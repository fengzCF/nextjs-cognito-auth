# Auth0 Setup Guide

Complete guide to setting up Auth0 OAuth 2.0 Code Grant with PKCE for this Next.js application.

---

## Table of Contents

1. [Create Auth0 Account](#create-auth0-account)
2. [Create Application](#create-application)
3. [Configure Application Settings](#configure-application-settings)
4. [Configure Environment Variables](#configure-environment-variables)
5. [Test Authentication](#test-authentication)
6. [Optional: Add Social Connections](#optional-add-social-connections)
7. [Optional: Customize Universal Login](#optional-customize-universal-login)
8. [Optional: Configure as Cognito Identity Provider](#optional-configure-as-cognito-identity-provider)

---

## Create Auth0 Account

### Step 1: Sign Up

1. Go to [auth0.com](https://auth0.com)
2. Click **Sign Up** (or **Try for Free**)
3. Choose sign-up method:
   - GitHub
   - Google
   - Email
4. Complete registration

### Step 2: Create Tenant

After signup, you'll be prompted to create a tenant:

- **Tenant Name**: `dev-yourname` (e.g., `dev-john`)
- **Region**: Choose closest to your users
  - US (us.auth0.com)
  - EU (eu.auth0.com)
  - AU (au.auth0.com)
  - JP (jp.auth0.com)
- **Environment**: Development

**Result**: Your tenant domain will be `dev-yourname.us.auth0.com`

---

## Create Application

### Step 1: Navigate to Applications

1. From Auth0 Dashboard sidebar, click **Applications**
2. Click **Applications** again (sub-menu)
3. Click **Create Application**

### Step 2: Configure Application

**Application Name**: `Next.js Cognito Auth Practice`

**Application Type**: Select **Single Page Application (SPA)**

**Why SPA?**
- Our Next.js app runs in the browser
- We use PKCE (no client secret needed)
- Tokens are managed client-side

Click **Create**

---

## Configure Application Settings

### Step 1: Basic Settings

After creation, you'll see the **Settings** tab. Configure:

#### Application URIs

**Allowed Callback URLs**:
```
http://localhost:3000/auth/auth0-callback, https://yourdomain.com/auth/auth0-callback
```

**Allowed Logout URLs**:
```
http://localhost:3000, https://yourdomain.com
```

**Allowed Web Origins**:
```
http://localhost:3000, https://yourdomain.com
```

**Allowed Origins (CORS)**:
```
http://localhost:3000, https://yourdomain.com
```

> **Note**: Separate multiple URLs with commas

#### Application Login URI (Optional)
```
http://localhost:3000/login-auth0
```

### Step 2: Advanced Settings

Scroll down to **Advanced Settings** → **Grant Types**

**Ensure these are enabled:**
- ✅ Authorization Code
- ✅ Refresh Token
- ✅ Implicit (not needed but doesn't hurt)

### Step 3: Save Changes

Scroll to bottom and click **Save Changes**

---

## Configure Environment Variables

### Step 1: Get Credentials

From the **Settings** tab, copy:

1. **Domain** (e.g., `dev-yourname.us.auth0.com`)
2. **Client ID** (long alphanumeric string)
3. **Client Secret** (if shown - we'll use it for token exchange)

### Step 2: Update `.env.local`

Open `/Users/fengzhu/Projects/practice-building/nextjs-cognito-auth/.env.local`

Update the Auth0 section:

```bash
# ==============================================================
# Auth0 Configuration - OAuth Code Grant Flow
# ==============================================================
# Auth0 tenant domain (WITHOUT https://)
# Example: dev-abc123.us.auth0.com
NEXT_PUBLIC_AUTH0_DOMAIN=dev-yourname.us.auth0.com

# Auth0 Application Client ID
NEXT_PUBLIC_AUTH0_CLIENT_ID=YOUR_CLIENT_ID_HERE

# Auth0 Client Secret (for token exchange - backend only)
# ⚠️ In production, use server-side API routes for token exchange
# This should NOT be in NEXT_PUBLIC_ but we'll use it for demo
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE

# Auth0 Audience (API identifier) - optional
# Leave empty to use default Auth0 user info
NEXT_PUBLIC_AUTH0_AUDIENCE=
```

### Step 3: Restart Dev Server

```bash
# Stop current server
pkill -f "next dev"

# Start fresh
pnpm dev
```

---

## Test Authentication

### Step 1: Start Application

```bash
pnpm dev
```

Application runs at: http://localhost:3000

### Step 2: Navigate to Login

1. Go to http://localhost:3000
2. Click the **purple card** labeled "Auth0 OAuth 2.0"
3. Click **Login with Auth0**

### Step 3: Authenticate

You'll be redirected to Auth0 Universal Login:
- If first time: **Sign Up**
  - Enter email
  - Set password
  - Verify email (check inbox)
- If returning: **Log In**
  - Enter credentials

### Step 4: Verify Callback

After authentication:
1. Auth0 redirects to: `http://localhost:3000/auth/auth0-callback?code=xxx&state=xxx`
2. App exchanges code for tokens
3. Redirects to dashboard

### Step 5: Check Token Debug Tool

1. From dashboard, click **Token Debug Tool**
2. You should see:
   - 🟣 **Auth0** badge
   - Access Token (JWT)
   - ID Token (JWT)
   - Refresh Token status

### Step 6: Test Token Refresh

Click **🧪 Test Token Refresh** button

Expected result:
```
✅ Auth0 refresh token works! New access token received.
```

---

## Optional: Add Social Connections

Enable login with Google, GitHub, etc.

### Step 1: Navigate to Authentication

Sidebar: **Authentication** → **Social**

### Step 2: Enable Provider

Click **+ Create Connection**

Choose provider:
- Google
- GitHub
- Facebook
- LinkedIn
- Apple
- etc.

### Step 3: Configure Provider

Each provider requires:
1. Create OAuth app on their platform
2. Get Client ID & Secret
3. Paste into Auth0
4. Configure callback URL (Auth0 provides this)

### Example: GitHub

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Auth0 Login
   - **Homepage URL**: `https://dev-yourname.us.auth0.com`
   - **Authorization callback URL**: `https://dev-yourname.us.auth0.com/login/callback`
4. Copy Client ID & Secret
5. Paste into Auth0 GitHub connection settings
6. Save

### Step 4: Enable for Application

1. Go to **Applications** → **Applications**
2. Select your app
3. Go to **Connections** tab
4. Toggle social providers you want to enable

### Step 5: Test

Login page will now show social login buttons:
- **Continue with Google**
- **Continue with GitHub**
- etc.

---

## Optional: Customize Universal Login

Change appearance of Auth0 login page.

### Step 1: Navigate to Branding

Sidebar: **Branding** → **Universal Login**

### Step 2: Customize Appearance

**Logo**: Upload your logo
**Primary Color**: Choose brand color
**Background Color**: Light or dark

### Step 3: Advanced Customization

Click **Advanced** tab:
- **Custom CSS**: Add custom styles
- **Custom HTML**: Completely replace login page (advanced)

### Step 4: Save

Your branded login page will appear for all users.

---

## Optional: Configure as Cognito Identity Provider

Use Auth0 as a federated identity provider for AWS Cognito.

### Step 1: Create Auth0 API

1. In Auth0 Dashboard: **Applications** → **APIs**
2. Click **Create API**
3. Configure:
   - **Name**: Cognito Federation
   - **Identifier**: `urn:amazon:cognito:sp:YOUR_USER_POOL_ID`
   - **Signing Algorithm**: RS256
4. Click **Create**

### Step 2: Get Auth0 Metadata

Your Auth0 OIDC metadata endpoint:
```
https://dev-yourname.us.auth0.com/.well-known/openid-configuration
```

### Step 3: Configure Cognito

1. Go to AWS Console → Cognito User Pool
2. **Sign-in experience** tab
3. **Federated identity provider sign-in** section
4. Click **Add identity provider**
5. Choose **OpenID Connect**

Configure:
- **Provider name**: Auth0
- **Client ID**: Your Auth0 app client ID
- **Client secret**: Your Auth0 app client secret
- **Authorized scopes**: `openid profile email`
- **Issuer URL**: `https://dev-yourname.us.auth0.com/`
- **Attributes mapping**:
  - email → email
  - sub → sub

### Step 4: Update Cognito App Client

1. Go to your Cognito OAuth app client
2. **Hosted UI** settings
3. **Identity providers**: Enable Auth0
4. Save

### Result

Users can now:
- Login directly with Cognito (SRP or OAuth)
- Login via Auth0 (federated through Cognito)

All users stored in Cognito User Pool.

---

## Troubleshooting

### Issue: "Invalid callback URL"

**Cause**: Callback URL not added to Auth0 application settings

**Fix**:
1. Go to Auth0 Dashboard → Applications → Your App → Settings
2. Add to **Allowed Callback URLs**: `http://localhost:3000/auth/auth0-callback`
3. Save

### Issue: "Invalid state parameter"

**Cause**: State mismatch or browser cleared session storage

**Fix**:
- Refresh page and try again
- Clear browser cache
- Check if sessionStorage is enabled

### Issue: "No refresh token received"

**Cause**: `offline_access` scope not requested

**Fix**:
This is already included in `lib/auth/auth0.ts`:
```typescript
scope: 'openid profile email offline_access'
```

Verify in Auth0 Dashboard:
1. Applications → Your App → Settings → Advanced Settings
2. Grant Types → Ensure "Refresh Token" is enabled

### Issue: Tokens not showing in debug tool

**Cause**: Authentication didn't complete

**Fix**:
- Check browser console for errors
- Verify callback handled successfully
- Check localStorage for tokens: DevTools → Application → Local Storage

### Issue: CORS errors

**Cause**: Origin not allowed in Auth0

**Fix**:
1. Auth0 Dashboard → Applications → Your App → Settings
2. Add to **Allowed Web Origins**: `http://localhost:3000`
3. Add to **Allowed Origins (CORS)**: `http://localhost:3000`
4. Save

---

## Security Best Practices

### ✅ DO:

1. **Use HTTPS in production**
   - Auth0 enforces HTTPS for production
   - Update callback URLs to `https://`

2. **Never commit secrets**
   ```bash
   # .gitignore should include:
   .env.local
   .env.*.local
   ```

3. **Use environment-specific tenants**
   - Development: `dev-yourname.us.auth0.com`
   - Production: `prod-yourname.us.auth0.com`

4. **Enable MFA**
   - Auth0 Dashboard → Security → Multi-factor Auth
   - Enable for users

5. **Monitor logs**
   - Auth0 Dashboard → Monitoring → Logs
   - Set up alerts for suspicious activity

### ❌ DON'T:

1. **Don't expose client secret in frontend**
   - In production, move token exchange to API routes
   - Use Next.js API route: `/app/api/auth/callback/route.ts`

2. **Don't use `NEXT_PUBLIC_` for secrets**
   - `NEXT_PUBLIC_AUTH0_CLIENT_SECRET` ❌
   - `AUTH0_CLIENT_SECRET` ✅ (server-only)

3. **Don't disable PKCE**
   - Always use PKCE for SPAs
   - Auth0 enforces this by default

---

## Production Deployment Checklist

### Auth0 Configuration

- [ ] Create production tenant
- [ ] Update allowed URLs to production domain
- [ ] Enable MFA
- [ ] Configure rate limiting
- [ ] Set up email templates
- [ ] Configure branding
- [ ] Test all flows in production

### Application Configuration

- [ ] Update `.env.production` with production Auth0 credentials
- [ ] Move token exchange to API routes (server-side)
- [ ] Enable HTTPS
- [ ] Configure Content Security Policy (CSP)
- [ ] Set up monitoring and logging
- [ ] Test token refresh in production
- [ ] Verify logout flow

---

## Additional Resources

### Auth0 Documentation
- [Auth0 SPA Quickstart](https://auth0.com/docs/quickstart/spa)
- [OAuth 2.0 Authorization Code Flow with PKCE](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)
- [Tokens](https://auth0.com/docs/secure/tokens)

### Next.js Integration
- [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0) (alternative to our custom implementation)

### Security
- [PKCE Explained](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)
- [Token Best Practices](https://auth0.com/docs/secure/tokens/token-best-practices)

---

## Comparison: Auth0 vs Cognito

| Feature | Auth0 | Cognito |
|---------|-------|---------|
| **Setup** | Very easy | Moderate |
| **Pricing** | Free tier: 7,000 MAU | Free tier: 50,000 MAU |
| **Social Login** | Native, easy | Requires federation |
| **Customization** | Excellent | Limited (Hosted UI) |
| **MFA** | Built-in, easy | Built-in |
| **Enterprise SSO** | Yes (SAML, OIDC) | Yes |
| **Passwordless** | Yes | Limited |
| **User Management UI** | Excellent | Basic |
| **Vendor Lock-in** | Less (standard OAuth) | More (AWS-specific) |
| **Monitoring** | Excellent dashboard | CloudWatch |

**When to choose Auth0:**
- Need rich social login
- Want easy customization
- Value developer experience
- Multi-cloud or vendor-agnostic

**When to choose Cognito:**
- Already using AWS heavily
- Need large free tier
- Integration with other AWS services
- Cost-sensitive (higher scale)

---

## Summary

You've successfully:
1. ✅ Created Auth0 account and tenant
2. ✅ Configured SPA application
3. ✅ Set up environment variables
4. ✅ Tested OAuth 2.0 Code Grant flow with PKCE
5. ✅ Verified token storage and refresh

**What's Next?**
- Try social login (Google, GitHub)
- Customize Universal Login branding
- Test MFA
- Explore Auth0 Rules (custom logic)
- Set up production environment

**Need Help?**
- Check [Auth0 Community](https://community.auth0.com/)
- Review Auth0 Docs
- Check application logs in Auth0 Dashboard
