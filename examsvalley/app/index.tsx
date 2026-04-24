// EXTRACTED FROM: client/src/pages/curriculum/HomePage.tsx
// CONVERTED TO:   app/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter Link → expo-router Link, shadcn → RN primitives
// LOGIC CHANGES: Removed FloatingLines/CurvedLoop animations, dark mode toggle; kept board query and board filter logic

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, Image,
} from "react-native";
import { useRouter } from "expo-router";
import type { Board } from "@/lib/curriculumData";

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

export default function HomePage() {
  const router = useRouter();

  const { data: boards = [], isLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const mainBoards = boards.filter(b => ["caie", "pearson", "ib"].includes(b.boardKey));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Hero */}
        <View className="py-8 items-center">
          <View className="bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-4">
            <Text className="text-blue-700 text-sm font-medium">🎓 Your Complete Study Companion</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Master Your Curriculum
          </Text>
          <Text className="text-gray-500 text-center text-base mb-6 max-w-xs">
            Access comprehensive study resources, past papers, and revision materials for CAIE, Edexcel, and IB.
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/curriculum")}
              className="bg-blue-600 rounded-xl px-5 py-3"
            >
              <Text className="text-white font-semibold">Explore Curricula →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/subjects")}
              className="border border-gray-300 rounded-xl px-5 py-3"
            >
              <Text className="text-gray-700 font-medium">Search Subjects</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Board Tiles */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 text-center mb-1">Choose Your Board</Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
            Select your education board to access relevant study materials
          </Text>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" />
            </View>
          ) : (
            mainBoards.map(board => {
              const colors = BOARD_COLORS[board.boardKey] || DEFAULT_COLOR;
              return (
                <TouchableOpacity
                  key={board.id}
                  onPress={() => router.push(`/curriculum/${board.boardKey}` as any)}
                  className={`border-2 rounded-2xl p-4 mb-3 ${colors.bg} ${colors.border}`}
                >
                  <View className="flex-row items-start justify-between">
                    {board.logoUrl ? (
                      <View className="w-14 h-14 bg-white rounded-xl items-center justify-center p-2 shadow-sm">
                        <Image source={{ uri: board.logoUrl }} className="w-full h-full" resizeMode="contain" />
                      </View>
                    ) : (
                      <View className={`w-12 h-12 rounded-xl items-center justify-center bg-white`}>
                        <Text className={`text-xl font-bold ${colors.text}`}>{board.displayName[0]}</Text>
                      </View>
                    )}
                    <Text className="text-gray-400 text-lg">→</Text>
                  </View>
                  <Text className={`mt-3 text-lg font-bold ${colors.text}`}>{board.displayName}</Text>
                  <Text className="text-gray-500 text-sm">{board.fullName}</Text>
                  <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>{board.description}</Text>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            onPress={() => router.push("/curriculum")}
            className="items-center mt-2"
          >
            <Text className="text-blue-600 text-sm font-medium">View all boards →</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View className="border border-gray-100 rounded-2xl p-5 bg-gray-50">
          <Text className="text-base font-bold text-gray-900 mb-4">Why ExamsValley?</Text>
          {[
            { emoji: "📄", title: "Past Papers", desc: "Years of exam papers with mark schemes" },
            { emoji: "📝", title: "Study Notes", desc: "Clear, concise revision materials" },
            { emoji: "📅", title: "Timetables", desc: "Up-to-date exam schedules" },
            { emoji: "📚", title: "Syllabus", desc: "Complete syllabus guides for every subject" },
          ].map((f, i) => (
            <View key={i} className="flex-row items-start gap-3 mb-3">
              <Text className="text-2xl">{f.emoji}</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">{f.title}</Text>
                <Text className="text-xs text-gray-500">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
