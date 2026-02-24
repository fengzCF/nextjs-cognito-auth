# Next.js Authentication Practice: Multi-Provider

A production-ready Next.js 16 application demonstrating **3 authentication flows** side-by-side: AWS Cognito SRP, AWS Cognito OAuth, and Auth0 OAuth.

## 🎯 Features

### Authentication Flows
- ✅ **AWS Cognito SRP** - Custom UI, direct authentication (zero redirects)
- ✅ **AWS Cognito OAuth** - Cognito Hosted UI with PKCE
- ✅ **Auth0 OAuth** - Auth0 Universal Login with PKCE
- ✅ **Side-by-Side Comparison** - See all three flows in action

### Security & Tokens
- ✅ **JWT Token Handling** (Access, ID, and Refresh tokens)
- ✅ **PKCE Implementation** - Proof Key for Code Exchange (OAuth flows)
- ✅ **State Parameter** - CSRF protection (OAuth flows)
- ✅ **Automatic Token Refresh** - Seamless session extension
- ✅ **Token Debug Tool** - Inspect and test tokens from all providers
- ✅ **Secure Token Storage** - Browser cookies + localStorage

### User Experience
- ✅ **User Registration** with email verification (Cognito)
- ✅ **Login/Logout** across all providers
- ✅ **Protected Routes** - Dashboard requires authentication
- ✅ **Loading States** - User-friendly feedback
- ✅ **Error Handling** - Comprehensive error messages

### Developer Experience  
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **No External Auth SDKs** - Educational OAuth implementation
- ✅ **Comprehensive Documentation** - 15+ markdown guides
- ✅ **Testing Ready** - Vitest + Testing Library setup

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) with Turbopack
- **React**: 19
- **TypeScript**: 5.7
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **Authentication**: 
  - AWS Amplify 6 (Cognito SRP & OAuth)
  - Custom OAuth 2.0 (Auth0)
- **State Management**: 
  - TanStack Query 5 (server state)
  - Zustand 5 (client state)
- **Testing**: Vitest + Testing Library
- **Code Quality**: Oxlint + Oxfmt
- **Package Manager**: pnpm

## 📁 Project Structure

```
nextjs-cognito-auth/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home (3 provider cards)
│   │
│   ├── login/                    # 🟢 Cognito SRP login
│   ├── register/                 # Cognito registration
│   ├── confirm-signup/           # Email confirmation
│   │
│   ├── login-oauth/              # 🔵 Cognito OAuth login
│   ├── login-auth0/              # 🟣 Auth0 login
│   │
│   ├── auth/
│   │   ├── callback/             # Cognito OAuth callback
│   │   └── auth0-callback/       # Auth0 OAuth callback
│   │
│   ├── dashboard/                # Protected dashboard
│   ├── token-debug/              # Token inspector (all providers)
│   │
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # React Query provider
│   └── globals.css               # Global styles
│
├── lib/                          # Core utilities
│   ├── auth/                     # Authentication implementations
│   │   ├── cognito.ts            # 🟢 SRP functions
│   │   ├── cognito-oauth.ts      # 🔵 Cognito OAuth functions
│   │   ├── auth0.ts              # 🟣 Auth0 OAuth functions
│   │   ├── amplify-config.ts     # Amplify SRP config
│   │   └── amplify-config-oauth.ts # Amplify OAuth config
│   │
│   ├── config/
│   │   └── env.ts                # Environment variables
│   └── utils.ts                  # Utility functions
│
├── components/                   # Shared UI components
│   └── ui/                       # Shadcn UI primitives
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── ...31 more components
│
├── Documentation/                # Comprehensive guides
│   ├── AUTH0_SETUP.md            # Auth0 configuration guide
│   ├── AUTH0_INTEGRATION_SUMMARY.md
│   ├── AUTH0_QUICK_START.md
│   ├── ARCHITECTURE.md           # System architecture diagrams
│   ├── OAUTH_SETUP.md            # Cognito OAuth setup
│   ├── OAUTH_SECURITY_EXPLAINED.md # PKCE deep dive
│   ├── OAUTH_COOKIES_EXPLAINED.md
│   ├── TOKEN_EXPLAINED.md        # Token types explained
│   ├── AMPLIFY_AUTH_FUNCTIONS.md
│   └── ...7 more guides
│
├── .env.local                    # Environment variables (git-ignored)
└── package.json                  # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (v25+ recommended)
- pnpm (install with `npm install -g pnpm`)
- **Option 1**: AWS Account (free tier) for Cognito
- **Option 2**: Auth0 account (free tier)
- **Or**: Use both and compare!

### Installation

```bash
# Install dependencies
pnpm install
```

### Choose Your Authentication Provider

#### Option 1: AWS Cognito (SRP + OAuth)

1. Follow [`COGNITO_SETUP.md`](./COGNITO_SETUP.md) to create User Pool
2. Update `.env.local`:

```bash
# Cognito SRP
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-west-2_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_srp_client_id
NEXT_PUBLIC_COGNITO_REGION=eu-west-2

