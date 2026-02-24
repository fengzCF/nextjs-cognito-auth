# OAuth Security: State and PKCE Explained

## Your Questions Answered

### 1. Do we need PKCE with Next.js server?

**Short answer: YES, in our setup!**

#### When PKCE is NOT needed:
```
Traditional confidential client (server-side only):

1. User → Next.js page
2. Next.js API route → Cognito (with client_secret)
3. Cognito returns code
4. Next.js API route → Exchange code + client_secret for tokens
5. Next.js → Set HttpOnly cookie
6. Tokens NEVER in browser

Security: client_secret protects token endpoint
```

#### What we're doing (needs PKCE):
```
Public client (browser-based Amplify):

1. User → Browser loads /login-oauth
2. Browser (Amplify) → Redirect to Cognito
3. Cognito returns code to browser
4. Browser (Amplify) → Exchange code for tokens
5. Tokens stored in browser cookies

Security: NO client_secret, so PKCE required!
```

**Why we need PKCE:**
- Code exchange happens in **browser JavaScript**
- Attacker can intercept authorization code from URL
- Without PKCE: attacker can use intercepted code
- With PKCE: attacker needs `code_verifier` (stored in browser, not in URL)

---

## State Parameter - Deep Dive

### What is State?

 
```

**Protection WITH state:**
```
1. Your app generates random state: "abc123"
2. Stores it: sessionStorage.setItem('oauth_state', 'abc123')
3. Redirects to Cognito with state=abc123
4. Cognito includes state in callback:
   /callback?code=xxx&state=abc123
5. Your app checks: stored state === returned state
6. If mismatch → reject (CSRF attempt!)
```

### Who Generates State in Our Code?

**Answer: AWS Amplify library (in the browser)**

```typescript
// When you call this:
await signInWithRedirect();

// Amplify internally does:
const state = generateRandomString(); // Cryptographically secure
sessionStorage.setItem('amplify-oauth-state', state);

// Then redirects to:
https://domain.auth.region.amazoncognito.com/oauth2/authorize?
  state=GENERATED_STATE&
  code_challenge=...&
  // ... other params
```

**On callback:**
```typescript
// app/auth/callback/page.tsx calls:
await fetchAuthSession();

// Amplify internally:
1. Extracts state from URL: ?state=xxx
2. Retrieves stored state: sessionStorage.getItem('amplify-oauth-state')
3. Compares them
4. If mismatch → throws error
5. If match → proceeds with code exchange
```

**Where to find this in our code:**

```typescript
// lib/auth/cognito-oauth.ts

export async function initiateOAuthLogin() {
  await signInWithRedirect();
  // ↑ This generates and stores state internally
}

export async function handleOAuthCallback() {
  const session = await fetchAuthSession();
  // ↑ This validates state internally
}
```

**Key point:** Amplify handles state generation and validation automatically. You don't see it in our code because it's abstracted!

---

## Is State Necessary with PKCE?

**YES! They protect against DIFFERENT attacks:**

### PKCE protects against:
```
Code Interception Attack:

1. Attacker intercepts authorization code from URL
2. Attacker tries to exchange code for tokens
3. ❌ Fails: needs code_verifier (not in URL)

PKCE prevents: Code replay/theft
```

### State protects against:
```
CSRF Attack:

1. Attacker obtains valid code (for their account)
2. Tricks victim into processing attacker's code
3. ❌ Fails: state mismatch (stored ≠ returned)

State prevents: Malicious code injection
```

### Real Attack Scenarios:

**Without PKCE:**
```
# Attacker at Starbucks WiFi intercepts:
http://localhost:3000/auth/callback?code=abc123&state=xyz789

# Attacker uses code:
POST /oauth2/token
code=abc123
→ Gets tokens! ❌
```

**With PKCE:**
```
# Same interception
# Attacker tries to use code:
POST /oauth2/token
code=abc123
code_verifier=ATTACKER_GUESS
→ Rejected! code_verifier doesn't match code_challenge ✅
```

**Without State:**
```
# Attacker's malicious site:
<iframe src="http://yourapp.com/auth/callback?code=ATTACKER_CODE"></iframe>

