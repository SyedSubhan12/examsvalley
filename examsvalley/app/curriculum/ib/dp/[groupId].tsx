// EXTRACTED FROM: client/src/pages/curriculum/SubjectListPage.tsx (reused for IB DP group context)
// CONVERTED TO:   app/curriculum/ib/dp/[groupId].tsx
// BUCKET:         B_convert
// LOGIC CHANGES: Fetches subjects for a specific IB DP subject group via
//   GET /api/curriculum/subject-groups/ib-dp/:groupId/subjects (or fallback to
//   /api/curriculum/subjects?subjectGroupId=:groupId). Navigates to /subject/:subjectId.

import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface SubjectGroup {
  id: string; name: string; description?: string; sortOrder: number;
}

interface Subject {
  id: string; subjectName?: string; name?: string; subjectCode?: string; isActive?: boolean;
}

const GROUP_COLORS: Record<number, string> = {
  1: "bg-blue-600", 2: "bg-green-600", 3: "bg-amber-600",
  4: "bg-purple-600", 5: "bg-red-600", 6: "bg-pink-600",
};

export default function IBGroupSubjectsPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: groups = [] } = useQuery<SubjectGroup[]>({
    queryKey: ["/api/curriculum/subject-groups/ib-dp"],
  });

  const group = groups.find((g) => g.id === groupId);

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: [`/api/curriculum/subject-groups/ib-dp/${groupId}/subjects`],
    enabled: !!groupId,
    queryFn: async () => {
      // Try group-specific endpoint first, fall back to query param
      const res = await fetch(
        `${BASE}/api/curriculum/subject-groups/ib-dp/${groupId}/subjects`,
        { credentials: "include" }
      );
      if (res.ok) return res.json();
      // Fallback
      const res2 = await fetch(
        `${BASE}/api/curriculum/subjects?subjectGroupId=${groupId}`,
        { credentials: "include" }
      );
      if (!res2.ok) throw new Error("Failed to fetch subjects");
      return res2.json();
    },
  });

  const filtered = subjects.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (s.subjectName || s.name || "").toLowerCase().includes(q) ||
      (s.subjectCode || "").toLowerCase().includes(q);
  });

  const accentColor = group ? (GROUP_COLORS[group.sortOrder] || "bg-indigo-600") : "bg-indigo-600";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header band */}
        <View className={`${accentColor} px-4 pt-4 pb-6`}>
          <TouchableOpacity onPress={() => router.back()} className="mb-3">
            <Text className="text-white/80 text-sm">← IB DP Groups</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-white mb-1">
            {group?.name ?? "Subjects"}
          </Text>
          {group?.sortOrder && (
            <Text className="text-white/70 text-sm">Group {group.sortOrder}</Text>
          )}
        </View>

        <View className="px-4 pt-4">
          {/* Search */}
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search subjects…"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 mb-4"
          />

          {isLoading ? (
            <View className="py-10 items-center"><ActivityIndicator size="large" /></View>
          ) : filtered.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-8">No subjects found.</Text>
          ) : (
            filtered.map((subj) => (
              <TouchableOpacity
                key={subj.id}
                onPress={() => router.push(`/subject/${subj.id}` as any)}
                className="flex-row items-center border border-gray-100 rounded-2xl p-4 mb-3 bg-white"
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {subj.subjectName || subj.name}
                  </Text>
                  {subj.subjectCode && (
                    <Text className="text-xs text-gray-400 mt-0.5">{subj.subjectCode}</Text>
                  )}
                </View>
                <Text className="text-gray-400">›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
