// EXTRACTED FROM: client/src/pages/curriculum/BranchSelectorPage.tsx
// CONVERTED TO:   app/curriculum/[boardKey]/[qualKey]/branch.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Board, Qualification, Branch } from "@/lib/curriculumData";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function BranchSelectorPage() {
  const { boardKey, qualKey } = useLocalSearchParams<{ boardKey: string; qualKey: string }>();
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
  const qualification = qualifications.find(q => q.qualKey === qualKey);

  const { data: branches = [], isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: [`/api/curriculum/qualifications/${qualification?.id}/branches`],
    enabled: !!qualification?.id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/qualifications/${qualification!.id}/branches`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isLoading = boardsLoading || qualsLoading || (branchesLoading && !!qualification);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!board || !qualification) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <Text className="text-gray-500 text-center mb-4">The requested qualification does not exist.</Text>
        <TouchableOpacity onPress={() => router.replace("/curriculum")} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back to Curriculum</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!qualification.hasBranching || branches.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">No Branches Available</Text>
        <Text className="text-gray-500 text-center mb-4">
          This qualification doesn't have Current/Legacy branches.
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/curriculum/${boardKey}/${qualKey}/subjects` as any)}
          className="bg-blue-600 rounded-xl px-5 py-3"
        >
          <Text className="text-white font-semibold">View Subjects →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Breadcrumb */}
        <TouchableOpacity onPress={() => router.push(`/curriculum/${boardKey}` as any)} className="mb-4">
          <Text className="text-gray-500 text-sm">← {board.displayName}</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-1">{qualification.displayName}</Text>
        <Text className="text-sm text-gray-500 mb-6">{board.displayName} • Choose specification version</Text>

        {/* Branch selector */}
        <Text className="text-base font-semibold text-gray-800 mb-1">Select Specification</Text>
        <Text className="text-sm text-gray-500 mb-4">
          Choose between the current specification or legacy materials
        </Text>

        {branches.map(branch => (
          <TouchableOpacity
            key={branch.id}
            onPress={() => router.push(`/curriculum/${boardKey}/${qualKey}/${branch.branchKey}/subjects` as any)}
            className="border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-base font-semibold text-gray-800">{branch.displayName}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {branch.branchKey === "current"
                  ? "Latest syllabus & exam format"
                  : "Previous syllabus materials"}
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">→</Text>
          </TouchableOpacity>
        ))}

        {/* Info box */}
        <View className="mt-4 border border-gray-200 rounded-xl p-5 bg-gray-50">
          <Text className="font-semibold text-gray-800 mb-3">What's the difference?</Text>
          <View className="mb-3">
            <Text className="text-sm font-medium text-blue-600 mb-1">Current Specification</Text>
            <Text className="text-xs text-gray-500">
              The latest syllabus and exam format. Use this if you're currently studying or will be taking exams in upcoming sessions.
            </Text>
          </View>
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Legacy Specification</Text>
            <Text className="text-xs text-gray-500">
              Previous syllabus materials. Useful for additional practice or if you're completing a qualification under the old format.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
