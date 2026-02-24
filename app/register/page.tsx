'use client';

import { useEffect } from 'react';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { configureAmplify } from '@/lib/auth/amplify-config';

export default function RegisterPage() {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50">
      <RegisterForm />
    </main>
  );
}
