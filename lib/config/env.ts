interface EnvConfig {
  cognito: {
    userPoolId: string;
    clientId: string;
    oauthClientId: string;
    region: string;
    domain: string;
  };
  auth0: {
    domain: string;
    clientId: string;
    clientSecret: string;
    audience: string;
  };
}

// In Next.js client components, process.env is replaced at build time
// We need to access the variables directly, not through a function
export const config: EnvConfig = {
  cognito: {
    // SRP Flow
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
    
    // OAuth Flow (separate client)
    oauthClientId: process.env.NEXT_PUBLIC_COGNITO_OAUTH_CLIENT_ID || '',
    
    // Common
    region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
  },
  auth0: {
    domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
    clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',
  },
};
