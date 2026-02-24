# Authentication Architecture Overview

Visual representation of all three authentication flows in the application.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Next.js Application                              │
│                         (localhost:3000 / Your Domain)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
         │  🟢 Cognito SRP  │ │🔵 Cognito    │ │  🟣 Auth0 OAuth  │
         │                  │ │   OAuth      │ │                  │
         │  /login          │ │ /login-oauth │ │  /login-auth0    │
         │  Custom UI       │ │ Hosted UI    │ │  Universal Login │
         └──────────────────┘ └──────────────┘ └──────────────────┘
                    │                 │                 │
                    │                 │                 │
                    ▼                 ▼                 ▼
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
         │  AWS Cognito     │ │ AWS Cognito  │ │   Auth0 Tenant   │
         │  User Pool       │ │ User Pool    │ │                  │
         │  (SRP API)       │ │(OAuth + PKCE)│ │ (OAuth + PKCE)   │
         │                  │ │              │ │                  │
         │  Direct Auth     │ │ Redirect     │ │   Redirect       │
         └──────────────────┘ └──────────────┘ └──────────────────┘
                    │                 │                 │
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   Token Storage         │
                         │   - Browser Cookies     │
                         │   - localStorage        │
                         │   - sessionStorage      │
                         └─────────────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   /dashboard            │
                         │   /token-debug          │
                         └─────────────────────────┘
```

---

## Flow Diagrams

### 1. 🟢 Cognito SRP Flow (Zero Redirects)

```
User                    Browser                  Next.js App              AWS Cognito
 │                         │                          │                       │
 │  1. Visit /login        │                          │                       │
 ├────────────────────────>│                          │                       │
 │                         │  2. Load page            │                       │
 │                         ├─────────────────────────>│                       │
 │                         │<─────────────────────────┤                       │
 │                         │  (Custom login form)     │                       │
 │                         │                          │                       │
 │  3. Enter credentials   │                          │                       │
 ├────────────────────────>│                          │                       │
 │                         │  4. SRP auth request     │                       │
 │                         ├─────────────────────────>│  5. Initiate SRP     │
 │                         │                          ├──────────────────────>│
 │                         │                          │  6. Challenge response│
 │                         │                          │<──────────────────────┤
 │                         │                          │  7. Send proof        │
 │                         │                          ├──────────────────────>│
 │                         │                          │  8. Tokens            │
 │                         │                          │<──────────────────────┤
 │                         │  9. Store in cookies     │                       │
 │                         │<─────────────────────────┤                       │
 │                         │ 10. Redirect /dashboard  │                       │
 │                         ├─────────────────────────>│                       │
 │                         │<─────────────────────────┤                       │
 │  11. Dashboard          │                          │                       │
 │<────────────────────────┤                          │                       │
```

**Key Features:**
- ✅ No page redirects
- ✅ Full UI control
- ✅ Zero-knowledge password proof
- ❌ AWS vendor lock-in

---

### 2. 🔵 Cognito OAuth Flow (Authorization Code + PKCE)

```
User              Browser          Next.js App      Cognito Hosted UI    AWS Cognito
 │                   │                  │                   │                 │
 │ 1. Visit          │                  │                   │                 │
 │  /login-oauth     │                  │                   │                 │
 ├──────────────────>│                  │                   │                 │
 │                   │ 2. Load page     │                   │                 │
 │                   ├─────────────────>│                   │                 │
 │                   │<─────────────────┤                   │                 │
 │                   │                  │                   │                 │
 │ 3. Click login    │                  │                   │                 │
 ├──────────────────>│                  │                   │                 │
 │                   │ 4. Generate PKCE │                   │                 │
 │                   │    & state       │                   │                 │
 │                   ├─────────────────>│                   │                 │
 │                   │ 5. Redirect to Cognito               │                 │
 │                   ├─────────────────────────────────────>│                 │
 │                   │                  │ 6. Show UI        │                 │
 │                   │                  │<──────────────────┤                 │
 │                   │                  │                   │                 │
 │ 7. Enter creds    │                  │                   │                 │
 ├──────────────────────────────────────────────────────────>│                 │
 │                   │                  │                   │ 8. Authenticate │
 │                   │                  │                   ├────────────────>│
 │                   │                  │                   │ 9. Generate code│
 │                   │                  │                   │<────────────────┤
 │                   │ 10. Redirect /auth/callback?code=xxx&state=yyy         │
 │                   │<────────────────────────────────────┤                  │
 │                   │ 11. Validate state                  │                  │
 │                   ├─────────────────>│                  │                  │
 │                   │ 12. Exchange code                   │                  │
 │                   │ + code_verifier  │                  │                  │
 │                   │                  ├──────────────────────────────────────>│
 │                   │                  │ 13. Validate PKCE│                  │
 │                   │                  │ 14. Return tokens│                  │
 │                   │                  │<────────────────────────────────────┤
 │                   │ 15. Store cookies│                  │                  │
 │                   │<─────────────────┤                  │                  │
 │                   │ 16. Redirect /dashboard            │                  │
 │                   ├─────────────────>│                  │                  │
 │ 17. Dashboard     │                  │                  │                  │
 │<──────────────────┤                  │                  │                  │
