// EXTRACTED FROM: client/src/pages/student/AssignmentsPage.tsx
// CONVERTED TO:   app/(student)/assignments/index.tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import type { Assignment } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function AssignmentsPage() {
  const router = useRouter();

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/assignments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const upcoming = assignments.filter(a => a.dueDate && new Date(a.dueDate) > new Date());
  const past = assignments.filter(a => !a.dueDate || new Date(a.dueDate) <= new Date());

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const renderSection = (title: string, items: Assignment[], accentClass: string) => {
    if (items.length === 0) return null;
    return (
      <View className="mb-5">
        <Text className={`text-sm font-semibold mb-2 ${accentClass}`}>{title}</Text>
        {items.map(a => (
          <TouchableOpacity
            key={a.id}
            onPress={() => router.push(`/(student)/assignments/${a.id}` as any)}
            className="border border-gray-100 rounded-xl p-4 mb-2"
          >
            <Text className="font-medium text-gray-800 text-sm">{a.title}</Text>
            {a.dueDate && (
              <Text className="text-xs text-gray-400 mt-1">
                Due: {new Date(a.dueDate).toLocaleDateString()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Assignments</Text>
        <Text className="text-sm text-gray-500 mb-5">View and submit your assignments</Text>

        {assignments.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">📋</Text>
            <Text className="text-gray-500">No assignments yet.</Text>
          </View>
        ) : (
          <>
            {renderSection("⏰ Upcoming", upcoming, "text-amber-600")}
            {renderSection("📅 Past", past, "text-gray-500")}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
