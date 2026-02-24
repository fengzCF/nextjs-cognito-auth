# Refresh Token in AWS Amplify v6

## The Mystery Solved! 🎉

**You were right** - the refresh token **IS** being returned and stored in cookies, but it's not directly accessible in the code!

### What's Happening

Looking at your browser cookies, you have:
```
CognitoIdentityServiceProvider.ojkkctuvfmhpv4d16gvsjt6co.{userId}.refreshToken
```

This cookie contains your refresh token! ✅

### Why `session.tokens.refreshToken` is undefined

**In AWS Amplify v6**, the architecture changed significantly:

#### Amplify v5 (Old):
```typescript
const session = await Auth.currentSession();
const refreshToken = session.getRefreshToken().getToken();
console.log(refreshToken); // ✅ Works - returns actual token string
```

#### Amplify v6 (New):
```typescript
const session = await fetchAuthSession();
const refreshToken = session.tokens?.refreshToken;
console.log(refreshToken); // ❌ undefined - NOT exposed!
```

### Why Did Amplify Change This?

**Security Best Practice:** Refresh tokens should be:
1. ✅ Stored securely (in HttpOnly cookies in production)
2. ✅ Managed automatically by the library
3. ❌ NOT exposed to application code
4. ❌ NOT accessible via JavaScript

By hiding the refresh token from `session.tokens`, Amplify v6 follows the principle of **least privilege** - your application code doesn't need direct access to the refresh token.

---

## How Amplify v6 Handles Refresh Tokens

### Automatic Token Refresh

Amplify automatically refreshes tokens when needed:

```typescript
// When access token expires (after 60 minutes)
const session = await fetchAuthSession();

// Behind the scenes, Amplify automatically:
// 1. Detects access token is expired
// 2. Reads refresh token from cookies
// 3. Calls Cognito token endpoint with refresh token
// 4. Gets new access + ID tokens
// 5. Updates cookies with new tokens
// 6. Returns the fresh session to you

console.log(session.tokens.accessToken); // ✅ Fresh token!
```

### Force Refresh

You can force a refresh even if the token hasn't expired:

```typescript
const session = await fetchAuthSession({ forceRefresh: true });
// This will use the refresh token to get brand new tokens
```

### Check If Refresh Token Exists

You can verify the refresh token exists in cookies:

```typescript
// Browser-side only
const hasRefreshToken = document.cookie.includes('refreshToken');
console.log('Has refresh token:', hasRefreshToken);
```

---

## Practical Token Refresh Demo

Let me create a demo page that shows automatic token refresh in action!

### Demo: Watch Tokens Refresh

Create a page at `app/token-demo/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function TokenDemoPage() {
  const [tokens, setTokens] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadTokens = async (forceRefresh = false) => {
    const session = await fetchAuthSession({ forceRefresh });
    
    if (session.tokens) {
      setTokens({
        accessToken: session.tokens.accessToken?.toString().substring(0, 50) + '...',
        idToken: session.tokens.idToken?.toString().substring(0, 50) + '...',
        hasRefreshToken: document.cookie.includes('refreshToken'),
      });
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Token Refresh Demo</h1>
        
        <div className="space-y-4">
          <div>
            <strong>Access Token (first 50 chars):</strong>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-auto">
              {tokens?.accessToken || 'Loading...'}
            </pre>
          </div>

          <div>
            <strong>ID Token (first 50 chars):</strong>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-auto">
              {tokens?.idToken || 'Loading...'}
            </pre>
          </div>

          <div>
            <strong>Refresh Token in Cookies:</strong>
            <span className="ml-2">
              {tokens?.hasRefreshToken ? '✅ Yes' : '❌ No'}
            </span>
          </div>

          <div>
            <strong>Last Refreshed:</strong>
            <span className="ml-2">{lastRefresh.toLocaleTimeString()}</span>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => loadTokens(false)}>
              Get Tokens (No Refresh)
            </Button>
            <Button onClick={() => loadTokens(true)} variant="primary">
              Force Refresh (Use Refresh Token)
            </Button>
          </div>

          <div className="bg-accent/10 p-4 rounded">
            <h3 className="font-semibold mb-2">How to test:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Get Tokens (No Refresh)" - returns cached tokens</li>
              <li>Click "Force Refresh" - uses refresh token to get new ones</li>
              <li>Notice the token strings change (first 50 chars)</li>
              <li>Wait 60 minutes - access token expires automatically</li>
              <li>Click "Get Tokens" - Amplify auto-refreshes without you knowing!</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

---

## Verification: Refresh Token Works

To verify your refresh token is working:

### Method 1: Check Cookie Expiration

1. **DevTools → Application → Cookies**
2. Find the `refreshToken` cookie
3. Check **Expires/Max-Age** column
4. Should show: **5 days from now** (your configured refresh token lifetime)

### Method 2: Force Refresh Test

```typescript
// In your app
const session1 = await fetchAuthSession();
const accessToken1 = session1.tokens?.accessToken?.toString();

