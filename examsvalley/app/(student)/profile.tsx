// EXTRACTED FROM: client/src/pages/student/ProfilePage.tsx
// CONVERTED TO:   app/(student)/profile.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: shadcn → RN primitives, Avatar → View initials circle
// LOGIC CHANGES: Removed mockData; uses real auth user; save calls PATCH /api/user/profile

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || "");
  const [isEditing, setIsEditing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/user/profile", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      Toast.show({ type: "success", text1: "Profile Updated" });
      setIsEditing(false);
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Failed to save profile" });
    },
  });

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Profile</Text>
        <Text className="text-sm text-gray-500 mb-6">Manage your account settings</Text>

        {/* Avatar + name */}
        <View className="border border-gray-200 rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-gray-800 mb-4">Personal Information</Text>

          <View className="flex-row items-center gap-4 mb-5">
            <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {user ? getInitials(user.name) : "U"}
              </Text>
            </View>
            <View>
              <Text className="text-base font-semibold text-gray-900">{user?.name}</Text>
              <Text className="text-sm text-gray-500 capitalize">{user?.role}</Text>
            </View>
          </View>

          {/* Name field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">👤 Name</Text>
            <TextInput
              value={name}
              onChangeText={(v) => { setName(v); setIsEditing(true); }}
              className="border border-gray-200 rounded-xl px-3 py-3 text-gray-800"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Email (read-only) */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-1">✉️ Email</Text>
            <View className="border border-gray-100 rounded-xl px-3 py-3 bg-gray-50">
              <Text className="text-gray-500">{user?.email || ""}</Text>
            </View>
            <Text className="text-xs text-gray-400 mt-1">Email cannot be changed</Text>
          </View>

          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={!isEditing || saveMutation.isPending}
            className={`rounded-xl py-3 items-center flex-row justify-center gap-2 ${!isEditing || saveMutation.isPending ? "bg-gray-200" : "bg-blue-600"}`}
          >
            {saveMutation.isPending && <ActivityIndicator color="white" size="small" />}
            <Text className={`font-semibold ${!isEditing || saveMutation.isPending ? "text-gray-400" : "text-white"}`}>
              💾 Save Changes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account info */}
        <View className="border border-gray-200 rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">Account</Text>
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-sm text-gray-500">Member Since</Text>
            <Text className="text-sm font-medium text-gray-800">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-gray-500">Status</Text>
            <View className={`rounded-full px-2.5 py-0.5 ${user?.isActive ? "bg-green-100" : "bg-gray-100"}`}>
              <Text className={`text-xs font-medium ${user?.isActive ? "text-green-700" : "text-gray-500"}`}>
                {user?.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="border border-red-300 rounded-xl py-3 items-center"
        >
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
