// EXTRACTED FROM: client/src/pages/admin/ContentModerationPage.tsx
// CONVERTED TO:   app/(admin)/moderation.tsx
// BUCKET:         B_convert

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, Modal, Linking,
} from "react-native";
import { FlashList } from "@shopify/flash-list";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminMaterial {
  id: string;
  title: string;
  type: string;
  status: string;
  uploaderName?: string;
  subject?: string;
  fileUrl?: string;
  videoUrl?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-green-100", text: "text-green-700" },
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
};

const TYPE_EMOJIS: Record<string, string> = {
  video: "🎥", notes: "📝", ebook: "📖", worksheet: "📋", pdf: "📄",
};

export default function ContentModerationPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [preview, setPreview] = useState<AdminMaterial | null>(null);

  const effectiveStatus = statusFilter === "all" ? "ALL" : statusFilter.toUpperCase();

  const { data, isLoading } = useQuery<{ data: AdminMaterial[] }>({
    queryKey: ["admin-materials", effectiveStatus],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/materials?status=${effectiveStatus}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const materials = data?.data ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === "all") return materials;
    return materials.filter(m => m.status.toLowerCase() === statusFilter);
  }, [materials, statusFilter]);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/api/admin/materials/${id}/approve`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-materials"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/api/admin/materials/${id}/reject`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-materials"] }),
  });

  const counts = {
    all: materials.length,
    pending: materials.filter(m => m.status === "PENDING").length,
    approved: materials.filter(m => m.status === "APPROVED").length,
    rejected: materials.filter(m => m.status === "REJECTED").length,
  };

  const tabs = [
    { value: "all", label: `All (${counts.all})` },
    { value: "pending", label: `Pending (${counts.pending})` },
    { value: "approved", label: `Approved (${counts.approved})` },
    { value: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Content Moderation</Text>
        <Text className="text-sm text-gray-500 mb-3">Review and approve uploaded content</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setStatusFilter(tab.value)}
                className={`rounded-full px-3 py-1.5 ${statusFilter === tab.value ? "bg-red-600" : "bg-gray-100"}`}
              >
                <Text className={`text-xs font-medium ${statusFilter === tab.value ? "text-white" : "text-gray-600"}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <FlashList
          data={filtered}
          estimatedItemSize={90}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ListEmptyComponent={
            <View className="py-10 items-center">
              <Text className="text-gray-400">No content in this category.</Text>
            </View>
          }
          renderItem={({ item: m }) => {
            const sc = STATUS_COLORS[m.status.toLowerCase()] ?? { bg: "bg-gray-100", text: "text-gray-600" };
            return (
              <View className="border border-gray-100 rounded-xl p-4 mb-2">
                <View className="flex-row items-start justify-between mb-1">
                  <View className="flex-row items-center flex-1 mr-2 gap-2">
                    <Text>{TYPE_EMOJIS[m.type] ?? "📄"}</Text>
                    <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={2}>{m.title}</Text>
                  </View>
                  <View className={`rounded-full px-2 py-0.5 ${sc.bg}`}>
                    <Text className={`text-xs font-medium capitalize ${sc.text}`}>{m.status.toLowerCase()}</Text>
                  </View>
                </View>

                <Text className="text-xs text-gray-500 mb-2">
                  {m.uploaderName ?? "Unknown"} · {m.subject ?? "No subject"}
                </Text>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setPreview(m)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-xs text-gray-700">Preview</Text>
                  </TouchableOpacity>
                  {m.status === "PENDING" && (
                    <>
                      <TouchableOpacity
                        onPress={() => approveMutation.mutate(m.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 rounded-lg px-3 py-1.5"
                      >
                        <Text className="text-xs text-white font-medium">Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => rejectMutation.mutate(m.id)}
                        disabled={rejectMutation.isPending}
                        className="bg-red-100 rounded-lg px-3 py-1.5"
                      >
                        <Text className="text-xs text-red-700 font-medium">Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Preview Modal */}
      <Modal visible={!!preview} transparent animationType="slide" onRequestClose={() => setPreview(null)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>{preview?.title}</Text>
            <Text className="text-sm text-gray-500 mb-4">
              {preview?.uploaderName} · {preview?.subject} · {preview?.type}
            </Text>

            <View className="bg-gray-50 rounded-xl p-4 mb-4 items-center">
              <Text className="text-4xl mb-2">{TYPE_EMOJIS[preview?.type ?? ""] ?? "📄"}</Text>
              <Text className="text-sm text-gray-500">
                {preview?.fileUrl || preview?.videoUrl ? "File available" : "No preview URL"}
              </Text>
              {(preview?.fileUrl || preview?.videoUrl) && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(preview.fileUrl ?? preview.videoUrl!)}
                  className="mt-3 bg-blue-600 rounded-xl px-4 py-2"
                >
                  <Text className="text-white text-sm font-medium">Open File</Text>
                </TouchableOpacity>
              )}
            </View>

            {preview?.status === "PENDING" && (
              <View className="flex-row gap-3 mb-3">
                <TouchableOpacity
                  onPress={() => { rejectMutation.mutate(preview.id); setPreview(null); }}
                  className="flex-1 bg-red-100 rounded-xl py-3"
                >
                  <Text className="text-center text-sm font-semibold text-red-700">Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { approveMutation.mutate(preview.id); setPreview(null); }}
                  className="flex-1 bg-green-600 rounded-xl py-3"
                >
                  <Text className="text-center text-sm font-semibold text-white">Approve</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={() => setPreview(null)} className="border border-gray-200 rounded-xl py-3">
              <Text className="text-center text-sm text-gray-700">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
