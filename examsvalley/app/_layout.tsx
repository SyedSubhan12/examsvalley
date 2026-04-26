// EXTRACTED FROM: client/src/App.tsx (root provider setup)
// CONVERTED TO:   app/_layout.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router Stack
// LOGIC CHANGES: First-run gate (splash → onboarding → app) using expo-router useSegments
//   to avoid redirect loops while on /splash or /onboarding screens.

import { useEffect, useState, type ReactNode } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { OnboardingGate } from "@/components/OnboardingGate";
import { queryClient } from "@/lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import "../global.css";

const SPLASH_SEEN_KEY = "ExamsValley_splash_seen";

function FirstRunGate({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const [splashChecked, setSplashChecked] = useState(false);
  const [splashSeen, setSplashSeen] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SPLASH_SEEN_KEY)
      .then((v) => setSplashSeen(v === "true"))
      .catch(() => setSplashSeen(true)) // fail open — don't trap users behind splash on storage error
      .finally(() => setSplashChecked(true));
  }, []);

  if (!splashChecked) return null;

  const root = segments[0] as string | undefined;

  // While /splash or /onboarding are active, don't re-gate — those screens own the flow.
  if (root === "splash" || root === "onboarding") {
    return <>{children}</>;
  }

  if (!splashSeen) {
    return <Redirect href="/splash" />;
  }

  return <OnboardingGate>{children}</OnboardingGate>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FirstRunGate>
              <Stack screenOptions={{ headerShown: false }} />
            </FirstRunGate>
            <Toast />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
