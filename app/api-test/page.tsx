'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect } from 'react';
import { getStoredTokens, isAuth0Authenticated } from '@/lib/auth/auth0';
import { fetchAuthSession } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/auth/amplify-config';
import { configureAmplifyOAuth } from '@/lib/auth/amplify-config-oauth';
import { config } from '@/lib/config/env';
import { useRouter } from 'next/navigation';

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [amplifyConfigured, setAmplifyConfigured] = useState(false);
  const router = useRouter();

  // Configure Amplify on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if OAuth client cookie exists
      // Cookie format: CognitoIdentityServiceProvider.{clientId}.{userId}.accessToken
      const oauthClientId = config.cognito.oauthClientId;
      const hasOAuthCookie = document.cookie.includes(oauthClientId);
      
      console.log('🔍 Checking authentication type...');
      console.log('OAuth Client ID:', oauthClientId);
      console.log('Has OAuth cookie:', hasOAuthCookie);
      
      if (hasOAuthCookie) {
        console.log('🔵 API Test - Configuring OAuth client for Cognito OAuth');
        configureAmplifyOAuth();
      } else {
        console.log('🟢 API Test - Configuring SRP client for Cognito SRP');
        configureAmplify();
      }
      setAmplifyConfigured(true);
    }
  }, []);

  const getAccessToken = async () => {
    try {
      // Check Auth0 first
      if (isAuth0Authenticated()) {
        const tokens = getStoredTokens();
        console.log('🔵 Using Auth0 token');
        return tokens?.accessToken || null;
      }
      
      // Cognito - fetch session from Amplify
      console.log('🟢 Fetching Cognito session...');
      const session = await fetchAuthSession({ forceRefresh: false });
      
      if (!session.tokens?.accessToken) {
        console.error('❌ No access token in session');
        console.log('Session details:', {
          hasTokens: !!session.tokens,
          hasAccessToken: !!session.tokens?.accessToken,
          hasIdToken: !!session.tokens?.idToken,
        });
        return null;
      }
      
      const token = session.tokens.accessToken.toString();
      console.log('✅ Access token retrieved, length:', token.length);
      console.log('Token (first 50 chars):', token.substring(0, 50));
      
      return token;
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      return null;
    }
  };

  const testEndpoint = async (name: string, url: string, method = 'GET') => {
    setLoading(prev => ({ ...prev, [name]: true }));
    setResults(prev => ({ ...prev, [name]: null }));

    try {
      console.log(`\n🧪 Testing ${name} endpoint: ${method} ${url}`);
      
      const token = await getAccessToken();
      
      if (!token) {
        console.error('❌ No token available - cannot proceed');
        setResults(prev => ({ 
          ...prev, 
          [name]: { error: 'No access token found. Please log in.' } 
        }));
        return;
      }

      console.log('✅ Token obtained, making request...');
      console.log('Authorization header:', `Bearer ${token.substring(0, 30)}...`);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📥 Response data:', data);
      
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: response.status, 
          data,
          success: response.ok,
        } 
      }));

    } catch (error: any) {
      console.error('❌ Request failed:', error);
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          error: error.message || 'Request failed',
          success: false,
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  // Show loading while Amplify is being configured
  if (!amplifyConfigured) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-muted-foreground">Initializing...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Testing</h1>
            <p className="mt-2 text-muted-foreground">
              Test protected API routes with your access token
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔒 Protected Endpoint
              <Badge variant="secondary">GET</Badge>
            </CardTitle>
            <CardDescription>
              Basic authentication - any logged-in user can access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => testEndpoint('protected', '/api/protected')}
                disabled={loading.protected}
              >
                {loading.protected ? 'Testing...' : 'Test GET /api/protected'}
              </Button>
              
              {results.protected && (
                <Badge variant={results.protected.success ? 'default' : 'destructive'}>
                  {results.protected.status || 'Error'}
                </Badge>
              )}
            </div>

            {results.protected && (
              <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-64">
                {JSON.stringify(results.protected, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👑 Admin Endpoint
              <Badge variant="secondary">GET</Badge>
            </CardTitle>
            <CardDescription>
              Role-based authorization - requires admin role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => testEndpoint('admin', '/api/admin')}
                disabled={loading.admin}
              >
                {loading.admin ? 'Testing...' : 'Test GET /api/admin'}
              </Button>
              
              {results.admin && (
                <Badge variant={results.admin.success ? 'default' : 'destructive'}>
                  {results.admin.status || 'Error'}
                </Badge>
              )}
            </div>

            {results.admin && (
              <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-64">
                {JSON.stringify(results.admin, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👤 User Profile
              <Badge variant="secondary">GET</Badge>
            </CardTitle>
            <CardDescription>
              Get current user's profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => testEndpoint('profile', '/api/user/profile')}
                disabled={loading.profile}
              >
                {loading.profile ? 'Testing...' : 'Test GET /api/user/profile'}
              </Button>
              
              {results.profile && (
                <Badge variant={results.profile.success ? 'default' : 'destructive'}>
                  {results.profile.status || 'Error'}
                </Badge>
              )}
            </div>

            {results.profile && (
              <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-64">
                {JSON.stringify(results.profile, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Expected Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Badge variant="default" className="mr-2">200</Badge>
              <strong>/api/protected</strong> - Should succeed for any authenticated user
            </div>
            <div>
              <Badge variant="destructive" className="mr-2">403</Badge>
              <strong>/api/admin</strong> - Should fail unless you have admin role
            </div>
            <div>
              <Badge variant="default" className="mr-2">200</Badge>
              <strong>/api/user/profile</strong> - Should return your user profile
            </div>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Check browser console for detailed request/response logs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
