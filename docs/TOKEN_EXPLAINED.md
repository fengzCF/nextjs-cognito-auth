# Understanding OAuth Tokens: Access, ID, and Refresh

## The Three Token Types

### 1. **Access Token** (JWT)
**Purpose:** Authorization - "What can this user access?"

**Lifetime:** 60 minutes (configurable in Cognito)

**Format:** JWT (JSON Web Token) - can be decoded

**Used for:**
- Calling backend APIs
- Accessing protected resources
- Authorization checks

**Example decoded Access Token:**
```json
{
  "sub": "16123254-f071-7000-4e09-7dada2dbef68",
  "iss": "https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_tLugLE3vN",
  "client_id": "ojkkctuvfmhpv4d16gvsjt6co",
  "origin_jti": "ae90a52f-a223-46bf-985f-a8f080dc0767",
  "token_use": "access",
  "scope": "aws.cognito.signin.user.admin openid profile email",
  "auth_time": 1770911252,
  "exp": 1770914852,
  "iat": 1770911252,
  "jti": "2660aa55-7a19-41a8-b3f9-80ee5f423342",
  "username": "16123254-f071-7000-4e09-7dada2dbef68"
}
```

**Key Claims:**
- `scope`: Permissions granted (what APIs can be called)
- `token_use`: "access" (identifies this as access token)
- `client_id`: Which app client requested this
- `exp`: Expiration timestamp (Unix time)
- `username`: User identifier

**When to use:**
```typescript
// Call your backend API
const response = await fetch('https://api.yourapp.com/products', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Your backend validates:
// 1. Signature is valid (using Cognito public keys)
// 2. Token not expired (exp > now)
// 3. Issuer matches (iss = your Cognito URL)
// 4. Scope includes required permission
```

---

### 2. **ID Token** (JWT)
**Purpose:** Authentication - "Who is this user?"

**Lifetime:** 60 minutes (configurable in Cognito)

**Format:** JWT (JSON Web Token) - can be decoded

**Used for:**
- Getting user profile information
- Displaying user details in UI
- Identity verification

**Example decoded ID Token:**
```json
{
  "sub": "16123254-f071-7000-4e09-7dada2dbef68",
  "email_verified": true,
  "iss": "https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_tLugLE3vN",
  "cognito:username": "16123254-f071-7000-4e09-7dada2dbef68",
  "origin_jti": "ae90a52f-a223-46bf-985f-a8f080dc0767",
  "aud": "ojkkctuvfmhpv4d16gvsjt6co",
  "token_use": "id",
  "auth_time": 1770911252,
  "exp": 1770914852,
  "iat": 1770911252,
  "jti": "00fddd24-4c84-4c4c-a081-719839807978",
  "email": "palil27152@newtrea.com"
}
```

**Key Claims:**
- `email`: User's email address
- `email_verified`: Email verification status
- `sub`: Unique user ID (subject)
- `cognito:username`: Username in Cognito
- `token_use`: "id" (identifies this as ID token)
- `aud`: Audience (your app client ID)

**When to use:**
```typescript
// Parse ID token to get user info
const idToken = parseJwt(tokens.idToken);

// Display in UI
console.log(`Welcome, ${idToken.email}!`);
console.log(`Email verified: ${idToken.email_verified}`);

// Store user session
localStorage.setItem('userId', idToken.sub);
```

---

### 3. **Refresh Token** (Opaque Token)
**Purpose:** Get new access/ID tokens without re-authentication

**Lifetime:** 5 days (configurable in Cognito, you set this)

**Format:** Opaque string (NOT a JWT) - cannot be decoded

**Used for:**
- Refreshing expired access/ID tokens
- Maintaining long sessions
- Background token renewal

**Example Refresh Token:**
```
eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...
(very long encrypted string, NOT a JWT!)
```

**Important:**
- **Cannot be decoded** - it's encrypted, not just encoded
- **Single-use** - after using it once, you get a new one
- **Long-lived** - survives multiple access token expirations
- **Stored securely** - Amplify stores it in browser cookies

**When to use:**
```typescript
// Amplify handles this automatically!
// When access token expires, it automatically:
// 1. Uses refresh token to get new tokens
// 2. Stores new access/ID tokens
// 3. Returns new refresh token
// You don't need to code this manually

// Force a refresh:
const session = await fetchAuthSession({ forceRefresh: true });
```

---

## Why Scope is in Access Token, Not ID Token

**Access Token = Authorization = "Can they do this?"**
- Contains `scope` to tell APIs what permissions granted
- Backend checks: "Does this access token have 'read:products' scope?"

**ID Token = Authentication = "Who are they?"**
- Contains user claims (email, name, etc.)
- No scope needed - it's about identity, not permissions

