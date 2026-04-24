// NEW FILE — replaces localStorage pattern for auth session persistence
// EXTRACTED FROM: NEW FILE
// CONVERTED TO:   hooks/useSecureSession.ts
// BUCKET:         D_replace
// WEB LIBRARIES REPLACED: localStorage → expo-secure-store
// LOGIC CHANGES: Wraps expo-secure-store with typed helpers for session persistence

import * as SecureStore from "expo-secure-store";

export const SESSION_KEY = "ExamsValley_user";

export async function saveSession(user: object): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

export async function loadSession<T>(): Promise<T | null> {
  const stored = await SecureStore.getItemAsync(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
