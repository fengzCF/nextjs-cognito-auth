/**
 * Auth0 OAuth 2.0 Code Grant Flow with PKCE
 * 
 * Flow:
 * 1. User clicks "Login with Auth0" → redirect to Auth0 Universal Login
 * 2. User authenticates on Auth0's hosted page
 * 3. Auth0 redirects back with authorization code
 * 4. App exchanges code for tokens (with PKCE verifier)
 * 5. Tokens stored in cookies and user authenticated
 */

import { config } from '@/lib/config/env';

export interface Auth0Tokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface Auth0UserInfo {
  sub: string; // User ID
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: any;
  updated_at?: string;
}

// ============================================
// PKCE Helper Functions
// ============================================

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Base64 URL encode (without padding)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...Array.from(buffer)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * SHA-256 hash
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE() {
  const codeVerifier = generateRandomString(32);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64URLEncode(new Uint8Array(hashed));
  
  return {
    codeVerifier,
    codeChallenge,
  };
}

// ============================================
// Storage Functions
// ============================================

const STORAGE_KEYS = {
  CODE_VERIFIER: 'auth0_code_verifier',
  STATE: 'auth0_state',
};

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Store tokens in cookies only
 */
function storeTokens(tokens: Auth0Tokens) {
  // Store in cookies
  document.cookie = `auth0_access_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; Secure`;
  document.cookie = `auth0_id_token=${tokens.idToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; Secure`;
  
  // Store expiration timestamp
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  document.cookie = `auth0_expires_at=${expiresAt}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; Secure`;
  
  if (tokens.refreshToken) {
    // Refresh token typically has longer lifetime
    const refreshMaxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `auth0_refresh_token=${tokens.refreshToken}; path=/; max-age=${refreshMaxAge}; SameSite=Lax; Secure`;
  }
}

/**
 * Get stored tokens from cookies
 */
export function getStoredTokens(): Auth0Tokens | null {
  const accessToken = getCookie('auth0_access_token');
  const idToken = getCookie('auth0_id_token');
  const refreshToken = getCookie('auth0_refresh_token');
  const expiresAt = getCookie('auth0_expires_at');
  
  if (!accessToken || !idToken) {
    return null;
  }
  
  const expiresIn = expiresAt ? Math.floor((parseInt(expiresAt) - Date.now()) / 1000) : 0;
  
  return {
    accessToken,
    idToken,
    refreshToken: refreshToken || undefined,
    expiresIn,
    tokenType: 'Bearer',
  };
}

/**
 * Check if tokens are expired
 */
export function isTokenExpired(): boolean {
  const expiresAt = getCookie('auth0_expires_at');
  if (!expiresAt) return true;
  
  return Date.now() >= parseInt(expiresAt);
}

/**
 * Clear all stored tokens
 */
export function clearTokens() {
  // Clear cookies
  document.cookie = 'auth0_access_token=; path=/; max-age=0';
  document.cookie = 'auth0_id_token=; path=/; max-age=0';
  document.cookie = 'auth0_refresh_token=; path=/; max-age=0';
  document.cookie = 'auth0_expires_at=; path=/; max-age=0';
}

// ============================================
// OAuth Flow Functions
// ============================================

/**
 * Initiate Auth0 OAuth login flow
 * Redirects user to Auth0 Universal Login
 */
export async function initiateAuth0Login() {
  const domain = config.auth0.domain;
  const clientId = config.auth0.clientId;
  const audience = config.auth0.audience;
  
  if (!domain || !clientId) {
    throw new Error('Auth0 not configured. Please set NEXT_PUBLIC_AUTH0_DOMAIN and NEXT_PUBLIC_AUTH0_CLIENT_ID');
  }
  
  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = await generatePKCE();
  
  // Generate state for CSRF protection
  const state = generateRandomString(32);
  
  // Store for later validation
  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, state);
  
  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/auth0-callback`,
    scope: 'openid profile email offline_access', // offline_access for refresh token
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  
  // Add audience if configured (for API access)
  if (audience) {
    params.append('audience', audience);
  }
  
  const authUrl = `https://${domain}/authorize?${params.toString()}`;
  
  console.log('Redirecting to Auth0:', authUrl);
  
  // Redirect to Auth0
  window.location.href = authUrl;
}

/**
 * Handle OAuth callback after redirect from Auth0
 * Call this in your callback page (e.g., /auth/auth0-callback)
 */
