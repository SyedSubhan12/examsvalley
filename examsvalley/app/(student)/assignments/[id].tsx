// EXTRACTED FROM: client/src/pages/student/AssignmentDetailPage.tsx
// CONVERTED TO:   app/(student)/assignments/[id].tsx
// BUCKET:         B_convert

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiRequest } from "@/lib/queryClient";
import Toast from "react-native-toast-message";
import type { Assignment } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function AssignmentDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useQuery<Assignment>({
    queryKey: [`/api/assignments/${id}`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/assignments/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/assignments/${id}/submit`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      Toast.show({ type: "success", text1: "Assignment submitted!" });
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Submission failed", text2: err.message });
    },
  });

  if (isLoading) {
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
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPastDue = assignment.dueDate && new Date(assignment.dueDate) <= new Date();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Assignments</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</Text>

        {/* Status badge */}
        <View className="flex-row gap-2 mb-4">
          {isPastDue ? (
            <View className="bg-red-100 rounded-full px-3 py-1">
              <Text className="text-red-700 text-xs font-medium">🔴 Past Due</Text>
            </View>
          ) : (
            <View className="bg-amber-100 rounded-full px-3 py-1">
              <Text className="text-amber-700 text-xs font-medium">⏰ Upcoming</Text>
            </View>
          )}
        </View>

        {assignment.dueDate && (
          <View className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50">
            <Text className="text-sm text-gray-500">
              Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {assignment.description && (
          <View className="border border-gray-200 rounded-xl p-4 mb-5">
            <Text className="text-sm font-semibold text-gray-800 mb-2">Description</Text>
            <Text className="text-sm text-gray-600">{assignment.description}</Text>
          </View>
        )}

        {!isPastDue && (
          <TouchableOpacity
            onPress={() => Alert.alert(
              "Submit Assignment",
              "Are you sure you want to submit this assignment?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Submit", onPress: () => submitMutation.mutate() },
              ]
            )}
            disabled={submitMutation.isPending}
            className={`rounded-xl py-3 items-center ${submitMutation.isPending ? "bg-gray-300" : "bg-blue-600"}`}
          >
            {submitMutation.isPending
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-semibold">Submit Assignment</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
