import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Authentication Flows Comparison
          </h1>
          <p className="text-lg text-muted-foreground">
            Compare: Cognito SRP vs Cognito OAuth vs Auth0 OAuth
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* SRP Flow Card */}
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                  Active - Custom UI
                </span>
              </div>
              <CardTitle className="text-2xl">AWS Cognito SRP</CardTitle>
              <CardDescription className="text-base">
                Secure Remote Password - AWS proprietary authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Custom UI (full control)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Direct API calls (no redirects)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Zero-knowledge password proof</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">⚠</span>
                  <span>AWS Cognito only (vendor lock-in)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full bg-blue-500 hover:bg-blue-700 text-white" size="lg" variant="outline">
                  <Link href="/register">
                    Register (SRP)
                  </Link>
                </Button>
                <Button asChild className="w-full bg-blue-500 hover:bg-blue-700 text-white" size="lg" variant="outline">
                  <Link href="/login">
                    Login (SRP)
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <strong>App Client:</strong> Public client (no secret)
                <br />
                <strong>Flow:</strong> Direct authentication with cryptographic proof
              </div>
            </CardContent>
          </Card>

          {/* OAuth Code Grant Card */}
          <Card className="border-2 border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Standard - Hosted UI
                </span>
              </div>
              <CardTitle className="text-2xl">OAuth 2.0 Code Grant</CardTitle>
              <CardDescription className="text-base">
                Industry standard with PKCE - Works with any provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Industry standard (RFC 6749, OIDC)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Works with Auth0, Okta, Google, etc.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>PKCE security + state validation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">⚠</span>
                  <span>Uses Cognito Hosted UI (less customization)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  <Link href="/login-oauth">
                    Login with OAuth (Hosted UI)
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <strong>App Client:</strong> Public client (separate from SRP)
                <br />
                <strong>Flow:</strong> Redirect → Authenticate → Code → Token exchange
              </div>
            </CardContent>
          </Card>

          {/* Auth0 OAuth Card */}
          <Card className="border-2 border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                  Auth0 - Universal Login
                </span>
              </div>
              <CardTitle className="text-2xl">Auth0 OAuth 2.0</CardTitle>
              <CardDescription className="text-base">
                Industry-leading identity platform with OAuth + PKCE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>OAuth 2.0 + OpenID Connect (OIDC)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Social providers (Google, GitHub, etc.)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>MFA, passwordless, enterprise SSO</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">★</span>
                  <span>Rich ecosystem & customization</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
                  <Link href="/login-auth0">
                    Login with Auth0
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <strong>Provider:</strong> Auth0 tenant (separate from Cognito)
                <br />
                <strong>Flow:</strong> Redirect → Authenticate → Code → Token exchange
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Section */}
        <Card className="mt-8 bg-white/50">
          <CardHeader>
            <CardTitle>Quick Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Feature</th>
                    <th className="text-left py-2 px-4">Cognito SRP</th>
                    <th className="text-left py-2 px-4">Cognito OAuth</th>
                    <th className="text-left py-2 px-4">Auth0 OAuth</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-medium">UI</td>
                    <td className="py-2 px-4">Custom forms</td>
                    <td className="py-2 px-4">Cognito Hosted UI</td>
                    <td className="py-2 px-4">Auth0 Universal Login</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-medium">Redirects</td>
                    <td className="py-2 px-4">None</td>
                    <td className="py-2 px-4">To Cognito</td>
                    <td className="py-2 px-4">To Auth0</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-medium">Security</td>
                    <td className="py-2 px-4">Zero-knowledge proof</td>
                    <td className="py-2 px-4">PKCE + state</td>
                    <td className="py-2 px-4">PKCE + state</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-medium">Portability</td>
                    <td className="py-2 px-4">AWS only</td>
                    <td className="py-2 px-4">OAuth standard</td>
                    <td className="py-2 px-4">OAuth standard</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-medium">Social Login</td>
                    <td className="py-2 px-4">Via Cognito</td>
                    <td className="py-2 px-4">Via Cognito</td>
                    <td className="py-2 px-4">Native support</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-medium">Token Storage</td>
                    <td className="py-2 px-4" colSpan={3}>
                      Cookies (SameSite=Lax, accessible to JavaScript)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Cognito SRP</strong> and <strong>Cognito OAuth</strong> use AWS Cognito User Pool
          </p>
          <p className="mb-2">
            <strong>Auth0</strong> uses a separate Auth0 tenant (can also be configured as Cognito IDP)
          </p>
          <p>
            After authentication, check <strong>DevTools → Application → Cookies</strong> to see stored tokens
          </p>
        </div>
      </div>
    </main>
  );
}

