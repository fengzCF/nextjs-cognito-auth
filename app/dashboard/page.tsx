'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { configureAmplify } from '@/lib/auth/amplify-config';
import { configureAmplifyOAuth } from '@/lib/auth/amplify-config-oauth';

// Configure Amplify BEFORE component renders
if (typeof window !== 'undefined') {
  const hasOAuthCookie = document.cookie.includes('ojkkctuvfmhpv4d16gvsjt6co');
  
  if (hasOAuthCookie) {
    console.log('🔵 Detected Cognito OAuth session - configuring OAuth client');
    configureAmplifyOAuth();
  } else {
    console.log('🟢 Detected Cognito SRP session - configuring SRP client');
    configureAmplify();
  }
}

export default function DashboardPage() {
  const { data: user, isLoading, isError } = useAuth();
  const logout = useLogout();

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (isError || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>
              You need to be logged in to view this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/">Login</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Welcome to your dashboard!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">User Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">ID:</div>
              <div className="font-mono text-xs">{user.id}</div>
              
              <div className="text-muted-foreground">Email:</div>
              <div>{user.email}</div>
              
              <div className="text-muted-foreground">Email Verified:</div>
              <div>{user.emailVerified ? 'Yes' : 'No'}</div>
              
              {user.name && (
                <>
                  <div className="text-muted-foreground">Name:</div>
                  <div>{user.name}</div>
                </>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-2">
            <Button asChild variant="outline" className="w-full">
              <a href="/token-debug">🔍 View Token Debug Tool</a>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <a href="/api-test">🧪 Test Protected APIs</a>
            </Button>
            
            <Button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              variant="destructive"
            >
              {logout.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Logging out...
                </>
              ) : (
                'Logout'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
