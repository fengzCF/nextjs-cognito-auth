import {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  type SignUpInput,
  type SignInInput,
  type ConfirmSignUpInput,
} from 'aws-amplify/auth';

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface ConfirmSignUpParams {
  email: string;
  confirmationCode: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

/**
 * Register a new user
 */
export async function registerUser({ email, password, name }: SignUpParams) {
  const params: SignUpInput = {
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        ...(name && { name }),
      },
      autoSignIn: true,
    },
  };

  const { isSignUpComplete, userId, nextStep } = await signUp(params);

  return {
    isSignUpComplete,
    userId,
    nextStep,
  };
}

/**
 * Confirm user registration with code
 */
export async function confirmUserRegistration({
  email,
  confirmationCode,
}: ConfirmSignUpParams) {
  const params: ConfirmSignUpInput = {
    username: email,
    confirmationCode,
  };

  const { isSignUpComplete, nextStep } = await confirmSignUp(params);

  return {
    isSignUpComplete,
    nextStep,
  };
}

/**
 * Resend confirmation code
 */
export async function resendConfirmationCode(email: string) {
  await resendSignUpCode({
    username: email,
  });
}

/**
 * Sign in user
 */
export async function loginUser({ email, password }: SignInParams) {
  const params: SignInInput = {
    username: email,
    password,
  };

  const { isSignedIn, nextStep } = await signIn(params);

  return {
    isSignedIn,
    nextStep,
  };
}

/**
 * Sign out user
 */
export async function logoutUser() {
  await signOut();
}

/**
 * Get current authenticated user
 */
export async function getAuthenticatedUser(): Promise<UserInfo | null> {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    return {
      id: user.userId,
      email: attributes.email || '',
      emailVerified: attributes.email_verified === 'true',
      name: attributes.name,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get authentication tokens
 * Note: Amplify automatically handles token refresh
 */
export async function getAuthTokens(): Promise<AuthTokens | null> {
  try {
    const session = await fetchAuthSession();
    
    if (!session.tokens) {
      return null;
    }

    const tokens = session.tokens as {
      accessToken: { toString: () => string };
      idToken?: { toString: () => string };
      refreshToken?: { toString: () => string };
    };

    return {
      accessToken: tokens.accessToken.toString(),
      idToken: tokens.idToken?.toString() || '',
      refreshToken: tokens.refreshToken?.toString(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
