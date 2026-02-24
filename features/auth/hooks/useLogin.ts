'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  loginUser,
  type SignInParams,
} from '@/lib/auth/cognito';
import { useInvalidateAuth } from './useAuth';

export function useLogin() {
  const router = useRouter();
  const invalidateAuth = useInvalidateAuth();

  return useMutation({
    mutationFn: async (params: SignInParams) => {
      const result = await loginUser(params);
      return result;
    },
    onSuccess: (data) => {
      // Invalidate auth queries to trigger refetch
      invalidateAuth();
      
      // Redirect to dashboard or home
      if (data.isSignedIn) {
        router.push('/dashboard');
      }
    },
  });
}
