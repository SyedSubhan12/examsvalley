// EXTRACTED FROM: client/src/pages/teacher/MaterialEditorPage.tsx (detail/edit view)
// CONVERTED TO:   app/(teacher)/materials/[id].tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Material } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-green-100", text: "text-green-700" },
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
};

export default function MaterialDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: material, isLoading } = useQuery<Material>({
    queryKey: [`/api/materials/${id}`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/materials/${id}`, { credentials: "include" });
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

  if (!material) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-purple-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColors = STATUS_COLORS[material.status] || { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Materials</Text>
        </TouchableOpacity>

        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-xl font-bold text-gray-900 flex-1 mr-2">{material.title}</Text>
          <View className={`rounded-full px-2.5 py-1 ${statusColors.bg}`}>
            <Text className={`text-xs font-medium capitalize ${statusColors.text}`}>{material.status}</Text>
          </View>
        </View>

        {material.description && (
          <Text className="text-sm text-gray-500 mb-4">{material.description}</Text>
        )}

        <View className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-4">
          {[
            { label: "Type", value: material.type?.replace("_", " ") },
            { label: "Year", value: material.year },
            { label: "Difficulty", value: material.difficulty },
            { label: "Views", value: material.viewCount },
            { label: "Downloads", value: material.downloadCount },
          ].filter(r => r.value != null).map((row, i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-sm text-gray-500">{row.label}</Text>
              <Text className="text-sm font-medium text-gray-800 capitalize">{String(row.value)}</Text>
            </View>
          ))}
        </View>

        {material.status === "rejected" && material.rejectionReason && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4">
            <Text className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</Text>
            <Text className="text-sm text-red-600">{material.rejectionReason}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
