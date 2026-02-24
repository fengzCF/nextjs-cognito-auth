/**
 * Example Protected API Route
 * 
 * Demonstrates how to validate access tokens from both Cognito and Auth0.
 * This pattern should be used for all authenticated API endpoints.
 */

import { validateRequest } from '@/lib/auth/api-validator';

export async function GET(request: Request) {
  // Debug: Log incoming headers
  const authHeader = request.headers.get('Authorization');
  console.log('🔍 API /protected - Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING');
  
  // Validate authentication
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    console.error('❌ Validation failed:', validation.error);
    return new Response(
      JSON.stringify({ error: validation.error }),
      { 
        status: validation.status || 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // User is authenticated - proceed with business logic
  const { user, token } = validation;
  
  return Response.json({
    message: 'Successfully accessed protected resource',
    user: {
      id: user!.id,
      email: user!.email,
      provider: user!.provider,
    },
    tokenInfo: {
      issuer: token!.iss,
      audience: token!.aud,
      expiresAt: new Date(token!.exp * 1000).toISOString(),
      scopes: token!.scope?.split(' ') || [],
    },
  });
}

export async function POST(request: Request) {
  // Validate authentication
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      { 
        status: validation.status || 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // Parse request body
  const body = await request.json();
  
  // User is authenticated - proceed with business logic
  return Response.json({
    message: 'Resource created successfully',
    data: body,
    userId: validation.user!.id,
  });
}
