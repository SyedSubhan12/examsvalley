import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw";
import { ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight, GraduationCap } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import type { Board } from "@/lib/curriculumData";
import { MobileNavbar } from "@/components/MobileNavbar";
import { FeaturesSection } from "@/components/FeaturesSection";
import { useTheme, themeColors } from "@/context/ThemeContext";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const BOARD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  caie: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  pearson: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  ib: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ocr: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  aqa: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  wjec: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  ccea: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};
const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };

function FadeSlideIn({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 90 }));
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = themeColors[theme];
  const isDark = theme === "dark";

  const { data: boards = [], isLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const mainBoards = boards.filter((b) => ["caie", "pearson", "ib"].includes(b.boardKey));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <MobileNavbar />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero */}
        <View
          style={{ backgroundColor: isDark ? c.card : c.bg }}
          className="px-4 pt-10 pb-12 items-center overflow-hidden"
        >
          <FadeSlideIn delay={0}>
            <View
              style={{
                backgroundColor: isDark ? "#1e3a8a33" : "#dbeafe",
                borderColor: isDark ? "#1e40af66" : "#bfdbfe",
              }}
              className="mb-4 flex-row items-center gap-2 rounded-full border px-4 py-2"
            >
              <GraduationCap size={14} color={isDark ? "#93c5fd" : "#2563eb"} />
              <Text
                style={{ color: isDark ? "#93c5fd" : "#1d4ed8" }}
                className="text-sm font-medium"
              >
                Your Complete Study Companion
              </Text>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={120}>
            <Text
              style={{ color: c.text }}
              className="text-3xl font-bold tracking-tight text-center"
            >
              Master Your Curriculum
            </Text>
          </FadeSlideIn>

          <FadeSlideIn delay={220}>
            <Text
              style={{ color: c.textMuted }}
              className="mt-3 max-w-xl text-center text-base px-2"
            >
              Access comprehensive study resources, past papers, and revision materials for
              CAIE, Edexcel, and IB curricula. Everything you need to excel in your exams.
            </Text>
          </FadeSlideIn>

          <FadeSlideIn delay={340}>
            <View className="mt-7 flex-row flex-wrap items-center justify-center gap-3">
              <TouchableOpacity
                onPress={() => router.push("/curriculum")}
                className="flex-row items-center gap-2 rounded-xl bg-blue-600 px-5 py-3"
              >
                <Text className="text-sm font-semibold text-white">Explore Curricula</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/subjects")}
                style={{ borderColor: c.border, backgroundColor: c.card }}
                className="rounded-xl border px-5 py-3"
              >
                <Text style={{ color: c.text }} className="text-sm font-medium">
                  Search Subjects
                </Text>
              </TouchableOpacity>
            </View>
          </FadeSlideIn>
        </View>

        {/* Board Tiles Section */}
        <View
          style={{ backgroundColor: isDark ? c.bg : "#f8fafc99" }}
          className="px-4 py-10"
        >
          <FadeSlideIn delay={100}>
            <Text style={{ color: c.text }} className="text-center text-2xl font-bold">
              Choose Your Board
            </Text>
            <Text style={{ color: c.textMuted }} className="mt-2 text-center text-sm">
              Select your education board to access relevant study materials
            </Text>
          </FadeSlideIn>

          <View className="mt-6 gap-3">
            {isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={c.primary} />
              </View>
            ) : (
              mainBoards.map((board, idx) => {
                const colors = BOARD_COLORS[board.boardKey] || DEFAULT_COLOR;
                return (
                  <FadeSlideIn key={board.id} delay={200 + idx * 120}>
                    <TouchableOpacity
                      onPress={() => router.push(`/curriculum/${board.boardKey}` as any)}
                      className={`rounded-2xl border-2 p-4 ${colors.bg} ${colors.border}`}
                    >
                      <View className="flex-row items-start justify-between">
                        {board.logoUrl ? (
                          <View className="h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                            <Image
                              source={{ uri: board.logoUrl }}
                              className="h-full w-full"
                              resizeMode="contain"
                            />
                          </View>
                        ) : (
                          <View className="h-12 w-12 items-center justify-center rounded-xl bg-white">
                            <Text className={`text-xl font-bold ${colors.text}`}>
                              {board.displayName[0]}
                            </Text>
                          </View>
                        )}
                        <ArrowRight size={18} color="#94a3b8" />
                      </View>
                      <Text className={`mt-3 text-lg font-bold ${colors.text}`}>
                        {board.displayName}
                      </Text>
                      <Text className="text-sm text-slate-600">{board.fullName}</Text>
                      <Text className="mt-1 text-xs text-slate-500" numberOfLines={2}>
                        {board.description}
                      </Text>
                    </TouchableOpacity>
                  </FadeSlideIn>
                );
              })
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/curriculum")}
            className="mt-6 flex-row items-center justify-center gap-1"
          >
            <Text style={{ color: c.textMuted }} className="text-sm font-medium">
              View all boards
            </Text>
            <ArrowRight size={14} color={c.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={{ backgroundColor: c.bg }} className="px-4">
          <FeaturesSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
