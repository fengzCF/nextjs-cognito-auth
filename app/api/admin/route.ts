/**
 * Example Admin-Only API Route
 * 
 * Demonstrates role-based authorization with access token validation.
 * Only users with 'admin' role can access this endpoint.
 */

import { validateRequestWithRole } from '@/lib/auth/api-validator';

export async function GET(request: Request) {
  // Validate authentication + authorization
  const validation = await validateRequestWithRole(request, 'admin');
  
  if (!validation.isValid) {
    return new Response(
      JSON.stringify({ 
        error: validation.error,
        hint: validation.status === 403 
          ? 'This endpoint requires admin privileges'
          : 'Please authenticate with a valid access token',
      }),
      { 
        status: validation.status || 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // User is authenticated AND authorized - proceed with admin operations
  return Response.json({
    message: 'Admin access granted',
    user: validation.user,
    adminData: {
      // Your admin-specific data here
      totalUsers: 1234,
      activeUsers: 567,
      systemStatus: 'healthy',
    },
  });
}
