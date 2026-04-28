// EXTRACTED FROM: client/src/pages/files/MultiViewPage.tsx
// CONVERTED TO:   app/view/multiview/[fileId1]/[fileId2].tsx
// BUCKET:         D_replace
// WEB LIBRARIES REPLACED: iframe → expo-web-browser (WebBrowser.openBrowserAsync) — React Native cannot embed inline iframes. Side-by-side PDF viewing is not supported natively; both files open sequentially in the system browser instead.
// LOGIC CHANGES: Split-pane viewer dropped (no web iframe on native); shows file metadata cards with "Open in Browser" buttons. Selection sidebar rendered as a scrollable list. window.history.back → router.back.

import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "@/components/tw"
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface FileAsset {
  id: string;
  title: string;
  fileName?: string;
  url?: string;
  fileType?: string;
  year?: number;
  session?: string;
  paper?: string;
  variant?: string;
  subjectId?: string;
  resourceKey?: string;
  fileSize?: number | null;
}

export default function MultiViewPage() {
  const { fileId1, fileId2 } = useLocalSearchParams<{ fileId1: string; fileId2: string }>();
  const router = useRouter();
  const isSelecting = fileId2 === "select";

  const [searchQuery, setSearchQuery] = useState("");

  const { data: file1, isLoading: isLoading1 } = useQuery<FileAsset>({
    queryKey: [`/api/curriculum/files/${fileId1}`],
    enabled: !!fileId1,
  });

  const { data: file2, isLoading: isLoading2 } = useQuery<FileAsset>({
    queryKey: [`/api/curriculum/files/${fileId2}`],
    enabled: !!fileId2 && !isSelecting,
  });

  const { data: siblingFiles = [], isLoading: isLoadingSiblings } = useQuery<FileAsset[]>({
    queryKey: [`/api/curriculum/subjects/${file1?.subjectId}/resource/${file1?.resourceKey}/files`],
    enabled: !!file1?.subjectId && !!file1?.resourceKey && isSelecting,
  });

  const filteredSiblings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return siblingFiles.filter(
      (s) =>
        s.id !== fileId1 &&
        (!q ||
          s.title.toLowerCase().includes(q) ||
          s.fileName?.toLowerCase().includes(q))
    );
  }, [siblingFiles, fileId1, searchQuery]);

  const relatedFile = useMemo(() => {
    if (!file1) return null;
    return siblingFiles.find(
      (s) =>
        s.id !== fileId1 &&
        s.year === file1.year &&
        s.session === file1.session &&
        s.paper === file1.paper &&
        s.variant === file1.variant &&
        ((file1.fileType === "qp" && s.fileType === "ms") ||
          (file1.fileType === "ms" && s.fileType === "qp"))
    );
  }, [siblingFiles, file1, fileId1]);

  const getFileUrl = (file?: FileAsset) => {
    if (!file?.url) return null;
    return file.url.startsWith("http") ? file.url : `${BASE}${file.url}`;
  };

  const openFile = async (file?: FileAsset) => {
    const url = getFileUrl(file);
    if (url) await WebBrowser.openBrowserAsync(url);
  };

  if (isLoading1 || (!isSelecting && isLoading2)) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-sm text-gray-500">Loading documents…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-gray-500 text-lg">✕</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">Multi-view Explorer</Text>
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {file1?.title}
            {!isSelecting && file2 ? ` vs ${file2.title}` : ""}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Limitation notice */}
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <Text className="text-xs text-amber-700">
            Side-by-side PDF view is only available on the web. Tap "Open" to view each file in
            your browser.
          </Text>
        </View>

        {/* File 1 Card */}
        {file1 && (
          <View className="border border-gray-100 rounded-2xl p-4 bg-white mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="bg-gray-100 rounded px-2 py-0.5">
                <Text className="text-xs text-gray-500 uppercase font-bold">Left</Text>
              </View>
              {file1.year && (
                <Text className="text-xs text-gray-400">{file1.year} {file1.session}</Text>
              )}
            </View>
            <Text className="text-sm font-semibold text-gray-800 mb-1">{file1.title}</Text>
            {file1.fileName && (
              <Text className="text-xs text-gray-400 mb-3">{file1.fileName}</Text>
            )}
            <TouchableOpacity
              onPress={() => openFile(file1)}
              className="bg-blue-600 rounded-xl py-2.5 items-center"
            >
              <Text className="text-white font-semibold text-sm">Open in Browser</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* File 2 Card or Selector */}
        {isSelecting ? (
          <View className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
            <View className="px-4 py-3 border-b border-gray-50">
              <Text className="text-sm font-semibold text-gray-800 mb-3">
                Select second file for Multi-view
              </Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search papers…"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </View>

            {isLoadingSiblings ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : (
              <View className="p-4">
                {relatedFile && !searchQuery && (
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                      Recommended Match
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.replace(
                          `/view/multiview/${fileId1}/${relatedFile.id}` as any
                        )
                      }
                      className="border-2 border-blue-600 rounded-xl p-3 bg-blue-50"
                    >
                      <Text className="text-sm font-semibold text-blue-700">{relatedFile.title}</Text>
                      <Text className="text-xs text-blue-400">{relatedFile.fileName}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {filteredSiblings.length === 0 ? (
                  <Text className="text-sm text-gray-400 text-center py-6">No matching files.</Text>
                ) : (
                  filteredSiblings.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() =>
                        router.replace(`/view/multiview/${fileId1}/${f.id}` as any)
                      }
                      className="flex-row items-center gap-2 py-2 border-b border-gray-50"
                    >
                      <Text className="text-gray-400">📄</Text>
                      <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                        {f.title}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        ) : (
          file2 && (
            <View className="border border-gray-100 rounded-2xl p-4 bg-white mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-gray-100 rounded px-2 py-0.5">
                  <Text className="text-xs text-gray-500 uppercase font-bold">Right</Text>
                </View>
                {file2.year && (
                  <Text className="text-xs text-gray-400">{file2.year} {file2.session}</Text>
                )}
              </View>
              <Text className="text-sm font-semibold text-gray-800 mb-1">{file2.title}</Text>
              {file2.fileName && (
                <Text className="text-xs text-gray-400 mb-3">{file2.fileName}</Text>
              )}
              <TouchableOpacity
                onPress={() => openFile(file2)}
                className="bg-blue-600 rounded-xl py-2.5 items-center mb-2"
              >
                <Text className="text-white font-semibold text-sm">Open in Browser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.replace(`/view/multiview/${fileId1}/select` as any)
                }
                className="border border-gray-200 rounded-xl py-2.5 items-center"
              >
                <Text className="text-gray-600 text-sm">Change File 2</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
