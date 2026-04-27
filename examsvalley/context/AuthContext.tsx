// EXTRACTED FROM: client/src/context/AuthContext.tsx
// CONVERTED TO:   context/AuthContext.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: localStorage → expo-secure-store
// LOGIC CHANGES: All localStorage calls replaced with SecureStore async equivalents;
//   fetch URLs prefixed with EXPO_PUBLIC_API_URL; functions that access storage made async;
//   updateUser uses fire-and-forget SecureStore.setItemAsync inside setUser callback;
//   ADDED loginWithGoogle(idToken, accessToken?) — mobile cannot use the web's redirect-based
//   GET /api/auth/google flow, so it POSTs the OAuth token to /api/auth/google/mobile
//   (backend route may need to be added; mirrors the user payload shape of /api/auth/login).

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@/types/index";
import { apiRequest } from "@/lib/queryClient";
import { setAccessToken } from "@/lib/authToken";
import * as SecureStore from "expo-secure-store";

const JWT_KEY = "ExamsValley_jwt";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  boardIds?: string[] | null;
  subjectIds?: string[] | null;
  password?: string | null;
  googleId?: string | null;
  authProvider?: string;
  isActive?: boolean;
  createdAt?: Date | null;
}

interface LoginResult {
  success: boolean;
  error?: string;
  needsEmailVerification?: boolean;
  email?: string;
  maskedEmail?: string;
  needsApproval?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithGoogle: (idToken: string, accessToken?: string) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
      // Ignore errors during logout
    }
    setUser(null);
    setAccessToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync("ExamsValley_user"),
      SecureStore.deleteItemAsync(JWT_KEY),
    ]);
  }, []);

  // Check authentication status
  useEffect(() => {
    const controller = new AbortController();
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          await SecureStore.setItemAsync("ExamsValley_user", JSON.stringify(userData));
        } else {
          setUser(null);
          setAccessToken(null);
          await Promise.all([
            SecureStore.deleteItemAsync("ExamsValley_user"),
            SecureStore.deleteItemAsync(JWT_KEY),
          ]);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;

        // Restore JWT from SecureStore so subsequent API calls are authenticated
        const [storedUser, storedToken] = await Promise.all([
          SecureStore.getItemAsync("ExamsValley_user"),
          SecureStore.getItemAsync(JWT_KEY),
        ]);
        if (storedToken) setAccessToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            await SecureStore.deleteItemAsync("ExamsValley_user");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    return () => controller.abort();
  }, []);

  // Poll for user status changes (check if account was deactivated)
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const checkUserStatus = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal
        });

        if (response.status === 403) {
          // Account has been deactivated - force logout
          console.log("Account deactivated, logging out...");
          logout();
        } else if (response.status === 401) {
          // Session expired or invalid
          logout();
        } else if (response.ok) {
          // Update user data if it changed
          const userData = await response.json();
          if (JSON.stringify(userData) !== JSON.stringify(user)) {
            setUser(userData);
            await SecureStore.setItemAsync("ExamsValley_user", JSON.stringify(userData));
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error("Error checking user status:", error);
      }
    };

    // Check every 10 seconds for immediate response when account is deactivated
    const interval = setInterval(checkUserStatus, 10000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [user, logout]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setIsLoading(false);
        return {
          success: false,
          error: payload?.message || payload?.error || "Invalid email or password",
          needsEmailVerification: payload?.needsEmailVerification,
          email: payload?.email,
          maskedEmail: payload?.maskedEmail,
          needsApproval: payload?.needsApproval,
        };
      }

      const userData = payload;
      setUser(userData);
      await SecureStore.setItemAsync("ExamsValley_user", JSON.stringify(userData));
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      return { success: false, error: errorMessage };
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, accessToken?: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      if (!idToken && !accessToken) {
        setIsLoading(false);
        return { success: false, error: "Missing Google token" };
      }
      // NOTE: Web uses GET /api/auth/google (redirect-based passport flow), which
      // is not usable from a native client. Mobile assumes a token-exchange endpoint
      // POST /api/auth/google/mobile that accepts { idToken, accessToken } and returns
      // the same user payload as /api/auth/login. Backend may need to add this route.
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/google/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken, accessToken }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setIsLoading(false);
        return {
          success: false,
          error: payload?.message || payload?.error || "Google sign-in failed",
          needsEmailVerification: payload?.needsEmailVerification,
          email: payload?.email,
          maskedEmail: payload?.maskedEmail,
          needsApproval: payload?.needsApproval,
        };
      }

      // The Expo Router API route returns { user, token }
      const userData = payload?.user ?? payload;
      const jwtToken: string | undefined = payload?.token;

      if (jwtToken) {
        setAccessToken(jwtToken);
        await SecureStore.setItemAsync(JWT_KEY, jwtToken);
      }
      setUser(userData);
      await SecureStore.setItemAsync("ExamsValley_user", JSON.stringify(userData));
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Google sign-in failed";
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      // Fire-and-forget: SecureStore is async but setUser callback cannot be async
      SecureStore.setItemAsync("ExamsValley_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
