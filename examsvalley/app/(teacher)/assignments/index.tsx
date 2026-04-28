// EXTRACTED FROM: client/src/pages/teacher/AssignmentsManagePage.tsx
// CONVERTED TO:   app/(teacher)/assignments/index.tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Assignment } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function AssignmentsManagePage() {
  const router = useRouter();

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/assignments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Assignments</Text>
            <Text className="text-sm text-gray-500">Manage assignments for your students</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(teacher)/assignments/new" as any)}
            className="bg-purple-600 rounded-xl px-3 py-2"
          >
            <Text className="text-white text-sm font-medium">+ New</Text>
          </TouchableOpacity>
        </View>

        {assignments.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-3">📋</Text>
            <Text className="text-gray-500 mb-2">No assignments created yet.</Text>
          </View>
        ) : (
          <FlashList
            data={assignments}
            estimatedItemSize={80}
            keyExtractor={a => a.id}
            renderItem={({ item: a }) => {
              const isActive = a.isActive;
              const isPast = a.dueDate && new Date(a.dueDate) < new Date();
              return (
                <TouchableOpacity
                  onPress={() => router.push(`/(teacher)/assignments/${a.id}` as any)}
                  className="border border-gray-100 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row items-start justify-between">
                    <Text className="font-semibold text-gray-800 text-sm flex-1" numberOfLines={2}>
                      📋 {a.title}
                    </Text>
                    <View className={`ml-2 rounded-full px-2 py-0.5 ${isActive ? "bg-green-100" : "bg-gray-100"}`}>
                      <Text className={`text-xs ${isActive ? "text-green-700" : "text-gray-500"}`}>
                        {isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3 mt-2">
                    {a.dueDate && (
                      <Text className={`text-xs ${isPast ? "text-red-500" : "text-gray-400"}`}>
                        Due: {new Date(a.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                    <Text className="text-xs text-gray-400">{a.totalMarks} marks</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
