# Cognito Configuration Quick Reference

## What You NEED in `.env.local` ✅

```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop  
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

### How to Get These Values

1. **User Pool ID**
   - AWS Console → Cognito → User pools
   - Click your pool name
   - Look for "User pool ID" at the top
   - Format: `us-east-1_XXXXXXXXX`

2. **Client ID**
   - Same page → "App integration" tab
   - Scroll to "App clients and analytics"
   - Click your app client name
   - Copy "Client ID"
   - Format: `26-character alphanumeric string`

3. **Region**
   - Same as the prefix of your User Pool ID
   - Common: `us-east-1`, `us-west-2`, `eu-west-1`

---

## What You DON'T NEED ❌

### ❌ Client Secret
```bash
# DON'T ADD THIS!
# NEXT_PUBLIC_COGNITO_CLIENT_SECRET=xxx
```

**Why?** 
- We use SRP authentication (Secure Remote Password)
- Client secrets should NEVER be in browser code
- The secret exists in Cognito but we ignore it

### ❌ Cognito Domain / Hosted UI URL
```bash
# DON'T ADD THIS!
# NEXT_PUBLIC_COGNITO_DOMAIN=xxx
# NEXT_PUBLIC_HOSTED_UI_URL=xxx
```

**Why?**
- We built custom login pages
- We don't use Cognito's hosted UI
- All login happens at `localhost:3000/login`

### ❌ Callback URLs
```bash
# DON'T ADD THIS!
# NEXT_PUBLIC_REDIRECT_URL=xxx
```

**Why?**
- Only needed for OAuth/hosted UI flows
- We use direct API calls, no redirects
- Our app handles routing internally

---

## New Cognito UI Settings

### Settings That Don't Affect Us

| Setting | New Cognito UI | Impact on Our App |
|---------|----------------|-------------------|
| Cognito domain | Required to fill in | ❌ None - we don't use it |
| Callback URLs | Required to fill in | ❌ None - we don't use hosted UI |
| Client secret | Auto-generated | ❌ None - we use SRP flow |
| Hosted UI styling | Can customize | ❌ None - we built custom UI |

**Fill these in during setup, but they won't affect our app!**

### What to Enter (If Prompted)

- **Cognito domain**: Leave default or enter any name (won't be used)
- **Callback URL**: `http://localhost:3000/` (required but not used)
- **Sign-out URL**: `http://localhost:3000/` (required but not used)

---

## Authentication Flows to Enable ✅

Make sure these are checked in Cognito console:

1. ✅ **ALLOW_USER_SRP_AUTH** (Secure Remote Password)
2. ✅ **ALLOW_REFRESH_TOKEN_AUTH** (Token refresh)

These are CRITICAL for our app to work!

---

## Testing Your Configuration

1. **Fill in `.env.local`** with the 3 values above
2. **Restart dev server**: `pnpm dev`
3. **Go to**: http://localhost:3000/register
4. **If it works**: Configuration is correct! ✅
5. **If error "Missing env var"**: Check `.env.local` and restart

---

## Where Login Happens

```
Our Custom Pages (what we built):
✅ http://localhost:3000/login          → app/login/page.tsx
✅ http://localhost:3000/register       → app/register/page.tsx
✅ http://localhost:3000/confirm-signup → app/confirm-signup/page.tsx
✅ http://localhost:3000/dashboard      → app/dashboard/page.tsx

Cognito Hosted UI (NOT used):
❌ https://xxx.auth.us-east-1.amazoncognito.com/login
```

---

## Quick Checklist

Before testing:

- [ ] Created Cognito User Pool in AWS Console
- [ ] Enabled `ALLOW_USER_SRP_AUTH` flow
- [ ] Enabled `ALLOW_REFRESH_TOKEN_AUTH` flow
- [ ] Copied User Pool ID to `.env.local`
- [ ] Copied Client ID to `.env.local`
- [ ] Set Region in `.env.local`
- [ ] Did NOT add Client Secret
- [ ] Restarted dev server (`pnpm dev`)
- [ ] Can access http://localhost:3000/login

Ready to test!

---

## Common Mistakes

### ❌ Adding Client Secret
```bash
# WRONG - never add this!
NEXT_PUBLIC_COGNITO_CLIENT_SECRET=abc123...
```

Client secrets are for server-to-server auth, not browser apps.

### ❌ Wrong Environment Variable Names
```bash
# WRONG - won't work without NEXT_PUBLIC_ prefix
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...

# CORRECT - must start with NEXT_PUBLIC_
NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_COGNITO_CLIENT_ID=...
```

### ❌ Forgetting to Restart Server
After changing `.env.local`, you MUST restart:
```bash
# Stop server (Ctrl+C)
pnpm dev
```

---

## Summary

**You only need 3 things:**
1. User Pool ID
2. Client ID  
3. Region

**Everything else (client secret, hosted UI, callback URLs) can be ignored!**

We built custom login pages, so we control everything. 🚀
