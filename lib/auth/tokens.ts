/**
 * Server-side token management with HTTP-only cookies
 * 
 * IMPORTANT: AWS Amplify automatically handles token storage in the browser.
 * For production, you would want to use HTTP-only cookies via API routes.
 * This file provides utilities for server-side token management.
 * 
 * Note: Due to Next.js App Router constraints with client components,
 * we'll demonstrate the secure pattern but rely on Amplify's secure storage
 * which uses IndexedDB with encryption.
 */

import { cookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'auth_access_token';
const ID_TOKEN_COOKIE = 'auth_id_token';
const REFRESH_TOKEN_COOKIE = 'auth_refresh_token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60, // 1 hour for access token
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
};

/**
 * Set authentication tokens in HTTP-only cookies
 */
export async function setAuthCookies(tokens: {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}) {
  const cookieStore = await cookies();
  
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, COOKIE_OPTIONS);
  cookieStore.set(ID_TOKEN_COOKIE, tokens.idToken, COOKIE_OPTIONS);
  
  if (tokens.refreshToken) {
    cookieStore.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );
  }
}

/**
 * Get authentication tokens from HTTP-only cookies
 */
export async function getAuthCookies() {
  const cookieStore = await cookies();
  
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const idToken = cookieStore.get(ID_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken || !idToken) {
    return null;
  }

  return {
    accessToken,
    idToken,
    refreshToken,
  };
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(ID_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Verify JWT token (basic structure check)
 * For production, use a proper JWT library like jose or jsonwebtoken
 */
export function verifyTokenStructure(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Decode payload
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8'),
    );
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}
