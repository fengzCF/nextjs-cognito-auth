import { Amplify } from 'aws-amplify';
import { config } from '@/lib/config/env';

/**
 * Configure Amplify for OAuth 2.0 Code Grant Flow
 * Uses Cognito Hosted UI with PKCE
 * 
 * This uses a SEPARATE App Client from the SRP flow!
 */
export function configureAmplifyOAuth() {
  const userPoolId = config.cognito.userPoolId;
  const oauthClientId = config.cognito.oauthClientId;
  const region = config.cognito.region;
  const cognitoDomain = config.cognito.domain;
  
  if (!userPoolId || !oauthClientId || !region) {
    console.error('Amplify OAuth configuration missing:', { 
      userPoolId: !!userPoolId, 
      oauthClientId: !!oauthClientId, 
      region: !!region 
    });
    throw new Error('OAuth not configured. Please check your .env.local file.');
  }

  if (!cognitoDomain) {
    console.error('NEXT_PUBLIC_COGNITO_DOMAIN not set. OAuth flow requires a Cognito domain.');
    throw new Error('Cognito domain not configured. See OAUTH_SETUP.md');
  }

  console.log('Configuring Amplify for OAuth with:', {
    userPoolId,
    oauthClientId,
    domain: cognitoDomain,
  });

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: oauthClientId, // Use OAuth-specific client!
        
        // OAuth Configuration
        loginWith: {
          oauth: {
            domain: cognitoDomain,
            scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
            redirectSignIn: ['http://localhost:3000/auth/callback'],
            redirectSignOut: ['http://localhost:3000/'],
            responseType: 'code', // Code Grant flow with PKCE
          },
        },
        
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true,
          },
        },
        passwordFormat: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: true,
        },
      },
    },
  }, {
    ssr: true,
  });
}
