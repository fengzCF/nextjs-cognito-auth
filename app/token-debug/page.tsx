'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { configureAmplify } from '@/lib/auth/amplify-config';
import { configureAmplifyOAuth } from '@/lib/auth/amplify-config-oauth';
import { getStoredTokens, refreshAuth0Token, isAuth0Authenticated } from '@/lib/auth/auth0';
import { Badge } from '@/components/ui/Badge';

interface TokenInfo {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  accessTokenDecoded?: any;
  idTokenDecoded?: any;
  provider?: 'cognito-srp' | 'cognito-oauth' | 'auth0';
}

export default function TokenDebugPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Parse JWT token
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  };

  // Load token information
  const loadTokens = async (forceRefresh = false) => {
    try {
      // Check if Auth0 session
      if (isAuth0Authenticated()) {
        const auth0Tokens = getStoredTokens();
        if (auth0Tokens) {
          setTokenInfo({
            accessToken: auth0Tokens.accessToken,
            idToken: auth0Tokens.idToken,
            refreshToken: auth0Tokens.refreshToken || 'Not available',
            accessTokenDecoded: parseJwt(auth0Tokens.accessToken),
            idTokenDecoded: parseJwt(auth0Tokens.idToken),
            provider: 'auth0',
          });
          setLastRefreshTime(new Date());
          if (forceRefresh) {
            setRefreshCount(prev => prev + 1);
          }
        }
        return;
      }
      
      // Cognito session (SRP or OAuth)
      const session = await fetchAuthSession({ forceRefresh });
      
      if (session.tokens) {
        const accessToken = session.tokens.accessToken?.toString() || '';
        const idToken = session.tokens.idToken?.toString() || '';
        const hasRefreshToken = document.cookie.includes('refreshToken');
        
        // Detect provider
        const hasOAuthCookie = document.cookie.includes('ojkkctuvfmhpv4d16gvsjt6co');
        const provider = hasOAuthCookie ? 'cognito-oauth' : 'cognito-srp';

        setTokenInfo({
          accessToken,
          idToken,
          refreshToken: hasRefreshToken ? 'Stored in cookies (managed by Amplify)' : 'Not found',
          accessTokenDecoded: parseJwt(accessToken),
          idTokenDecoded: parseJwt(idToken),
          provider,
        });

        setLastRefreshTime(new Date());
        
        if (forceRefresh) {
          setRefreshCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Auth0 first
        if (isAuth0Authenticated()) {
          console.log('Detected Auth0 session');
          setIsAuthenticated(true);
          await loadTokens();
          setLoading(false);
          return;
        }
        
        // Try OAuth configuration (check for OAuth client cookie)
        const hasOAuthCookie = document.cookie.includes('ojkkctuvfmhpv4d16gvsjt6co');
        
        if (hasOAuthCookie) {
          console.log('Detected Cognito OAuth session, configuring OAuth...');
          configureAmplifyOAuth();
        } else {
          console.log('Detected Cognito SRP session, configuring SRP...');
          configureAmplify();
        }
        
        await getCurrentUser();
        setIsAuthenticated(true);
        await loadTokens();
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const testTokenRefresh = async () => {
    console.log('=== Token Refresh Test ===');
    
    try {
      // Check if Auth0
      if (tokenInfo?.provider === 'auth0') {
        console.log('Testing Auth0 refresh token...');
        
        const tokens1 = getStoredTokens();
        if (!tokens1) {
          throw new Error('No Auth0 tokens found');
        }
        
        if (!tokens1.refreshToken) {
          alert('❌ No refresh token available!\n\nTo get refresh token:\n1. Go to Auth0 Dashboard\n2. Applications → Your App → Settings\n3. Advanced Settings → Grant Types\n4. ✅ Enable "Refresh Token"\n5. Create an API with "Allow Offline Access"\n6. Save and try logging in again');
          return;
        }
        
        const token1 = tokens1.accessToken;
        console.log('Current access token (first 50 chars):', token1?.substring(0, 50));
        
        console.log('Calling refreshAuth0Token()...');
        const newTokens = await refreshAuth0Token();
        
        const token2 = newTokens.accessToken;
        console.log('New access token (first 50 chars):', token2?.substring(0, 50));
        
        const refreshWorked = token1 !== token2;
        console.log('✅ Refresh worked:', refreshWorked);
        
        if (refreshWorked) {
          alert('✅ Auth0 refresh token works! New tokens received.\n\nOld token: ' + token1.substring(0, 50) + '...\nNew token: ' + token2.substring(0, 50) + '...\n\nCheck console for full details.');
          await loadTokens(true);
        } else {
          alert('⚠️ Tokens are the same. Refresh may not have occurred.\n\nThis could mean:\n- Token is still valid\n- Auth0 returned cached token\n- Check console for errors');
        }
        
        return;
      }
      
      // Cognito flow
      const session1 = await fetchAuthSession();
      const token1 = session1.tokens?.accessToken?.toString();
      console.log('Current access token (first 50 chars):', token1?.substring(0, 50));
      
      // Force refresh using refresh token
      console.log('Forcing refresh using Cognito refresh token...');
      const session2 = await fetchAuthSession({ forceRefresh: true });
      const token2 = session2.tokens?.accessToken?.toString();
      console.log('New access token (first 50 chars):', token2?.substring(0, 50));
      
      // Verify tokens are different
      const refreshWorked = token1 !== token2;
      console.log('✅ Refresh worked:', refreshWorked);
      console.log('Tokens are different:', refreshWorked);
      
      if (refreshWorked) {
        alert('✅ Cognito refresh token works! New access token received.\n\nCheck console for details.');
      } else {
        alert('⚠️ Tokens are the same. This might mean:\n1. Tokens are still valid (not expired)\n2. Cognito returned cached tokens\n\nThis is normal behavior.');
      }
      
      // Reload display
      await loadTokens(true);
    } catch (error) {
      console.error('Token refresh failed:', error);
      alert('❌ Token refresh failed!\n\n' + (error instanceof Error ? error.message : 'Unknown error') + '\n\nCheck console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Token Debug Tool</h1>
          <p className="text-muted-foreground">Inspect OAuth/SRP tokens and test refresh functionality</p>
          {tokenInfo?.provider && (
            <div className="mt-2">
              <Badge variant={
                tokenInfo.provider === 'auth0' ? 'default' : 
                tokenInfo.provider === 'cognito-oauth' ? 'secondary' : 
                'outline'
              }>
                {tokenInfo.provider === 'auth0' ? '🟣 Auth0' : 
                 tokenInfo.provider === 'cognito-oauth' ? '🔵 Cognito OAuth' : 
                 '🟢 Cognito SRP'}
              </Badge>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>

      {/* Actions */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Actions</h2>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button onClick={() => loadTokens(false)} variant="outline">
            🔄 Reload Tokens (Cached)
          </Button>
          <Button onClick={testTokenRefresh} variant="outline">
            ✅ Test Token Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Refresh Info */}
      {lastRefreshTime && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Last Refresh:</span>
                <span className="ml-2 font-mono">{lastRefreshTime.toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Refresh Count:</span>
                <Badge className="ml-2">{refreshCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Token */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Access Token</h2>
            <Badge variant="secondary">JWT</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Raw Token (first 100 chars)</label>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto mt-2 border">
              {tokenInfo?.accessToken?.substring(0, 100)}...
            </pre>
          </div>
          
          {tokenInfo?.accessTokenDecoded && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Decoded Payload</label>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto mt-2 border">
                {JSON.stringify(tokenInfo.accessTokenDecoded, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-sm font-semibold">Token Use:</span>
              <span className="ml-2 font-mono text-sm">{tokenInfo?.accessTokenDecoded?.token_use}</span>
            </div>
            <div>
              <span className="text-sm font-semibold">Expires:</span>
              <span className="ml-2 font-mono text-sm">
                {tokenInfo?.accessTokenDecoded?.exp 
                  ? new Date(tokenInfo.accessTokenDecoded.exp * 1000).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-sm font-semibold">Scope:</span>
              <span className="ml-2 font-mono text-sm">{tokenInfo?.accessTokenDecoded?.scope}</span>
            </div>
            <div>
              <span className="text-sm font-semibold">Client ID:</span>
              <span className="ml-2 font-mono text-sm">{tokenInfo?.accessTokenDecoded?.client_id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ID Token */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">ID Token</h2>
            <Badge variant="secondary">JWT</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Raw Token (first 100 chars)</label>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto mt-2 border">
              {tokenInfo?.idToken?.substring(0, 100)}...
            </pre>
          </div>
          
          {tokenInfo?.idTokenDecoded && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Decoded Payload</label>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto mt-2 border">
                {JSON.stringify(tokenInfo.idTokenDecoded, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-sm font-semibold">Token Use:</span>
              <span className="ml-2 font-mono text-sm">{tokenInfo?.idTokenDecoded?.token_use}</span>
            </div>
            <div>
              <span className="text-sm font-semibold">Email:</span>
              <span className="ml-2 font-mono text-sm">{tokenInfo?.idTokenDecoded?.email}</span>
            </div>
            <div>
              <span className="text-sm font-semibold">Email Verified:</span>
              <Badge variant={tokenInfo?.idTokenDecoded?.email_verified ? "default" : "destructive"} className="ml-2">
                {tokenInfo?.idTokenDecoded?.email_verified ? '✓ Yes' : '✗ No'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-semibold">Subject (User ID):</span>
              <span className="ml-2 font-mono text-xs">{tokenInfo?.idTokenDecoded?.sub}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Token */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Refresh Token</h2>
            <Badge variant="secondary">Opaque</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-accent/10 border border-accent/20 p-4 rounded space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold">
                  Status: {tokenInfo?.refreshToken?.includes('Stored') ? '✅ Present' : '❌ Not Found'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tokenInfo?.refreshToken}
                </p>
              </div>
            </div>

            <div className="bg-background/50 p-3 rounded text-sm space-y-2">
              <p className="font-semibold">⚠️ Why can't we see the refresh token value?</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Refresh token is NOT a JWT (it's an encrypted opaque token)</li>
                <li>Amplify v6 hides it from direct JavaScript access (security best practice)</li>
                <li>It's stored in browser cookies and managed automatically</li>
                <li>Amplify uses it automatically when access token expires (60 min)</li>
              </ul>
            </div>

            <div className="bg-primary/10 p-3 rounded text-sm">
              <p className="font-semibold text-primary">✅ How to verify it works?</p>
              <p className="text-muted-foreground mt-1">
                Click "Test Token Refresh" button above. If you get new tokens, your refresh token is working!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Flow Details (if available) */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">OAuth 2.0 Flow Details</h2>
          <p className="text-sm text-muted-foreground">
            PKCE (Proof Key for Code Exchange) parameters
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-2">🔐 PKCE Flow (Authorization Code Grant):</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li><strong>Code Verifier:</strong> Random string (generated by Amplify, not accessible)</li>
                <li><strong>Code Challenge:</strong> SHA256(code_verifier) in base64 (sent to Cognito)</li>
                <li><strong>State:</strong> Random string for CSRF protection (you saw this in URL)</li>
                <li><strong>Authorization Code:</strong> Received from Cognito after authentication</li>
                <li><strong>Token Exchange:</strong> Code + Verifier → Access + ID + Refresh tokens</li>
              </ol>
            </div>

            <div className="bg-background p-3 rounded">
              <p className="font-semibold mb-2">⚠️ Why can't we display these values?</p>
              <p className="text-muted-foreground">
                Amplify v6 manages PKCE internally for security. The code verifier is never exposed to prevent 
                interception attacks. The authorization code is immediately exchanged for tokens and discarded.
                This is intentional security by design - these values should not be accessible to application code.
              </p>
            </div>

            <div className="bg-accent/10 border border-accent/20 p-3 rounded">
              <p className="font-semibold text-accent mb-2">✅ What you CAN see:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Check browser DevTools Network tab during OAuth login</li>
                <li>Look for requests to: <code className="bg-background px-1 rounded">eu-west-2tlugle3vn.auth.eu-west-2.amazoncognito.com</code></li>
                <li>Authorization request will show: <code className="bg-background px-1 rounded">code_challenge</code> and <code className="bg-background px-1 rounded">state</code></li>
                <li>Callback URL will show: <code className="bg-background px-1 rounded">code=xxx&state=xxx</code></li>
                <li>Token endpoint request (POST) exchanges code for tokens</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">💡 Understanding Token Lifecycle</h2>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Access Token</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Lifetime: 60 minutes</li>
                <li>• Purpose: API authorization</li>
                <li>• Contains: scope, client_id</li>
                <li>• Used for: Backend API calls</li>
              </ul>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">ID Token</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Lifetime: 60 minutes</li>
                <li>• Purpose: User identity</li>
                <li>• Contains: email, sub, name</li>
                <li>• Used for: Profile display</li>
              </ul>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Refresh Token</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Lifetime: 5 days</li>
                <li>• Purpose: Get new tokens</li>
                <li>• Contains: Encrypted data</li>
                <li>• Used for: Background refresh</li>
              </ul>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 p-4 rounded">
            <p className="font-semibold mb-2">🔄 Automatic Token Refresh:</p>
            <p className="text-muted-foreground">
              When your access token expires (after 60 minutes), Amplify automatically uses the refresh token 
              to get new access and ID tokens. This happens transparently - you stay logged in for up to 5 days 
              without re-authenticating!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
