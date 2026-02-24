/**
 * API Route Token Validator
 * 
 * Validates access tokens from both Cognito and Auth0 in Next.js App Router API routes.
 * 
 * Usage:
 * ```typescript
 * import { validateRequest } from '@/lib/auth/api-validator';
 * 
 * export async function GET(request: Request) {
 *   const validation = await validateRequest(request);
 *   if (!validation.isValid) {
 *     return new Response(JSON.stringify({ error: validation.error }), { 
 *       status: validation.status 
 *     });
 *   }
 *   
 *   // Use validation.user for authorized operations
 *   return Response.json({ message: 'Success', user: validation.user });
 * }
 * ```
 */

import { cookies } from 'next/headers';

export interface DecodedToken {
  sub: string;
  email?: string;
  email_verified?: boolean;
  iss: string; // Issuer (Cognito or Auth0)
  aud: string; // Audience (client ID)
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  token_use?: string; // Cognito: 'access' or 'id'
  scope?: string; // Auth0: space-separated scopes
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  user?: {
    id: string;
    email?: string;
    provider: 'cognito' | 'auth0';
  };
  token?: DecodedToken;
  error?: string;
  status?: number;
}

/**
 * Decode JWT without verification (structure only)
 * For production: Use `jose` library for proper signature verification
 */
function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );
    
    return payload;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Basic JWT validation (structure and expiration)
 * For production: Verify signature with JWKS from Cognito/Auth0
 */
function validateJWT(token: string): { valid: boolean; decoded?: DecodedToken; error?: string } {
  // Check basic structure
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Invalid token format' };
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid JWT structure' };
  }
  
  // Decode payload
  const decoded = decodeJWT(token);
  if (!decoded) {
    return { valid: false, error: 'Failed to decode token' };
  }
  
  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp <= now) {
    return { valid: false, error: 'Token expired' };
  }
  
  // Check issued at (not in future)
  if (decoded.iat && decoded.iat > now + 60) {
    return { valid: false, error: 'Token issued in future' };
  }
  
  return { valid: true, decoded };
}

/**
 * Extract access token from request
 * Supports both Authorization header and cookies
 */
async function extractToken(request: Request): Promise<string | null> {
  // 1. Try Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Try cookies (Cognito or Auth0)
  const cookieStore = await cookies();
  
  // Check Auth0 cookie
  const auth0Token = cookieStore.get('auth0_access_token')?.value;
  if (auth0Token) {
    return auth0Token;
  }
  
  // Check Cognito cookie (Amplify stores tokens with pattern)
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.includes('CognitoIdentityServiceProvider') && 
        cookie.name.includes('accessToken')) {
      return cookie.value;
    }
  }
  
  return null;
}

/**
 * Detect provider from decoded token
 */
function detectProvider(decoded: DecodedToken): 'cognito' | 'auth0' {
  // Auth0 issuer format: https://{domain}.auth0.com/
  if (decoded.iss?.includes('auth0.com')) {
    return 'auth0';
  }
  
  // Cognito issuer format: https://cognito-idp.{region}.amazonaws.com/{userPoolId}
  if (decoded.iss?.includes('cognito-idp') && decoded.iss?.includes('amazonaws.com')) {
    return 'cognito';
  }
  
  // Default to cognito if unclear
  return 'cognito';
}

/**
 * Validate request and extract user information
 * 
 * @param request - Next.js Request object
 * @returns Validation result with user info or error
 */
export async function validateRequest(request: Request): Promise<ValidationResult> {
  try {
    // 1. Extract token
    const token = await extractToken(request);
    if (!token) {
      return {
        isValid: false,
        error: 'No access token found',
        status: 401,
      };
    }
    
    // 2. Validate JWT structure and expiration
    const validation = validateJWT(token);
    if (!validation.valid || !validation.decoded) {
      return {
        isValid: false,
        error: validation.error || 'Invalid token',
        status: 401,
      };
    }
    
    // 3. Extract user information
    const decoded = validation.decoded;
    const provider = detectProvider(decoded);
    
    return {
      isValid: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        provider,
      },
      token: decoded,
    };
    
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      isValid: false,
      error: 'Internal validation error',
      status: 500,
    };
  }
}

/**
 * Validate request with role-based authorization
 * 
 * @param request - Next.js Request object
 * @param requiredRole - Required role for access (e.g., 'admin')
 * @returns Validation result
 */
export async function validateRequestWithRole(
  request: Request,
  requiredRole: string
): Promise<ValidationResult> {
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    return validation;
  }
  
  // Check role in token claims
  const userRole = validation.token?.['custom:role'] || // Cognito custom attribute
                   validation.token?.role ||             // Auth0 custom claim
                   validation.token?.['cognito:groups']?.[0]; // Cognito groups
  
  if (userRole !== requiredRole) {
    return {
      isValid: false,
      error: 'Insufficient permissions',
      status: 403,
    };
  }
  
  return validation;
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create a 403 Forbidden response
 */
export function forbiddenResponse(message = 'Forbidden'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
