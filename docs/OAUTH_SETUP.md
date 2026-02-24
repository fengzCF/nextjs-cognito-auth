# OAuth 2.0 Code Grant Setup Guide

## Overview: Two Authentication Methods

We now support **BOTH** authentication flows so you can compare:

### 1. **SRP (Current Setup)** - AWS Cognito Specific
- ✅ Custom UI (full control)
- ✅ Direct API calls (no redirects)
- ✅ Works now with your current setup
- ❌ AWS Cognito only (vendor lock-in)
- ❌ Limited SSO support

### 2. **OAuth 2.0 Code Grant (New)** - Industry Standard
- ✅ Industry standard (RFC 6749, OIDC)
- ✅ Works with Auth0, Okta, Google, etc.
- ✅ Excellent SSO support
- ✅ Enterprise features
- ❌ Uses Cognito Hosted UI (less customization)
- ❌ Requires redirect flow

---

## Security Comparison

### **SRP Flow Security:**
```
1. Client generates ephemeral key pair
2. Server sends challenge
3. Client computes proof: HMAC(password, salt, challenge)
4. Server verifies proof
5. Tokens returned if valid

Security:
✅ Password NEVER sent over network
✅ Zero-knowledge proof
✅ Resistant to man-in-the-middle
✅ AWS proprietary but battle-tested
```

### **OAuth Code Grant with PKCE Security:**
```
1. Client generates code_verifier (random string)
2. Client computes code_challenge = SHA256(code_verifier)
3. Redirect to auth server with code_challenge
4. User authenticates on auth server (not your app!)
5. Auth server redirects with authorization_code
6. Client exchanges code + code_verifier for tokens
7. Auth server verifies code_verifier matches challenge

Security:
✅ Password handled by identity provider only
✅ PKCE prevents code interception
✅ Industry audited (RFC 7636)
✅ Works even if client secret leaked (public clients)
✅ Standard security model
```

**Both are secure!** OAuth is preferred for **portability** and **standards compliance**.

---

## Setup OAuth 2.0 Code Grant Flow

### Step 1: Configure Cognito Hosted UI Domain

1. Go to AWS Cognito Console
2. Select your User Pool (`User pool - mhmokb`)
3. Click **"App integration"** tab
4. Scroll to **"Domain"** section
5. Click **"Actions" → "Create Cognito domain"**
6. Enter a domain prefix (e.g., `nextjs-auth-yourname`)
7. Your domain will be: `nextjs-auth-yourname.auth.eu-west-2.amazoncognito.com`
8. Click **"Create"**

### Step 2: Update App Client Settings

1. In same User Pool, scroll to **"App clients and analytics"**
2. Click your app client
3. Click **"Edit"** (if needed)
4. Under **"Hosted UI settings"**:
   - **Allowed callback URLs**: 
     ```
     http://localhost:3000/auth/callback
     https://yourdomain.com/auth/callback
     ```
   - **Allowed sign-out URLs**: 
     ```
     http://localhost:3000/
     https://yourdomain.com/
     ```
   - **OAuth 2.0 grant types**:
     - ✅ Authorization code grant
     - ✅ Implicit grant (optional, for testing)
   - **OpenID Connect scopes**:
     - ✅ email
     - ✅ openid
     - ✅ profile
     - ✅ aws.cognito.signin.user.admin
5. **Save changes**

### Step 3: Update Environment Variables

Update your `.env.local`:

```bash
# Existing values
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-west-2_tLugLE3vN
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-new-public-client-id
NEXT_PUBLIC_COGNITO_REGION=eu-west-2

# Add this NEW variable for OAuth
NEXT_PUBLIC_COGNITO_DOMAIN=nextjs-auth-yourname.auth.eu-west-2.amazoncognito.com
```

**Important:** Use the domain WITHOUT `https://` prefix!

### Step 4: Restart Dev Server

```bash
# Kill server
Ctrl+C

# Restart
pnpm dev
```

### Step 5: Test OAuth Flow

Visit: **http://localhost:3000/login-oauth**

Click "Sign in with Cognito Hosted UI" and observe:

1. **Redirect to Cognito** - You'll see AWS Cognito's login page
2. **Authenticate** - Enter your credentials
3. **Redirect back** - URL will have `?code=...&state=...`
4. **Callback page** - `/auth/callback` processes the code
5. **Token exchange** - Code automatically exchanged for tokens (PKCE)
6. **Dashboard** - You're logged in!

---

## How the OAuth Flow Works (Under the Hood)

### **1. User Clicks "Login"**

```typescript
// app/login-oauth/page.tsx
await initiateOAuthLogin();

// lib/auth/cognito-oauth.ts
await signInWithRedirect(); // Amplify function
```

**What happens:**
- Amplify generates `code_verifier` (random 43-128 char string)
- Computes `code_challenge = base64url(SHA256(code_verifier))`
- Stores `code_verifier` in browser storage
- Redirects to:

