# Custom OAuth vs Auth Libraries: Comparison and Security

## Overview

This document explains:
1. How our custom Auth0 implementation differs from NextAuth.js/Auth.js
2. Why Auth0 requires a client secret (and Cognito doesn't)
3. How to securely handle client secrets in production

---

## Part 1: Custom Implementation vs Auth Libraries

### Our Custom Implementation

**What We Built:**
```typescript
// lib/auth/auth0.ts
- Manual PKCE generation (code_verifier, code_challenge)
- Manual OAuth URL construction
- Manual token exchange via fetch()
- Manual token storage (localStorage + cookies)
- Manual refresh token handling
- Manual user info fetching
```

**Architecture:**
```
Browser → lib/auth/auth0.ts → Auth0 API
         (direct fetch calls)
```

### NextAuth.js / Auth.js

**What They Provide:**
```typescript
import { signIn, signOut, useSession } from 'next-auth/react';

// Simple API
await signIn('auth0');
const { data: session } = useSession();
```

**Architecture:**
```
Browser → Next.js API Routes → Auth0 API
         (/api/auth/[...nextauth])
```

---

## Detailed Comparison

### 1. Architecture Difference

#### Our Custom Implementation (Client-Side)

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  app/login-auth0/page.tsx                              │
│           │                                             │
│           ▼                                             │
│  lib/auth/auth0.ts                                     │
│    - initiateAuth0Login()                              │
│    - handleAuth0Callback()                             │
│    - refreshAuth0Token()                               │
│           │                                             │
│           ▼                                             │
│  fetch('https://dev-yourname.us.auth0.com/authorize')  │
│  fetch('https://dev-yourname.us.auth0.com/oauth/token')│
│           │                                             │
└───────────┼─────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │   Auth0 API   │
    └───────────────┘
```

**Characteristics:**
- ✅ All code runs in browser
- ✅ Client secret exposed in browser bundle
- ✅ Tokens stored client-side (localStorage/cookies)
- ✅ Direct API calls from browser
- ⚠️ Vulnerable to XSS attacks
- ⚠️ Cannot use confidential client secrets

#### NextAuth.js (Server-Side)

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  'use client'                                           │
│  import { signIn } from 'next-auth/react'              │
│           │                                             │
│           ▼                                             │
│  POST /api/auth/signin/auth0                           │
│           │                                             │
└───────────┼─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│               Next.js Server (Node.js)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  app/api/auth/[...nextauth]/route.ts                   │
│           │                                             │
│           ▼                                             │
│  NextAuth({                                            │
│    providers: [                                         │
│      Auth0Provider({                                    │
│        clientId: process.env.AUTH0_CLIENT_ID,          │
│        clientSecret: process.env.AUTH0_CLIENT_SECRET,  │
│      })                                                 │
│    ]                                                    │
│  })                                                     │
│           │                                             │
│           ▼                                             │
│  fetch('https://dev-yourname.us.auth0.com/oauth/token')│
│  (server-side, secret never exposed)                   │
│           │                                             │
│           ▼                                             │
│  Set HttpOnly cookies (js cannot access)               │
│           │                                             │
└───────────┼─────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │   Auth0 API   │
    └───────────────┘
```

**Characteristics:**
- ✅ OAuth logic runs on server
- ✅ Client secret stays on server (never in browser)
- ✅ HttpOnly cookies (XSS protection)
- ✅ CSRF token protection
- ✅ Session management
- ⚠️ Requires API routes (more complexity)

---

### 2. Feature Comparison

| Feature | Our Custom | NextAuth.js |
|---------|-----------|-------------|
| **Setup Complexity** | Medium | High (initial) |
| **Code to Write** | ~500 lines | ~50 lines |
| **Client Secret Security** | ❌ Exposed in bundle | ✅ Server-only |
| **Token Storage** | localStorage + cookies | HttpOnly cookies |
| **XSS Protection** | ⚠️ Vulnerable | ✅ Protected |
| **CSRF Protection** | Manual (state param) | ✅ Built-in |
| **Multiple Providers** | Manual per provider | ✅ Easy (config) |
| **Session Management** | Manual | ✅ Built-in |
| **Token Refresh** | Manual | ✅ Automatic |
| **Database Session** | No | ✅ Optional |
| **Middleware Support** | Manual | ✅ Built-in |
| **TypeScript Types** | DIY | ✅ Included |
| **Edge Runtime** | N/A | ✅ Supported |
| **Learning Value** | ✅✅✅ High | ⚠️ Black box |
| **Production Ready** | ⚠️ Needs hardening | ✅ Battle-tested |

---

### 3. Code Comparison

#### Our Custom Implementation

**Login:**
```typescript
// app/login-auth0/page.tsx
'use client';
import { initiateAuth0Login } from '@/lib/auth/auth0';

const handleLogin = async () => {
  await initiateAuth0Login();
  // Browser redirects, nothing returned
};
```

**Callback:**
```typescript
// app/auth/auth0-callback/page.tsx
'use client';
import { handleAuth0Callback } from '@/lib/auth/auth0';

useEffect(() => {
  const processCallback = async () => {
    await handleAuth0Callback();
    router.push('/dashboard');
  };
  processCallback();
}, []);
```

**Token Exchange (CLIENT-SIDE ⚠️):**
```typescript
// lib/auth/auth0.ts
async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.auth0.clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: `${window.location.origin}/auth/auth0-callback`,
  });
  
  // ⚠️ Client secret exposed in browser bundle
  if (config.auth0.clientSecret) {
    body.append('client_secret', config.auth0.clientSecret);
  }
  
  const response = await fetch(`https://${config.auth0.domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  
  return response.json();
}
```

#### NextAuth.js Implementation

**Setup:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';

const handler = NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!, // Server-only ✅
      issuer: process.env.AUTH0_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      return session;
    },
  },
  session: {
    strategy: 'jwt', // or 'database'
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true, // XSS protection ✅
        sameSite: 'lax', // CSRF protection
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});

export { handler as GET, handler as POST };
```