// Force refresh (uses refresh token behind the scenes)
const session2 = await fetchAuthSession({ forceRefresh: true });
const accessToken2 = session2.tokens?.accessToken?.toString();

// Tokens should be DIFFERENT (new tokens issued)
console.log('Tokens are different:', accessToken1 !== accessToken2); // Should be true
```

### Method 3: Wait for Expiration

1. Log in via OAuth
2. Wait 60 minutes (access token expires)
3. Make any API call that needs authentication
4. Amplify automatically uses refresh token to get new access token
5. Request succeeds without re-login! ✅

---

## Updated TOKEN_EXPLAINED.md

The key point to add to the documentation:

### Amplify v6 Behavior

**Refresh Token Access:**
- ❌ NOT accessible via `session.tokens.refreshToken` (returns undefined)
- ✅ Stored securely in browser cookies
- ✅ Managed automatically by Amplify
- ✅ Used automatically when access token expires

**Why?**
- Security: Prevents XSS attacks from stealing refresh token
- Simplicity: You don't need to manually refresh tokens
- Best Practice: Follows OAuth 2.0 security recommendations

**How to verify it exists?**
```typescript
// Method 1: Check cookies
const hasRefreshToken = document.cookie.includes('refreshToken');

// Method 2: Force refresh - if it works, refresh token exists!
try {
  await fetchAuthSession({ forceRefresh: true });
  console.log('Refresh token works! ✅');
} catch (error) {
  console.log('No refresh token ❌');
}
```

---

## Summary

### What We Learned

1. **✅ Refresh token IS being returned** by Cognito
2. **✅ Refresh token IS stored** in cookies
3. **✅ Amplify v6 hides refresh token** from direct access (intentional security feature)
4. **✅ Amplify automatically uses it** when tokens expire
5. **❌ We cannot log the actual refresh token string** (by design)

### Your Setup is CORRECT!

Everything is working as intended:
- OAuth Code Grant flow: ✅
- Refresh token issued: ✅
- Refresh token stored: ✅
- Automatic refresh: ✅

The only thing that confused us was that Amplify v6 doesn't expose `session.tokens.refreshToken` directly, but it's there in the cookies and working behind the scenes!

---

## Testing Automatic Refresh

Want to see it in action? Here's a simple test:

```typescript
// dashboard/page.tsx - add this button

'use client';

export default function DashboardPage() {
  const testAutoRefresh = async () => {
    console.log('Test 1: Get current tokens');
    const session1 = await fetchAuthSession();
    const token1 = session1.tokens?.accessToken?.toString().substring(0, 30);
    console.log('Access token (first 30 chars):', token1);

    console.log('Test 2: Force refresh using refresh token');
    const session2 = await fetchAuthSession({ forceRefresh: true });
    const token2 = session2.tokens?.accessToken?.toString().substring(0, 30);
    console.log('New access token (first 30 chars):', token2);

    console.log('Test 3: Verify tokens are different');
    console.log('Refresh worked:', token1 !== token2);
  };

  return (
    <div>
      {/* ...existing dashboard code... */}
      
      <Button onClick={testAutoRefresh}>
        Test Automatic Refresh
      </Button>
    </div>
  );
}
```

When you click "Test Automatic Refresh":
1. Gets current access token
2. Forces Amplify to use refresh token
3. Gets new access token
4. Compares them - they should be different!

This proves your refresh token is working! 🎉

---

## Key Takeaway

**Stop trying to log `session.tokens.refreshToken` - it's `undefined` by design in Amplify v6!**

Instead:
- ✅ Check cookies for `refreshToken` cookie
- ✅ Test `fetchAuthSession({ forceRefresh: true })`
- ✅ Trust that Amplify handles it automatically

Your OAuth setup is **perfect**! The refresh token is there, it's just hidden for security. 🔒
