// EXTRACTED FROM: client/src/pages/admin/TeacherApprovalPage.tsx
// CONVERTED TO:   app/(admin)/teachers/index.tsx
// BUCKET:         B_convert

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator,
  Modal, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function TeacherApprovalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [approveTarget, setApproveTarget] = useState<PendingTeacher | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingTeacher | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery<{ data: PendingTeacher[] }>({
    queryKey: ["pending-teachers"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/teachers/pending`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const teachers = data?.data ?? [];
  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/api/admin/teachers/${id}/approve`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setApproveTarget(null);
    },
    onError: () => Alert.alert("Error", "Failed to approve teacher."),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await fetch(`${BASE}/api/admin/teachers/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: () => Alert.alert("Error", "Failed to reject teacher."),
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Teacher Approvals</Text>
        <Text className="text-sm text-gray-500 mb-3">
          {teachers.length} pending application{teachers.length !== 1 ? "s" : ""}
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          placeholderTextColor="#9ca3af"
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800"
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <FlashList
          data={filtered}
          estimatedItemSize={100}
          keyExtractor={t => t.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-3xl mb-2">✅</Text>
              <Text className="text-gray-500">
                {search ? "No matching teachers." : "No pending applications."}
              </Text>
            </View>
          }
          renderItem={({ item: teacher }) => (
            <View className="border border-gray-100 rounded-xl p-4 mb-2">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-semibold text-gray-900">{teacher.name}</Text>
                  <Text className="text-xs text-gray-500">{teacher.email}</Text>
                </View>
                <View className={`rounded-full px-2 py-0.5 ${teacher.isEmailVerified ? "bg-green-100" : "bg-gray-100"}`}>
                  <Text className={`text-xs font-medium ${teacher.isEmailVerified ? "text-green-700" : "text-gray-500"}`}>
                    {teacher.isEmailVerified ? "Verified" : "Unverified"}
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-gray-400 mb-3">
                Applied {new Date(teacher.createdAt).toLocaleDateString()}
              </Text>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/teachers/${teacher.id}`)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <Text className="text-xs text-gray-700">View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setApproveTarget(teacher)}
                  className="bg-green-600 rounded-lg px-3 py-1.5"
                >
                  <Text className="text-xs text-white font-medium">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRejectTarget(teacher)}
                  className="bg-red-100 rounded-lg px-3 py-1.5"
                >
                  <Text className="text-xs text-red-700 font-medium">Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Approve Confirm Modal */}
      <Modal visible={!!approveTarget} transparent animationType="fade" onRequestClose={() => setApproveTarget(null)}>
        <View className="flex-1 justify-center bg-black/40 px-6">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">Approve Teacher</Text>
            <Text className="text-sm text-gray-600 mb-6">
              Approve {approveTarget?.name}? They will gain access to the teacher dashboard.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setApproveTarget(null)}
                className="flex-1 border border-gray-200 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => approveTarget && approveMutation.mutate(approveTarget.id)}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-white font-semibold">
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => { setRejectTarget(null); setRejectReason(""); }}>
        <View className="flex-1 justify-center bg-black/40 px-6">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-2">Reject Application</Text>
            <Text className="text-sm text-gray-600 mb-4">
              Reject {rejectTarget?.name}'s application? Their account will be deactivated.
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason (optional)"
              placeholderTextColor="#9ca3af"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-4"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setRejectTarget(null); setRejectReason(""); }}
                className="flex-1 border border-gray-200 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-red-600 rounded-xl py-3"
              >
                <Text className="text-center text-sm text-white font-semibold">
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