# Your browser processes it:
→ You're logged in as attacker! ❌
```

**With State:**
```
# Same attack
# Your app checks state:
Stored: "user_generated_xyz"
Received: null (attacker didn't know it)
→ Rejected! ✅
```

---

## How Amplify Generates State Securely

Amplify uses **Web Crypto API** for random generation:

```typescript
// Conceptual (Amplify's internal implementation):

function generateState(): string {
  const array = new Uint8Array(32); // 32 bytes = 256 bits
  crypto.getRandomValues(array); // Browser's secure RNG
  return base64urlEncode(array);
}

// Result: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo"
```

**Security properties:**
- **Unpredictable**: Cryptographically secure randomness
- **Unique**: Collision probability ~0
- **Tamper-proof**: Stored locally, not sent except as verification

---

## Complete OAuth Flow with Security

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User clicks "Login"
       ↓
┌─────────────────────────────────────────────────────────┐
│ initiateOAuthLogin()                                    │
│                                                         │
│ Amplify generates:                                      │
│  - state = random(256 bits)                            │
│  - code_verifier = random(256 bits)                    │
│  - code_challenge = SHA256(code_verifier)              │
│                                                         │
│ Stores locally:                                         │
│  - sessionStorage['amplify-oauth-state'] = state       │
│  - sessionStorage['amplify-pkce-verifier'] = verifier  │
└─────────────────────────────────────────────────────────┘
       │
       │ 2. Redirect to Cognito
       ↓
https://domain.auth.region.amazoncognito.com/oauth2/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000/auth/callback&
  state=RANDOM_STATE&             ← CSRF protection
  code_challenge=SHA256_HASH&      ← PKCE
  code_challenge_method=S256&
  scope=email+openid+profile

       │
       │ 3. User authenticates
       ↓
┌─────────────┐
│   Cognito   │
└──────┬──────┘
       │
       │ 4. Validates credentials
       │ 5. Generates authorization code
       │ 6. Redirects back
       ↓
http://localhost:3000/auth/callback?
  code=AUTHORIZATION_CODE&
  state=RANDOM_STATE              ← Same state returned

       │
       │ 7. Browser loads callback page
       ↓
┌─────────────────────────────────────────────────────────┐
│ handleOAuthCallback()                                   │
│                                                         │
│ Amplify validates:                                      │
│  1. Extract state from URL                             │
│  2. Compare with stored state                          │
│     ✓ Match → Continue                                 │
│     ✗ Mismatch → Reject (CSRF!)                        │
│                                                         │
│  3. Extract code from URL                              │
│  4. Retrieve stored code_verifier                      │
│                                                         │
│  5. Exchange code for tokens:                          │
│     POST /oauth2/token                                 │
│     code=AUTHORIZATION_CODE                            │
│     code_verifier=STORED_VERIFIER                      │
│                                                         │
│ Cognito validates:                                      │
│  ✓ SHA256(code_verifier) === code_challenge            │
│  ✓ Code not expired                                    │
│  ✓ Code not already used                               │
│                                                         │
│ Returns tokens:                                         │
│  { access_token, id_token, refresh_token }            │
└─────────────────────────────────────────────────────────┘
       │
       │ 8. Store tokens in cookies
       ↓
┌─────────────────────┐
│ Authenticated User  │
└─────────────────────┘
```

---

## Code Walkthrough

### 1. Login Initiation (`/login-oauth`)

```typescript
// app/login-oauth/page.tsx

const handleOAuthLogin = async () => {
  await initiateOAuthLogin();
  // After this call, user is redirected to Cognito
};

// lib/auth/cognito-oauth.ts

export async function initiateOAuthLogin() {
  await signInWithRedirect();
  // Amplify handles:
  // - Generate state
  // - Generate code_verifier
  // - Compute code_challenge
  // - Store both locally
  // - Build authorization URL
  // - Redirect to Cognito
}
```

### 2. Callback Handling (`/auth/callback`)

```typescript
// app/auth/callback/page.tsx

useEffect(() => {
  async function processCallback() {
    const result = await handleOAuthCallback();
    if (result.success) {
      router.push('/dashboard');
    }
  }
  processCallback();
}, []);

// lib/auth/cognito-oauth.ts

export async function handleOAuthCallback() {
  try {
    const session = await fetchAuthSession();
    // Amplify handles:
    // - Extract code and state from URL
    // - Validate state matches stored value
    // - Retrieve stored code_verifier
    // - POST to /oauth2/token with code + verifier
    // - Validate token response
    // - Store tokens in cookies
    
    if (session.tokens) {
      return { success: true };
    }
  } catch (error) {
    return { success: false, error };
  }
}
```

---

## Security Best Practices

### ✅ What We Do Right:

1. **PKCE**: Prevents code interception
2. **State**: Prevents CSRF
3. **Secure random generation**: Using Web Crypto API
4. **HTTPS in production**: Protects network traffic
5. **Token refresh**: Automatic, no user interaction
6. **Short-lived tokens**: Access tokens expire in 1 hour

### ⚠️ Potential Improvements:

1. **HttpOnly cookies**: Current implementation uses JavaScript-accessible cookies
   - Vulnerable to XSS attacks
   - Improvement: Server-side session management

2. **SameSite=Strict**: Currently using Lax
   - Better CSRF protection
   - Trade-off: Breaks some legitimate cross-site flows

3. **Content Security Policy**: Add CSP headers
   - Mitigates XSS
   - Restricts inline scripts

---

## Summary

| Security Feature | Purpose | Who Generates | Where Stored | Validated By |
|------------------|---------|---------------|--------------|--------------|
| **state** | CSRF protection | Amplify (browser) | sessionStorage | Amplify on callback |
| **code_verifier** | PKCE proof | Amplify (browser) | sessionStorage | Cognito on token exchange |
| **code_challenge** | PKCE commitment | Amplify (browser) | Sent to Cognito | Cognito verifies verifier |
| **authorization_code** | Temporary credential | Cognito | URL parameter | Cognito (single-use) |

**Both state AND PKCE are necessary** - they protect against different attack vectors!
