// EXTRACTED FROM: client/src/components/onboarding/SplashVideoScreen.tsx
// CONVERTED TO:   app/splash.tsx
// BUCKET:         D_replace
// WEB LIBRARIES REPLACED: HTMLVideoElement → expo-av Video
// LOGIC CHANGES: SecureStore for first-run flag; expo-router replace for nav

// TODO(integration): _layout.tsx must redirect to /splash on first launch when SecureStore.getItemAsync("ExamsValley_splash_seen") !== "true"

import { useCallback, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "@/components/tw"
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as SecureStore from "expo-secure-store";

const SPLASH_SEEN_KEY = "ExamsValley_splash_seen";
const FALLBACK_DURATION_MS = 4000;

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const hasFinishedRef = useRef(false);
  const [, setIsLoaded] = useState(false);

  const finish = useCallback(async () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    try {
      await SecureStore.setItemAsync(SPLASH_SEEN_KEY, "true");
    } catch (e) {
      console.warn("Failed to persist splash-seen flag:", e);
    }
    router.replace("/");
  }, [router]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if ("error" in status && status.error) {
          // Video failed; bail out after short fallback
          setTimeout(() => finish(), FALLBACK_DURATION_MS);
        }
        return;
      }
      setIsLoaded(true);
      if (status.didJustFinish) {
        finish();
      }
    },
    [finish]
  );

  return (
    <View className="flex-1 bg-black">
      <Video
        ref={videoRef}
        source={require("@/assets/video/splash.mp4")}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isMuted
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Skip splash video"
        onPress={finish}
        style={{ top: insets.top + 12, right: 16 }}
        className="absolute rounded-full bg-white/15 px-4 py-2 border border-white/20"
      >
        <Text className="text-white text-sm font-medium">Skip</Text>
      </TouchableOpacity>
    </View>
  );
}
