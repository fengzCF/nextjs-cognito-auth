'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { initiateOAuthLogin } from '@/lib/auth/cognito-oauth';
import { configureAmplifyOAuth } from '@/lib/auth/amplify-config-oauth';

/**
 * OAuth Login Page
 * 
 * This demonstrates the OAuth 2.0 Code Grant flow with PKCE
 * 
 * Flow:
 * 1. User clicks "Sign in with Cognito"
 * 2. Redirects to Cognito Hosted UI
 * 3. User authenticates on AWS Cognito's page
 * 4. Cognito redirects to /auth/callback with code
 * 5. App exchanges code for tokens
 * 6. User is authenticated
 */
export default function OAuthLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    configureAmplifyOAuth();
  }, []);

  const handleOAuthLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('=== OAuth Login Debug ===');
      console.log('Domain:', process.env.NEXT_PUBLIC_COGNITO_DOMAIN);
      console.log('OAuth Client ID:', process.env.NEXT_PUBLIC_COGNITO_OAUTH_CLIENT_ID);
      console.log('User Pool ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
      
      await initiateOAuthLogin();
      // User will be redirected, so this line won't execute
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to initiate login');
      console.error('OAuth login error:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">OAuth 2.0 Login</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Industry standard authentication flow using Cognito Hosted UI
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
              onClick={handleOAuthLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Redirecting...' : 'Sign in with Cognito Hosted UI'}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-900 mb-2">About OAuth 2.0 Code Grant:</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Industry standard (RFC 6749)</li>
                <li>Uses PKCE for security</li>
                <li>AWS Cognito Hosted UI</li>
                <li>Authorization code exchange</li>
                <li>Compatible with Auth0, Okta, etc.</li>
              </ul>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Compare with:{' '}
                <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  SRP Login (Custom UI)
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
