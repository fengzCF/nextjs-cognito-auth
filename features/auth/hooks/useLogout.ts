'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth/cognito';
import { logoutAuth0, isAuth0Authenticated } from '@/lib/auth/auth0';
import { useInvalidateAuth } from './useAuth';

export function useLogout() {
  const router = useRouter();
  const invalidateAuth = useInvalidateAuth();

  return useMutation({
    mutationFn: async () => {
      // Check which provider is active and logout accordingly
      if (isAuth0Authenticated()) {
        logoutAuth0(); // This will redirect, so no return needed
      } else {
        await logoutUser(); // Cognito logout
      }
    },
    onSuccess: () => {
      // Clear auth queries
      invalidateAuth();
      
      // Redirect to home (only for Cognito, Auth0 handles its own redirect)
      if (!isAuth0Authenticated()) {
        router.push('/');
      }
    },
  });
}
