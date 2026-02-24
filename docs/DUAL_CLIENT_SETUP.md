# Dual App Client Setup Guide

## Overview

We're configuring **TWO separate App Clients** in AWS Cognito:

1. **SRP Client** - For custom UI with direct authentication
2. **OAuth Client** - For Hosted UI with OAuth Code Grant flow

This allows side-by-side comparison on the home page.

---

## Why Two Separate Clients?

**Best Practice Reasons:**

1. **Different authentication flows** - SRP vs OAuth have different requirements
2. **Security isolation** - Separate credentials for each flow
3. **Configuration independence** - Can modify one without affecting the other
4. **Production readiness** - Real apps often have multiple clients (web, mobile, etc.)
5. **Clear separation** - Easier to debug and understand

**Technical Reasons:**

- OAuth client needs **callback URLs** configured
- OAuth client needs **hosted UI domain** enabled
- SRP client only needs **ALLOW_USER_SRP_AUTH** flow
- Different scopes/permissions per client

---

## Setup Instructions

### Step 1: Verify Your SRP Client (Already Configured)

1. Go to AWS Cognito Console
2. Select your User Pool (`User pool - mhmokb`)
3. Click **"App integration"** tab
4. Scroll to **"App clients and analytics"**
5. You should see your existing client with ID: `4sgv71l3cmiadbhv07roae160q`

**Verify settings:**
- **App type**: Public client
- **Client secret**: None / Not generated
- **Authentication flows enabled**:
  - ✅ ALLOW_USER_SRP_AUTH
  - ✅ ALLOW_REFRESH_TOKEN_AUTH

### Step 2: Create OAuth App Client

1. In the same **"App clients and analytics"** section
2. Click **"Create app client"**
3. Configure as follows:

#### Basic Configuration:
- **App type**: `Public client` ⚠️ Important!
- **App client name**: `nextjs-auth-oauth`
- **Client secret**: `Don't generate a client secret`

#### Authentication Flows:
Expand **"Authentication flows"** section:
- ✅ **ALLOW_USER_SRP_AUTH** (can keep for flexibility)
- ✅ **ALLOW_REFRESH_TOKEN_AUTH** ✅ Required!
- ❌ Uncheck all others

#### Hosted UI Configuration:
Expand **"Hosted UI settings"**:

**Allowed callback URLs:**
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

**Allowed sign-out URLs:**
```
http://localhost:3000/
https://yourdomain.com/
```

**Identity providers:**
- ✅ Cognito user pool

**OAuth 2.0 grant types:**
- ✅ Authorization code grant
- ❌ Implicit grant (not needed)

**OpenID Connect scopes:**
- ✅ OpenID
- ✅ Email
- ✅ Profile
- ✅ aws.cognito.signin.user.admin

4. Click **"Create app client"**
5. **Copy the Client ID** - you'll need it for `.env.local`

### Step 3: Configure Cognito Domain (Required for OAuth)

1. Still in **"App integration"** tab
2. Scroll to **"Domain"** section
3. Click **"Actions"** → **"Create Cognito domain"**
4. Enter a domain prefix (must be globally unique):
   ```
   nextjs-auth-yourname-2026
   ```
5. Your domain will be:
   ```
   nextjs-auth-yourname-2026.auth.eu-west-2.amazoncognito.com
   ```
6. Click **"Create"**
7. **Copy the domain** (without `https://`)

### Step 4: Update Environment Variables

Update `.env.local`:

```bash
# ==============================================================
# AWS Cognito Configuration - SRP Flow
# ==============================================================
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-west-2_tLugLE3vN
NEXT_PUBLIC_COGNITO_CLIENT_ID=4sgv71l3cmiadbhv07roae160q  # Existing SRP client
NEXT_PUBLIC_COGNITO_REGION=eu-west-2

# ==============================================================
# OAuth 2.0 Configuration - Code Grant Flow
# ==============================================================
NEXT_PUBLIC_COGNITO_OAUTH_CLIENT_ID=YOUR_OAUTH_CLIENT_ID_HERE  # New OAuth client
NEXT_PUBLIC_COGNITO_DOMAIN=nextjs-auth-yourname-2026.auth.eu-west-2.amazoncognito.com
```

Replace:
- `YOUR_OAUTH_CLIENT_ID_HERE` with the OAuth client ID from Step 2
- `nextjs-auth-yourname-2026` with your actual domain prefix

### Step 5: Restart Dev Server

```bash
# Stop the current server (Ctrl+C in terminal)
# Then start again:
pnpm dev
```

---

## Testing Both Flows

### 1. Visit Home Page
```
http://localhost:3000
```

You should see side-by-side cards:
- **Left card**: AWS Cognito SRP (green indicator)
- **Right card**: OAuth 2.0 Code Grant (blue indicator)

