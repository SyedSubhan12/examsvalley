// EXTRACTED FROM: client/src/pages/admin/BoardsPage.tsx
// CONVERTED TO:   app/(admin)/boards/index.tsx
// BUCKET:         B_convert

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator,
  Modal, Switch, Alert,
} from "react-native";
import { FlashList } from "@shopify/flash-list";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminBoard {
  id: string;
  displayName: string;
  boardKey: string;
  description?: string;
  isActive: boolean;
  qualificationCount?: number;
}

export default function BoardsPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingBoard, setEditingBoard] = useState<AdminBoard | null>(null);
  const [form, setForm] = useState({ displayName: "", boardKey: "", description: "", isEnabled: true });

  const { data: boards = [], isLoading } = useQuery<AdminBoard[]>({
    queryKey: ["admin-boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const openCreate = () => {
    setEditingBoard(null);
    setForm({ displayName: "", boardKey: "", description: "", isEnabled: true });
    setShowDialog(true);
  };

  const openEdit = (board: AdminBoard) => {
    setEditingBoard(board);
    setForm({
      displayName: board.displayName,
      boardKey: board.boardKey,
      description: board.description ?? "",
      isEnabled: board.isActive,
    });
    setShowDialog(true);
  };

  const toggleMutation = useMutation({
    mutationFn: async (board: AdminBoard) => {
      const res = await fetch(`${BASE}/api/admin/boards/${board.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !board.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-boards"] }),
    onError: () => Alert.alert("Error", "Failed to update board."),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.displayName.trim() || !form.boardKey.trim()) throw new Error("Required fields missing");
      const url = editingBoard
        ? `${BASE}/api/admin/boards/${editingBoard.id}`
        : `${BASE}/api/admin/boards`;
      const res = await fetch(url, {
        method: editingBoard ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          boardKey: form.boardKey.trim().toLowerCase(),
          description: form.description.trim() || undefined,
          isActive: form.isEnabled,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      setShowDialog(false);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Failed to save board."),
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Boards</Text>
            <Text className="text-sm text-gray-500">{boards.length} boards configured</Text>
          </View>
          <TouchableOpacity onPress={openCreate} className="bg-red-600 rounded-xl px-4 py-2">
            <Text className="text-white font-semibold text-sm">+ Add Board</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <FlashList
          data={boards}
          estimatedItemSize={90}
          keyExtractor={b => b.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={
            <View className="py-10 items-center">
              <Text className="text-gray-400">No boards configured.</Text>
            </View>
          }
          renderItem={({ item: board }) => (
            <View className="border border-gray-100 rounded-xl p-4 mb-2">
              <View className="flex-row items-start justify-between mb-1">
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-semibold text-gray-900">{board.displayName}</Text>
                  <Text className="text-xs text-gray-400 font-mono">{board.boardKey}</Text>
                </View>
                <View className={`rounded-full px-2 py-0.5 ${board.isActive ? "bg-green-100" : "bg-gray-100"}`}>
                  <Text className={`text-xs font-medium ${board.isActive ? "text-green-700" : "text-gray-500"}`}>
                    {board.isActive ? "Active" : "Disabled"}
                  </Text>
                </View>
              </View>
              {board.description ? (
                <Text className="text-xs text-gray-500 mb-2" numberOfLines={2}>{board.description}</Text>
              ) : null}
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity
                  onPress={() => openEdit(board)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <Text className="text-xs text-gray-700">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleMutation.mutate(board)}
                  disabled={toggleMutation.isPending}
                  className={`rounded-lg px-3 py-1.5 ${board.isActive ? "bg-gray-100" : "bg-green-100"}`}
                >
                  <Text className={`text-xs font-medium ${board.isActive ? "text-gray-700" : "text-green-700"}`}>
                    {board.isActive ? "Disable" : "Enable"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showDialog} transparent animationType="slide" onRequestClose={() => setShowDialog(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editingBoard ? "Edit Board" : "Add Board"}
            </Text>

            <Text className="text-sm text-gray-600 mb-1">Board Name *</Text>
            <TextInput
              value={form.displayName}
              onChangeText={v => setForm(p => ({ ...p, displayName: v }))}
              placeholder="e.g. Cambridge Assessment International"
              placeholderTextColor="#9ca3af"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-3"
            />

            <Text className="text-sm text-gray-600 mb-1">Board Code *</Text>
            <TextInput
              value={form.boardKey}
              onChangeText={v => setForm(p => ({ ...p, boardKey: v.toLowerCase() }))}
              placeholder="e.g. caie"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-3"
            />

            <Text className="text-sm text-gray-600 mb-1">Description</Text>
            <TextInput
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              placeholder="Optional description..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={2}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-3"
            />

            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-sm text-gray-600">Enabled</Text>
              <Switch
                value={form.isEnabled}
                onValueChange={v => setForm(p => ({ ...p, isEnabled: v }))}
                trackColor={{ true: "#dc2626" }}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDialog(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.displayName || !form.boardKey}
                className="flex-1 bg-red-600 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-white font-semibold">
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
