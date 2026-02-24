# Fix: No Refresh Token in OAuth Flow

## Problem

After successful OAuth authentication, the refresh token is not being returned:
- `hasRefreshToken: false` in console logs
- Cognito only returns access token and ID token
- Session expires after 60 minutes with no way to refresh

## Root Cause

**Refresh tokens are NOT returned by default in OAuth Code Grant flow.**

To get a refresh token, you need the **`offline_access`** OAuth scope. However, this scope must be:
1. ✅ Enabled in your Cognito App Client settings (AWS Console)
2. ✅ Requested in your application code

Currently, `offline_access` is **NOT enabled** in your app client, which is why you get `invalid_scope` error.

---

## Solution: Enable Offline Access in AWS Console

### Step 1: Open AWS Cognito Console

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Select your User Pool: **eu-west-2_tLugLE3vN**
3. Go to **App clients** tab
4. Click on your OAuth app client: **nextjs-auth-oauth** (ID: `ojkkctuvfmhpv4d16gvsjt6co`)

### Step 2: Edit Hosted UI Settings

In the app client settings page:

1. Scroll down to **"Hosted UI settings"** section
2. Find **"OpenID Connect scopes"**
3. You should see checkboxes for:
   - ✅ OpenID (checked)
   - ✅ Email (checked)
   - ✅ Profile (checked)
   - ✅ aws.cognito.signin.user.admin (checked)
   - ⬜ **Phone** (unchecked)
   - ⬜ **offline_access** (unchecked) ← **CHECK THIS BOX!**

4. **Check the `offline_access` box**
5. Click **"Save changes"** at the bottom

### Step 3: Update Application Code

Once `offline_access` is enabled in AWS, update the code to request it:

**File:** `lib/auth/amplify-config-oauth.ts`

```typescript
// OAuth Configuration
loginWith: {
  oauth: {
    domain: cognitoDomain,
    scopes: [
      'openid',
      'email', 
      'profile', 
      'aws.cognito.signin.user.admin',
      'offline_access' // ← Add this line
    ],
    redirectSignIn: ['http://localhost:3000/auth/callback'],
    redirectSignOut: ['http://localhost:3000/'],
    responseType: 'code',
  },
}
```

### Step 4: Test

1. **Restart dev server** (to pick up config changes):
   ```bash
   pkill -f "next dev"
   pnpm dev
   ```

2. **Clear browser cookies** (to remove old session)
   - DevTools → Application → Cookies → localhost → Clear all

3. **Log in again via OAuth**
   - Go to http://localhost:3000/login-oauth
   - Authenticate with Cognito Hosted UI

4. **Check console logs**:
   ```
   Token details: {
     hasAccessToken: true,
     hasIdToken: true,
     hasRefreshToken: true  ← Should be true now!
   }
   ```

5. **Verify refresh token in cookies**:
   - DevTools → Application → Cookies → localhost
   - Look for: `CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{username}.refreshToken`

---

## What is `offline_access`?

**`offline_access`** is a standard OAuth 2.0 scope defined in the [OpenID Connect specification](https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess).

**Purpose:**
- Tells the authorization server to issue a **refresh token**
- Allows applications to maintain sessions even when the user is "offline" (not actively using the app)
- Standard across all OAuth providers (Google, GitHub, Auth0, Cognito, etc.)

**Without `offline_access`:**
- Only access token + ID token returned
- Session expires when access token expires (60 minutes)
- User must re-authenticate every hour

**With `offline_access`:**
- Access token + ID token + **refresh token** returned
- Session can last up to refresh token expiration (5 days in your config)
- Tokens automatically refresh in the background
- User stays logged in for 5 days without re-authenticating

---

## Why This Scope Must Be Configured in AWS

Unlike other scopes (`openid`, `email`, `profile`), Cognito treats `offline_access` as a **privileged scope** because:

1. **Security:** Refresh tokens are long-lived (days/weeks) vs access tokens (minutes/hours)
2. **Privacy:** Allows background access even when user not present
3. **Control:** Administrators need explicit control over which apps can maintain long sessions

Therefore, AWS requires you to **explicitly enable** this scope in the console for each app client.

---

## Alternative: Use SRP Flow Instead

If you don't want to use `offline_access` or can't modify AWS settings, you can use the **SRP (Secure Remote Password)** flow instead:

**SRP Flow:**
- Custom login form (no Hosted UI)
- Refresh tokens returned by default (no special scope needed)
- More control over UI/UX
- Already working in this project: http://localhost:3000/login

**OAuth Flow:**
- Cognito Hosted UI (managed by AWS)
- Requires `offline_access` scope for refresh tokens
- Better for social login (Google, Facebook, etc.)
- Less UI control

Both flows are valid - choose based on your requirements!

---

## Expected Token Lifetimes (Your Current Config)

| Token | Lifetime | Renewable? | Purpose |
|-------|----------|------------|---------|
| Access Token | 60 minutes | Yes (with refresh token) | API authorization |
| ID Token | 60 minutes | Yes (with refresh token) | User identity |
| Refresh Token | 5 days | No (single-use, but gets new one) | Token renewal |

After enabling `offline_access`, your session flow will be:

```
Day 0, 0:00  → Login via OAuth
             → Receive: Access (60m) + ID (60m) + Refresh (5d)

Day 0, 1:00  → Access token expires
             → Amplify auto-uses refresh token
             → Receive: NEW Access (60m) + ID (60m) + Refresh (5d)

Day 0, 2:00  → Auto-refresh again
Day 0, 3:00  → Auto-refresh again
...
Day 5, 0:00  → Refresh token expires
             → User must log in again
```

---

## Troubleshooting

### Error: `invalid_scope`
**Cause:** `offline_access` not enabled in AWS Console  
**Fix:** Follow Step 2 above to enable it

### Error: `No tokens received`
**Cause:** Amplify not configured before callback  
**Fix:** Ensure `configureAmplifyOAuth()` called in callback page

### Refresh token still `false`
**Cause:** Old session cached in cookies  
**Fix:** Clear all cookies and log in fresh

### Refresh token shows `undefined`
**Cause:** Refresh token is opaque (not JWT)  
**Fix:** This is normal - check `hasRefreshToken` boolean instead

---

## Summary

1. ⚠️ **Current Status:** Refresh token NOT working (missing `offline_access` scope)
2. 🔧 **Required Action:** Enable `offline_access` in AWS Console (Step 2 above)
3. 💻 **Code Change:** Add `'offline_access'` to scopes array (Step 3 above)
4. ✅ **Expected Result:** `hasRefreshToken: true` + 5-day sessions

Once you enable `offline_access` in AWS Console, the code change is just one line!