```

**Key Features:**
- ✅ Industry standard OAuth 2.0
- ✅ PKCE prevents code interception
- ✅ State prevents CSRF
- ⚠️ Limited UI customization

---

### 3. 🟣 Auth0 OAuth Flow (Authorization Code + PKCE)

```
User              Browser          Next.js App      Auth0 Universal      Auth0 Tenant
 │                   │                  │               Login               │
 │                   │                  │                   │               │
 │ 1. Visit          │                  │                   │               │
 │  /login-auth0     │                  │                   │               │
 ├──────────────────>│                  │                   │               │
 │                   │ 2. Load page     │                   │               │
 │                   ├─────────────────>│                   │               │
 │                   │<─────────────────┤                   │               │
 │                   │                  │                   │               │
 │ 3. Click login    │                  │                   │               │
 ├──────────────────>│                  │                   │               │
 │                   │ 4. Generate PKCE │                   │               │
 │                   │    & state       │                   │               │
 │                   ├─────────────────>│                   │               │
 │                   │ 5. Redirect to Auth0                 │               │
 │                   ├─────────────────────────────────────>│               │
 │                   │                  │ 6. Show UI        │               │
 │                   │                  │<──────────────────┤               │
 │                   │                  │                   │               │
 │ 7. Enter creds    │                  │                   │               │
 ├──────────────────────────────────────────────────────────>│               │
 │                   │                  │                   │ 8. Authenticate│
 │                   │                  │                   ├───────────────>│
 │                   │                  │                   │ 9. Generate code
 │                   │                  │                   │<───────────────┤
 │                   │ 10. Redirect /auth/auth0-callback?code=xxx&state=yyy  │
 │                   │<────────────────────────────────────┤                 │
 │                   │ 11. Validate state                  │                 │
 │                   ├─────────────────>│                  │                 │
 │                   │ 12. Exchange code│                  │                 │
 │                   │ + code_verifier  │                  │                 │
 │                   │                  ├──────────────────────────────────────>│
 │                   │                  │ 13. Validate PKCE│                 │
 │                   │                  │ 14. Return tokens│                 │
 │                   │                  │<────────────────────────────────────┤
 │                   │ 15. Store tokens │                  │                 │
 │                   │ (localStorage +  │                  │                 │
 │                   │  cookies)        │                  │                 │
 │                   │<─────────────────┤                  │                 │
 │                   │ 16. Redirect /dashboard            │                 │
 │                   ├─────────────────>│                  │                 │
 │ 17. Dashboard     │                  │                  │                 │
 │<──────────────────┤                  │                  │                 │
```

**Key Features:**
- ✅ Industry standard OAuth 2.0
- ✅ PKCE prevents code interception
- ✅ State prevents CSRF
- ✅ Excellent UI customization
- ✅ Social login built-in

---

## Token Debug Tool Architecture

```
                         /token-debug
                              │
                              ▼
                   ┌──────────────────┐
                   │ Provider         │
                   │ Detection        │
                   └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth0?       │    │ Cognito      │    │ Cognito      │
│              │    │ OAuth?       │    │ SRP          │
│ Check        │    │              │    │ (default)    │
│ localStorage │    │ Check cookie │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Load from    │    │ fetchAuth    │    │ fetchAuth    │
│ localStorage │    │ Session()    │    │ Session()    │
│              │    │ (Amplify)    │    │ (Amplify)    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ Display Tokens   │
                   │ - Access Token   │
                   │ - ID Token       │
                   │ - Refresh Token  │
                   │ - Provider Badge │
                   └──────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ Test Refresh     │
                   │ - Compare tokens │
                   │ - Alert result   │
                   └──────────────────┘
