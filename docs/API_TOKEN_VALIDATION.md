# API Token Validation Guide

## Overview

This guide explains how to validate access tokens in Next.js 16 App Router API routes for both **Cognito** and **Auth0** authentication.

---

## 📚 Latest Documentation Sources

### Next.js 16.1.6
- **Route Handlers**: App Router API routes with Request/Response API
- **Authentication Pattern**: Session verification before API operations
- **Security**: HTTP-only cookies, token validation, role-based access

### Tailwind CSS v4.0
- **Configuration**: Uses `@theme` directive in CSS instead of JS config
- **PostCSS Plugin**: `@tailwindcss/postcss` for Next.js integration
- **Vite Plugin**: `@tailwindcss/vite` available but using PostCSS for Next.js

---

## 🔐 Implementation

### 1. Token Validator Utility

**File**: `lib/auth/api-validator.ts`

```typescript
import { validateRequest } from '@/lib/auth/api-validator';

export async function GET(request: Request) {
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    return new Response(JSON.stringify({ error: validation.error }), { 
      status: validation.status 
    });
  }
  
  // validation.user contains { id, email, provider }
  return Response.json({ data: 'protected data', user: validation.user });
}
```

**Features:**
- ✅ Extracts token from `Authorization: Bearer <token>` header
- ✅ Extracts token from cookies (Auth0 and Cognito)
- ✅ Validates JWT structure (3 parts: header.payload.signature)
- ✅ Checks token expiration (`exp` claim)
- ✅ Validates issued-at time (`iat` claim)
- ✅ Detects provider automatically (Cognito vs Auth0)
- ✅ Returns user info (id, email, provider)

---

## 🛣️ Example API Routes

### Basic Protected Route

**File**: `app/api/protected/route.ts`

```typescript
import { validateRequest } from '@/lib/auth/api-validator';

export async function GET(request: Request) {
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      { status: validation.status || 401 }
    );
  }
  
  // User authenticated - proceed with logic
  return Response.json({
    message: 'Success',
    user: validation.user,
    tokenInfo: {
      issuer: validation.token!.iss,
      expiresAt: new Date(validation.token!.exp * 1000).toISOString(),
    },
  });
}
```

### Admin-Only Route (Role-Based)

**File**: `app/api/admin/route.ts`

```typescript
import { validateRequestWithRole } from '@/lib/auth/api-validator';

export async function GET(request: Request) {
  const validation = await validateRequestWithRole(request, 'admin');
  
  if (!validation.isValid) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      { status: validation.status || 401 }
    );
  }
  
  // User is admin - proceed with admin operations
  return Response.json({ adminData: { /* ... */ } });
}
```

---

## 🔑 Token Sources

The validator checks **two locations** for access tokens:

### 1. Authorization Header (Recommended for API clients)

```bash
curl http://localhost:3000/api/protected \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```typescript
// Frontend: Send token in header
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

### 2. Cookies (Automatic for browser requests)

**Auth0 Cookies:**
- `auth0_access_token` - Access token for API calls

**Cognito Cookies:**
- `CognitoIdentityServiceProvider.{clientId}.{username}.accessToken`

Browser automatically sends cookies with `fetch()` - no action needed!

---

## 🧪 Testing Your API Routes

### Test with Token Debug Page

1. Go to http://localhost:3000/token-debug
2. Copy the **Access Token** (full token, not just first 50 chars)
3. Test with curl:

```bash
# Get your token from token-debug page, then:
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0..."

# Test protected route
curl http://localhost:3000/api/protected \
  -H "Authorization: Bearer $TOKEN"
```

### Test from Browser Console

```javascript
// On any page with authentication
const tokens = isAuth0Authenticated() 
  ? getStoredTokens() 
  : await fetchAuthSession().then(s => s.tokens);

const accessToken = tokens.accessToken;

// Call protected API
fetch('/api/protected', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
```

### Test with Browser Cookies (Automatic)

```javascript
// No Authorization header needed - cookies sent automatically
fetch('/api/protected')
  .then(res => res.json())
  .then(console.log);
```

---

## ⚠️ Security Limitations (Current Implementation)

### What's Validated ✅
1. Token structure (3 JWT parts)
2. Token expiration (`exp` claim)
3. Token issued-at time (`iat` claim)
4. Basic format validation

### What's NOT Validated ❌
1. **Signature verification** - Token could be forged
2. **Issuer validation** - Token could be from wrong provider
3. **Audience validation** - Token could be for different app
4. **JWKS key rotation** - No public key verification

### Why This Matters
Without signature verification, anyone can create a fake JWT with valid structure and expiration, and your API will accept it. This is **NOT PRODUCTION-READY**.

---

## 🚀 Production-Ready JWT Validation

