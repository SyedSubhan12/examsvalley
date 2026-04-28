// EXTRACTED FROM: client/src/components/onboarding/OnboardingGate.tsx
// CONVERTED TO:   components/OnboardingGate.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: localStorage → expo-secure-store, shadcn useToast → react-native-toast-message, inline <OnboardingWizard> → <Redirect href="/onboarding"/> (wizard is its own screen)
// LOGIC CHANGES: Three-state gate ("checking"|"wizard"|"ready"); device id generated via Math.random+Date.now fallback (expo-crypto not installed). Wizard handles its own POST /api/onboarding/complete + flag write — gate just routes to it when not completed.

import { useEffect, useState, type ReactNode } from "react";
import { View, Text } from "@/components/tw";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";

const DEVICE_ID_KEY = "ExamsValley_device_id";
const ONBOARDING_COMPLETED_KEY = "ExamsValley_onboarding_completed";
const PREFERENCES_KEY = "ExamsValley_preferences";

const BASE = process.env.EXPO_PUBLIC_API_URL;

type GateState = "checking" | "wizard" | "ready";

function generateDeviceId(): string {
  // expo-crypto not in package.json — use a fallback random id.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

interface OnboardingGateProps {
  children: ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const [state, setState] = useState<GateState>("checking");
  const router = useRouter();

  useEffect(() => {
    if (state === "wizard") {
      router.replace("/onboarding");
    }
  }, [state, router]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const completed = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);
        if (completed === "true") {
          if (!cancelled) setState("ready");
          // Still try a server sync in the background (non-blocking).
          syncWithServer().catch(() => {});
          return;
        }

        // Not completed locally — sync with server.
        const serverCompleted = await syncWithServer();
        if (cancelled) return;
        if (serverCompleted) {
          setState("ready");
        } else {
          setState("wizard");
        }
      } catch (err) {
        console.warn("OnboardingGate init error:", err);
        if (!cancelled) setState("wizard");
      }
    };

    const syncWithServer = async (): Promise<boolean> => {
      try {
        const deviceId = await getDeviceId();
        const res = await fetch(`${BASE}/api/onboarding/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ deviceId }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data?.onboardingCompleted) {
          await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, "true");
          if (data.preferences) {
            await SecureStore.setItemAsync(
              PREFERENCES_KEY,
              JSON.stringify({ ...data.preferences, subjectIds: data.subjectIds })
            );
          }
          return true;
        }
        return false;
      } catch (err) {
        console.warn("Could not sync onboarding with server:", err);
        return false;
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Setting up your experience…</Text>
      </View>
    );
  }

  if (state === "wizard") {
    return null;
  }

  return <>{children}</>;
}

// Helper exported for wizard screen to call after successful completion.
export async function markOnboardingComplete(prefs: any): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, "true");
    await SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn("Could not persist onboarding flag:", err);
    Toast.show({
      type: "error",
      text1: "Could not save preferences locally",
    });
  }
}

export async function getOnboardingDeviceId(): Promise<string> {
  return getDeviceId();
}
