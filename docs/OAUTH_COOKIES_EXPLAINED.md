# OAuth 2.0 Cookies Explained

## Overview of Cookies in OAuth Code Grant Flow

When you authenticate via OAuth 2.0 Code Grant with Cognito, you'll see several types of cookies. Here's who sets them and who validates them.

---

## 1. `XSRF-TOKEN` Cookie

### Who Sets It?
**Cognito Hosted UI** (AWS Managed)

When you redirect to the Cognito Hosted UI:
```
https://eu-west-2tlugle3vn.auth.eu-west-2.amazoncognito.com/login?...
```

Cognito's login page sets this cookie for CSRF protection on the Hosted UI itself.

### Purpose
- **Protects the Hosted UI login form** from Cross-Site Request Forgery (CSRF) attacks
- Ensures the login form submission comes from a legitimate page load, not a malicious site
- Works in tandem with a hidden form field or header

### Who Validates It?
**Cognito Hosted UI** (when you submit the login form)

Flow:
```
1. User loads Cognito Hosted UI
   → Cognito sets XSRF-TOKEN cookie

2. Login form includes hidden field or header with same token
   <input type="hidden" name="_csrf" value="{token}" />

3. User submits login form
   → Cognito validates: cookie value === form field value

4. If mismatch → Reject (CSRF attack!)
   If match → Process login
```

