/**
 * API Validator Tests
 * 
 * Tests for the token validation utility used in API routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateRequest, validateRequestWithRole } from './api-validator';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  getAll: vi.fn(),
}));

describe('validateRequest', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue(mockCookies as any);
  });

  it('should return invalid when no token present', async () => {
    mockCookies.get.mockReturnValue(undefined);
    mockCookies.getAll.mockReturnValue([]);
    
    const request = new Request('http://localhost:3000/api/protected');
    const result = await validateRequest(request);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('No access token found');
    expect(result.status).toBe(401);
  });

  it('should validate token from Authorization header', async () => {
    // Create a mock JWT (not signed, for testing only)
    const mockToken = createMockJWT({
      sub: 'user123',
      email: 'test@example.com',
      iss: 'https://test.auth0.com/',
      aud: 'test-client-id',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
    });
    
    const request = new Request('http://localhost:3000/api/protected', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });
    
    const result = await validateRequest(request);
    
    expect(result.isValid).toBe(true);
    expect(result.user?.id).toBe('user123');
    expect(result.user?.email).toBe('test@example.com');
    expect(result.user?.provider).toBe('auth0');
  });

  it('should return invalid for expired token', async () => {
    // Create an expired token
    const expiredToken = createMockJWT({
      sub: 'user123',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200,
    });
    
    const request = new Request('http://localhost:3000/api/protected', {
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
      },
    });
    
    const result = await validateRequest(request);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Token expired');
    expect(result.status).toBe(401);
  });

  it('should validate token from Auth0 cookie', async () => {
    const mockToken = createMockJWT({
      sub: 'auth0|123',
      email: 'user@auth0.com',
      iss: 'https://dev-abc123.auth0.com/',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    
    mockCookies.get.mockReturnValue({ value: mockToken });
    
    const request = new Request('http://localhost:3000/api/protected');
    const result = await validateRequest(request);
    
    expect(result.isValid).toBe(true);
    expect(result.user?.provider).toBe('auth0');
  });

  it('should detect Cognito provider from issuer', async () => {
    const cognitoToken = createMockJWT({
      sub: 'cognito-user-123',
      email: 'user@cognito.com',
      iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    
    const request = new Request('http://localhost:3000/api/protected', {
      headers: {
        'Authorization': `Bearer ${cognitoToken}`,
      },
    });
    
    const result = await validateRequest(request);
    
    expect(result.isValid).toBe(true);
    expect(result.user?.provider).toBe('cognito');
  });
});

describe('validateRequestWithRole', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue(mockCookies as any);
  });

  it('should return 403 when user lacks required role', async () => {
    const mockToken = createMockJWT({
      sub: 'user123',
      email: 'user@example.com',
      role: 'user', // Not admin
      iss: 'https://test.auth0.com/',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    
    const request = new Request('http://localhost:3000/api/admin', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });
    
    const result = await validateRequestWithRole(request, 'admin');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Insufficient permissions');
    expect(result.status).toBe(403);
  });

  it('should allow access when user has required role', async () => {
    const mockToken = createMockJWT({
      sub: 'admin123',
      email: 'admin@example.com',
      role: 'admin', // Has admin role
      iss: 'https://test.auth0.com/',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    
    const request = new Request('http://localhost:3000/api/admin', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });
    
    const result = await validateRequestWithRole(request, 'admin');
    
    expect(result.isValid).toBe(true);
    expect(result.user?.id).toBe('admin123');
  });

  it('should check Cognito custom:role attribute', async () => {
    const cognitoToken = createMockJWT({
      sub: 'cognito-admin',
      email: 'admin@cognito.com',
      'custom:role': 'admin', // Cognito custom attribute
      iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    
    const request = new Request('http://localhost:3000/api/admin', {
      headers: {
        'Authorization': `Bearer ${cognitoToken}`,
      },
    });
    
    const result = await validateRequestWithRole(request, 'admin');
    
    expect(result.isValid).toBe(true);
  });
});

/**
 * Helper to create mock JWT for testing
 * NOTE: This creates unsigned tokens for testing only
 */
function createMockJWT(payload: Record<string, any>): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mockSignature = 'mock-signature-for-testing';
  
  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}