**Login (Client):**
```typescript
'use client';
import { signIn } from 'next-auth/react';

const handleLogin = async () => {
  await signIn('auth0', { callbackUrl: '/dashboard' });
};
```

**Use Session (Client):**
```typescript
'use client';
import { useSession } from 'next-auth/react';

function Dashboard() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Not authenticated</p>;
  
  return <p>Welcome, {session.user?.email}</p>;
}
```

**Protect API Route:**
```typescript
// app/api/protected/route.ts
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return Response.json({ data: 'Protected data' });
}
```

---

## Part 2: Why Auth0 Requires Client Secret

### OAuth 2.0 Client Types

#### 1. Public Clients (Cognito SRP & OAuth)

**Definition:** Cannot securely store credentials

**Examples:**
- Single Page Applications (SPAs)
- Mobile apps
- Desktop apps

**Cognito Configuration:**
```typescript
// Cognito App Client Settings
{
  clientId: 'ojkkctuvfmhpv4d16gvsjt6co',
  clientSecret: null, // ✅ Not required
  authFlows: ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH']
}

// Or for OAuth:
{
  clientId: 'ojkkctuvfmhpv4d16gvsjt6co',
  clientSecret: null, // ✅ Not required
  allowedOAuthFlows: ['code'],
  allowedOAuthScopes: ['openid', 'email', 'profile']
}
```

**Security:** PKCE replaces client secret
- Code verifier stays in browser
- Code challenge sent to server
- Server validates verifier matches challenge

**Why Cognito doesn't require it:**
AWS designed Cognito to work without client secrets by default. You can optionally add a secret, but:
- SRP flow: Secret not used (zero-knowledge proof instead)
- OAuth flow: PKCE is sufficient (secret optional)

