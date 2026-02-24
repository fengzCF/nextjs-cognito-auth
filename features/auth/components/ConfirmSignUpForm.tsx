'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useConfirmSignUp, useResendCode } from '@/features/auth/hooks/useRegister';

export function ConfirmSignUpForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  
  const [email, setEmail] = useState(emailParam || '');
  const [code, setCode] = useState('');
  const confirmSignUp = useConfirmSignUp();
  const resendCode = useResendCode();

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    confirmSignUp.mutate({ email, confirmationCode: code });
  };

  const handleResend = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }
    resendCode.mutate(email);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Confirm Your Email</CardTitle>
        <CardDescription>
          Enter the confirmation code sent to your email
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {confirmSignUp.isError && (
            <div className="rounded-md bg-destructive/10 border border-destructive p-3">
              <p className="text-sm text-destructive">
                {confirmSignUp.error instanceof Error
                  ? confirmSignUp.error.message
                  : 'Failed to confirm. Please check your code.'}
              </p>
            </div>
          )}
          
          {resendCode.isSuccess && (
            <div className="rounded-md bg-accent border border-[color:hsl(var(--border))] p-3">
              <p className="text-sm text-foreground">
                Confirmation code sent! Check your email.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={confirmSignUp.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Confirmation Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={confirmSignUp.isPending}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={confirmSignUp.isPending}
          >
            {confirmSignUp.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Confirming...
              </>
            ) : (
              'Confirm Email'
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resendCode.isPending}
          >
            {resendCode.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Resending...
              </>
            ) : (
              'Resend Code'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
