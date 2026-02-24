# AWS Amplify Auth Functions Reference

## Core Functions from `aws-amplify/auth`

### 1. `getCurrentUser()`

**Purpose:** Check if user is authenticated and get basic user info

**Returns:**
```typescript
{
  username: string;
  userId: string;
  signInDetails: { loginId: string; authFlowType: string; };
}
```

**Where it looks:**
- ✅ **LOCAL ONLY** - reads from browser cookies/storage
- ❌ **No API call** to Cognito
- ⚡ **Fast** - instant response

**Throws error if:** No valid session found locally

**Use cases:**
```typescript
// Protected route - check if logged in
try {
  const user = await getCurrentUser();
  console.log('Authenticated:', user.userId);
  // Proceed to protected content
} catch {
  router.push('/login'); // Redirect to login
}

// Get username without fetching tokens
const user = await getCurrentUser();
console.log('Welcome,', user.username);
```

**When to use:**
- Quick authentication check before rendering
- Protected routes/middleware
- Display username without needing tokens
- When you don't need actual tokens, just confirmation user is logged in

---

### 2. `fetchAuthSession(options?)`

**Purpose:** Get authentication tokens (access, ID) and AWS credentials

**Parameters:**
```typescript
{
  forceRefresh?: boolean; // Default: false
}
```

**Returns:**
```typescript
{
  tokens: {
    accessToken: JWT;
    idToken: JWT;
    // Note: refreshToken not exposed in Amplify v6
  };
  credentials?: AWSCredentials; // For AWS SDK
  identityId?: string; // Cognito Identity Pool ID
  userSub?: string; // User's Cognito sub
}
```

**Where it looks:**

**Default behavior (`forceRefresh: false`):**
1. ✅ **Checks LOCAL cookies** first
2. ✅ **Returns cached tokens** if valid (not expired)
3. ✅ **Auto-refreshes** if access token expired:
   - Reads refresh token from cookies
   - Calls Cognito token endpoint
   - Gets new access + ID tokens
   - Updates cookies
   - Returns fresh tokens
4. ❌ **Throws error** if refresh token expired or invalid

**Force refresh (`forceRefresh: true`):**
1. 🔄 **Calls Cognito API** with refresh token
2. 🔄 **Gets new tokens** regardless of expiration
3. 🔄 **Updates cookies** with new tokens
4. 🔄 **Returns fresh tokens**

**Use cases:**
```typescript
// Get tokens for API call (uses cache if valid)
const session = await fetchAuthSession();
const accessToken = session.tokens?.accessToken?.toString();

fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Force new tokens (e.g., for testing refresh)
const session = await fetchAuthSession({ forceRefresh: true });

// Check if user is authenticated
try {
  const session = await fetchAuthSession();
  if (session.tokens) {
    console.log('Has valid session');
  }
} catch {
  console.log('Session expired');
}
```

**When to use:**
- Making authenticated API calls (need access token)
- Getting user claims from ID token
- Testing refresh token functionality (`forceRefresh: true`)
- AWS SDK operations (uses credentials)

---

### 3. `fetchUserAttributes()`

**Purpose:** Get user profile attributes (email, name, etc.)

**Returns:**
```typescript
{
  sub: string;
  email?: string;
  email_verified?: string;
  name?: string;
  phone_number?: string;
  // ... any custom attributes
}
```

**Where it looks:**
- 🔄 **Calls Cognito API** (GetUser endpoint)
- Uses cached access token from cookies
- Requires valid access token

**Use case:**
```typescript
const attributes = await fetchUserAttributes();
console.log('Email:', attributes.email);
console.log('Verified:', attributes.email_verified === 'true');
```

---

### 4. `signOut(options?)`

**Purpose:** Log out user and clear session

**Parameters:**
```typescript
{
  global?: boolean; // Sign out from all devices (revoke refresh token)
}
```

**What it does:**
1. 🔄 **Calls Cognito API** (GlobalSignOut or just clear local)
2. 🗑️ **Clears all cookies** (access, ID, refresh tokens)
3. 🗑️ **Clears local storage**
4. ✅ **User logged out**

**Use cases:**
```typescript
// Simple logout
await signOut();

// Global logout (revoke refresh tokens on all devices)
await signOut({ global: true });
```

---

## API Call Summary

| Function | API Call? | Cognito Endpoint | When Called |
|----------|-----------|------------------|-------------|
| `getCurrentUser()` | ❌ No | None | Never (local only) |
| `fetchAuthSession()` (default) | ⚠️ Sometimes | `/oauth2/token` | Only if access token expired |
| `fetchAuthSession({ forceRefresh: true })` | ✅ Yes | `/oauth2/token` | Always (forces refresh) |
| `fetchUserAttributes()` | ✅ Yes | `GetUser` | Always |
| `signOut()` | ✅ Yes | `GlobalSignOut` | Always |