```

---

## File Organization

```
nextjs-cognito-auth/
│
├── app/
│   ├── page.tsx                          # Home (3 cards)
│   │
│   ├── login/                            # 🟢 Cognito SRP
│   │   └── page.tsx                      # Custom login form
│   │
│   ├── login-oauth/                      # 🔵 Cognito OAuth
│   │   └── page.tsx                      # Redirect to Hosted UI
│   │
│   ├── login-auth0/                      # 🟣 Auth0
│   │   └── page.tsx                      # Redirect to Universal Login
│   │
│   ├── auth/
│   │   ├── callback/                     # 🔵 Cognito OAuth callback
│   │   │   └── page.tsx
│   │   └── auth0-callback/               # 🟣 Auth0 callback
│   │       └── page.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx                      # Post-login dashboard
│   │
│   └── token-debug/
│       └── page.tsx                      # Token inspector (all 3 providers)
│
├── lib/
│   ├── auth/
│   │   ├── cognito.ts                    # 🟢 SRP functions
│   │   ├── cognito-oauth.ts              # 🔵 OAuth functions
│   │   ├── auth0.ts                      # 🟣 Auth0 functions
│   │   ├── amplify-config.ts             # SRP Amplify config
│   │   └── amplify-config-oauth.ts       # OAuth Amplify config
│   │
│   └── config/
│       └── env.ts                        # Environment variables
│
├── components/
│   └── ui/                               # Shared UI components
│
├── .env.local                            # Environment variables
│
└── Documentation/
    ├── AUTH0_SETUP.md                    # Auth0 setup guide
    ├── AUTH0_INTEGRATION_SUMMARY.md      # Implementation details
    ├── AUTH0_QUICK_START.md              # Quick commands
    ├── OAUTH_SETUP.md                    # Cognito OAuth guide
    ├── OAUTH_SECURITY_EXPLAINED.md       # PKCE explained
    ├── OAUTH_COOKIES_EXPLAINED.md        # Cookie security
    ├── TOKEN_EXPLAINED.md                # Token types
    └── AMPLIFY_AUTH_FUNCTIONS.md         # Amplify reference
```

---

## Security Layer Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                       Browser Security                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Content Security Policy (CSP)                                 │
│  ├── script-src 'self'                                        │
│  ├── style-src 'self'                                         │
│  └── connect-src 'self' *.auth0.com *.amazoncognito.com      │
│                                                                 │
│  SameSite Cookies                                              │
│  ├── Lax (default)                                            │
│  └── Prevents most CSRF attacks                               │
│                                                                 │
│  Secure Cookies                                                │
│  └── HTTPS only in production                                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   OAuth 2.0 Security (PKCE)                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Code Verifier (random 32 bytes)                           │
│     ├── Generated: crypto.getRandomValues()                    │
│     └── Stored: sessionStorage                                 │
│                                                                 │
│  2. Code Challenge = SHA256(code_verifier)                    │
│     └── Sent to authorization server                          │
│                                                                 │
│  3. State Parameter (CSRF protection)                         │
│     ├── Random 32 bytes                                       │
│     ├── Stored: sessionStorage                                │
│     └── Validated on callback                                 │
│                                                                 │
│  4. Authorization Code (single-use)                           │
│     └── Short lifetime (~10 seconds)                          │
│                                                                 │
│  5. Token Exchange                                            │
│     ├── code + code_verifier                                  │
│     └── Server validates: SHA256(verifier) === challenge      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                        Token Security                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Access Token (JWT)                                            │
│  ├── Lifetime: 60 minutes                                     │
│  ├── Use: API authorization                                   │
│  └── Signature: RS256 (asymmetric)                            │
│                                                                 │
│  ID Token (JWT)                                                │
│  ├── Lifetime: 60 minutes                                     │
│  ├── Use: User identity                                       │
│  └── Signature: RS256                                         │
│                                                                 │
│  Refresh Token (Opaque)                                        │
│  ├── Lifetime: 30 days (Auth0) / 5 days (Cognito)            │
│  ├── Use: Get new access tokens                              │
│  └── Cannot be decoded (encrypted)                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

| Provider | User Store | Auth Server | Token Exchange | Token Storage |
|----------|-----------|-------------|----------------|---------------|
| **Cognito SRP** | Cognito User Pool | N/A (direct auth) | Amplify (SRP proof) | Amplify cookies |
| **Cognito OAuth** | Cognito User Pool | Cognito Hosted UI | Amplify (code + PKCE) | Amplify cookies |
| **Auth0** | Auth0 tenant | Auth0 Universal Login | Custom (code + PKCE) | localStorage + cookies |

---

## Next Steps

Refer to:
- `AUTH0_SETUP.md` - Complete setup walkthrough
- `AUTH0_INTEGRATION_SUMMARY.md` - Technical deep dive
- `AUTH0_QUICK_START.md` - Command reference
