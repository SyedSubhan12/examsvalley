// EXTRACTED FROM: client/src/pages/curriculum/IBSubjectGroupPage.tsx
// CONVERTED TO:   app/curriculum/ib/dp/groups.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import type { Board, SubjectGroup } from "@/lib/curriculumData";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const GROUP_COLORS: Record<number, { border: string; bg: string }> = {
  1: { border: "border-blue-300", bg: "bg-blue-50" },
  2: { border: "border-green-300", bg: "bg-green-50" },
  3: { border: "border-amber-300", bg: "bg-amber-50" },
  4: { border: "border-purple-300", bg: "bg-purple-50" },
  5: { border: "border-red-300", bg: "bg-red-50" },
  6: { border: "border-pink-300", bg: "bg-pink-50" },
};

export default function IBSubjectGroupPage() {
  const router = useRouter();

  const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const board = boards.find(b => b.boardKey === "ib");

  const { data: subjectGroups = [], isLoading: groupsLoading } = useQuery<SubjectGroup[]>({
    queryKey: ["/api/curriculum/subject-groups/ib-dp"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/subject-groups/ib-dp`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isLoading = boardsLoading || groupsLoading;

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
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <TouchableOpacity onPress={() => router.replace("/curriculum")} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back to Curriculum</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.push("/curriculum/ib" as any)} className="mb-4">
          <Text className="text-gray-500 text-sm">← IB</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-1">Diploma Programme</Text>
        <Text className="text-sm text-gray-500 mb-4">IB • Select a subject group</Text>

        {/* Info */}
        <View className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-6">
          <Text className="font-semibold text-gray-800 mb-2">About IB DP Subject Groups</Text>
          <Text className="text-sm text-gray-500">
            The IB Diploma Programme requires students to choose one subject from each of the first five groups, plus either a subject from Group 6 or a second subject from Groups 1-4.
          </Text>
        </View>

        {/* Groups grid (2 per row) */}
        <View className="flex-row flex-wrap gap-3">
          {subjectGroups.map(group => {
            const colors = GROUP_COLORS[group.sortOrder] || { border: "border-gray-200", bg: "bg-gray-50" };
            return (
              <TouchableOpacity
                key={group.id}
                onPress={() => router.push(`/curriculum/ib/dp/${group.id}` as any)}
                className={`border-2 rounded-xl p-4 ${colors.border} ${colors.bg}`}
                style={{ width: "47.5%" }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="border border-gray-300 rounded-full px-2 py-0.5 bg-white">
                    <Text className="text-xs text-gray-600 font-medium">Group {group.sortOrder}</Text>
                  </View>
                  <Text className="text-gray-400">→</Text>
                </View>
                <Text className="font-bold text-gray-800 text-sm mb-1">{group.name}</Text>
                <Text className="text-xs text-gray-500" numberOfLines={2}>{group.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
