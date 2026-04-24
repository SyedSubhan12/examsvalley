// EXTRACTED FROM: client/src/pages/admin/AnalyticsPage.tsx
// CONVERTED TO:   app/(admin)/analytics.tsx
// BUCKET:         B_convert — charts are placeholders (no RN chart lib in scope)

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalBoards: number;
  totalMaterials: number;
  pendingMaterials?: number;
  dailyActiveUsers?: number;
}

export default function AnalyticsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ stats: AdminStats }>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/overview`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const stats = data?.stats;

  const statCards = [
    { label: "Total Students", value: stats?.totalStudents ?? 0, emoji: "🎓" },
    { label: "Total Teachers", value: stats?.totalTeachers ?? 0, emoji: "👩‍🏫" },
    { label: "Total Boards", value: stats?.totalBoards ?? 0, emoji: "🏫" },
    { label: "Total Materials", value: stats?.totalMaterials ?? 0, emoji: "📚" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Dashboard</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-1">Analytics</Text>
        <Text className="text-sm text-gray-500 mb-5">Platform usage statistics and insights</Text>

        {isLoading ? (
          <View className="py-8 items-center"><ActivityIndicator size="large" /></View>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-3 mb-6">
              {statCards.map(card => (
                <View key={card.label} className="flex-1 min-w-[40%] border border-gray-100 rounded-xl p-4">
                  <Text className="text-2xl mb-1">{card.emoji}</Text>
                  <Text className="text-2xl font-bold text-gray-900">{card.value}</Text>
                  <Text className="text-xs text-gray-500 mt-1">{card.label}</Text>
                </View>
              ))}
            </View>

            {/* Chart placeholders */}
            {[
              { title: "Content Usage by Subject", emoji: "📊" },
              { title: "Quiz Attempts Over Time", emoji: "📈" },
              { title: "Active Users Trend", emoji: "📉" },
            ].map(chart => (
              <View key={chart.title} className="border border-dashed border-gray-200 rounded-xl p-6 mb-4 items-center">
                <Text className="text-3xl mb-2">{chart.emoji}</Text>
                <Text className="text-sm font-medium text-gray-700 mb-1">{chart.title}</Text>
                <Text className="text-xs text-gray-400">Chart visualization coming soon</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
