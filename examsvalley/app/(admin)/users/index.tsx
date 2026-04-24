// EXTRACTED FROM: client/src/pages/admin/UsersPage.tsx
// CONVERTED TO:   app/(admin)/users/index.tsx
// BUCKET:         B_convert

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator,
  Modal, FlatList, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  status: "ACTIVE" | "INACTIVE";
  boardIds?: string[];
  createdAt?: string;
}

interface AdminBoardSummary {
  id: string;
  displayName: string;
  boardKey: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  teacher: "bg-purple-100 text-purple-700",
  student: "bg-blue-100 text-blue-700",
};

function SimpleDropdown({
  value, options, onSelect, placeholder,
}: {
  value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="border border-gray-200 rounded-lg px-3 py-2 flex-row items-center gap-1"
      >
        <Text className="text-sm text-gray-700">{selected?.label ?? placeholder}</Text>
        <Text className="text-gray-400 ml-1">▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity className="flex-1 bg-black/30" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-xl mx-8 mt-40 overflow-hidden">
            <FlatList
              data={options}
              keyExtractor={o => o.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                  className={`px-4 py-3 border-b border-gray-100 ${item.value === value ? "bg-red-50" : ""}`}
                >
                  <Text className={`text-sm ${item.value === value ? "font-semibold text-red-700" : "text-gray-800"}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "", email: "", role: "student" as "student" | "teacher" | "admin", status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const { data: usersResponse, isLoading } = useQuery<{ data: AdminUserSummary[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/users?page=1&pageSize=100`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: boards = [] } = useQuery<AdminBoardSummary[]>({
    queryKey: ["admin-boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const users = usersResponse?.data ?? [];

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);

  const toggleStatusMutation = useMutation({
    mutationFn: async (user: AdminUserSummary) => {
      const res = await fetch(`${BASE}/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: () => Alert.alert("Error", "Failed to update user status."),
  });

  const createUserMutation = useMutation({
    mutationFn: async (body: typeof newUser) => {
      const res = await fetch(`${BASE}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowAddModal(false);
      setNewUser({ name: "", email: "", role: "student", status: "ACTIVE" });
    },
    onError: () => Alert.alert("Error", "Failed to create user."),
  });

  const roleOptions = [
    { label: "All Roles", value: "all" },
    { label: "Students", value: "student" },
    { label: "Teachers", value: "teacher" },
    { label: "Admins", value: "admin" },
  ];

  const newRoleOptions = [
    { label: "Student", value: "student" },
    { label: "Teacher", value: "teacher" },
    { label: "Admin", value: "admin" },
  ];

  const getBoardName = (user: AdminUserSummary) => {
    if (!user.boardIds?.length) return "All Boards";
    const board = boards.find(b => b.id === user.boardIds![0]);
    if (user.boardIds.length > 1) return `${board?.displayName ?? "?"} +${user.boardIds.length - 1}`;
    return board?.displayName ?? "Unknown";
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Users</Text>
            <Text className="text-sm text-gray-500">{users.length} total</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-red-600 rounded-xl px-4 py-2"
          >
            <Text className="text-white font-semibold text-sm">+ Add User</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          placeholderTextColor="#9ca3af"
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 mb-3"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {roleOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setRoleFilter(opt.value)}
                className={`rounded-full px-3 py-1.5 ${roleFilter === opt.value ? "bg-red-600" : "bg-gray-100"}`}
              >
                <Text className={`text-xs font-medium ${roleFilter === opt.value ? "text-white" : "text-gray-600"}`}>
                  {opt.label}
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
          estimatedItemSize={80}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={
            <View className="py-10 items-center">
              <Text className="text-gray-400">No users found.</Text>
            </View>
          }
          renderItem={({ item: user }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(admin)/users/${user.id}`)}
              className="border border-gray-100 rounded-xl p-4 mb-2"
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{user.name}</Text>
                <View className={`rounded-full px-2 py-0.5 ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"}`}>
                  <Text className="text-xs font-medium capitalize">{user.role}</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500 mb-2">{user.email}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">{getBoardName(user)}</Text>
                <View className="flex-row gap-2 items-center">
                  <View className={`rounded-full px-2 py-0.5 ${user.status === "ACTIVE" ? "bg-green-100" : "bg-gray-100"}`}>
                    <Text className={`text-xs font-medium ${user.status === "ACTIVE" ? "text-green-700" : "text-gray-500"}`}>
                      {user.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleStatusMutation.mutate(user)}
                    disabled={toggleStatusMutation.isPending}
                    className="bg-gray-100 rounded px-2 py-1"
                  >
                    <Text className="text-xs text-gray-600">
                      {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add User Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Add User</Text>

            <Text className="text-sm text-gray-600 mb-1">Name</Text>
            <TextInput
              value={newUser.name}
              onChangeText={v => setNewUser(p => ({ ...p, name: v }))}
              placeholder="Full name"
              placeholderTextColor="#9ca3af"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-3"
            />

            <Text className="text-sm text-gray-600 mb-1">Email</Text>
            <TextInput
              value={newUser.email}
              onChangeText={v => setNewUser(p => ({ ...p, email: v }))}
              placeholder="user@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-3"
            />

            <Text className="text-sm text-gray-600 mb-2">Role</Text>
            <View className="flex-row gap-2 mb-4">
              {newRoleOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setNewUser(p => ({ ...p, role: opt.value as any }))}
                  className={`flex-1 py-2 rounded-lg border ${newUser.role === opt.value ? "bg-red-600 border-red-600" : "border-gray-200"}`}
                >
                  <Text className={`text-xs text-center font-medium ${newUser.role === opt.value ? "text-white" : "text-gray-700"}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => createUserMutation.mutate(newUser)}
                disabled={createUserMutation.isPending || !newUser.name || !newUser.email}
                className="flex-1 bg-red-600 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-white font-semibold">
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
