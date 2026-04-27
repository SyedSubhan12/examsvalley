// EXTRACTED FROM: client/src/pages/curriculum/IBSubjectGroupPage.tsx
// CONVERTED TO:   app/curriculum/ib/dp/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter Link → expo-router useRouter, shadcn Card/Badge/Skeleton → RN View/Text/ActivityIndicator, CurriculumLayout/ScreenHeader → SafeAreaView + back button
// LOGIC CHANGES: Fetches /api/curriculum/boards for IB board + /api/curriculum/subject-groups/ib-dp for groups. Group color palette mapped to NativeWind classes. Individual group pages (/curriculum/ib/dp/[groupId]) are Phase 5 work.

import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

interface Board {
  id: string;
  boardKey: string;
  displayName: string;
}

interface SubjectGroup {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
}

const GROUP_COLORS: Record<number, { border: string; bg: string; badge: string }> = {
  1: { border: "border-blue-200", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" },
  2: { border: "border-green-200", bg: "bg-green-50", badge: "bg-green-100 text-green-700" },
  3: { border: "border-amber-200", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
  4: { border: "border-purple-200", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700" },
  5: { border: "border-red-200", bg: "bg-red-50", badge: "bg-red-100 text-red-700" },
  6: { border: "border-pink-200", bg: "bg-pink-50", badge: "bg-pink-100 text-pink-700" },
};

export default function IBSubjectGroupPage() {
  const router = useRouter();

  const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
  });

  const { data: subjectGroups = [], isLoading: groupsLoading } = useQuery<SubjectGroup[]>({
    queryKey: ["/api/curriculum/subject-groups/ib-dp"],
  });

  const board = boards.find((b) => b.boardKey === "ib");
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
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          The IB board could not be found.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/curriculum" as any)}
          className="bg-blue-600 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">← Back to Curriculum</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Breadcrumb */}
        <View className="flex-row items-center gap-1 mb-4">
          <TouchableOpacity onPress={() => router.push("/curriculum" as any)}>
            <Text className="text-xs text-blue-600">Curriculum</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400"> › </Text>
          <TouchableOpacity onPress={() => router.push("/curriculum/ib" as any)}>
            <Text className="text-xs text-blue-600">IB</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400"> › </Text>
          <Text className="text-xs text-gray-800 font-medium">Diploma Programme</Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-1">Diploma Programme</Text>
        <Text className="text-sm text-gray-500 mb-5">IB · Select a subject group</Text>

        {/* Info box */}
        <View className="border border-gray-100 rounded-xl bg-gray-50 p-4 mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">
            About IB DP Subject Groups
          </Text>
          <Text className="text-sm text-gray-500 leading-relaxed">
            The IB Diploma Programme requires students to choose one subject from each of the first
            five groups, plus either a subject from Group 6 or a second subject from Groups 1-4.
          </Text>
        </View>

        {/* Groups Grid */}
        {subjectGroups.map((group) => {
          const colors = GROUP_COLORS[group.sortOrder] || {
            border: "border-gray-200",
            bg: "bg-gray-50",
            badge: "bg-gray-100 text-gray-700",
          };
          return (
            <TouchableOpacity
              key={group.id}
              onPress={() => router.push(`/curriculum/ib/dp/${group.id}` as any)}
              className={`border ${colors.border} ${colors.bg} rounded-2xl p-5 mb-3`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start justify-between">
                <View
                  className={`rounded-full px-2.5 py-1 mb-2 self-start ${colors.badge}`}
                >
                  <Text className="text-xs font-semibold">Group {group.sortOrder}</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </View>
              <Text className="text-base font-bold text-gray-900 mb-1">{group.name}</Text>
              <Text className="text-sm text-gray-500 leading-relaxed">{group.description}</Text>
            </TouchableOpacity>
          );
        })}

        {subjectGroups.length === 0 && (
          <Text className="text-sm text-gray-400 text-center py-8">No subject groups found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
