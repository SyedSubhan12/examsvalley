// EXTRACTED FROM: client/src/pages/curriculum/BoardsListPage.tsx
// CONVERTED TO:   app/curriculum/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives

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

export default function CurriculumPage() {
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
  const otherBoards = boards.filter(b => !["caie", "pearson", "ib"].includes(b.boardKey));

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Curriculum</Text>
        <Text className="text-gray-500 text-sm mb-6">
          Select your education board to explore qualifications and subjects
        </Text>

        {/* Featured Boards */}
        <Text className="text-base font-semibold text-gray-800 mb-3">Featured Boards</Text>
        {mainBoards.map(board => {
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
                  <View className="w-12 h-12 rounded-xl items-center justify-center bg-white">
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
        })}

        {/* Other Boards */}
        {otherBoards.length > 0 && (
          <>
            <Text className="text-base font-semibold text-gray-800 mt-4 mb-3">Other Boards</Text>
            {otherBoards.map(board => {
              const colors = BOARD_COLORS[board.boardKey] || DEFAULT_COLOR;
              return (
                <TouchableOpacity
                  key={board.id}
                  onPress={() => router.push(`/curriculum/${board.boardKey}` as any)}
                  className="border border-gray-200 rounded-xl p-4 mb-2 flex-row items-center gap-3"
                >
                  {board.logoUrl ? (
                    <View className="w-12 h-12 bg-white rounded-lg items-center justify-center border border-gray-100 p-1.5">
                      <Image source={{ uri: board.logoUrl }} className="w-full h-full" resizeMode="contain" />
                    </View>
                  ) : (
                    <View className={`w-10 h-10 rounded-lg items-center justify-center bg-gray-100`}>
                      <Text className={`text-base font-bold ${colors.text}`}>{board.displayName[0]}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{board.displayName}</Text>
                    <Text className="text-xs text-gray-500" numberOfLines={1}>{board.fullName}</Text>
                  </View>
                  <Text className="text-gray-400">→</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
