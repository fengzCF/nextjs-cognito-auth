# Cognito Refresh Token Investigation

## Current Situation

**Problem:** OAuth Code Grant flow is not returning refresh tokens
- ✅ Access token: Working
- ✅ ID token: Working  
- ❌ Refresh token: Not returned (`hasRefreshToken: false`)

**App Client Settings:**
- ✅ ALLOW_REFRESH_TOKEN_AUTH: Enabled
- ❌ Enable refresh token rotation: Disabled
- OAuth 2.0 Grant Type: Authorization code grant
- OpenID Connect scopes: email, profile, openid, aws.cognito.signin.user.admin

## Why No Refresh Token?

### Theory 1: Missing `offline_access` Scope ❌
**Status:** Not applicable - AWS Cognito doesn't show this scope in the UI by default

AWS Cognito handles refresh tokens differently than standard OAuth providers:
- Other providers (Auth0, Google): Use `offline_access` scope
- AWS Cognito: Returns refresh tokens automatically IF configured correctly

### Theory 2: Implicit Grant Instead of Code Grant ❓
**Need to verify:** Check if the wrong grant type is selected

If "Implicit grant" is selected instead of "Authorization code grant", refresh tokens are NOT returned (by design).

**Check in AWS Console:**
1. Go to your app client settings
2. Find "OAuth 2.0 grant types" section
3. Verify **"Authorization code grant"** is checked
4. Verify **"Implicit grant"** is NOT checked

### Theory 3: Token Exchange Not Happening ❓
**Possible cause:** Amplify might be using Implicit flow instead of Code flow

Even if "Authorization code grant" is selected, if Amplify is configured incorrectly, it might use implicit flow.

**Current Amplify Config:**
```typescript
oauth: {
  domain: cognitoDomain,
  scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
  redirectSignIn: ['http://localhost:3000/auth/callback'],
  redirectSignOut: ['http://localhost:3000/'],
  responseType: 'code', // ← Should trigger Code Grant
}
```

`responseType: 'code'` should force Code Grant flow with token exchange.

### Theory 4: Refresh Token Expiration is 0 ❓
**Check in AWS Console:**
- Refresh token expiration: Currently set to **5 days** ✅

If this was 0, no refresh tokens would be issued.

## Debug Steps

### Step 1: Add Enhanced Logging

I've updated the code to log the full session structure. Now:

1. **Log out completely**
2. **Clear browser cookies** (DevTools → Application → Cookies → Clear all)
3. **Log in again via OAuth**
4. **Check console for:**
   ```
   Full session.tokens structure: { ... }
   ```

This will show us exactly what Cognito is returning.

### Step 2: Check Browser Cookies

After successful OAuth login, check cookies:

**DevTools → Application → Cookies → localhost**

Look for these cookies:
```
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.accessToken
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.idToken
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.refreshToken  ← This one
```

If `refreshToken` cookie exists but `hasRefreshToken` is false, it's an Amplify parsing issue.

If `refreshToken` cookie doesn't exist at all, Cognito isn't returning it.

### Step 3: Check Cognito App Client Configuration

In AWS Console, verify your OAuth app client has:

**Authentication flows:**
- ✅ ALLOW_REFRESH_TOKEN_AUTH (you have this ✓)
- ✅ ALLOW_USER_SRP_AUTH (optional, for SRP flow)

**OAuth 2.0 grant types:**
- ✅ Authorization code grant (CHECK THIS!)
- ❌ Implicit grant (should NOT be checked)

**Token expiration:**
- Refresh token: 5 days (you have this ✓)
- Access token: 60 minutes ✓
- ID token: 60 minutes ✓

### Step 4: Try Alternative Amplify Method

Instead of using `fetchAuthSession()`, try using the direct token getter:

```typescript
import { fetchAuthSession } from 'aws-amplify/auth';

const session = await fetchAuthSession();
const refreshToken = session.tokens?.refreshToken;

// Also try accessing via credentials
console.log('Credentials:', session.credentials);
```

## Possible Solutions

### Solution A: Use SRP Flow Instead

Your **SRP flow already works and returns refresh tokens**! This is in:
- `/login` - Custom login form
- Working perfectly with refresh tokens

If OAuth continues to have issues, you can use SRP as your primary flow.

### Solution B: Add Resource Server Custom Scope

Sometimes Cognito requires a custom scope from a Resource Server to return refresh tokens.

**To test:**
1. AWS Console → Cognito → Your User Pool
2. **App integration** tab
3. **Resource servers** section
4. Create a resource server with custom scope (e.g., `myapi/read`)
5. Add this scope to your app client
6. Request this scope in your application

### Solution C: Enable Refresh Token Rotation

This might force Cognito to start issuing refresh tokens:

**In AWS Console:**
1. App client settings
2. Find "Enable refresh token rotation"
3. **Check the box**
4. Save changes

**Note:** This requires disabling `ALLOW_REFRESH_TOKEN_AUTH`, which is contradictory. But try it.

### Solution D: Check Amplify Version

Ensure you're using the latest Amplify v6:

```bash
pnpm list aws-amplify
```

Should show: `6.16.2` or later

If older, update:
```bash
pnpm update aws-amplify
```

## Expected vs Actual Behavior

### Expected (Authorization Code Grant):
```
1. User clicks login
2. Redirect to Cognito Hosted UI
3. User authenticates
4. Cognito redirects with ?code=xxx
5. Amplify exchanges code for tokens
6. Response: { access_token, id_token, refresh_token } ← All 3!
7. Amplify stores all tokens in cookies
```

### Actual (Current):
```
1-5. Same as above ✓
6. Response: { access_token, id_token } ← Only 2!
7. No refresh token stored
```

**This suggests Cognito is NOT returning refresh token in token exchange response.**

## AWS Documentation Reference

From [Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html):

> **Authorization code grant**
> 
> The authorization code grant returns a refresh token only if:
> 1. The app client has ALLOW_REFRESH_TOKEN_AUTH enabled ✅ (you have this)
> 2. The user authenticated with a user pool user (not social IdP) ✅ (you are)
> 3. The app client uses authorization code grant ❓ (need to verify)

## Next Immediate Action

**Run this test:**

1. Clear browser completely (cookies + cache)
2. Log in via OAuth
3. Check console for the new detailed logs
4. Share the output of: `Full session.tokens structure: { ... }`
5. Check if `refreshToken` cookie exists in browser

This will tell us if:
- Cognito is returning the refresh token (but Amplify can't find it)
- Cognito is NOT returning the refresh token (AWS config issue)

---

## Comparison: OAuth vs SRP

Since your SRP flow works perfectly, here's why:

**SRP Flow** (`/login`):
- Custom login UI
- Direct Cognito API calls
- Always returns refresh tokens (when ALLOW_REFRESH_TOKEN_AUTH is enabled)
- ✅ Working in your project

**OAuth Flow** (`/login-oauth`):
- Cognito Hosted UI  
- Authorization code exchange
- Refresh tokens require specific configuration
- ❌ Not returning refresh tokens currently

**Recommendation:** Until OAuth is fixed, use SRP flow for production. OAuth is mainly useful for social providers (Google, Facebook, etc.).