```
https://your-domain.auth.eu-west-2.amazoncognito.com/oauth2/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000/auth/callback&
  state=RANDOM_STATE&
  scope=email+openid+profile&
  code_challenge=YOUR_CHALLENGE&
  code_challenge_method=S256
```

### **2. User Authenticates on Cognito**

User sees Cognito Hosted UI (not your app!):
- Enter email/password
- Cognito validates credentials
- Cognito checks MFA (if enabled)

### **3. Cognito Redirects Back**

After successful authentication:

```
http://localhost:3000/auth/callback?
  code=a1b2c3d4-authorization-code&
  state=RANDOM_STATE
```

### **4. Callback Page Processes Code**

```typescript
// app/auth/callback/page.tsx
const result = await handleOAuthCallback();

// lib/auth/cognito-oauth.ts  
const session = await fetchAuthSession();
```

**What Amplify does automatically:**
1. Extracts `code` from URL
2. Retrieves stored `code_verifier` from storage
3. Makes POST request to token endpoint:

```http
POST https://your-domain.auth.eu-west-2.amazoncognito.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=a1b2c3d4-authorization-code&
redirect_uri=http://localhost:3000/auth/callback&
client_id=YOUR_CLIENT_ID&
code_verifier=YOUR_CODE_VERIFIER
```

4. Cognito **verifies** `SHA256(code_verifier) === code_challenge`
5. If valid, returns:

```json
{
  "access_token": "eyJhbGci...",
  "id_token": "eyJhbGci...",
  "refresh_token": "eyJjdH...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

6. Amplify stores tokens in cookies/storage
7. Redirect to `/dashboard`

---

## Compare with SRP Flow

### SRP (Current):
```
User → /login → Enter credentials → 
Direct API call with SRP proof → 
Tokens returned → Dashboard
```

### OAuth Code Grant (New):
```
User → /login-oauth → Redirect to Cognito → 
Enter credentials on Cognito → 
Redirect back with code → 
Exchange code for tokens → Dashboard
```

---

## Token Storage (Same for Both!)

After authentication (SRP or OAuth), tokens stored identically:

**Cookies:**
- `CognitoIdentityServiceProvider.{clientId}.{username}.accessToken`
- `CognitoIdentityServiceProvider.{clientId}.{username}.idToken`
- `CognitoIdentityServiceProvider.{clientId}.{username}.refreshToken`

**Properties:**
- **Secure**: ✅ Yes (HTTPS only in production)
- **HttpOnly**: ❌ No (JavaScript accessible)
- **SameSite**: Lax

---

## Migration to Auth0 Later

With OAuth Code Grant setup, migrating is straightforward:

### Auth0 Configuration:
```typescript
// Only change configuration
Amplify.configure({
  Auth: {
    Cognito: {
      // Remove Cognito config
    },
    OAuth: {
      domain: 'your-tenant.auth0.com',
      clientId: 'your-auth0-client-id',
      redirectSignIn: 'http://localhost:3000/auth/callback',
      redirectSignOut: 'http://localhost:3000/',
      responseType: 'code',
      scopes: ['openid', 'profile', 'email'],
    }
  }
})
```

**Your app code remains the same!** Just config changes.

---

## Testing Both Flows

### Test SRP (Custom UI):
1. Visit: `http://localhost:3000/register`
2. Sign up with email/password
3. Enter verification code
4. Visit: `http://localhost:3000/login`
5. Sign in with custom form
6. Check cookies in DevTools

### Test OAuth (Hosted UI):
1. Visit: `http://localhost:3000/login-oauth`
2. Click "Sign in with Cognito Hosted UI"
3. You'll see Cognito's login page
4. Sign in with same credentials
5. Observe redirect flow
6. Check cookies in DevTools (same structure!)

---

## Files Created

```
lib/auth/cognito-oauth.ts           # OAuth flow functions
lib/auth/amplify-config-oauth.ts    # OAuth-enabled config
app/login-oauth/page.tsx            # OAuth login page
app/auth/callback/page.tsx          # OAuth callback handler
```

---

## Next Steps

1. **Setup Cognito domain** (Step 1 above)
2. **Update callback URLs** in app client
3. **Add COGNITO_DOMAIN** to `.env.local`
4. **Restart dev server**
5. **Test OAuth flow** at `/login-oauth`
6. **Compare** token storage (both flows use same cookies!)

---

## Comparison Summary

| Feature | SRP (Custom UI) | OAuth Code Grant (Hosted UI) |
|---------|----------------|------------------------------|
| **Login URL** | `/login` | `/login-oauth` |
| **UI** | Your custom form | Cognito hosted page |
| **Redirects** | None | Yes (to Cognito and back) |
| **Password** | Cryptographic proof | Handled by Cognito |
| **Tokens** | Same cookies | Same cookies |
| **Refresh** | Automatic | Automatic |
| **Portability** | AWS only | Any OAuth provider |
| **Migration** | Difficult | Easy (config change) |

**Recommendation:** Use **OAuth Code Grant** for production apps you might migrate later!
