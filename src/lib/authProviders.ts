import { GithubAuthProvider, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

export const oauthProviders = {
  'google.com': () => new GoogleAuthProvider(),
  'github.com': () => new GithubAuthProvider(),
  'apple.com': () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    return provider;
  },
};

export const providerNames = {
  'google.com': 'Google',
  'github.com': 'GitHub',
  'apple.com': 'Apple',
};
