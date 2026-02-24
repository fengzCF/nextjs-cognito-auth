'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { initiateAuth0Login } from '@/lib/auth/auth0';

/**
 * Auth0 OAuth Login Page
 * 
 * This demonstrates OAuth 2.0 Code Grant flow with Auth0
 * 
 * Flow:
 * 1. User clicks "Sign in with Auth0"
 * 2. Redirects to Auth0 Universal Login
 * 3. User authenticates on Auth0's page
 * 4. Auth0 redirects to /auth/auth0-callback with code
 * 5. App exchanges code for tokens
 * 6. User is authenticated
 */
export default function Auth0LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAuth0Login = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('=== Auth0 Login Debug ===');
      console.log('Domain:', process.env.NEXT_PUBLIC_AUTH0_DOMAIN);
      console.log('Client ID:', process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);
      console.log('Audience:', process.env.NEXT_PUBLIC_AUTH0_AUDIENCE);
      
      await initiateAuth0Login();
      // User will be redirected, so this line won't execute
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to initiate login');
      console.error('Auth0 login error:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-indigo-50 to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Auth0 Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            OAuth 2.0 Code Grant with PKCE using Auth0 Universal Login
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive p-3 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleAuth0Login}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isLoading ? 'Redirecting...' : 'Sign in with Auth0'}
            </Button>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-purple-900 mb-2">About Auth0:</p>
              <ul className="text-purple-800 space-y-1 list-disc list-inside">
                <li>Industry-leading identity platform</li>
                <li>OAuth 2.0 + PKCE for security</li>
                <li>Universal Login (hosted UI)</li>
                <li>Social connections support</li>
                <li>Multi-factor authentication</li>
              </ul>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Compare with:{' '}
                <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  SRP (Cognito)
                </a>
                {' '} | {' '}
                <a href="/login-oauth" className="text-blue-600 hover:text-blue-800 font-medium">
                  OAuth (Cognito)
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
