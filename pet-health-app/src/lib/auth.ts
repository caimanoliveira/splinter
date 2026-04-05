/**
 * Clerk auth helpers for React Native / Expo.
 *
 * Clerk manages the full auth lifecycle (sign-in, sign-up, session refresh,
 * token storage). This module re-exports the hooks used across the app so
 * there's a single import point if you ever need to swap providers.
 */
export {
  useAuth,
  useUser,
  useSignIn,
  useSignUp,
  useClerk,
} from '@clerk/clerk-expo';

/**
 * SecureStore-backed token cache for Clerk.
 * Pass this to <ClerkProvider tokenCache={clerkTokenCache}>.
 */
import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo/dist/cache';

export const clerkTokenCache: TokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
};
