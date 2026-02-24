# Token Debug Tool - User Guide

## Access the Tool

After logging in (via either SRP or OAuth flow), navigate to:

```
http://localhost:3000/token-debug
```

Or click the **"🔍 View Token Debug Tool"** button from your dashboard.

---

## Features

### 1. Token Inspection

**View all three token types:**
- ✅ **Access Token** (JWT) - For API authorization
- ✅ **ID Token** (JWT) - For user identity
- ✅ **Refresh Token** (Opaque) - For token renewal

**What you can see:**
- Raw token strings (truncated for security)
- Decoded JWT payloads
- Token metadata (expiration, scope, claims)
- Token lifetimes and expiration times

### 2. Token Refresh Testing

**Three action buttons:**

1. **🔄 Reload Tokens (Cached)**
   - Gets current tokens from Amplify cache
   - No network request
   - Shows what's currently stored

2. **⚡ Force Refresh (Use Refresh Token)**
   - Forces Amplify to use refresh token
   - Gets brand new access + ID tokens
   - Demonstrates automatic refresh mechanism
   - Updates the display with new tokens

3. **🧪 Test Token Refresh**
   - Runs comparison test
   - Gets tokens before and after refresh
   - Verifies tokens are different (proves refresh works)
   - Shows console logs with details
   - Alert popup confirms if refresh worked

### 3. Cookie Analysis

**Browser Cookie Inspector:**
- Lists all Cognito-related cookies
- Shows cookie security flags:
  - ✅ **HttpOnly** - Prevents JavaScript access (XSS protection)
  - ✅ **Secure** - Only sent over HTTPS
  - ✅ **SameSite** - CSRF protection (Lax/Strict/None)
- Displays cookie size and expiration
- Identifies refresh token cookie specifically

**Why refresh token shows "Present" but no value:**
- Amplify v6 hides refresh token from JavaScript (security feature)
- It's stored in cookies and managed automatically
- You can see it exists, but not the actual value
- This is intentional and follows OAuth 2.0 best practices

### 4. OAuth/PKCE Flow Details

**Explains the Authorization Code Grant with PKCE:**
- Code Verifier (random string, not exposed)
- Code Challenge (SHA256 hash of verifier)
- State parameter (CSRF protection)
- Authorization code (exchanged for tokens)
- Token exchange process

**Why these aren't directly visible:**
- Amplify v6 manages PKCE internally for security
- Values are never exposed to application code
- Prevents interception and replay attacks
- You can see them in DevTools Network tab during OAuth flow

### 5. Token Lifecycle Visualization

**Three-column comparison:**
| Access Token | ID Token | Refresh Token |
|--------------|----------|---------------|
| 60 min lifetime | 60 min lifetime | 5 days lifetime |
| API authorization | User identity | Get new tokens |
| Contains: scope, client_id | Contains: email, sub, name | Encrypted data |
| Use for: Backend API calls | Use for: Profile display | Use for: Background refresh |

**Automatic Refresh Explanation:**
- After 60 minutes, access token expires
- Amplify automatically uses refresh token
- Gets new access + ID tokens
- Updates cookies transparently
- User stays logged in for 5 days!

---

## How to Use the Test Button

### Step-by-Step Testing

1. **Log in** via OAuth or SRP flow
2. **Navigate to** `/token-debug`
3. **Click** "🧪 Test Token Refresh"

**What happens:**
```
1. Fetches current access token
   → Logs first 50 characters to console
   
2. Forces refresh using refresh token
   → Amplify calls Cognito with refresh token
   → Gets brand new tokens
   → Logs new token's first 50 characters
   
3. Compares tokens
   → If different: Refresh worked! ✅
   → If same: Tokens still valid (normal)
   
4. Shows alert with result
5. Updates UI with fresh tokens
```

**Console Output Example:**
```
=== Token Refresh Test ===
Current access token (first 50 chars): eyJraWQiOiJabUZIa2R...
Forcing refresh using refresh token...
New access token (first 50 chars): eyJraWQiOiJabUZIa2R... [different!]
✅ Refresh worked: true
Tokens are different: true
```

---

## Understanding Token States

### Access Token Display

**Raw Token Section:**
- Shows first 100 characters
- Full token is much longer (~1000+ chars)
- Can copy for API testing

**Decoded Payload:**
```json
{
  "sub": "16123254-f071-7000-4e09-7dada2dbef68",
  "iss": "https://cognito-idp.eu-west-2.amazonaws.com/...",
  "token_use": "access",
  "scope": "aws.cognito.signin.user.admin openid profile email",
  "auth_time": 1770911252,
  "exp": 1770914852,
  "iat": 1770911252,
  "client_id": "ojkkctuvfmhpv4d16gvsjt6co",
  "username": "16123254-f071-7000-4e09-7dada2dbef68"
}
```

**Key Fields:**
- `token_use`: "access" (identifies token type)
- `scope`: Permissions granted
- `exp`: Expiration timestamp (Unix epoch)
- `client_id`: Your app client ID

### ID Token Display

**Decoded Payload:**
```json
{
  "sub": "16123254-f071-7000-4e09-7dada2dbef68",
  "email": "palil27152@newtrea.com",
  "email_verified": true,
  "token_use": "id",
  "auth_time": 1770911252,
  "exp": 1770914852,
  "iat": 1770911252
}
```

**Key Fields:**
- `email`: User's email address
- `email_verified`: Email verification status
- `sub`: Unique user ID (subject)
- `token_use`: "id" (identifies token type)

### Refresh Token Status

**Status Indicator:**
- ✅ **Present**: Stored in cookies, working
- ❌ **Not Found**: Missing, re-login required

