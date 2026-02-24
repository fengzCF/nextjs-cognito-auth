/**
 * User Profile API Route
 * 
 * GET /api/user/profile - Get current user's profile
 * PUT /api/user/profile - Update current user's profile
 * 
 * Demonstrates practical use of token validation with CRUD operations.
 */

import { validateRequest } from '@/lib/auth/api-validator';

interface UpdateProfileRequest {
  name?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
}

export async function GET(request: Request) {
  // Validate authentication
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    return Response.json(
      { error: validation.error },
      { status: validation.status || 401 }
    );
  }
  
  // Get user profile from your database
  // Example: const profile = await db.users.findUnique({ where: { id: validation.user!.id } });
  
  return Response.json({
    profile: {
      id: validation.user!.id,
      email: validation.user!.email,
      provider: validation.user!.provider,
      // Add more profile fields from your database
      name: 'John Doe',
      phoneNumber: '+1234567890',
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    },
  });
}

export async function PUT(request: Request) {
  // Validate authentication
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    return Response.json(
      { error: validation.error },
      { status: validation.status || 401 }
    );
  }
  
  try {
    // Parse request body
    const updates: UpdateProfileRequest = await request.json();
    
    // Validate updates
    if (!updates.name && !updates.phoneNumber && !updates.preferredLanguage) {
      return Response.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Update user profile in your database
    // Example: await db.users.update({
    //   where: { id: validation.user!.id },
    //   data: updates,
    // });
    
    console.log('Profile updated:', {
      userId: validation.user!.id,
      updates,
    });
    
    return Response.json({
      message: 'Profile updated successfully',
      profile: {
        id: validation.user!.id,
        email: validation.user!.email,
        ...updates,
      },
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
