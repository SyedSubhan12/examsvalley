// EXTRACTED FROM: client/src/App.tsx (root provider setup)
// CONVERTED TO:   app/_layout.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router Stack
// LOGIC CHANGES: First-run gate (splash → onboarding → app) using expo-router useSegments
//   to avoid redirect loops while on /splash or /onboarding screens.

import { useEffect, useState, type ReactNode } from "react";
import { Stack, useSegments, useRouter, usePathname } from "expo-router";
import { View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { OnboardingGate } from "@/components/OnboardingGate";
import { BottomTabs } from "@/components/BottomTabs";
import { queryClient } from "@/lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { FeedbackPopup } from "@/components/FeedbackPopup";
import * as SecureStore from "expo-secure-store";
import "../global.css";

const PUBLIC_TAB_PREFIXES = ["/curriculum", "/subjects", "/help", "/boards", "/become-a-tutor"];

function shouldShowTabs(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/(auth)")) return false;
  if (pathname.startsWith("/(student)")) return false;
  if (pathname.startsWith("/(teacher)")) return false;
  if (pathname.startsWith("/(admin)")) return false;
  if (pathname.startsWith("/onboarding")) return false;
  if (pathname.startsWith("/splash")) return false;
  return PUBLIC_TAB_PREFIXES.some((p) => pathname.startsWith(p));
}

const SPLASH_SEEN_KEY = "ExamsValley_splash_seen";

function FirstRunGate({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [splashChecked, setSplashChecked] = useState(false);
  const [splashSeen, setSplashSeen] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SPLASH_SEEN_KEY)
      .then((v) => setSplashSeen(v === "true"))
      .catch(() => setSplashSeen(true))
      .finally(() => setSplashChecked(true));
  }, []);

  useEffect(() => {
    if (!splashChecked) return;
    const root = segments[0] as string | undefined;
    if (root === "splash" || root === "onboarding") return;
    if (!splashSeen) {
      router.replace("/splash");
    }
  }, [splashChecked, splashSeen, segments, router]);

  if (!splashChecked) return null;

  const root = segments[0] as string | undefined;
  if (root === "splash" || root === "onboarding") {
    return <>{children}</>;
  }
  if (!splashSeen) return null;

  return <OnboardingGate>{children}</OnboardingGate>;
}

function RootShell() {
  const pathname = usePathname();
  const showTabs = shouldShowTabs(pathname);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <FirstRunGate>
          <Stack screenOptions={{ headerShown: false }} />
        </FirstRunGate>
      </View>
      {showTabs && <BottomTabs />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <RootShell />
              <FeedbackPopup delayMs={2 * 60 * 1000} />
              <Toast />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