# Cognito OAuth
NEXT_PUBLIC_COGNITO_OAUTH_CLIENT_ID=your_oauth_client_id
NEXT_PUBLIC_COGNITO_DOMAIN=your-domain.auth.eu-west-2.amazoncognito.com
```

3. Test:
   - SRP: http://localhost:3000/login
   - OAuth: http://localhost:3000/login-oauth

#### Option 2: Auth0

1. Follow [`AUTH0_SETUP.md`](./AUTH0_SETUP.md) to create tenant and application
2. Update `.env.local`:

```bash
NEXT_PUBLIC_AUTH0_DOMAIN=dev-yourname.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_AUTH0_AUDIENCE=  # Optional
```

3. Test: http://localhost:3000/login-auth0

#### Option 3: All Three (Recommended for Learning!)

Configure both Cognito and Auth0, then compare all three flows side-by-side.

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll see all three options!

## 🎓 Learning Path

### 1. Start with Cognito SRP
- Simplest flow (no redirects)
- Custom UI control
- Register → Confirm → Login
- Good for: Understanding direct authentication

### 2. Try Cognito OAuth
- Industry-standard OAuth 2.0
- See PKCE in action
- Compare with SRP
- Good for: Learning OAuth flow

### 3. Compare with Auth0
- Different provider, same OAuth standard
- Better UI customization
- Social login support
- Good for: Understanding portability

### 4. Token Debug Tool
- Inspect all three token formats
- Test refresh functionality
- Compare implementations
- Access at: `/token-debug`

## 🔐 Authentication Flows Comparison

| Feature | Cognito SRP | Cognito OAuth | Auth0 OAuth |
|---------|-------------|---------------|-------------|
| **UI** | Custom | Hosted UI | Universal Login |
| **Redirects** | None (0) | 2 redirects | 2 redirects |
| **Setup** | Easy | Medium | Easy |
| **Security** | SRP proof | PKCE + state | PKCE + state |
| **Customization** | Full | Limited | Excellent |
| **Social Login** | Via Cognito | Via Cognito | Native |
| **Vendor Lock-in** | High (AWS) | Medium | Low |
| **Best For** | Custom UX | Standard OAuth | Rich features |

### Detailed Flow Diagrams

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for complete flow diagrams and architecture details.

## 📚 Token Management

### Three Token Types (All Providers)

1. **Access Token** (JWT)
   - Used for API authorization
   - Expires: 1 hour
   - Contains user permissions

2. **ID Token** (JWT)
   - Contains user identity info
   - Expires: 1 hour
   - Used for user profile

3. **Refresh Token**
   - Used to get new tokens
   - Expires: 30 days
   - Automatically handled by Amplify

### How Refresh Works

AWS Amplify automatically handles token refresh:
- No manual logic needed
- Transparent to your app
- Refresh tokens can be rotated
- Session stays alive for 30 days

Check `lib/auth/cognito.ts` → `getAuthTokens()` to see implementation.

## 🛡️ Security Features

### Implemented

✅ **No Client Secrets** - Public client configuration  
✅ **Secure Storage** - IndexedDB with encryption  
✅ **Automatic Refresh** - Seamless token renewal  
✅ **Email Verification** - Prevents fake accounts  
✅ **Strong Passwords** - Enforced complexity requirements  
✅ **HTTPS Only** - Production cookie configuration  
✅ **SameSite Strict** - CSRF protection

### For Production

Consider adding:
- 🔐 MFA (Multi-Factor Authentication)
- 🔐 Advanced Security Features (Cognito)
- 🔐 Rate Limiting
- 🔐 API Gateway + Lambda for server-side verification
- 🔐 HTTP-Only Cookies (pattern included in `lib/auth/tokens.ts`)

## 📝 Available Scripts

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Build for production
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run Oxlint
pnpm format                 # Format with Oxfmt
pnpm format:check           # Check formatting

# Testing
pnpm test                   # Run tests
pnpm test:watch             # Run tests in watch mode

# Storybook
pnpm storybook              # Start component library
pnpm build-storybook        # Build static Storybook
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm vitest run <file-path>
```

## 📦 Key Dependencies

- `aws-amplify` - AWS Amplify client library
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management
- `tailwindcss` - Utility-first CSS
- `@radix-ui/react-*` - Accessible UI primitives
- `lucide-react` - Icon library

## 🐛 Troubleshooting

### Common Issues

**"Missing required environment variable"**
- Check `.env.local` exists and has all variables
- Restart dev server after adding env vars

**"User pool not found"**
- Verify User Pool ID is correct
- Check region matches your Cognito setup

**"Confirmation code not received"**
- Check spam/junk folder
- Try "Resend Code" button
- Verify email in Cognito console

**"NotAuthorizedException"**
- Incorrect credentials
- Account not confirmed
- Check user status in Cognito

## 📖 Documentation

- [AWS Cognito Setup Guide](./COGNITO_SETUP.md) - Complete setup instructions
- [Development Agent Guide](./Agents.md) - Development patterns and rules
- [AWS Cognito Docs](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Auth Docs](https://docs.amplify.aws/javascript/build-a-backend/auth/)

## 💰 Cost

**This project uses AWS Free Tier and costs $0.00**

- 50,000 Monthly Active Users (FREE forever)
- Unlimited authentication operations
- Email sending via Cognito (50/day limit)

For production with higher email volume, consider AWS SES (still very cheap).

## 🤝 Contributing

This is a practice/learning project, but feel free to:
- Report issues
- Suggest improvements
- Share your implementations

## 📄 License

MIT

## 🙏 Acknowledgments

- AWS Amplify team for excellent authentication SDK
- Shadcn for beautiful UI components
- Vercel for Next.js framework

---

**Happy coding!** 🚀

If you have questions or run into issues, check:
1. `COGNITO_SETUP.md` for AWS setup
2. Code comments in `lib/auth/` for implementation details
3. AWS Cognito console for user status
