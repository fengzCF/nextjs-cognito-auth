/**
 * API Client Hooks with Token Validation
 * 
 * React hooks for calling protected API routes with automatic token handling.
 * Supports both Cognito and Auth0 tokens.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getStoredTokens, isAuth0Authenticated } from '@/lib/auth/auth0';

/**
 * Get current access token (Cognito or Auth0)
 */
async function getAccessToken(): Promise<string | null> {
  try {
    // Check Auth0 first
    if (isAuth0Authenticated()) {
      const tokens = getStoredTokens();
      return tokens?.accessToken || null;
    }
    
    // Cognito (Amplify)
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
    
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('No access token available');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * Hook to fetch user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => authenticatedFetch('/api/user/profile'),
    retry: 1,
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: { name?: string; phoneNumber?: string; preferredLanguage?: string }) =>
      authenticatedFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      // Invalidate profile query to refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

/**
 * Hook to test protected endpoint
 */
export function useProtectedData() {
  return useQuery({
    queryKey: ['protected'],
    queryFn: () => authenticatedFetch('/api/protected'),
    retry: 1,
  });
}

/**
 * Hook to test admin endpoint
 */
export function useAdminData() {
  return useQuery({
    queryKey: ['admin'],
    queryFn: () => authenticatedFetch('/api/admin'),
    retry: false, // Don't retry if user is not admin
  });
}
