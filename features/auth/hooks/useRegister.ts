'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  registerUser,
  confirmUserRegistration,
  resendConfirmationCode,
  type SignUpParams,
  type ConfirmSignUpParams,
} from '@/lib/auth/cognito';

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: SignUpParams) => {
      const result = await registerUser(params);
      return result;
    },
    onSuccess: (data, variables) => {
      // If sign up requires confirmation, redirect to confirmation page
      if (data.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        router.push(`/confirm-signup?email=${encodeURIComponent(variables.email)}`);
      }
    },
  });
}

export function useConfirmSignUp() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: ConfirmSignUpParams) => {
      const result = await confirmUserRegistration(params);
      return result;
    },
    onSuccess: () => {
      // Redirect to login after successful confirmation
      router.push('/login?confirmed=true');
    },
  });
}

export function useResendCode() {
  return useMutation({
    mutationFn: async (email: string) => {
      await resendConfirmationCode(email);
    },
  });
}
