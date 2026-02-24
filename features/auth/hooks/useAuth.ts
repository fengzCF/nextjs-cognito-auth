'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAuthenticatedUser,
  isAuthenticated,
  type UserInfo,
} from '@/lib/auth/cognito';
import {
  isAuth0Authenticated,
  getAuth0UserInfo,
  type Auth0UserInfo,
} from '@/lib/auth/auth0';

/**
 * Unified user type for all auth providers
 */
export type UnifiedUser = UserInfo | {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  provider: 'auth0';
};

/**
 * Hook to get current authenticated user
 * Supports Cognito SRP, Cognito OAuth, and Auth0
 */
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      // Check Auth0 first
      if (isAuth0Authenticated()) {
        try {
          const auth0User = await getAuth0UserInfo();
          // Transform to unified format
          return {
            id: auth0User.sub,
            email: auth0User.email || '',
            emailVerified: auth0User.email_verified || false,
            name: auth0User.name || auth0User.nickname,
            provider: 'auth0' as const,
          };
        } catch (error) {
          console.error('Failed to get Auth0 user info:', error);
          return null;
        }
      }
      
      // Check Cognito (SRP or OAuth)
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return null;
      }
      return getAuthenticatedUser();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to check authentication status
 */
export function useAuthStatus() {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to invalidate auth queries (useful after login/logout)
 */
export function useInvalidateAuth() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  };
}
