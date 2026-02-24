'use client';

import { useEffect, Suspense } from 'react';
import { ConfirmSignUpForm } from '@/features/auth/components/ConfirmSignUpForm';
import { configureAmplify } from '@/lib/auth/amplify-config';

function ConfirmSignUpContent() {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <ConfirmSignUpForm />
    </main>
  );
}

export default function ConfirmSignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmSignUpContent />
    </Suspense>
  );
}