---

## Token Refresh Flow (Automatic)

### Scenario: Access token expires after 60 minutes

```
User makes API call
    ↓
App calls fetchAuthSession()
    ↓
Amplify checks access token expiration
    ↓
[Expired!] Amplify reads refresh token from cookies
    ↓
Amplify calls Cognito: POST /oauth2/token
    Request: {
      grant_type: 'refresh_token',
      refresh_token: '<refresh_token>',
      client_id: '<client_id>'
    }
    ↓
Cognito validates refresh token
    ↓
Cognito returns new tokens
    Response: {
      access_token: '<new_access_token>',
      id_token: '<new_id_token>',
      token_type: 'Bearer',
      expires_in: 3600
    }
    ↓
Amplify updates cookies with new tokens
    ↓
fetchAuthSession() returns new tokens
    ↓
App proceeds with API call using fresh token
```

**Important:** This happens **automatically** - you don't need to write refresh logic!

---

## Best Practices

### ✅ Do This

**Protected Routes:**
```typescript
// Fast check, no API call
useEffect(() => {
  const checkAuth = async () => {
    try {
      await getCurrentUser();
      setAuthenticated(true);
    } catch {
      router.push('/login');
    }
  };
  checkAuth();
}, []);
```

**API Calls:**
```typescript
// Get fresh tokens automatically
const session = await fetchAuthSession();
const token = session.tokens?.accessToken?.toString();

await fetch('/api/data', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Testing Refresh:**
```typescript
// Force refresh for testing
const session = await fetchAuthSession({ forceRefresh: true });
```

### ❌ Don't Do This

**Don't use getCurrentUser() when you need tokens:**
```typescript
// ❌ Bad - getCurrentUser doesn't return tokens
const user = await getCurrentUser();
// user.tokens doesn't exist!

// ✅ Good - use fetchAuthSession for tokens
const session = await fetchAuthSession();
const token = session.tokens?.accessToken;
```

**Don't force refresh on every call:**
```typescript
// ❌ Bad - unnecessary API calls
const session = await fetchAuthSession({ forceRefresh: true });

// ✅ Good - let Amplify handle refresh
const session = await fetchAuthSession();
```

**Don't try to access refresh token directly:**
```typescript
// ❌ Bad - Amplify v6 doesn't expose this
const refreshToken = session.tokens?.refreshToken; // undefined!

// ✅ Good - refresh token managed automatically
// Just call fetchAuthSession() and Amplify handles it
```

---

## Performance Comparison

| Function | Speed | API Call | Use Case |
|----------|-------|----------|----------|
| `getCurrentUser()` | ⚡ Instant | Never | Quick auth check |
| `fetchAuthSession()` (cached) | ⚡ Fast | No | Get tokens (most common) |
| `fetchAuthSession()` (expired) | 🔄 ~200ms | Yes (auto-refresh) | Get tokens (auto-handled) |
| `fetchAuthSession({ forceRefresh: true })` | 🔄 ~200ms | Always | Testing refresh |
| `fetchUserAttributes()` | 🔄 ~200ms | Always | Get profile data |

---

## Token Storage in Cookies

Amplify stores tokens in browser cookies:

```
CognitoIdentityServiceProvider.{clientId}.{userId}.accessToken
CognitoIdentityServiceProvider.{clientId}.{userId}.idToken
CognitoIdentityServiceProvider.{clientId}.{userId}.refreshToken
CognitoIdentityServiceProvider.{clientId}.{userId}.clockDrift
CognitoIdentityServiceProvider.{clientId}.LastAuthUser
```

**Cookie Properties:**
- ❌ NOT HttpOnly (JavaScript can access - needed for Amplify)
- ✅ Secure flag (HTTPS only in production)
- ✅ SameSite=Lax (CSRF protection)

**Why tokens are accessible:**
- Amplify library needs to read/write tokens
- Enables automatic refresh without API calls
- Trade-off: vulnerable to XSS attacks → Use CSP headers!

---

## Summary

**Quick Reference:**

| Need | Use |
|------|-----|
| Check if logged in | `getCurrentUser()` |
| Get tokens for API | `fetchAuthSession()` |
| Test refresh token | `fetchAuthSession({ forceRefresh: true })` |
| Get user email/name | `fetchUserAttributes()` |
| Log out | `signOut()` |

**Remember:**
- `getCurrentUser()` = Local check only ⚡
- `fetchAuthSession()` = Smart token management (auto-refresh) 🔄
- Refresh token is automatic - don't worry about it! 🎉
