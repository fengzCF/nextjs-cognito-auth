'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleAuth0Callback } from '@/lib/auth/auth0';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Auth0 OAuth Callback Page
 * 
 * This page handles the redirect from Auth0 after user authenticates
 * 
 * Flow:
 * 1. User clicks "Login" → redirected to Auth0 Universal Login
 * 2. User authenticates on Auth0
 * 3. Auth0 redirects here with ?code=xxx&state=xxx
 * 4. App exchanges code for tokens (PKCE validation)
 * 5. Redirect to dashboard
 */
export default function Auth0CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function processCallback() {
      try {
        console.log('=== Auth0 Callback Debug ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        
        await handleAuth0Callback();
        
        console.log('✓ Success! Tokens received and stored');
        setStatus('success');
        
        // Redirect to dashboard after brief delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        
      } catch (err) {
        console.error('✗ Exception:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to process callback');
      }
    }

    processCallback();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-indigo-50 to-pink-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {status === 'processing' && (
              <>
                <Spinner className="mx-auto mb-4" />
                <h1 className="text-2xl font-semibold mb-2">Completing sign in...</h1>
                <p className="text-muted-foreground">Please wait while we authenticate you with Auth0.</p>
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
                <p className="text-muted-foreground">Redirecting to dashboard...</p>
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
                  onClick={() => router.push('/login-auth0')}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  ← Back to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
