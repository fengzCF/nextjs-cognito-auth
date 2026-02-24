'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useRegister } from '@/features/auth/hooks/useRegister';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    register.mutate({ email, password });
  };

  return (
    <Card className="w-full max-w-[500px] shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold">Sign up</CardTitle>
        <CardDescription className="text-base">
          Create a new account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {register.isError && (
            <div className="rounded-md bg-destructive/10 border border-destructive p-3">
              <p className="text-sm text-destructive">
                {register.error instanceof Error
                  ? register.error.message
                  : 'Failed to register. Please try again.'}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@host.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={register.isPending}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={register.isPending}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Reenter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={register.isPending}
              className="h-11"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded border-[color:hsl(var(--border))]"
            />
            <label
              htmlFor="showPassword"
              className="text-sm font-normal cursor-pointer"
            >
              Show password
            </label>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            className="w-full h-11 bg-[#0066FF] hover:bg-[#0052CC] text-white"
            disabled={register.isPending}
          >
            {register.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Signing up...
              </>
            ) : (
              'Sign up'
            )}
          </Button>
          
          <p className="text-sm text-center">
            Have an account already?{' '}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
