// EXTRACTED FROM: client/src/pages/student/MaterialDetailPage.tsx
// CONVERTED TO:   app/(student)/materials/[id].tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: iframe PDF → expo-file-system + Sharing

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Material } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const TYPE_EMOJIS: Record<string, string> = {
  video: "🎬", past_paper: "📋", notes: "📝", worksheet: "📄",
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

  const handleOpen = async () => {
    const rawUrl = material?.fileUrl || material?.videoUrl;
    if (!rawUrl) return;
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE}${rawUrl}`;

    try {
      const { Linking } = await import("react-native");
      await Linking.openURL(fullUrl);
    } catch {
      Alert.alert("Error", "Could not open this resource.");
    }
  };

  const handleDownload = async () => {
    if (!material?.fileUrl) return;
    const fullUrl = material.fileUrl.startsWith("http") ? material.fileUrl : `${BASE}${material.fileUrl}`;
    const fileName = `${material.title}.pdf`;
    const localUri = FileSystem.documentDirectory + fileName;

    try {
      const { uri } = await FileSystem.downloadAsync(fullUrl, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Downloaded", `Saved to: ${uri}`);
      }
    } catch {
      Alert.alert("Error", "Failed to download.");
    }
  };

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
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasFile = !!(material.fileUrl || material.videoUrl);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Materials</Text>
        </TouchableOpacity>

        {/* Material card */}
        <View className="border border-gray-200 rounded-2xl p-5 items-center mb-5">
          <View className="w-20 h-20 bg-blue-50 rounded-2xl items-center justify-center mb-4">
            <Text className="text-4xl">{TYPE_EMOJIS[material.type] || "📄"}</Text>
          </View>

          <Text className="text-xl font-bold text-gray-900 text-center mb-2">{material.title}</Text>

          {/* Chips */}
          <View className="flex-row flex-wrap gap-2 justify-center mb-4">
            {material.type && (
              <View className="border border-gray-200 rounded-full px-3 py-1">
                <Text className="text-xs text-gray-600 capitalize">{material.type.replace("_", " ")}</Text>
              </View>
            )}
            {material.year && (
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs text-gray-600">{material.year}</Text>
              </View>
            )}
          </View>

          {material.description && (
            <Text className="text-sm text-gray-500 text-center mb-4">{material.description}</Text>
          )}

          {/* Stats */}
          <View className="flex-row gap-6">
            {material.viewCount != null && (
              <View className="items-center">
                <Text className="text-base font-bold text-gray-800">{material.viewCount}</Text>
                <Text className="text-xs text-gray-400">Views</Text>
              </View>
            )}
            {material.downloadCount != null && (
              <View className="items-center">
                <Text className="text-base font-bold text-gray-800">{material.downloadCount}</Text>
                <Text className="text-xs text-gray-400">Downloads</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        {hasFile && (
          <>
            <TouchableOpacity
              onPress={handleOpen}
              className="bg-blue-600 rounded-xl py-3 items-center mb-3"
            >
              <Text className="text-white font-semibold">Open Resource</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDownload}
              className="border border-gray-300 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-700 font-medium">⬇ Download</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
