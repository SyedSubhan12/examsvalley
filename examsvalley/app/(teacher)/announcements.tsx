// EXTRACTED FROM: client/src/pages/teacher/TeacherAnnouncementsPage.tsx
// CONVERTED TO:   app/(teacher)/announcements.tsx
// BUCKET:         B_convert

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { apiRequest } from "@/lib/queryClient";
import Toast from "react-native-toast-message";
import type { Announcement } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function TeacherAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<"school" | "board" | "subject">("school");
  const [showForm, setShowForm] = useState(false);

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/announcements`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/announcements", { title, content, scope, isActive: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      Toast.show({ type: "success", text1: "Announcement posted!" });
      setTitle(""); setContent(""); setShowForm(false);
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Failed", text2: err.message });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900">Announcements</Text>
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            className="bg-purple-600 rounded-xl px-3 py-2"
          >
            <Text className="text-white text-sm font-medium">{showForm ? "Cancel" : "+ New"}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View className="border border-purple-200 rounded-2xl p-4 mb-5 bg-purple-50">
            <Text className="text-sm font-semibold text-purple-900 mb-3">New Announcement</Text>

            <Text className="text-xs font-medium text-gray-700 mb-1">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Announcement title..."
              placeholderTextColor="#9ca3af"
              className="border border-gray-200 rounded-xl px-3 py-3 bg-white mb-3 text-gray-800"
            />

            <Text className="text-xs font-medium text-gray-700 mb-1">Content</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your announcement..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="border border-gray-200 rounded-xl px-3 py-3 bg-white mb-3 min-h-[96px] text-gray-800"
            />

            <Text className="text-xs font-medium text-gray-700 mb-2">Scope</Text>
            <View className="flex-row gap-2 mb-4">
              {(["school", "board", "subject"] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setScope(s)}
                  className={`flex-1 py-2 rounded-lg border items-center ${scope === s ? "bg-purple-600 border-purple-600" : "border-gray-300 bg-white"}`}
                >
                  <Text className={`text-xs font-medium capitalize ${scope === s ? "text-white" : "text-gray-600"}`}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending || !title || !content}
              className={`rounded-xl py-3 items-center ${!title || !content || createMutation.isPending ? "bg-gray-300" : "bg-purple-600"}`}
            >
              {createMutation.isPending
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-semibold">Post Announcement</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator />
        ) : announcements.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">🔔</Text>
            <Text className="text-gray-500">No announcements posted yet.</Text>
          </View>
        ) : (
          announcements.map(a => (
            <View key={a.id} className="border border-gray-100 rounded-xl p-4 mb-3">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="bg-gray-100 rounded-full px-2 py-0.5">
                  <Text className="text-xs text-gray-600 capitalize">{a.scope}</Text>
                </View>
                {a.createdAt && (
                  <Text className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</Text>
                )}
                {!a.isActive && (
                  <View className="bg-red-100 rounded-full px-2 py-0.5">
                    <Text className="text-xs text-red-600">Inactive</Text>
                  </View>
                )}
              </View>
              <Text className="font-semibold text-gray-800 text-sm mb-1">{a.title}</Text>
              <Text className="text-xs text-gray-500" numberOfLines={2}>{a.content}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