**Why no value shown:**
- Not a JWT (can't be decoded)
- Encrypted opaque token
- Hidden by Amplify v6 for security
- Managed automatically in background

**Verification:**
- Check browser cookies for `refreshToken`
- Click "Test Token Refresh" - if works, it exists!
- Wait 60 min - if auto-refreshes, it's working!

---

## Cookie Security Analysis

### Example Cookie Display

```
Name: CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.16123254...accessToken
Value: eyJraWQiOiJabUZIa2R...
HttpOnly: ✗  (JavaScript accessible - Amplify design)
Secure: ✓    (HTTPS only in production)
SameSite: Lax (Prevents most CSRF attacks)
Size: 1248 bytes
```

### Security Flags Explained

**HttpOnly Flag:**
- ✗ False for Amplify tokens (intentional)
- Allows JavaScript access for token management
- Amplify needs to read/write tokens
- ⚠️ Means XSS can steal tokens - use CSP headers!

**Secure Flag:**
- ✓ True in production (HTTPS)
- ✗ False in localhost (HTTP allowed for dev)
- Prevents man-in-the-middle attacks

**SameSite Flag:**
- **Lax**: Sent with top-level navigation (default)
- **Strict**: Never sent cross-site
- **None**: Sent with all requests (requires Secure)
- Cognito uses Lax (good balance)

---

## Practical Use Cases

### 1. Verify OAuth Setup

**Goal:** Confirm OAuth flow returns all tokens

**Steps:**
1. Log in via OAuth (`/login-oauth`)
2. Navigate to `/token-debug`
3. Check all three sections show tokens
4. Verify refresh token shows "Present"

**Expected Result:**
- ✅ Access Token: Present + Decoded
- ✅ ID Token: Present + Decoded
- ✅ Refresh Token: Status = Present

### 2. Test Automatic Refresh

**Goal:** Prove refresh token works

**Steps:**
1. Navigate to `/token-debug`
2. Note current access token (first 50 chars)
3. Click "⚡ Force Refresh"
4. Compare new token (should be different)

**Expected Result:**
- Refresh Count increases
- Last Refresh time updates
- Token strings are different
- No errors in console

### 3. Debug Token Expiration

**Goal:** See token lifecycle in action

**Steps:**
1. Navigate to `/token-debug`
2. Note access token expiration time
3. Wait ~60 minutes (or adjust Cognito settings)
4. Click "🔄 Reload Tokens"
5. Amplify auto-refreshes behind the scenes

**Expected Result:**
- New tokens automatically issued
- Expiration time extended by 60 minutes
- No re-authentication required
- Seamless user experience

### 4. Compare SRP vs OAuth

**Goal:** See differences between flows

**Steps:**
1. Log in via SRP (`/login`)
2. Navigate to `/token-debug`
3. Screenshot tokens
4. Log out
5. Log in via OAuth (`/login-oauth`)
6. Navigate to `/token-debug`
7. Compare tokens

**Differences:**
- Client ID might differ (separate app clients)
- Scope might differ (OAuth has more scopes)
- Both have refresh tokens
- Token format is identical (both JWT)

---

## Troubleshooting

### "Refresh Token: Not Found"

**Causes:**
1. OAuth flow missing `offline_access` scope
2. App client doesn't have `ALLOW_REFRESH_TOKEN_AUTH`
3. Cookies cleared/expired

**Solutions:**
- Check AWS Console app client settings
- Re-login to get fresh tokens
- Check browser cookie storage

### "Test Token Refresh" Shows Same Tokens

**This is normal!**

**Reason:**
- Cognito may return cached tokens if still valid
- Refresh only issues new tokens when needed
- Try again after ~50 minutes

**Not a problem if:**
- Tokens are working
- Can make API calls
- Status shows "Present"

### Can't Decode Refresh Token

**This is intentional!**

**Reason:**
- Refresh token is NOT a JWT
- It's an opaque encrypted token
- Only Cognito can read it

**How to verify it exists:**
- Check "Status: Present" indicator
- Look for `refreshToken` in cookies list
- Test token refresh button

---

## Advanced: Network Tab Inspection

### OAuth Flow in DevTools

**Steps:**
1. Open DevTools → Network tab
2. Log in via OAuth
3. Watch for requests to:
   - `cognito-idp.eu-west-2.amazonaws.com`

**Authorization Request:**
```
GET /oauth2/authorize?
  response_type=code
  &client_id=ojkkctuvfmhpv4d16gvsjt6co
  &redirect_uri=http://localhost:3000/auth/callback
  &scope=openid+email+profile
  &state=MPuD02jCDgud9cDeKuX...
  &code_challenge=6B8fC3...
  &code_challenge_method=S256
```

**Callback with Code:**
```
http://localhost:3000/auth/callback?
  code=ae90a52f-a223-46bf-985f-a8f080dc0767
  &state=MPuD02jCDgud9cDeKuX...
```

**Token Exchange (POST):**
```
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=ae90a52f-a223-46bf-985f-a8f080dc0767
&redirect_uri=http://localhost:3000/auth/callback
&client_id=ojkkctuvfmhpv4d16gvsjt6co
&code_verifier=dGVzdGNvZGV2ZXJpZmllcg...
```

**Token Response:**
```json
{
  "access_token": "eyJraWQiOi...",
  "id_token": "eyJraWQiOi...",
  "refresh_token": "eyJjdHkiOi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Summary

The Token Debug Tool provides:

✅ **Visibility** - See all tokens and their contents
✅ **Testing** - Verify refresh token works
✅ **Learning** - Understand OAuth/PKCE flow
✅ **Debugging** - Troubleshoot auth issues
✅ **Security** - Analyze cookie protection

**Access it at:** `http://localhost:3000/token-debug`

**Available after login via:**
- SRP flow (`/login`)
- OAuth flow (`/login-oauth`)

Both flows work identically once authenticated! 🎉
