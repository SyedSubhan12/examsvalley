// EXTRACTED FROM: client/src/pages/curriculum/BoardDetailPage.tsx
// CONVERTED TO:   app/curriculum/[boardKey]/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Board, Qualification } from "@/lib/curriculumData";
import { getSubjectGroupsByProgram, isIBDP } from "@/lib/curriculumData";

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

export default function BoardDetailPage() {
  const { boardKey } = useLocalSearchParams<{ boardKey: string }>();
  const router = useRouter();

  const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const board = boards.find(b => b.boardKey === boardKey);

  const { data: qualifications = [], isLoading: qualsLoading } = useQuery<Qualification[]>({
    queryKey: [`/api/curriculum/boards/${boardKey}/qualifications`],
    enabled: !!boardKey,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards/${boardKey}/qualifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isLoading = boardsLoading || (qualsLoading && !!boardKey);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!board) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Board Not Found</Text>
        <Text className="text-gray-500 text-center mb-4">The requested board does not exist.</Text>
        <TouchableOpacity onPress={() => router.replace("/curriculum")} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back to Curriculum</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const colors = BOARD_COLORS[board.boardKey] || DEFAULT_COLOR;

  const handleQualPress = (qual: Qualification) => {
    if (isIBDP(qual.id)) {
      router.push(`/curriculum/ib/dp/groups` as any);
    } else if (qual.hasBranching) {
      router.push(`/curriculum/${boardKey}/${qual.qualKey}/branch` as any);
    } else {
      router.push(`/curriculum/${boardKey}/${qual.qualKey}/subjects` as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Back + breadcrumb */}
        <TouchableOpacity onPress={() => router.push("/curriculum")} className="mb-4">
          <Text className="text-gray-500 text-sm">← Curriculum</Text>
        </TouchableOpacity>

        {/* Board header card */}
        <View className={`border-2 rounded-2xl p-5 mb-6 ${colors.bg} ${colors.border}`}>
          <View className="flex-row items-start gap-4">
            {board.logoUrl ? (
              <View className="w-14 h-14 bg-white rounded-xl items-center justify-center p-2 shadow-sm">
                <Image source={{ uri: board.logoUrl }} className="w-full h-full" resizeMode="contain" />
              </View>
            ) : (
              <View className="w-14 h-14 bg-white rounded-xl items-center justify-center">
                <Text className={`text-2xl font-bold ${colors.text}`}>{board.displayName[0]}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className={`text-xl font-bold ${colors.text}`}>{board.displayName}</Text>
              <Text className="text-gray-500 text-sm mt-1">{board.description}</Text>
            </View>
          </View>
        </View>

        {/* Qualifications */}
        <Text className="text-base font-semibold text-gray-800 mb-3">
          Select {board.boardKey === "ib" ? "Programme" : "Qualification"}
        </Text>

        {qualifications.map(qual => {
          const isDP = isIBDP(qual.id);
          const subGroupCount = isDP ? getSubjectGroupsByProgram("ib-dp").length : null;

          return (
            <TouchableOpacity
              key={qual.id}
              onPress={() => handleQualPress(qual)}
              className="border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">{qual.displayName}</Text>
                {isDP && (
                  <Text className="text-xs text-gray-500 mt-0.5">Ages 16–19 • {subGroupCount} Subject Groups</Text>
                )}
                {qual.hasBranching && !isDP && (
                  <Text className="text-xs text-gray-500 mt-0.5">Current & Legacy specifications</Text>
                )}
              </View>
              <Text className="text-gray-400 text-lg">→</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