export async function handleAuth0Callback(): Promise<Auth0Tokens> {
  try {
    console.log('handleAuth0Callback: Starting...');
    
    // Extract code and state from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    // Check for errors
    if (error) {
      throw new Error(`Auth0 error: ${error} - ${errorDescription || 'Unknown error'}`);
    }
    
    if (!code) {
      throw new Error('No authorization code received from Auth0');
    }
    
    // Validate state (CSRF protection)
    const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
    if (!storedState || storedState !== returnedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }
    
    // Get stored code verifier
    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      throw new Error('No code verifier found - session may have expired');
    }
    
    console.log('Exchanging authorization code for tokens...');
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    
    // Clean up session storage
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.STATE);
    
    // Store tokens
    storeTokens(tokens);
    
    console.log(tokens);
    console.log('🎉 Auth0 authentication successful!');
    console.log('📦 Tokens received:', {
      hasAccessToken: !!tokens.accessToken,
      accessTokenLength: tokens.accessToken?.length,
      hasIdToken: !!tokens.idToken,
      idTokenLength: tokens.idToken?.length,
      hasRefreshToken: !!tokens.refreshToken,
      refreshToken: tokens.refreshToken || '❌ NO REFRESH TOKEN',
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
    });
    console.log('⏱️  Access token expires in:', tokens.expiresIn, 'seconds (', Math.floor(tokens.expiresIn / 60), 'minutes )');
    
    if (!tokens.refreshToken) {
      console.warn('⚠️  NO REFRESH TOKEN received!');
      console.warn('💡 To get refresh token, enable in Auth0 Dashboard:');
      console.warn('   Applications → Your App → Settings → Advanced Settings → Grant Types');
      console.warn('   ✅ Check "Refresh Token"');
    }
    
    return tokens;
    
  } catch (error) {
    console.error('Auth0 callback error:', error);
    throw error;
  }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<Auth0Tokens> {
  const domain = config.auth0.domain;
  const clientId = config.auth0.clientId;
  const clientSecret = config.auth0.clientSecret;
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: `${window.location.origin}/auth/auth0-callback`,
  });
  
  // Add client secret if available (for confidential clients)
  // Note: In production, this should be done server-side
  if (clientSecret) {
    body.append('client_secret', clientSecret);
  }
  
  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

/**
 * Get user info from Auth0
 */
export async function getAuth0UserInfo(): Promise<Auth0UserInfo> {
  const tokens = getStoredTokens();
  if (!tokens) {
    throw new Error('Not authenticated');
  }
  
  const domain = config.auth0.domain;
  
  const response = await fetch(`https://${domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  
  const userInfo: Auth0UserInfo = await response.json();
  
  return userInfo;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAuth0Token(): Promise<Auth0Tokens> {
  console.log('🔄 refreshAuth0Token: Starting...');
  
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    console.error('❌ No refresh token available');
    throw new Error('No refresh token available');
  }
  
  console.log('✅ Found refresh token:', tokens.refreshToken.substring(0, 20) + '...');
  
  const domain = config.auth0.domain;
  const clientId = config.auth0.clientId;
  const clientSecret = config.auth0.clientSecret;
  
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: tokens.refreshToken,
  });
  
  if (clientSecret) {
    body.append('client_secret', clientSecret);
  }
  
  console.log('📤 Sending refresh request to Auth0...');
  
  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Token refresh failed:', errorData);
    throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
  }
  
  const data = await response.json();
  
  console.log('✅ Received new tokens from Auth0');
  console.log('New access token (first 50 chars):', data.access_token.substring(0, 50));
  console.log('New ID token (first 50 chars):', data.id_token.substring(0, 50));
  console.log('Refresh token rotated:', !!data.refresh_token);
  
  const newTokens: Auth0Tokens = {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token || tokens.refreshToken, // Keep old refresh token if new one not provided
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
  
  storeTokens(newTokens);
  
  console.log('✅ New tokens stored successfully');
  
  return newTokens;
}

/**
 * Logout from Auth0
 */
export function logoutAuth0() {
  const domain = config.auth0.domain;
  const clientId = config.auth0.clientId;
  
  // Clear local tokens
  clearTokens();
  
  // Redirect to Auth0 logout
  const returnTo = encodeURIComponent(window.location.origin);
  window.location.href = `https://${domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}`;
}

/**
 * Check if user is authenticated with Auth0
 */
export function isAuth0Authenticated(): boolean {
  const tokens = getStoredTokens();
  return !!tokens && !isTokenExpired();
}
