'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useLogin } from '@/features/auth/hooks/useLogin';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <Card className="w-full max-w-[500px] shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
        <CardDescription className="text-base">
          Sign in to your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {login.isError && (
            <div className="rounded-md bg-destructive/10 border border-destructive p-3">
              <p className="text-sm text-destructive">
                {login.error instanceof Error
                  ? login.error.message
                  : 'Failed to login. Please check your credentials.'}
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
              disabled={login.isPending}
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
              disabled={login.isPending}
              className="h-11"
            />
          </div>

          <div className="flex items-center justify-between">
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
            <a
              href="#"
              className="text-sm text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                alert('Password reset feature coming soon!');
              }}
            >
              Forgot your password?
            </a>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            className="w-full h-11 bg-[#0066FF] hover:bg-[#0052CC] text-white"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
          
          <p className="text-sm text-center">
            New user?{' '}
            <a href="/register" className="text-primary hover:underline">
              Create an account
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
