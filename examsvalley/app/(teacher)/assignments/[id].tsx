// EXTRACTED FROM: client/src/pages/teacher/AssignmentSubmissionsPage.tsx
// CONVERTED TO:   app/(teacher)/assignments/[id].tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Assignment, Submission } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function AssignmentSubmissionsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: assignment, isLoading: assignLoading } = useQuery<Assignment>({
    queryKey: [`/api/assignments/${id}`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/assignments/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery<Submission[]>({
    queryKey: [`/api/assignments/${id}/submissions`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/assignments/${id}/submissions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (assignLoading || subsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-purple-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Assignments</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900 mb-1">{assignment.title}</Text>
        {assignment.dueDate && (
          <Text className="text-sm text-gray-500 mb-4">
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </Text>
        )}

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 border border-gray-200 rounded-xl p-4 items-center">
            <Text className="text-2xl font-bold text-gray-900">{submissions.length}</Text>
            <Text className="text-xs text-gray-500 mt-1">Submissions</Text>
          </View>
          <View className="flex-1 border border-gray-200 rounded-xl p-4 items-center">
            <Text className="text-2xl font-bold text-gray-900">{assignment.totalMarks}</Text>
            <Text className="text-xs text-gray-500 mt-1">Total Marks</Text>
          </View>
        </View>

        <Text className="text-sm font-semibold text-gray-800 mb-3">Submissions</Text>
        {submissions.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-gray-400">No submissions yet.</Text>
          </View>
        ) : (
          submissions.map(sub => (
            <View key={sub.id} className="border border-gray-100 rounded-xl p-4 mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-800">Student #{sub.studentId?.slice(-6)}</Text>
                {sub.submittedAt && (
                  <Text className="text-xs text-gray-400">
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {sub.grade != null && (
                <Text className="text-sm text-green-700 font-medium mt-1">
                  Grade: {sub.grade}/{assignment.totalMarks}
                </Text>
              )}
              {sub.feedback && (
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>{sub.feedback}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
