'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';
import { getStoredTokens, isAuth0Authenticated } from '@/lib/auth/auth0';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const getAccessToken = async () => {
    if (isAuth0Authenticated()) {
      const tokens = getStoredTokens();
      return tokens?.accessToken || null;
    }
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  };

  const testEndpoint = async (name: string, url: string, method = 'GET') => {
    setLoading(prev => ({ ...prev, [name]: true }));
    setResults(prev => ({ ...prev, [name]: null }));

    try {
      const token = await getAccessToken();
      
      if (!token) {
        setResults(prev => ({ 
          ...prev, 
          [name]: { error: 'No access token found. Please log in.' } 
        }));
        return;
      }

      console.log(`Testing ${name}...`);
      console.log('Token (first 50 chars):', token.substring(0, 50));

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          status: response.status, 
          data,
          success: response.ok,
        } 
      }));

    } catch (error: any) {
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

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Testing</h1>
          <p className="mt-2 text-muted-foreground">
            Test protected API routes with your access token
          </p>
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
