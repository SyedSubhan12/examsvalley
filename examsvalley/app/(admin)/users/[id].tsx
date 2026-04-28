// EXTRACTED FROM: client/src/pages/admin/UserDetailPage.tsx
// CONVERTED TO:   app/(admin)/users/[id].tsx
// BUCKET:         B_convert

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView, FlatList } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Alert, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  status: "ACTIVE" | "INACTIVE";
  boardIds?: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

function RolePicker({
  value, onSelect,
}: { value: string; onSelect: (v: "student" | "teacher" | "admin") => void }) {
  const [open, setOpen] = useState(false);
  const options: { label: string; value: "student" | "teacher" | "admin" }[] = [
    { label: "Student", value: "student" },
    { label: "Teacher", value: "teacher" },
    { label: "Admin", value: "admin" },
  ];
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Text className="text-sm text-gray-800 capitalize">{value}</Text>
        <Text className="text-gray-400">▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity className="flex-1 bg-black/30" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-xl mx-8 mt-60 overflow-hidden">
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onSelect(opt.value); setOpen(false); }}
                className={`px-4 py-3 border-b border-gray-100 ${opt.value === value ? "bg-red-50" : ""}`}
              >
                <Text className={`text-sm ${opt.value === value ? "font-semibold text-red-700" : "text-gray-800"}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function UserDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");

  const { data: user, isLoading } = useQuery<AdminUserSummary>({
    queryKey: ["admin-user", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/users/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (body: Partial<AdminUserSummary>) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: updated => {
      queryClient.setQueryData(["admin-user", id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => Alert.alert("Error", "Failed to update user."),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">User Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-red-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Users</Text>
        </TouchableOpacity>

        <View className="items-center mb-5">
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-red-600">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{user.name}</Text>
          <Text className="text-sm text-gray-500">{user.email}</Text>
        </View>

        <View className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-4">
          {[
            { label: "Role", value: user.role },
            { label: "Status", value: user.status },
            user.createdAt && { label: "Joined", value: new Date(user.createdAt).toLocaleDateString() },
            user.lastLoginAt && { label: "Last Login", value: new Date(user.lastLoginAt).toLocaleDateString() },
          ].filter(Boolean).map((row: any, i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-sm text-gray-500">{row.label}</Text>
              <Text className="text-sm font-medium text-gray-800 capitalize">{row.value}</Text>
            </View>
          ))}
        </View>

        <Text className="text-sm font-semibold text-gray-800 mb-2">Change Role</Text>
        <RolePicker value={role} onSelect={setRole} />
        <TouchableOpacity
          onPress={() => updateMutation.mutate({ role })}
          disabled={updateMutation.isPending || role === user.role}
          className={`mt-3 rounded-xl py-3 ${role !== user.role ? "bg-red-600" : "bg-gray-100"}`}
        >
          <Text className={`text-center text-sm font-semibold ${role !== user.role ? "text-white" : "text-gray-400"}`}>
            {updateMutation.isPending ? "Saving..." : "Save Role"}
          </Text>
        </TouchableOpacity>

        <View className="mt-4 pt-4 border-t border-gray-100">
          <TouchableOpacity
            onPress={() => updateMutation.mutate({
              status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            })}
            disabled={updateMutation.isPending}
            className={`rounded-xl py-3 ${user.status === "ACTIVE" ? "bg-gray-100" : "bg-green-600"}`}
          >
            <Text className={`text-center text-sm font-semibold ${user.status === "ACTIVE" ? "text-gray-700" : "text-white"}`}>
              {user.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
