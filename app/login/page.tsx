'use client';

import { useEffect } from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { configureAmplify } from '@/lib/auth/amplify-config';

export default function LoginPage() {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50">
      <LoginForm />
    </main>
  );
}
