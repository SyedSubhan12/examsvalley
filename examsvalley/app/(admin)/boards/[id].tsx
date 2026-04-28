// EXTRACTED FROM: client/src/pages/admin/BoardEditorPage.tsx
// CONVERTED TO:   app/(admin)/boards/[id].tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter useRoute/useLocation → expo-router useLocalSearchParams/useRouter, shadcn Input/Textarea/Switch/Card/Button/Skeleton → RN TextInput/View/Switch/TouchableOpacity, useToast → react-native-toast-message, PageHeader → inline header
// LOGIC CHANGES: id='new' → create mode (POST /api/admin/boards), else edit mode (PATCH /api/admin/boards/:id). Logo upload section replaced with a note (no file picker for logos on this form). API calls use apiRequest from lib/queryClient.

import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "@/components/tw"
import { Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { apiRequest } from "@/lib/queryClient";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminBoard {
  id: string;
  displayName: string;
  boardKey: string;
  description: string | null;
  isEnabled: boolean;
}

export default function BoardEditorPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== "new";

  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<AdminBoard[]>({
    queryKey: ["admin-boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isEditing,
  });

  const existingBoard = isEditing ? boards.find((b) => b.id === id) ?? null : null;

  const [form, setForm] = useState({
    displayName: "",
    boardKey: "",
    description: "",
    isEnabled: true,
  });
  const [errors, setErrors] = useState<{ displayName?: string; boardKey?: string }>({});

  useEffect(() => {
    if (isEditing && existingBoard) {
      setForm({
        displayName: existingBoard.displayName,
        boardKey: existingBoard.boardKey,
        description: existingBoard.description || "",
        isEnabled: existingBoard.isEnabled,
      });
    }
  }, [isEditing, existingBoard]);

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const body = {
        name: values.displayName,
        code: values.boardKey,
        description: values.description || null,
        isActive: values.isEnabled,
      };
      const res = await fetch(
        `${BASE}/api/admin/boards${isEditing ? `/${id}` : ""}`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save board.");
      }
      return res.json();
    },
    onSuccess: (saved: AdminBoard) => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      Toast.show({
        type: "success",
        text1: isEditing ? "Board Updated" : "Board Created",
        text2: `${saved.displayName} has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      router.back();
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to save board.",
      });
    },
  });

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.displayName.trim()) errs.displayName = "Board name is required";
    if (!form.boardKey.trim()) errs.boardKey = "Board code is required";
    else if (form.boardKey.length < 2) errs.boardKey = "Code must be at least 2 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) saveMutation.mutate(form);
  };

  const isLoading = isEditing && isLoadingBoards;
  const isSaving = saveMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-gray-500">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Board" : "Create Board"}
            </Text>
            <Text className="text-sm text-gray-500">
              {isEditing ? "Update board information and settings" : "Add a new educational board"}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <View className="gap-5">
            {/* Board Name */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Board Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={form.displayName}
                onChangeText={(v) => {
                  setForm((p) => ({ ...p, displayName: v }));
                  if (errors.displayName) setErrors((p) => ({ ...p, displayName: undefined }));
                }}
                placeholder="e.g., Central Board of Secondary Education"
                className={`border rounded-xl px-4 py-3 text-sm text-gray-800 ${
                  errors.displayName ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.displayName && (
                <Text className="text-xs text-red-500 mt-1">{errors.displayName}</Text>
              )}
            </View>

            {/* Board Code */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Board Code <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={form.boardKey}
                onChangeText={(v) => {
                  setForm((p) => ({ ...p, boardKey: v.toUpperCase() }));
                  if (errors.boardKey) setErrors((p) => ({ ...p, boardKey: undefined }));
                }}
                placeholder="e.g., CBSE"
                autoCapitalize="characters"
                className={`border rounded-xl px-4 py-3 text-sm text-gray-800 ${
                  errors.boardKey ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.boardKey ? (
                <Text className="text-xs text-red-500 mt-1">{errors.boardKey}</Text>
              ) : (
                <Text className="text-xs text-gray-400 mt-1">
                  A short unique identifier for the board
                </Text>
              )}
            </View>

            {/* Description */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                placeholder="Brief description of the board…"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800"
                style={{ minHeight: 80 }}
              />
            </View>

            {/* Active Status */}
            <View className="flex-row items-center justify-between border border-gray-100 rounded-xl p-4">
              <View>
                <Text className="text-sm font-medium text-gray-800">Active Status</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  Inactive boards won't be visible to users
                </Text>
              </View>
              <Switch
                value={form.isEnabled}
                onValueChange={(v) => setForm((p) => ({ ...p, isEnabled: v }))}
                trackColor={{ true: "#2563eb" }}
              />
            </View>

            {/* Actions */}
            <View className="flex-row gap-3 pt-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSaving}
                className="flex-1 bg-blue-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
              >
                {isSaving && <ActivityIndicator size="small" color="#fff" />}
                <Text className="text-white font-semibold">
                  {isEditing ? "Save Changes" : "Create Board"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={isSaving}
                className="flex-1 border border-gray-200 rounded-xl py-3.5 items-center"
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