#### 2. Confidential Clients (Traditional Auth0)

**Definition:** Can securely store credentials

**Examples:**
- Web servers (Node.js, Python, etc.)
- Backend services
- Server-side rendering

**Auth0 Default Configuration:**
```typescript
// Auth0 Application Settings
{
  clientId: 'abc123',
  clientSecret: 'xyz789secretkey', // ❌ Required by default
  applicationType: 'Regular Web Application'
}
```

**Security:** Client secret proves identity
- Secret stored on server
- Never exposed to browser
- Sent with token exchange request

**Why Auth0 requires it:**
Auth0's default assumption is you're using server-side OAuth (more secure). For SPAs:
- You can create a "Single Page Application" type
- BUT Auth0 still generates a secret (it's just not enforced)
- Best practice: Use PKCE + server-side token exchange

---

### Technical Difference

#### Cognito Token Exchange (No Secret)

```http
POST https://cognito-domain.auth.region.amazoncognito.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=ojkkctuvfmhpv4d16gvsjt6co
&code=AUTHORIZATION_CODE
&code_verifier=CODE_VERIFIER
&redirect_uri=http://localhost:3000/auth/callback
```

Response: ✅ Tokens (no client_secret needed)

#### Auth0 Token Exchange (With Secret)

```http
POST https://dev-yourname.us.auth0.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=abc123
&client_secret=xyz789secretkey  ⬅️ Required
&code=AUTHORIZATION_CODE
&code_verifier=CODE_VERIFIER
&redirect_uri=http://localhost:3000/auth/auth0-callback
```

Response: ✅ Tokens

**Without secret:**
```json
{
  "error": "access_denied",
  "error_description": "Unauthorized"
}
```

---

## Part 3: Secure Client Secret Handling

### Current Implementation (⚠️ INSECURE)

**Problem:**
```typescript
// .env.local (git-ignored, but still risky)
AUTH0_CLIENT_SECRET=xyz789secretkey

// lib/config/env.ts
export const config = {
  auth0: {
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  }
};

// lib/auth/auth0.ts (CLIENT-SIDE)
const body = new URLSearchParams({
  client_secret: config.auth0.clientSecret, // ⚠️ EXPOSED IN BUNDLE
});
```

**Why it's insecure:**
1. Next.js bundles `NEXT_PUBLIC_*` vars into browser JavaScript
2. Even without `NEXT_PUBLIC_`, if used in client component, it's bundled
3. Anyone can inspect browser Network tab or JS bundle
4. Secret is visible in source maps

---

### Solution 1: Server-Side Token Exchange (Recommended)

**Architecture:**
```
Browser → Next.js API Route → Auth0
        (callback page)   (server-side)
```

**Implementation:**

#### Step 1: Create API Route

```typescript
// app/api/auth/auth0-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth0Secret } from '@/lib/secrets';

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json();
    
    // Validate code and codeVerifier from request
    if (!code || !codeVerifier) {
      return NextResponse.json(
        { error: 'Missing code or codeVerifier' },
        { status: 400 }
      );
    }
    
    // Get secret securely (server-side only)
    const clientSecret = await getAuth0Secret();
    
    // Exchange code for tokens (server-side)
    const tokenResponse = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.AUTH0_CLIENT_ID!,
          client_secret: clientSecret, // ✅ Server-only, never exposed
          code,
          code_verifier: codeVerifier,
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/auth0-callback`,
        }),
      }
    );
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      return NextResponse.json({ error: error.error_description }, { status: 400 });
    }
    
    const tokens = await tokenResponse.json();
    
    // Set HttpOnly cookies (XSS protection)
    const cookieOptions = 'HttpOnly; Secure; SameSite=Strict; Path=/';
    const maxAge = tokens.expires_in || 3600;
    
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('auth0_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });
    
    response.cookies.set('auth0_id_token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });
    
    if (tokens.refresh_token) {
      response.cookies.set('auth0_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }
    
    return response;
    
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Token exchange failed' },
      { status: 500 }
    );
  }
}
```

#### Step 2: Update Client Callback Handler

```typescript
// app/auth/auth0-callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Auth0CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract code and state from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        // Validate state (CSRF)
        const storedState = sessionStorage.getItem('auth0_state');
        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }
        
        // Get code verifier
        const codeVerifier = sessionStorage.getItem('auth0_code_verifier');
        if (!codeVerifier) {
          throw new Error('No code verifier found');
        }
        
        // Call server-side API to exchange code
        // ✅ Client secret never exposed
        const response = await fetch('/api/auth/auth0-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Token exchange failed');
        }
        
        // Tokens now in HttpOnly cookies ✅
        // Clean up
        sessionStorage.removeItem('auth0_state');
        sessionStorage.removeItem('auth0_code_verifier');
        
        // Redirect to dashboard
        router.push('/dashboard');
        
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };
    
    processCallback();
  }, [router]);
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return <div>Completing sign in...</div>;
}
```

#### Step 3: Read Tokens from Server

```typescript
// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  
  const accessToken = cookieStore.get('auth0_access_token')?.value;
  const idToken = cookieStore.get('auth0_id_token')?.value;
  
  if (!accessToken || !idToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  // Optionally decode and validate tokens here
  
  return NextResponse.json({
    authenticated: true,
    accessToken, // Only send to authorized client code
    idToken,
  });
}
```

---

### Solution 2: AWS Systems Manager (SSM) Parameter Store

**Best for:** Production deployments on AWS

#### Step 1: Store Secret in SSM

```bash
# AWS CLI
aws ssm put-parameter \
  --name "/nextjs-app/prod/auth0-client-secret" \
  --value "xyz789secretkey" \
  --type "SecureString" \
  --description "Auth0 client secret for production" \
  --region us-east-1