For production, use the `jose` library for proper JWT verification:

### Install jose

```bash
pnpm add jose
```

### Implement Proper Validation

```typescript
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { config } from '@/lib/config/env';

// Cognito JWKS URL
const COGNITO_JWKS_URL = `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}/.well-known/jwks.json`;

// Auth0 JWKS URL
const AUTH0_JWKS_URL = `https://${config.auth0.domain}/.well-known/jwks.json`;

// Create JWKS fetchers (cached)
const cognitoJWKS = createRemoteJWKSet(new URL(COGNITO_JWKS_URL));
const auth0JWKS = createRemoteJWKSet(new URL(AUTH0_JWKS_URL));

/**
 * Verify JWT signature with JWKS
 */
async function verifyJWT(token: string): Promise<DecodedToken | null> {
  try {
    // Decode without verification first to detect provider
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Select appropriate JWKS
    const jwks = payload.iss.includes('auth0.com') ? auth0JWKS : cognitoJWKS;
    
    // Verify signature + claims
    const { payload: verified } = await jwtVerify(token, jwks, {
      // Validate issuer
      issuer: payload.iss,
      // Validate audience (optional - uncomment if needed)
      // audience: config.auth0.clientId || config.cognito.userPoolClientId,
    });
    
    return verified as DecodedToken;
    
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
```

### Updated validateRequest with jose

```typescript
export async function validateRequest(request: Request): Promise<ValidationResult> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return { isValid: false, error: 'No access token found', status: 401 };
    }
    
    // Verify signature with JWKS
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return { isValid: false, error: 'Invalid or expired token', status: 401 };
    }
    
    const provider = detectProvider(decoded);
    
    return {
      isValid: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        provider,
      },
      token: decoded,
    };
  } catch (error) {
    return { isValid: false, error: 'Internal validation error', status: 500 };
  }
}
```

---

## 📖 Next.js 16 API Route Patterns

### Pattern 1: Simple Authentication

```typescript
import { validateRequest } from '@/lib/auth/api-validator';

export async function GET(request: Request) {
  const validation = await validateRequest(request);
  if (!validation.isValid) {
    return new Response(null, { status: 401 });
  }
  
  // Authenticated - fetch user data
  const data = await fetchUserData(validation.user!.id);
  return Response.json(data);
}
```

### Pattern 2: Role-Based Authorization

```typescript
import { validateRequestWithRole } from '@/lib/auth/api-validator';

export async function DELETE(request: Request) {
  const validation = await validateRequestWithRole(request, 'admin');
  
  if (!validation.isValid) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      { status: validation.status || 401 }
    );
  }
  
  // Admin only - delete resource
  await deleteResource();
  return new Response(null, { status: 204 });
}
```

### Pattern 3: Webhook with Secret Token

```typescript
export async function POST(request: Request) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (token !== process.env.WEBHOOK_SECRET_TOKEN) {
    return Response.json({ success: false }, { status: 401 });
  }
  
  // Process webhook
  const body = await request.json();
  await processWebhook(body);
  
  return Response.json({ success: true });
}
```

---

## 🧪 Testing Checklist

### ✅ Valid Token
- **Expected**: 200 OK with user data
- **Test**: Send valid access token from logged-in session

### ❌ No Token
- **Expected**: 401 Unauthorized with error message
- **Test**: Call API without Authorization header or cookies

### ❌ Expired Token
- **Expected**: 401 Unauthorized with "Token expired"
- **Test**: Wait for token to expire (1 hour for Cognito/Auth0)

### ❌ Malformed Token
- **Expected**: 401 Unauthorized with "Invalid token format"
- **Test**: Send random string as token

### ❌ Wrong Provider Token
- **Expected**: 401 Unauthorized (signature verification fails)
- **Test**: Use Cognito token for Auth0-only API (requires signature verification)

### ❌ Insufficient Permissions
- **Expected**: 403 Forbidden
- **Test**: Use regular user token on admin-only route

---

## 🔄 Token Refresh Flow

### Client-Side (Automatic)

**Cognito (Amplify):**
```typescript
import { fetchAuthSession } from 'aws-amplify/auth';

// Amplify auto-refreshes if token expired
const session = await fetchAuthSession({ forceRefresh: true });
const accessToken = session.tokens?.accessToken?.toString();
```

**Auth0 (Custom):**
```typescript
import { refreshAuth0Token, getStoredTokens } from '@/lib/auth/auth0';

