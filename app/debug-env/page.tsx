'use client';

export default function DebugEnvPage() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = process.env.NEXT_PUBLIC_COGNITO_REGION;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
        
        <div className="space-y-4">
          <div>
            <p className="font-semibold">NEXT_PUBLIC_COGNITO_USER_POOL_ID:</p>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded">
              {userPoolId || '❌ NOT SET'}
            </p>
          </div>

          <div>
            <p className="font-semibold">NEXT_PUBLIC_COGNITO_CLIENT_ID:</p>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded">
              {clientId || '❌ NOT SET'}
            </p>
          </div>

          <div>
            <p className="font-semibold">NEXT_PUBLIC_COGNITO_REGION:</p>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded">
              {region || '❌ NOT SET'}
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> If any values show "NOT SET", restart your dev server:
            </p>
            <code className="block mt-2 text-xs bg-gray-800 text-white p-2 rounded">
              # Kill server: Ctrl+C<br/>
              # Then run: pnpm dev
            </code>
          </div>
        </div>
      </div>
    </main>
  );
}