---

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ Initial Login (OAuth Code Grant)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │  Token Exchange              │
        │  (Code + PKCE verifier)      │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │  Receive 3 Tokens:                   │
        │  • Access Token (60 min)             │
        │  • ID Token (60 min)                 │
        │  • Refresh Token (5 days)            │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │  Use Access Token for API calls      │
        │  Use ID Token for user info          │
        │  Refresh Token stored safely         │
        └──────────────┬───────────────────────┘
                       │
                       │ (After 60 minutes)
                       ▼
        ┌──────────────────────────────────────┐
        │  Access Token Expired!               │
        │  Amplify detects this automatically  │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │  Automatic Refresh:                  │
        │  1. Send Refresh Token to Cognito    │
        │  2. Get new Access Token             │
        │  3. Get new ID Token                 │
        │  4. Get new Refresh Token            │
        └──────────────┬───────────────────────┘
                       │
                       │ (Repeat every 60 min)
                       ▼
        ┌──────────────────────────────────────┐
        │  Tokens stay fresh for 5 days        │
        │  No re-login needed!                 │
        └──────────────────────────────────────┘
                       │
                       │ (After 5 days)
                       ▼
        ┌──────────────────────────────────────┐
        │  Refresh Token Expired               │
        │  User must log in again              │
        └──────────────────────────────────────┘
```

---

## Where Are Tokens Stored?

Looking at your browser DevTools → Application → Cookies:

```
# Access Token
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.accessToken

# ID Token
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.idToken

# Refresh Token
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.refreshToken

# Metadata
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.clockDrift
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.LastAuthUser
```

**Cookie Properties:**
- **SameSite:** Lax (prevents CSRF in most cases)
- **Secure:** Yes (HTTPS only in production)
- **HttpOnly:** No (JavaScript can access - this is how Amplify works)

---

## Practical Usage in Your App

### **Scenario 1: Display User Profile**

```typescript
// Use ID Token
import { fetchUserAttributes } from 'aws-amplify/auth';

const attributes = await fetchUserAttributes();
console.log('Email:', attributes.email);
console.log('Verified:', attributes.email_verified);
```

### **Scenario 2: Call Your Backend API**

```typescript
// Use Access Token
import { fetchAuthSession } from 'aws-amplify/auth';

const session = await fetchAuthSession();
const accessToken = session.tokens?.accessToken?.toString();

const response = await fetch('https://api.yourapp.com/products', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### **Scenario 3: Check If User Is Authenticated**

```typescript
// Can use either, but typically use ID token
import { getCurrentUser } from 'aws-amplify/auth';

try {
  const user = await getCurrentUser();
  console.log('User is authenticated:', user.userId);
} catch {
  console.log('User not authenticated');
  router.push('/login');
}
```

### **Scenario 4: Manual Token Refresh**

```typescript
// Usually automatic, but you can force it
import { fetchAuthSession } from 'aws-amplify/auth';

const session = await fetchAuthSession({ forceRefresh: true });
// New tokens automatically retrieved and stored
```

---

## Backend Token Validation

Your backend API should validate access tokens:

```typescript
// Node.js backend example
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_tLugLE3vN/.well-known/jwks.json'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Middleware
function validateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    issuer: 'https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_tLugLE3vN'
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check token_use
    if (decoded.token_use !== 'access') {
      return res.status(401).json({ error: 'Not an access token' });
    }
    
    // Check scope
    if (!decoded.scope.includes('read:products')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    req.user = decoded;
    next();
  });
}
```

---

## Summary Table

| Token | Purpose | Format | Lifetime | Can Decode? | Contains | Used For |
|-------|---------|--------|----------|-------------|----------|----------|
| **Access** | Authorization | JWT | 60 min | ✅ Yes | `scope`, `client_id`, `username` | API calls, resource access |
| **ID** | Authentication | JWT | 60 min | ✅ Yes | `email`, `sub`, `email_verified` | User info, profile display |
| **Refresh** | Token renewal | Opaque | 5 days | ❌ No | Encrypted data | Getting new access/ID tokens |

---

## Why You Don't See Refresh Token in JWT.io

Because **it's not a JWT!** It's an encrypted, opaque token that only Cognito can read. You cannot and should not decode it.

To verify you have a refresh token, check:
1. **Browser Console** logs (should show `hasRefreshToken: true`)
2. **Browser Cookies** - look for the `refreshToken` cookie
3. **Wait 60 minutes** - access token expires, refresh token automatically gets new ones

---

## Refresh Token Storage

Amplify stores it in browser cookies automatically. You can verify by:

```typescript
// Check if refresh token exists
import { fetchAuthSession } from 'aws-amplify/auth';

const session = await fetchAuthSession();
const hasRefreshToken = !!session.tokens?.refreshToken;
console.log('Has refresh token:', hasRefreshToken);
```

If `hasRefreshToken` is `false`, check your Cognito app client settings:
- ✅ "ALLOW_REFRESH_TOKEN_AUTH" must be enabled
- ✅ Refresh token expiration > 0 days (you have 5 days ✓)