### Scope
- **Domain**: `.auth.eu-west-2.amazoncognito.com`
- **Path**: `/`
- **HttpOnly**: Usually YES (depends on Cognito's implementation)
- **Secure**: YES (HTTPS only)
- **SameSite**: Lax or Strict

### Important Note
⚠️ This token is **NOT** the OAuth `state` parameter!
- `XSRF-TOKEN`: Protects Cognito's login form
- `state`: Protects your app's callback endpoint (different layers)

---

## 2. `cognito` Cookie

### Who Sets It?
**Cognito Hosted UI** (AWS Managed)

### Purpose
- **Session tracking** for the Cognito Hosted UI itself
- Maintains your authentication session with Cognito's login page
- Enables features like "Remember Me" or session continuity

### Who Validates It?
**Cognito Hosted UI**

When you return to the Hosted UI (e.g., logging in again, or navigating through MFA steps), Cognito checks this cookie to maintain session state.

### Scope
- **Domain**: `.auth.eu-west-2.amazoncognito.com`
- **Path**: `/`
- **Contents**: Likely a session identifier or encrypted session data
- **HttpOnly**: Likely YES
- **Secure**: YES
- **SameSite**: Lax

### Use Cases
1. **Multi-step flows**: MFA, password reset
2. **Remember device**: Don't prompt MFA again
3. **SSO**: Share session across multiple apps using same User Pool

---

## 3. `lang` Cookie

### Who Sets It?
**Cognito Hosted UI** (AWS Managed)

### Purpose
- Stores the user's **language preference** for the Hosted UI
- When you access Cognito's login page, it can display in different languages:
  - English (default)
  - Spanish
  - French
  - German
  - Japanese
  - etc.

### Who Validates It?
**Cognito Hosted UI**

Cognito reads this cookie to determine which language to display.

### Scope
- **Domain**: `.auth.eu-west-2.amazoncognito.com`
- **Path**: `/`
- **Contents**: Language code (e.g., `en`, `es`, `fr`, `de`, `ja`)
- **HttpOnly**: NO (JavaScript can modify it)
- **Secure**: YES
- **SameSite**: Lax

### Example
```
Cookie: lang=en

# Cognito Hosted UI displays:
"Sign in to your account"
"Email"
"Password"

# If changed to:
Cookie: lang=es

# Cognito Hosted UI displays:
"Iniciar sesión en tu cuenta"
"Correo electrónico"
"Contraseña"
```

---

## 4. `CognitoIdentityServiceProvider.*` Cookies (Your App)

These are the **actual authentication tokens** set by **AWS Amplify** in your browser after successful OAuth exchange.

### Who Sets Them?
**AWS Amplify Library** (in your Next.js app)

After the OAuth callback, when Amplify exchanges the authorization code for tokens:
```typescript
// lib/auth/cognito-oauth.ts
export async function handleOAuthCallback() {
  const session = await fetchAuthSession({ forceRefresh: true });
  // ↑ Amplify sets cookies here
}
```

### Cookie Names
```
CognitoIdentityServiceProvider.{clientId}.{userId}.accessToken
CognitoIdentityServiceProvider.{clientId}.{userId}.idToken
CognitoIdentityServiceProvider.{clientId}.{userId}.refreshToken
CognitoIdentityServiceProvider.{clientId}.{userId}.clockDrift
CognitoIdentityServiceProvider.{clientId}.LastAuthUser
```

### Who Validates Them?
**Your Next.js Application** (via AWS Amplify)

Every time you call:
```typescript
await fetchAuthSession();
await getCurrentUser();
```

Amplify reads these cookies, validates JWTs, checks expiration, and auto-refreshes if needed.

### Scope
- **Domain**: `localhost` (or your production domain)
- **Path**: `/`
- **HttpOnly**: ❌ NO (Amplify needs JavaScript access)
- **Secure**: ✅ YES (HTTPS in production)
- **SameSite**: Lax

---

## Cookie Lifecycle in OAuth Flow

### Step-by-Step with Cookie Creation

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Login with OAuth"                               │
│    Your app: /login-oauth                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Amplify redirects to Cognito Hosted UI                       │
│    https://domain.auth.region.amazoncognito.com/login?...       │
│                                                                  │
│    Cognito SETS these cookies:                                  │
│    ✅ XSRF-TOKEN (CSRF protection)                              │
│    ✅ cognito (session tracking)                                │
│    ✅ lang (language preference)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User enters credentials and submits form                     │
│                                                                  │
│    Cognito VALIDATES:                                           │
│    ✓ XSRF-TOKEN cookie matches form field                       │
│    ✓ Username/password correct                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Cognito redirects back to your app                           │
│    http://localhost:3000/auth/callback?code=xxx&state=yyy       │
│                                                                  │
│    Note: Cognito cookies (XSRF-TOKEN, cognito, lang)            │
│    stay on Cognito's domain - NOT sent to your app!             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Your app exchanges code for tokens                           │
│                                                                  │
│    Amplify SETS these cookies:                                  │
│    ✅ accessToken                                               │
│    ✅ idToken                                                   │
│    ✅ refreshToken                                              │
│    ✅ clockDrift                                                │
│    ✅ LastAuthUser                                              │
│                                                                  │
│    These cookies are on YOUR domain (localhost)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Comparison

| Cookie | Domain | HttpOnly | Secure | SameSite | Purpose | Set By | Validated By |
|--------|--------|----------|--------|----------|---------|--------|--------------|
| **XSRF-TOKEN** | Cognito | ✅ Yes | ✅ Yes | Strict/Lax | CSRF protection for Hosted UI | Cognito | Cognito |
| **cognito** | Cognito | ✅ Yes | ✅ Yes | Lax | Session tracking on Hosted UI | Cognito | Cognito |
| **lang** | Cognito | ❌ No | ✅ Yes | Lax | Language preference | Cognito | Cognito |
| **accessToken** | Your app | ❌ No | ✅ Yes | Lax | API authorization | Amplify | Amplify + Backend |
| **idToken** | Your app | ❌ No | ✅ Yes | Lax | User identity | Amplify | Amplify + Your app |
| **refreshToken** | Your app | ❌ No | ✅ Yes | Lax | Token renewal | Amplify | Amplify |

---

## Why Are Cognito's Cookies Separate?

### Domain Isolation
Cognito's cookies (`XSRF-TOKEN`, `cognito`, `lang`) are set on:
```
.auth.eu-west-2.amazoncognito.com
```

Your app's cookies (tokens) are set on:
```
localhost (or yourdomain.com in production)
```

**Benefit**: Complete isolation. Your app never sees Cognito's internal cookies, and vice versa.

### Security Benefits

1. **Reduced Attack Surface**
   - If your app is compromised (XSS), attacker can't steal XSRF-TOKEN
   - Cognito's session management remains secure

2. **Single Sign-On (SSO)**
   - `cognito` cookie can be shared across multiple apps
   - User logs in once, authenticated everywhere

3. **Separation of Concerns**
   - Cognito manages login flow security
   - Your app only handles tokens

---

## Common Questions

### Q: Why do I see XSRF-TOKEN in my browser?

**A:** You're seeing cookies from **both domains**:
- Cognito domain cookies (XSRF-TOKEN, cognito, lang)
- Your app domain cookies (accessToken, idToken, refreshToken)

DevTools shows all cookies for all visited domains. Filter by domain to see which belong where.

---

### Q: Should my app validate XSRF-TOKEN?

**A:** No! That's Cognito's job.

Your app should focus on:
1. Validating the OAuth `state` parameter (Amplify does this automatically)
2. Validating JWT tokens (signature, expiration)
3. Implementing proper CSRF protection for your own forms (different from XSRF-TOKEN)

---

### Q: Can I customize the Hosted UI language?

**A:** Yes! Two ways:

1. **Query parameter**:
   ```typescript
   await signInWithRedirect({
     // Cognito will redirect with ?locale=es
   });
   ```

2. **User changes it**: Hosted UI has a language selector dropdown

The `lang` cookie persists their choice.

---

### Q: Are Cognito cookies HttpOnly?

**A:** Yes, `XSRF-TOKEN` and `cognito` are typically HttpOnly (Cognito's implementation).

Your app's tokens (set by Amplify) are **NOT HttpOnly** because Amplify needs JavaScript access.

---

### Q: What if I want HttpOnly tokens?

**A:** You'd need to implement server-side session management:

```typescript
// app/api/auth/callback/route.ts (API Route)

export async function GET(request: Request) {
  // 1. Extract code from URL
  const code = new URL(request.url).searchParams.get('code');
  
  // 2. Exchange code for tokens (server-side)
  const tokens = await exchangeCodeForTokens(code);
  
  // 3. Set HttpOnly cookies
  cookies().set('access_token', tokens.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
  
  // 4. Redirect to dashboard
  return redirect('/dashboard');
}
```

Trade-off: More complex, but better XSS protection.

---

## Summary

| Cookie Name | Set By | Validated By | Purpose | Your App Sees It? |
|-------------|--------|--------------|---------|-------------------|
| **XSRF-TOKEN** | Cognito Hosted UI | Cognito Hosted UI | CSRF protection for login form | ❌ No (different domain) |
| **cognito** | Cognito Hosted UI | Cognito Hosted UI | Session tracking | ❌ No (different domain) |
| **lang** | Cognito Hosted UI | Cognito Hosted UI | Language preference | ❌ No (different domain) |
| **accessToken** | AWS Amplify | Amplify + Backend APIs | Authorization | ✅ Yes (your domain) |
| **idToken** | AWS Amplify | Your app code | User identity | ✅ Yes (your domain) |
| **refreshToken** | AWS Amplify | AWS Amplify | Token renewal | ✅ Yes (your domain) |

**Key Insight**: Cognito's internal cookies handle **login flow security**, while your app's cookies handle **authenticated session management**. They operate on different domains and never interact directly.
