import { Amplify } from 'aws-amplify';
import { config } from '@/lib/config/env';

export function configureAmplify() {
  const userPoolId = config.cognito.userPoolId;
  const clientId = config.cognito.clientId;
  const region = config.cognito.region;

  if (!userPoolId || !clientId || !region) {
    console.error('Amplify configuration missing:', { 
      userPoolId: !!userPoolId, 
      clientId: !!clientId, 
      region: !!region 
    });
    throw new Error('Auth UserPool not configured. Please check your .env.local file.');
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        loginWith: {
          email: true,
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
    ssr: true, // Enable SSR support for Next.js
  });
}
