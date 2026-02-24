# Auth0 Quick Start Commands

Quick reference for testing the Auth0 integration.

---

## Prerequisites

1. ✅ Auth0 account created
2. ✅ SPA application configured
3. ✅ Callback URL added: `http://localhost:3000/auth/auth0-callback`
4. ✅ Credentials copied to `.env.local`

---

## Development Commands

### Start Development Server
```bash
pnpm dev
```

### Stop Development Server
```bash
pkill -f "next dev"
```

### Restart After Config Changes
```bash
pkill -f "next dev" && pnpm dev
```

### Run Tests
```bash
pnpm test
```

### Check Lint
```bash
pnpm lint
```

### Format Code
```bash
pnpm format
```

---

## Testing URLs

### Home Page (Choose Provider)
```
http://localhost:3000
```

### Auth0 Login Page
```
http://localhost:3000/login-auth0
```

### Dashboard (After Login)
```
http://localhost:3000/dashboard
```

### Token Debug Tool
```
http://localhost:3000/token-debug
```

### Compare Other Flows

**Cognito SRP:**
```
http://localhost:3000/login
```

**Cognito OAuth:**
```
http://localhost:3000/login-oauth
```

---

## Environment Variables

### Required for Auth0

```bash
# .env.local

NEXT_PUBLIC_AUTH0_DOMAIN=dev-yourname.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_AUTH0_AUDIENCE=  # Optional
```

### Get Values From
Auth0 Dashboard → Applications → Your App → Settings

---

## Debug Commands

### Check Token Storage (Browser Console)

```javascript
// Check localStorage
localStorage.getItem('auth0_access_token');
localStorage.getItem('auth0_id_token');
localStorage.getItem('auth0_refresh_token');

// Check cookies
document.cookie;

// Check if authenticated
localStorage.getItem('auth0_access_token') !== null;
```

### Manual Token Refresh (Browser Console)

```javascript
// Import is not available in console, but you can test via UI
// Use the "Test Token Refresh" button in Token Debug Tool
```

### Clear Auth0 Session (Browser Console)

```javascript
// Clear localStorage
['auth0_access_token', 'auth0_id_token', 'auth0_refresh_token', 'auth0_expires_at', 'auth0_user_info']
  .forEach(key => localStorage.removeItem(key));

// Clear cookies
document.cookie = 'auth0_access_token=; path=/; max-age=0';
document.cookie = 'auth0_id_token=; path=/; max-age=0';
document.cookie = 'auth0_refresh_token=; path=/; max-age=0';

// Reload page
location.reload();
```

---

## Troubleshooting

### "Invalid callback URL" Error

```bash
# Fix in Auth0 Dashboard:
# Applications → Your App → Settings
# Allowed Callback URLs: http://localhost:3000/auth/auth0-callback
```

### "Auth0 not configured" Error

```bash
# Check .env.local exists and has correct values
cat .env.local | grep AUTH0

# Restart dev server
pkill -f "next dev" && pnpm dev
```

### Tokens Not Showing in Debug Tool

```bash
# Open browser DevTools → Console
# Look for errors

# Check localStorage
# DevTools → Application → Local Storage → http://localhost:3000

# Should see:
# - auth0_access_token
# - auth0_id_token  
# - auth0_refresh_token
# - auth0_expires_at
```

### CORS Error

```bash
# Fix in Auth0 Dashboard:
# Applications → Your App → Settings
# Allowed Web Origins: http://localhost:3000
# Allowed Origins (CORS): http://localhost:3000
```

---

## File Locations

### Auth0 Implementation
```
lib/auth/auth0.ts                    # OAuth functions
lib/config/env.ts                    # Config
```

### Pages
```
app/login-auth0/page.tsx             # Login page
app/auth/auth0-callback/page.tsx     # Callback handler
app/page.tsx                          # Home (3 providers)
app/token-debug/page.tsx             # Token inspector
```

### Documentation
```
AUTH0_SETUP.md                       # Complete setup guide
AUTH0_INTEGRATION_SUMMARY.md         # Implementation summary
```

---

## Testing Checklist

### Login Flow
- [ ] Navigate to http://localhost:3000
- [ ] See purple Auth0 card
- [ ] Click "Login with Auth0"
- [ ] Redirected to Auth0 Universal Login
- [ ] Sign up or log in
- [ ] Redirected back to app
- [ ] Land on dashboard

### Token Inspection
- [ ] From dashboard, click "Token Debug Tool"
- [ ] See 🟣 Auth0 badge
- [ ] See Access Token section
- [ ] See ID Token section
- [ ] See Refresh Token status
- [ ] Click "Test Token Refresh"
- [ ] Alert shows success

### Provider Comparison
- [ ] Test Cognito SRP flow
- [ ] Test Cognito OAuth flow
- [ ] Test Auth0 flow
- [ ] Compare tokens in debug tool
- [ ] Verify each shows correct provider badge

---

## Quick Testing Script

```bash
#!/bin/bash

echo "🧪 Auth0 Integration Test"
echo "========================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    exit 1
fi

# Check Auth0 variables
if ! grep -q "NEXT_PUBLIC_AUTH0_DOMAIN" .env.local; then
    echo "❌ NEXT_PUBLIC_AUTH0_DOMAIN not set"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_AUTH0_CLIENT_ID" .env.local; then
    echo "❌ NEXT_PUBLIC_AUTH0_CLIENT_ID not set"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Start dev server
echo "🚀 Starting development server..."
pnpm dev &
DEV_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "✅ Server running at http://localhost:3000"
echo ""
echo "📋 Test URLs:"
echo "  - Home: http://localhost:3000"
echo "  - Auth0 Login: http://localhost:3000/login-auth0"
echo "  - Token Debug: http://localhost:3000/token-debug"
echo ""
echo "Press Ctrl+C to stop server"

# Wait for Ctrl+C
wait $DEV_PID
```

Save as `test-auth0.sh`, make executable:
```bash
chmod +x test-auth0.sh
./test-auth0.sh
```

---

## Next Steps

1. **Complete Setup**
   - Follow `AUTH0_SETUP.md`
   - Create Auth0 account
   - Configure application
   - Update `.env.local`

2. **Test Flow**
   - Run `pnpm dev`
   - Navigate to login page
   - Complete authentication
   - Verify tokens in debug tool

3. **Optional Enhancements**
   - Add social login (Google, GitHub)
   - Customize Universal Login branding
   - Enable MFA
   - Set up Auth0 Rules

---

## Support

### Documentation
- `AUTH0_SETUP.md` - Full setup guide
- `AUTH0_INTEGRATION_SUMMARY.md` - Technical details
- `OAUTH_SECURITY_EXPLAINED.md` - PKCE explained

### External Resources
- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Community](https://community.auth0.com/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC](https://tools.ietf.org/html/rfc7636)

---

## Summary

You now have **3 authentication flows** side by side:
- 🟢 **Cognito SRP** - Custom UI, zero redirects
- 🔵 **Cognito OAuth** - Hosted UI, PKCE
- 🟣 **Auth0** - Universal Login, PKCE

All fully functional and ready to test! 🎉
