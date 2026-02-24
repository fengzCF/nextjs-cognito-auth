# AWS Cognito Setup Guide

This guide will walk you through setting up AWS Cognito User Pool for authentication. **All steps use AWS Free Tier and incur no costs.**

## Prerequisites

- AWS Account (create one at https://aws.amazon.com if you don't have one)
- AWS Console access

## AWS Free Tier for Cognito

AWS Cognito Free Tier includes:
- **50,000 Monthly Active Users (MAUs)** for User Pools
- Unlimited authentication operations
- **FREE forever** (not just 12 months)

This is more than enough for development and small production apps!

---

## ⚠️ New Cognito UI Changes (2024+)

AWS has updated the Cognito console UI. Key differences from older guides:

1. **No more wizard-style setup** - Now uses a streamlined form
2. **Client secrets auto-generated** - We don't use them (SRP flow)
3. **Hosted UI called "Cognito domain"** - We're NOT using it (we built our own)
4. **Callback URLs required** - Enter `http://localhost:3000/` (won't affect our app)

**We're using direct API calls, not the hosted UI!** Our login pages are in:
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/confirm-signup/page.tsx`

---

## Step 1: Create a User Pool

1. **Sign in to AWS Console**
   - Go to https://console.aws.amazon.com
   - Search for "Cognito" in the search bar
   - Click on "Amazon Cognito"

2. **Create User Pool**
   - Click "Create user pool" button
   - You'll be guided through a multi-step process

---

## Step 2: Configure Sign-in Experience

### Sign-in Options
- **Provider types**: Select "Cognito user pool"
- **Cognito user pool sign-in options**: Check **Email**
  - This allows users to sign in with their email address
  - Uncheck "Username" unless you want username-based login

Click "Next"

---

## Step 3: Configure Security Requirements

### Password Policy
Choose one of the following:

**Option A: Cognito defaults (Recommended for development)**
- Minimum length: 8 characters
- Contains lowercase letters
- Contains uppercase letters  
- Contains numbers
- Contains special characters

**Option B: Custom (if you want less strict for testing)**
- You can customize, but for production, keep it strong!

### Multi-factor Authentication (MFA)
- Select **"No MFA"** for development
- For production, consider "Optional MFA" or "Require MFA"

### User Account Recovery
- **Enable self-service account recovery**: Check this
- **Delivery method for user account recovery**: Select "Email only"
  - This is FREE (SMS costs money)

Click "Next"

---

## Step 4: Configure Sign-up Experience

### Self-service sign-up
- **Enable self-registration**: Check this
  - Allows users to create accounts themselves

### Attribute Verification and User Account Confirmation
- **Cognito-assisted verification and confirmation**: Check this
- **Attributes to verify**: Select **Email**
- **Active attribute values when an update is pending**: Select "Keep original attribute value active"
- **Allow Cognito to automatically send messages**: Check this

### Required Attributes
- Add **email** (should be checked by default)
- Optionally add **name** if you want to collect user names

### Custom Attributes (Optional)
- Skip for now unless you need custom user data

Click "Next"

---

## Step 5: Configure Message Delivery

### Email
- **Email provider**: Select **"Send email with Cognito"**
  - This is **FREE** and works out of the box
  - No SES configuration needed for development
  - Limited to 50 emails/day (enough for testing)

**For production**: Consider using SES (Simple Email Service) for higher limits

### SMS (Optional - COSTS MONEY)
- Skip SMS configuration unless you need phone verification
- SMS messages cost money (~$0.00581 per message in US)

Click "Next"

---

## Step 6: Integrate Your App

### User Pool Name
- **User pool name**: Enter a name like `nextjs-auth-pool`

### Hosted Authentication Pages (Cognito Domain)
- ⚠️ **NEW UI**: You'll see "Cognito domain" or "Managed login pages"
- **We're NOT using these** - we built our own login pages!
- You can:
  - Skip/leave the domain settings as-is (no impact on our app)
  - Or configure a domain name if you want (optional)
- **Callback URL** (if prompted): Enter `http://localhost:3000/` (won't be used by our app)

### Initial App Client
- **App type**: Select **"Public client"**
- **App client name**: Enter `nextjs-auth-client`

### Client Secret
- ⚠️ **NEW UI**: Client secret is auto-generated (you'll see it listed)
- **IMPORTANT**: We're NOT using the client secret!
  - Our app uses Secure Remote Password (SRP) flow
  - Client secret is never sent to browser
  - **Do NOT add it to `.env.local`** ✅
  - It's there but we ignore it

### Advanced App Client Settings

#### Authentication Flows
- **ALLOW_USER_SRP_AUTH**: Check this ✅
  - Secure Remote Password protocol (recommended)
- **ALLOW_REFRESH_TOKEN_AUTH**: Check this ✅
  - Enables token refresh (crucial for your requirement!)
- Uncheck all others

#### Refresh Token Expiration
- **Refresh token expiration**: 30 days (default is fine)
- This determines how long refresh tokens are valid

#### Access Token Expiration  
- **Access token expiration**: 60 minutes (1 hour)
- This determines how often tokens need to be refreshed

#### ID Token Expiration
- **ID token expiration**: 60 minutes (1 hour)

Click "Next"

---

## Step 7: Review and Create

1. Review all your settings
2. Click **"Create user pool"**
3. Wait for creation (takes ~30 seconds)

---

## Step 8: Get Your Configuration Values

After creation, you'll see your User Pool details:

### 1. Get User Pool ID
- On the User Pool overview page
- Look for **"User pool ID"** 
- Format: `us-east-1_XXXXXXXXX`
- Copy this value

### 2. Get App Client ID
- Click on the **"App integration"** tab
- Scroll down to **"App clients and analytics"**
- Click on your app client name (e.g., `nextjs-auth-client`)
- Copy the **"Client ID"**
- Format: `1234567890abcdefghijklmnop`

### 3. Get Region
- Look at your User Pool ID
- The region is the first part (e.g., `us-east-1`)
- Common regions:
  - `us-east-1` - US East (N. Virginia)
  - `us-west-2` - US West (Oregon)
  - `eu-west-1` - EU (Ireland)
  - `ap-southeast-1` - Asia Pacific (Singapore)

---

## Step 9: Configure Your Application

1. Open your `.env.local` file in the project root

2. Add your values:
```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

3. **IMPORTANT**: Never commit `.env.local` to git!
   - It's already in `.gitignore`
   - Share values securely with your team

---

## Step 10: Test Your Setup

1. **Start the development server**:
```bash
pnpm dev
```

2. **Open your browser**:
   - Navigate to http://localhost:3000

3. **Register a new user**:
   - Click "Register"
   - Fill in the form
   - You'll receive a confirmation code via email
   - Check your email (including spam folder)

4. **Confirm your account**:
   - Enter the 6-digit code from the email
   - Click "Confirm Email"

5. **Login**:
   - Use your email and password
   - You should be redirected to the dashboard

6. **Check the dashboard**:
   - You should see your user information
   - Try the logout button

---

## Understanding JWT Tokens

When you successfully log in, Cognito returns three tokens:

### 1. **ID Token** (JWT)
- Contains user identity information (email, name, etc.)
- Used to get user profile data
- Expires after 1 hour (by default)

### 2. **Access Token** (JWT)
- Used to authorize API calls
- Grants access to protected resources
- Expires after 1 hour (by default)

### 3. **Refresh Token**
- Used to get new ID and Access tokens
- Lasts 30 days (by default)
- Automatically used by AWS Amplify

### How Token Refresh Works

The aws-amplify library **automatically handles token refresh**:

1. When Access/ID tokens expire, Amplify detects this
2. It uses the Refresh token to request new tokens
3. New tokens are issued without user intervention
4. Process is transparent to your application
5. Refresh tokens can be rotated for security

You can verify this in the code:
- `lib/auth/cognito.ts` - `getAuthTokens()` function
- AWS Amplify's `fetchAuthSession()` automatically refreshes if needed

---

## Security Best Practices

### ✅ What This Setup Does Right

1. **No Client Secrets in Browser**
   - Public clients don't use secrets
   - Secrets in browser = security risk

2. **Secure Token Storage**
   - AWS Amplify uses IndexedDB with encryption
   - Better than localStorage

3. **Automatic Token Refresh**
   - No manual refresh logic needed
   - Seamless user experience

4. **Email Verification**
   - Prevents fake accounts
   - Validates user email addresses

5. **Strong Password Policy**
   - Prevents weak passwords
   - Follows security standards

### 🔐 Additional Security for Production

1. **Enable MFA** (Multi-Factor Authentication)
   - Adds an extra layer of security
   - Can use TOTP (Google Authenticator) or SMS

2. **Use SES for Emails**
   - Higher sending limits
   - Better deliverability
   - Still very cheap

3. **Enable Advanced Security**
   - Cognito Advanced Security (costs extra)
   - Risk-based authentication
   - Compromised credentials detection

4. **Add API Gateway + Lambda**
   - Verify JWT tokens server-side
   - Add custom authorization logic

5. **Use HTTP-Only Cookies**
   - For production, consider moving tokens to HTTP-only cookies
   - Prevents XSS attacks
   - Requires API route handlers (see `lib/auth/tokens.ts`)

---

## Troubleshooting

### Error: "Missing required environment variable"
- Check `.env.local` has all three variables
- Restart Next.js dev server after adding env vars
- Variables must start with `NEXT_PUBLIC_`

### Error: "User pool not found"
- Verify your User Pool ID is correct
- Check the region matches your User Pool
- Ensure User Pool wasn't deleted

### Confirmation code not received
- Check spam/junk folder
- Verify email in User Pool settings
- Try "Resend Code" button
- For development, check CloudWatch logs in AWS

### Password doesn't meet requirements
- Must be at least 8 characters
- Must have uppercase letter
- Must have lowercase letter
- Must have number
- Must have special character (!@#$%^&*)

### "NotAuthorizedException" error
- Incorrect email/password
- Account not confirmed yet
- User might be disabled in Cognito

---

## Cost Monitoring

To ensure you stay within Free Tier:

1. Go to AWS Console → Cognito → Your User Pool
2. Click on "Monitoring" tab
3. Check "Monthly Active Users" metric
4. Should stay under 50,000 MAUs

**Note**: MAU = unique user who authenticates at least once in a calendar month

---

## Next Steps

Now that Cognito is configured:

1. ✅ Try registering multiple users
2. ✅ Test the login flow
3. ✅ Verify token refresh (stay logged in > 1 hour)
4. ✅ Check user management in Cognito Console
5. 🚀 Build your app features!

---

## Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Auth Documentation](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [JWT.io - Decode Tokens](https://jwt.io/)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

## Questions?

Common scenarios covered in code:

- **Register**: `features/auth/hooks/useRegister.ts`
- **Login**: `features/auth/hooks/useLogin.ts`  
- **Logout**: `features/auth/hooks/useLogout.ts`
- **Check Auth**: `features/auth/hooks/useAuth.ts`
- **Token Management**: `lib/auth/cognito.ts`
- **Secure Cookies**: `lib/auth/tokens.ts` (server-side pattern)

Happy coding! 🎉
