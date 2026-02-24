# Quick Start Guide

Get up and running with AWS Cognito authentication in 10 minutes!

## Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check pnpm (install if needed: npm install -g pnpm)
pnpm --version

# Confirm dependencies installed
pnpm install
```

## Step 1: AWS Cognito Setup (5 minutes)

### Option A: Detailed Guide
Follow `COGNITO_SETUP.md` for complete instructions with screenshots and explanations.

### Option B: Quick Steps
1. Go to https://console.aws.amazon.com
2. Search "Cognito" → Click "Create user pool"
3. **Sign-in**: Select "Email"
4. **Security**: Use defaults (strong password, no MFA for dev)
5. **Sign-up**: Enable self-registration, email verification
6. **Message**: Use "Send email with Cognito" (FREE)
7. **App client**:
   - Type: Public client
   - Name: `nextjs-auth-client`
   - No client secret ✅
   - Enable: `ALLOW_USER_SRP_AUTH` ✅
   - Enable: `ALLOW_REFRESH_TOKEN_AUTH` ✅
8. **Create** → Copy values:
   - User Pool ID: `us-east-1_XXXXXXXXX`
   - Client ID: `1234567890abcdefghijklmnop`

**Cost**: $0.00 (Free Tier: 50,000 MAUs)

## Step 2: Configure Environment (1 minute)

Edit `.env.local`:

```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

Replace with your actual values from Step 1.

## Step 3: Start Development Server (1 minute)

```bash
pnpm dev
```

Open http://localhost:3000

## Step 4: Test Authentication (3 minutes)

### Register New User
1. Go to http://localhost:3000/register
2. Fill in:
   - Name: Your Name (optional)
   - Email: your@email.com
   - Password: Test123!@# (must meet requirements)
   - Confirm Password: Test123!@#
3. Click "Create Account"

### Confirm Email
1. Check your email (including spam/junk)
2. Copy the 6-digit code
3. Enter code on confirmation page
4. Click "Confirm Email"

### Login
1. Go to http://localhost:3000/login
2. Enter email and password
3. Click "Login"
4. You'll be redirected to dashboard!

### View Dashboard
- See your user information
- Notice you're authenticated
- Try logout button
- Try logging in again

## Step 5: Verify Token Refresh (Optional)

### Check Tokens
1. Login to dashboard
2. Open DevTools (F12)
3. Application tab → IndexedDB
4. See tokens stored by Amplify

### Test Auto-Refresh
Stay logged in for 1+ hour and tokens will auto-refresh seamlessly!

Or check the code:
- `lib/auth/cognito.ts` → `getAuthTokens()`
- AWS Amplify handles refresh automatically

## Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Lint code
pnpm format           # Format code
pnpm test             # Run tests
```

## Troubleshooting

### "Missing environment variable"
- Check `.env.local` has all three variables
- Restart dev server: `pnpm dev`

### "User pool not found"
- Verify User Pool ID in `.env.local`
- Check region matches (e.g., `us-east-1`)

### "Confirmation code not received"
- Check spam/junk folder
- Click "Resend Code" button
- Verify email in Cognito console

### "Password doesn't meet requirements"
Must have:
- 8+ characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

## What's Next?

Now that authentication works:

1. ✅ **Explore the code**:
   - `features/auth/` - Auth hooks and components
   - `lib/auth/` - Cognito integration
   - `app/` - Pages and routing

2. ✅ **Build features**:
   - Protected routes
   - User profile management
   - Role-based access
   - API integration

3. ✅ **Learn concepts**:
   - JWT token structure (use jwt.io)
   - Token refresh flow
   - Secure storage patterns

4. ✅ **Read docs**:
   - `README.md` - Full project overview
   - `COGNITO_SETUP.md` - Detailed AWS guide
   - `PROJECT_SUMMARY.md` - Implementation details

## Need Help?

- **AWS Setup**: See `COGNITO_SETUP.md`
- **Code Details**: Check inline comments
- **Troubleshooting**: See `README.md`
- **AWS Docs**: https://docs.aws.amazon.com/cognito/

---

**That's it!** You now have a working authentication system with:
- User registration & email verification ✅
- Login & logout ✅
- JWT token management ✅
- Automatic token refresh ✅
- Secure token storage ✅
- All for $0.00 with AWS Free Tier ✅

Happy coding! 🚀