# With encryption key
aws ssm put-parameter \
  --name "/nextjs-app/prod/auth0-client-secret" \
  --value "xyz789secretkey" \
  --type "SecureString" \
  --key-id "alias/my-app-key" \
  --description "Auth0 client secret (encrypted with KMS)"
```

#### Step 2: Create Secret Fetcher

```typescript
// lib/secrets/ssm.ts
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Initialize SSM client
const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Cache to avoid repeated API calls
const secretCache = new Map<string, { value: string; expiry: number }>();

export async function getAuth0Secret(): Promise<string> {
  const cacheKey = 'auth0_client_secret';
  const now = Date.now();
  
  // Check cache
  const cached = secretCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return cached.value;
  }
  
  // Fetch from SSM
  const parameterName = `/nextjs-app/${process.env.NODE_ENV}/auth0-client-secret`;
  
  try {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true, // Decrypt SecureString
    });
    
    const response = await ssmClient.send(command);
    const secret = response.Parameter?.Value;
    
    if (!secret) {
      throw new Error('Secret not found in SSM');
    }
    
    // Cache for 5 minutes
    secretCache.set(cacheKey, {
      value: secret,
      expiry: now + 5 * 60 * 1000,
    });
    
    return secret;
    
  } catch (error) {
    console.error('Failed to fetch secret from SSM:', error);
    throw new Error('Unable to retrieve Auth0 client secret');
  }
}
```

#### Step 3: Use in API Route

```typescript
// app/api/auth/auth0-callback/route.ts
import { getAuth0Secret } from '@/lib/secrets/ssm';

export async function POST(request: NextRequest) {
  // ...
  
  // Fetch secret from SSM (cached)
  const clientSecret = await getAuth0Secret(); // ✅ Never in .env
  
  const tokenResponse = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        client_secret: clientSecret, // ✅ Secure
        // ...
      }),
    }
  );
  
  // ...
}
```

#### Step 4: Configure IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:us-east-1:123456789012:parameter/nextjs-app/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:kms:us-east-1:123456789012:key/your-kms-key-id"
      ]
    }
  ]
}
```

