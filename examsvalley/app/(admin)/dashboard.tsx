// EXTRACTED FROM: client/src/pages/admin/AdminDashboardPage.tsx
// CONVERTED TO:   app/(admin)/dashboard.tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalBoards: number;
  totalMaterials: number;
  pendingMaterials: number;
  dailyActiveUsers?: number;
}

interface AdminEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface AdminOverview {
  stats: AdminStats;
  recentEvents: AdminEvent[];
}

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  registration: { label: "New User", color: "bg-blue-100 text-blue-700" },
  upload: { label: "Upload", color: "bg-green-100 text-green-700" },
  flagged: { label: "Moderation", color: "bg-red-100 text-red-700" },
  status: { label: "Status", color: "bg-gray-100 text-gray-700" },
};

function mapEventType(type: string) {
  if (type === "NEW_USER") return "registration";
  if (type.startsWith("NEW_")) return "upload";
  if (type.startsWith("CONTENT_")) return "flagged";
  return "status";
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<AdminOverview>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/overview`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const stats = data?.stats;
  const recentEvents = data?.recentEvents ?? [];

  const statCards = [
    { label: "Students", value: stats?.totalStudents ?? 0, color: "bg-blue-50", text: "text-blue-700" },
    { label: "Teachers", value: stats?.totalTeachers ?? 0, color: "bg-purple-50", text: "text-purple-700" },
    { label: "Boards", value: stats?.totalBoards ?? 0, color: "bg-green-50", text: "text-green-700" },
    { label: "Materials", value: stats?.totalMaterials ?? 0, color: "bg-amber-50", text: "text-amber-700" },
  ];

  const quickActions = [
    { label: "Manage Users", sub: "View and manage all users", route: "/(admin)/users/" },
    { label: "Content Moderation", sub: `${stats?.pendingMaterials ?? 0} pending`, route: "/(admin)/moderation" },
    { label: "Teacher Approvals", sub: "Review applications", route: "/(admin)/teachers/" },
    { label: "Analytics", sub: "Platform statistics", route: "/(admin)/analytics" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</Text>
        <Text className="text-sm text-gray-500 mb-5">System overview and recent activity</Text>

        {isLoading ? (
          <View className="items-center py-8"><ActivityIndicator size="large" /></View>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-3 mb-5">
              {statCards.map(card => (
                <View key={card.label} className={`flex-1 min-w-[40%] rounded-xl p-4 ${card.color}`}>
                  <Text className={`text-2xl font-bold ${card.text}`}>{card.value}</Text>
                  <Text className="text-xs text-gray-600 mt-1">{card.label}</Text>
                </View>
              ))}
            </View>

            <Text className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</Text>
            <View className="mb-5">
              {quickActions.map(action => (
                <TouchableOpacity
                  key={action.label}
                  onPress={() => router.push(action.route as any)}
                  className="flex-row items-center border border-gray-100 rounded-xl p-4 mb-2"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{action.label}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{action.sub}</Text>
                  </View>
                  <Text className="text-gray-400">›</Text>
                </TouchableOpacity>
              ))}
            </View>

            {recentEvents.length > 0 && (
              <>
                <Text className="text-sm font-semibold text-gray-800 mb-3">Recent System Events</Text>
                {recentEvents.slice(0, 8).map(event => {
                  const mapped = mapEventType(event.type);
                  const badge = EVENT_TYPE_LABELS[mapped];
                  return (
                    <View key={event.id} className="border border-gray-100 rounded-xl p-4 mb-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                          {event.type}
                        </Text>
                        <View className={`rounded-full px-2 py-0.5 ${badge.color}`}>
                          <Text className="text-xs font-medium">{badge.label}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500" numberOfLines={2}>{event.message}</Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