### 2. Test SRP Flow

**Register:**
1. Click **"Register (SRP)"** button
2. Fill in email and password
3. Submit form
4. Check email for verification code
5. Enter code at `/confirm-signup`
6. Account created!

**Login:**
1. Click **"Login (SRP)"** button
2. Enter email and password
3. Direct authentication (no redirect)
4. Redirected to `/dashboard`
5. Check DevTools → Cookies to see tokens

### 3. Test OAuth Flow

**Login:**
1. Click **"Login with OAuth (Hosted UI)"** button
2. You'll be redirected to Cognito Hosted UI
3. Enter the same email/password you registered with SRP
4. Cognito validates credentials
5. Redirected back to `/auth/callback`
6. Brief "Completing sign in..." message
7. Redirected to `/dashboard`
8. Check DevTools → Cookies to see tokens (same structure as SRP!)

---

## Verification Checklist

After setup, verify:

### SRP Client:
- [ ] Client ID in `.env.local` matches AWS Console
- [ ] Public client (no secret)
- [ ] ALLOW_USER_SRP_AUTH enabled
- [ ] ALLOW_REFRESH_TOKEN_AUTH enabled
- [ ] `/register` works
- [ ] `/login` works
- [ ] Tokens appear in cookies after login

### OAuth Client:
- [ ] Different Client ID from SRP client
- [ ] Public client (no secret)
- [ ] Callback URL configured: `http://localhost:3000/auth/callback`
- [ ] Domain created and configured
- [ ] Domain in `.env.local` (without `https://`)
- [ ] `/login-oauth` redirects to Cognito Hosted UI
- [ ] After authentication, redirects back successfully
- [ ] Tokens appear in cookies after OAuth login

### Common:
- [ ] Same User Pool ID for both
- [ ] Same AWS region
- [ ] Dev server restarted after `.env.local` changes
- [ ] Home page shows both options side-by-side

---

## Troubleshooting

### OAuth Error: "invalid_request"
**Problem:** Domain not configured or callback URL mismatch

**Solution:**
1. Verify domain is created in AWS Console
2. Check callback URL exactly matches: `http://localhost:3000/auth/callback`
3. No trailing slash!
4. Restart dev server

### OAuth Error: "unauthorized_client"
**Problem:** OAuth grants not enabled

**Solution:**
1. Go to OAuth client settings
2. Ensure "Authorization code grant" is checked
3. Ensure required scopes are selected
4. Save changes

### SRP Error: "Auth UserPool not configured"
**Problem:** Environment variables not loaded

**Solution:**
1. Verify `.env.local` has correct values
2. Restart dev server (environment variables are loaded at startup)
3. Check for typos in variable names

### Neither Flow Works
**Problem:** User Pool ID or region incorrect

**Solution:**
1. Double-check User Pool ID matches AWS Console
2. Verify region matches (e.g., `eu-west-2`)
3. Ensure `.env.local` variables start with `NEXT_PUBLIC_`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     localhost:3000                      │
│                      (Home Page)                        │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
             │                       │
    ┌────────▼────────┐    ┌────────▼────────┐
    │   SRP Flow      │    │  OAuth Flow     │
    │   (Custom UI)   │    │  (Hosted UI)    │
    └────────┬────────┘    └────────┬────────┘
             │                       │
             │                       │
    ┌────────▼────────────────────┬──▼────────┐
    │   AWS Cognito User Pool     │           │
    │   eu-west-2_tLugLE3vN       │           │
    └─────────┬───────────────────┴───────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼──────┐    ┌────────▼────┐
│ SRP      │    │ OAuth       │
│ Client   │    │ Client      │
│ (4sgv7..)│    │ (new ID)    │
└──────────┘    └─────────────┘
    │                │
    │                │
   SRP          Code Grant
   Flow         + PKCE Flow
```

---

## Next Steps

1. ✅ Complete AWS setup above
2. ✅ Update `.env.local` with both client IDs
3. ✅ Restart dev server
4. ✅ Test both flows from home page
5. ✅ Compare token storage (identical structure!)
6. 📝 Read `OAUTH_SECURITY_EXPLAINED.md` for security details
7. 🔐 Plan Auth0 integration (future)

---

## Summary

**You now have:**
- ✅ Two separate app clients (SRP + OAuth)
- ✅ Side-by-side comparison on home page
- ✅ Both flows working independently
- ✅ Same token storage mechanism
- ✅ Ready for Auth0 comparison later

**Security:**
- Both use public clients (no client secret in browser)
- SRP uses zero-knowledge password proof
- OAuth uses PKCE + state validation
- Tokens stored in cookies (Lax SameSite)

**Portability:**
- SRP: AWS Cognito only
- OAuth: Works with any OAuth 2.0 provider (Auth0, Okta, Google, etc.)