#### Step 5: Environment Setup

```bash
# .env.local (local development)
AUTH0_CLIENT_SECRET=dev_secret_for_local_testing

# .env.production (server only)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
# No AUTH0_CLIENT_SECRET in production ✅
```

---

### Solution 3: AWS Secrets Manager

**Similar to SSM but designed specifically for secrets**

```typescript
// lib/secrets/secrets-manager.ts
import { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function getAuth0Secret(): Promise<string> {
  const secretName = `nextjs-app/${process.env.NODE_ENV}/auth0`;
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    
    if (response.SecretString) {
      const secrets = JSON.parse(response.SecretString);
      return secrets.clientSecret;
    }
    
    throw new Error('Secret not found');
    
  } catch (error) {
    console.error('Failed to fetch secret:', error);
    throw error;
  }
}
```

**Store secret:**
```bash
aws secretsmanager create-secret \
  --name "nextjs-app/prod/auth0" \
  --description "Auth0 credentials" \
  --secret-string '{"clientId":"abc123","clientSecret":"xyz789"}'
```

---

### Solution 4: Vercel Environment Variables

**If deploying to Vercel:**

1. **Dashboard → Project → Settings → Environment Variables**
2. Add `AUTH0_CLIENT_SECRET` as **Secret**
3. Environment: Production
4. Encrypted at rest ✅
5. Never exposed in logs or client ✅

**Access:**
```typescript
// Only works in API Routes and Server Components
const clientSecret = process.env.AUTH0_CLIENT_SECRET;
```

---

## Security Comparison

| Method | Security | Cost | Complexity | Best For |
|--------|----------|------|------------|----------|
| **Client-Side (Current)** | ❌ Low | Free | Low | **Demo only** |
| **Server-Side API Route** | ✅ High | Free | Medium | **Production** |
| **AWS SSM** | ✅✅ Very High | ~$0.05/10k calls | Medium | **AWS deployments** |
| **AWS Secrets Manager** | ✅✅ Very High | ~$0.40/month | Medium | **Multi-secret apps** |
| **Vercel Env Vars** | ✅ High | Free | Low | **Vercel deployments** |
| **NextAuth.js** | ✅✅ Very High | Free | Low (setup) | **Production (best)** |

---

## Migration Path

### Phase 1: Quick Fix (Server-Side API Route)
1. Create `/app/api/auth/auth0-callback/route.ts`
2. Move token exchange to server
3. Use HttpOnly cookies
4. **Time: 1 hour**

### Phase 2: Add Secret Management (AWS SSM)
1. Store secret in SSM Parameter Store
2. Fetch in API route
3. Remove from .env
4. **Time: 2 hours**

### Phase 3: Full Migration (NextAuth.js)
1. Install `next-auth`
2. Configure Auth0 provider
3. Use built-in session management
4. Replace custom auth code
5. **Time: 4-8 hours**

---

## Summary

### Our Custom Implementation
- **Pros:** Educational, full control, no dependencies
- **Cons:** Client secret exposed, manual security, XSS vulnerable
- **Best for:** Learning OAuth 2.0 internals

### NextAuth.js / Auth.js
- **Pros:** Battle-tested, secure by default, HttpOnly cookies, multi-provider
- **Cons:** Black box, initial complexity, requires API routes
- **Best for:** Production applications

### Client Secret Handling
- **Cognito:** Doesn't require secret (PKCE sufficient)
- **Auth0:** Requires secret (confidential client model)
- **Solution:** Server-side token exchange + AWS SSM/Secrets Manager

### Recommendation
For production with Auth0:
1. Use NextAuth.js (easiest, most secure)
2. OR move to server-side API route + AWS SSM
3. Never use current client-side approach in production

### Quick Command to Install NextAuth
```bash
pnpm add next-auth @auth0/nextjs-auth0
```

Then follow: https://next-auth.js.org/providers/auth0
