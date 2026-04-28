// EXTRACTED FROM: client/src/pages/teacher/MyMaterialsPage.tsx
// CONVERTED TO:   app/(teacher)/materials/index.tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Material } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-green-100", text: "text-green-700" },
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
};

const TYPE_EMOJIS: Record<string, string> = {
  video: "🎬", past_paper: "📋", notes: "📝", worksheet: "📄",
};

export default function MyMaterialsPage() {
  const router = useRouter();

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/materials`, { credentials: "include" });
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
            <Text className="text-2xl font-bold text-gray-900">My Materials</Text>
            <Text className="text-sm text-gray-500">Manage your uploaded resources</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(teacher)/materials/new" as any)}
            className="bg-purple-600 rounded-xl px-3 py-2"
          >
            <Text className="text-white text-sm font-medium">+ Upload</Text>
          </TouchableOpacity>
        </View>

        {materials.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-3">📭</Text>
            <Text className="text-gray-500 mb-2">No materials uploaded yet.</Text>
            <TouchableOpacity
              onPress={() => router.push("/(teacher)/materials/new" as any)}
              className="bg-purple-600 rounded-xl px-5 py-3"
            >
              <Text className="text-white font-semibold">Upload First Material</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={materials}
            estimatedItemSize={80}
            keyExtractor={m => m.id}
            renderItem={({ item: m }) => {
              const statusColors = STATUS_COLORS[m.status] || { bg: "bg-gray-100", text: "text-gray-600" };
              return (
                <TouchableOpacity
                  onPress={() => router.push(`/(teacher)/materials/${m.id}` as any)}
                  className="border border-gray-100 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row items-start justify-between mb-1">
                    <Text className="font-semibold text-gray-800 text-sm flex-1" numberOfLines={2}>
                      {TYPE_EMOJIS[m.type] || "📄"} {m.title}
                    </Text>
                    <View className={`ml-2 rounded-full px-2 py-0.5 ${statusColors.bg}`}>
                      <Text className={`text-xs capitalize ${statusColors.text}`}>{m.status}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3 mt-1">
                    <Text className="text-xs text-gray-400 capitalize">{m.type?.replace("_", " ")}</Text>
                    {m.year && <Text className="text-xs text-gray-400">{m.year}</Text>}
                    <Text className="text-xs text-gray-400">👁 {m.viewCount}</Text>
                    <Text className="text-xs text-gray-400">⬇ {m.downloadCount}</Text>
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