// Check if expired
const tokens = getStoredTokens();
if (isExpired(tokens)) {
  // Refresh tokens
  const newTokens = await refreshAuth0Token();
  // Use new access token
  const accessToken = newTokens.accessToken;
}
```

### API Route Handling Expired Tokens

```typescript
export async function GET(request: Request) {
  const validation = await validateRequest(request);
  
  if (!validation.isValid) {
    // Return 401 with refresh hint
    return Response.json(
      { 
        error: validation.error,
        code: 'TOKEN_EXPIRED',
        hint: 'Please refresh your access token',
      },
      { status: 401 }
    );
  }
  
  // Continue...
}
```

**Client handles 401:**
```typescript
const response = await fetch('/api/protected');

if (response.status === 401) {
  // Auto-refresh token
  if (isAuth0) {
    await refreshAuth0Token();
  } else {
    await fetchAuthSession({ forceRefresh: true });
  }
  
  // Retry request
  return fetch('/api/protected');
}
```

---

## 🎯 Best Practices

### 1. Always Validate in API Routes
```typescript
// ✅ Good - validate every request
export async function GET(request: Request) {
  const validation = await validateRequest(request);
  if (!validation.isValid) return unauthorizedResponse();
  // ...
}

// ❌ Bad - no validation
export async function GET(request: Request) {
  const data = await fetchSensitiveData();
  return Response.json(data);
}
```

### 2. Use Specific Error Messages
```typescript
// ✅ Good - helpful errors
return Response.json(
  { 
    error: 'Token expired',
    code: 'TOKEN_EXPIRED',
    hint: 'Please refresh your access token',
  },
  { status: 401 }
);

// ❌ Bad - vague error
return Response.json({ error: 'Unauthorized' }, { status: 401 });
```

### 3. Separate 401 vs 403
```typescript
// ✅ Good
if (!validation.isValid) {
  return Response.json({ error: validation.error }, { status: 401 }); // Not authenticated
}

if (!hasPermission) {
  return Response.json({ error: 'Insufficient permissions' }, { status: 403 }); // Authenticated but not authorized
}
```

### 4. Log Security Events
```typescript
const validation = await validateRequest(request);
if (!validation.isValid) {
  console.warn('Unauthorized API access attempt:', {
    path: request.url,
    error: validation.error,
    ip: request.headers.get('x-forwarded-for'),
  });
  return unauthorizedResponse();
}
```

---

## 🔧 Current vs Production Implementation

### Current (Basic Validation)

**✅ What works:**
- Token extraction from headers and cookies
- JWT structure validation
- Expiration checking
- Provider detection

**❌ Security gaps:**
- No signature verification (tokens can be forged)
- No issuer validation (tokens from wrong provider accepted)
- No audience validation (tokens for other apps accepted)
- No JWKS key rotation support

### Production (Full Validation)

**Required for production:**

1. **Install `jose` library:**
```bash
pnpm add jose
```

2. **Verify signatures with JWKS:**
```typescript
import { jwtVerify, createRemoteJWKSet } from 'jose';

const jwks = createRemoteJWKSet(new URL(JWKS_URL));
const { payload } = await jwtVerify(token, jwks, {
  issuer: expectedIssuer,
  audience: expectedAudience,
});
```

3. **Validate all claims:**
- `iss` (issuer) - Must match your Cognito/Auth0 domain
- `aud` (audience) - Must match your client ID or API identifier
- `exp` (expiration) - Token not expired
- `iat` (issued at) - Token not issued in future

---

## 📝 Quick Reference

### Token Locations

| Provider | Cookie Name | Header Format |
|----------|-------------|---------------|
| Auth0 | `auth0_access_token` | `Authorization: Bearer {token}` |
| Cognito | `CognitoIdentityServiceProvider.*.accessToken` | `Authorization: Bearer {token}` |

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 500 | Internal Error | Server-side validation error |

### Response Formats

**Success (200):**
```json
{
  "message": "Success",
  "data": { /* ... */ },
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "provider": "auth0"
  }
}
```

**Unauthorized (401):**
```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED",
  "hint": "Please refresh your access token"
}
```

**Forbidden (403):**
```json
{
  "error": "Insufficient permissions",
  "hint": "This endpoint requires admin privileges"
}
```

---

## 🚀 Next Steps

1. ✅ **Start with basic validation** (current implementation)
2. 🔄 **Add signature verification** with `jose` library
3. 🔒 **Migrate to HttpOnly cookies** (requires server-side token exchange)
4. 📊 **Add rate limiting** for API routes
5. 🔐 **Add CSRF protection** for state-changing operations
6. 📝 **Add API request logging** for security monitoring

---

## 📚 Additional Resources

- **Next.js 16 Authentication Guide**: https://nextjs.org/docs/app/guides/authentication
- **Auth0 API Authentication**: https://auth0.com/docs/secure/tokens/access-tokens
- **Cognito JWT Validation**: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
- **jose Library**: https://github.com/panva/jose
- **JWT Best Practices**: https://datatracker.ietf.org/doc/html/rfc8725
