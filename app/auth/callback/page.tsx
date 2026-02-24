'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleOAuthCallback } from '@/lib/auth/cognito-oauth';
import { configureAmplifyOAuth } from '@/lib/auth/amplify-config-oauth';
import { Spinner } from '@/components/ui/Spinner';

/**
 * OAuth Callback Page
 * 
 * This page handles the redirect from Cognito after user authenticates
 * 
 * Flow:
 * 1. User clicks "Login" → redirected to Cognito Hosted UI
 * 2. User authenticates on Cognito
 * 3. Cognito redirects here with ?code=xxx&state=xxx
 * 4. Amplify automatically exchanges code for tokens (PKCE)
 * 5. Redirect to dashboard
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function processCallback() {
      try {
        console.log('=== OAuth Callback Debug ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        
        // IMPORTANT: Configure Amplify with OAuth settings first!
        console.log('Configuring Amplify for OAuth...');
        configureAmplifyOAuth();
        
        const result = await handleOAuthCallback();
        
        console.log('Callback result:', result);
        
        if (result.success) {
          console.log('✓ Success! Tokens received');
          setStatus('success');
          // Redirect to dashboard after brief delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          console.error('✗ Failed:', result.error);
          setStatus('error');
          setError(result.error || 'Unknown error');
        }
      } catch (err) {
        console.error('✗ Exception:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to process callback');
      }
    }

    processCallback();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {status === 'processing' && (
              <>
                <Spinner className="mx-auto mb-4" />
                <h1 className="text-2xl font-semibold mb-2">Completing sign in...</h1>
                <p className="text-gray-600">Please wait while we authenticate you.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-green-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold mb-2">Success!</h1>
                <p className="text-gray-600">Redirecting to dashboard...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold mb-2">Authentication Failed</h1>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Return to login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
