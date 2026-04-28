// EXTRACTED FROM: client/src/pages/subject/SubjectResourceHub.tsx
// CONVERTED TO:   app/subject/[subjectId]/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives, ResourceCardGrid → TouchableOpacity grid

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Subject, Board, Qualification, Branch, ResourceCategory } from "@/lib/curriculumData";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface SubjectContext {
  subject: Subject;
  board: Board;
  qualification: Qualification;
  branch?: Branch;
  resourceCounts: Record<string, number>;
}

const RESOURCE_EMOJIS: Record<string, string> = {
  past_papers: "📄",
  notes: "📝",
  syllabus: "📚",
  books: "📖",
  timetable: "📅",
  other: "📁",
};

export default function SubjectResourceHub() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();

  const { data: context, isLoading: contextLoading } = useQuery<SubjectContext>({
    queryKey: [`/api/curriculum/subjects/${subjectId}/context`],
    enabled: !!subjectId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/subjects/${subjectId}/context`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/curriculum/resource-categories"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/resource-categories`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isLoading = contextLoading || categoriesLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!context) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Subject Not Found</Text>
        <TouchableOpacity onPress={() => router.replace("/subjects")} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Search Subjects</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { subject, board, qualification, branch, resourceCounts = {} } = context;
  const totalResources = Object.values(resourceCounts).reduce((a, b) => a + (b || 0), 0);

  const backHref = (() => {
    if (!board || !qualification) return "/subjects";
    if (branch) return `/curriculum/${board.boardKey}/${qualification.qualKey}/${branch.branchKey}/subjects`;
    return `/curriculum/${board.boardKey}/${qualification.qualKey}/subjects`;
  })();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.push(backHref as any)} className="mb-4">
          <Text className="text-gray-500 text-sm">← {qualification?.displayName}</Text>
        </TouchableOpacity>

        {/* Subject title */}
        <Text className="text-2xl font-bold text-gray-900 mb-2">{subject.subjectName}</Text>

        {/* Badges */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {board && (
            <View className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
              <Text className="text-blue-700 text-xs font-medium">{board.displayName}</Text>
            </View>
          )}
          {qualification && (
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-gray-600 text-xs">{qualification.displayName}</Text>
            </View>
          )}
          {subject.subjectCode && (
            <View className="border border-gray-200 rounded-full px-3 py-1">
              <Text className="text-gray-600 text-xs">{subject.subjectCode}</Text>
            </View>
          )}
          {subject.versionTag && (
            <View className="border border-gray-200 rounded-full px-3 py-1">
              <Text className="text-gray-600 text-xs">{subject.versionTag}</Text>
            </View>
          )}
        </View>

        {subject.description && (
          <Text className="text-gray-500 text-sm mb-4">{subject.description}</Text>
        )}

        {/* Resource categories grid */}
        <Text className="text-base font-semibold text-gray-800 mb-3">Resources</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {categories.map(cat => {
            const count = resourceCounts[cat.resourceKey] || 0;
            const emoji = RESOURCE_EMOJIS[cat.resourceKey] || "📁";
            return (
              <TouchableOpacity
                key={cat.resourceKey}
                onPress={() => router.push(`/subject/${subjectId}/resource/${cat.resourceKey}` as any)}
                className="border border-gray-200 rounded-xl p-4"
                style={{ width: "47.5%" }}
              >
                <Text className="text-2xl mb-2">{emoji}</Text>
                <Text className="font-semibold text-gray-800 text-sm mb-1">{cat.displayName}</Text>
                <Text className="text-xs text-gray-400">{count} {count === 1 ? "resource" : "resources"}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick stats */}
        <View className="border border-gray-100 rounded-2xl p-5 bg-gray-50">
          <Text className="font-semibold text-gray-800 mb-4">Quick Overview</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-blue-600">{totalResources}</Text>
              <Text className="text-xs text-gray-500 text-center mt-1">Total Resources</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-800">{resourceCounts.past_papers || 0}</Text>
              <Text className="text-xs text-gray-500 text-center mt-1">Past Papers</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-800">{resourceCounts.notes || 0}</Text>
              <Text className="text-xs text-gray-500 text-center mt-1">Study Notes</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
