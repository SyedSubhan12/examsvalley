// EXTRACTED FROM: client/src/pages/files/PDFViewerPage.tsx
// CONVERTED TO:   app/view/file/[fileId].tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: iframe PDF viewer → expo-file-system download + Linking.openURL or expo-sharing
// LOGIC CHANGES: No fullscreen/theme toggle (native handles that); download uses FileSystem.downloadAsync + Sharing.shareAsync

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { FileAsset } from "@/lib/curriculumData";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function PDFViewerPage() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [opening, setOpening] = useState(false);

  const { data: file, isLoading } = useQuery<FileAsset>({
    queryKey: [`/api/curriculum/files/${fileId}`],
    enabled: !!fileId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/files/${fileId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const handleOpenInBrowser = async () => {
    if (!file?.url) return;
    const { Linking } = await import("react-native");
    const url = file.url.startsWith("http") ? file.url : `${BASE}${file.url}`;
    await Linking.openURL(url);
  };

  const handleDownload = async () => {
    if (!file?.url) return;
    setDownloading(true);
    try {
      const url = file.url.startsWith("http") ? file.url : `${BASE}${file.url}`;
      const fileName = file.fileName || file.title || "document.pdf";
      const localUri = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(url, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: file.title });
      } else {
        Alert.alert("Downloaded", `File saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to download file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenDirectly = async () => {
    if (!file?.url) return;
    setOpening(true);
    try {
      const url = file.url.startsWith("http") ? file.url : `${BASE}${file.url}`;
      const fileName = file.fileName || file.title || "document.pdf";
      const localUri = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(url, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      } else {
        const { Linking } = await import("react-native");
        await Linking.openURL(uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to open file. Please try downloading instead.");
    } finally {
      setOpening(false);
    }
  };

  if (isLoading || !file) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading document...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 items-center justify-center rounded-full bg-gray-100">
          <Text className="text-gray-600 text-base">✕</Text>
        </TouchableOpacity>
        <View className="flex-1 mx-3">
          <Text className="font-semibold text-sm text-gray-900" numberOfLines={1}>{file.title}</Text>
          {file.fileName && file.fileName !== file.title && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>{file.fileName}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloading}
          className="bg-blue-600 rounded-xl px-3 py-2 flex-row items-center gap-1"
        >
          {downloading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-medium text-sm">⬇ Download</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View className="flex-1 items-center justify-center p-8">
        {/* File card */}
        <View className="bg-white rounded-2xl border border-gray-200 p-8 items-center w-full max-w-sm shadow-sm">
          <View className="w-20 h-20 bg-red-50 rounded-2xl items-center justify-center mb-4">
            <Text className="text-5xl">📄</Text>
          </View>

          <Text className="text-lg font-bold text-gray-900 text-center mb-1" numberOfLines={2}>
            {file.title}
          </Text>
          {file.fileName && (
            <Text className="text-xs text-gray-400 text-center mb-4">{file.fileName}</Text>
          )}

          {/* File metadata chips */}
          <View className="flex-row flex-wrap gap-2 justify-center mb-6">
            {file.fileType && (
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs text-gray-600 font-medium">{file.fileType.toUpperCase()}</Text>
              </View>
            )}
            {file.year && (
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs text-gray-600">{file.year}</Text>
              </View>
            )}
            {file.session && (
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs text-gray-600">{file.session}</Text>
              </View>
            )}
            {file.paper != null && (
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs text-gray-600">Paper {file.paper}</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            onPress={handleOpenDirectly}
            disabled={opening}
            className="w-full bg-blue-600 rounded-xl py-3 items-center mb-3"
          >
            {opening ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Open PDF</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownload}
            disabled={downloading}
            className="w-full border border-gray-300 rounded-xl py-3 items-center mb-3"
          >
            {downloading ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-gray-700 font-medium">Download & Share</Text>
            )}
          </TouchableOpacity>

          {file.url && (
            <TouchableOpacity
              onPress={handleOpenInBrowser}
              className="w-full items-center py-2"
            >
              <Text className="text-blue-600 text-sm">Open in Browser</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
