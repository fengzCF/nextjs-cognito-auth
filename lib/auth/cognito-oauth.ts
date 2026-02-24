/**
 * OAuth 2.0 Code Grant Flow with PKCE
 * This is the INDUSTRY STANDARD authentication flow
 * 
 * Flow:
 * 1. User clicks "Login" → redirect to Cognito Hosted UI
 * 2. User authenticates on Cognito's page
 * 3. Cognito redirects back with authorization code
 * 4. App exchanges code for tokens (with PKCE verifier)
 * 5. Tokens stored and user authenticated
 */

import { signInWithRedirect, signOut, fetchAuthSession, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import type { AuthTokens, UserInfo } from './cognito';

/**
 * Initiate OAuth login flow
 * Redirects user to Cognito Hosted UI
 */
export async function initiateOAuthLogin() {
  await signInWithRedirect();
  // User will be redirected - this function won't return
}

/**
 * Initiate OAuth login with social provider
 */
export async function initiateOAuthSocialLogin(provider: 'Google' | 'Facebook' | 'Amazon') {
  await signInWithRedirect({
    provider,
  });
}

/**
 * Handle OAuth callback after redirect
 * Call this in your callback page (e.g., /auth/callback)
 * 
 * Amplify automatically:
 * 1. Extracts authorization code from URL
 * 2. Exchanges code for tokens using PKCE
 * 3. Stores tokens in browser storage
 */
export async function handleOAuthCallback() {
  try {
    console.log('handleOAuthCallback: Starting...');
    
    // Amplify handles the OAuth callback automatically
    // Just check if we have a session
    const session = await fetchAuthSession({ forceRefresh: true });
    
    console.log('Session retrieved:', {
      hasTokens: !!session.tokens,
      tokens: session.tokens ? 'Present' : 'Missing',
      credentials: session.credentials ? 'Present' : 'Missing',
    });
    
    // Debug: Log the full session structure
    console.log('Full session structure:', {
      tokens: session.tokens ? 'Present' : 'Missing',
      credentials: session.credentials ? 'Present' : 'Missing',
      identityId: session.identityId,
      userSub: session.userSub,
    });
    
    if (session.tokens) {
      const tokens = session.tokens;
      
      // In Amplify v6, refresh token is stored internally in cookies
      // It's not directly accessible via session.tokens.refreshToken
      // But we can check if it exists in cookies
      const hasRefreshTokenInCookies = typeof document !== 'undefined' && 
        document.cookie.includes('CognitoIdentityServiceProvider') &&
        document.cookie.includes('refreshToken');
      
      console.log('Token details:', {
        hasAccessToken: !!tokens.accessToken,
        hasIdToken: !!tokens.idToken,
        hasRefreshTokenInCookies,
        accessTokenLength: tokens.accessToken?.toString().length,
        idTokenLength: tokens.idToken?.toString().length,
      });
      
      console.log('✓ Tokens received successfully');
      console.log('ℹ️  Note: Refresh token is stored in cookies and managed automatically by Amplify');
      
      return {
        success: true,
        tokens: {
          accessToken: tokens.accessToken?.toString() || '',
          idToken: tokens.idToken?.toString() || '',
          refreshToken: hasRefreshTokenInCookies ? 'stored-in-cookies' : '',
        },
      };
    }
    
    console.error('✗ No tokens in session');
    return {
      success: false,
      error: 'No tokens received',
    };
  } catch (error) {
    console.error('✗ Exception in handleOAuthCallback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth callback failed',
    };
  }
}

/**
 * Sign out (works for both SRP and OAuth)
 */
export async function logoutOAuth() {
  await signOut();
}

/**
 * Get current user (works for both SRP and OAuth)
 */
export async function getOAuthUser(): Promise<UserInfo | null> {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    return {
      id: user.userId,
      email: attributes.email || '',
      emailVerified: attributes.email_verified === 'true',
      name: attributes.name,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get tokens (works for both SRP and OAuth)
 */
export async function getOAuthTokens(): Promise<AuthTokens | null> {
  try {
    const session = await fetchAuthSession();
    
    if (!session.tokens) {
      return null;
    }

    const tokens = session.tokens as any;
    return {
      accessToken: tokens.accessToken.toString(),
      idToken: tokens.idToken?.toString() || '',
      refreshToken: tokens.refreshToken?.toString(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isOAuthAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
