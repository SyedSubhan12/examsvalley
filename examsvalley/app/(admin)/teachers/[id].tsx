// EXTRACTED FROM: client/src/pages/admin/TeacherDetailPage.tsx
// CONVERTED TO:   app/(admin)/teachers/[id].tsx
// BUCKET:         B_convert

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface TeacherDetails {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  username: string | null;
  bio: string | null;
  qualifications: string[] | null;
  experienceYears: number | null;
  isEmailVerified: boolean;
  isApproved: boolean;
  approvedAt: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  boards: { id: string; display_name: string; board_key: string }[];
}

export default function TeacherDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "", username: "", bio: "", qualifications: "", experienceYears: "",
  });

  const { data: teacher, isLoading } = useQuery<TeacherDetails>({
    queryKey: ["admin-teacher", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/teachers/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name ?? "",
        username: teacher.username ?? "",
        bio: teacher.bio ?? "",
        qualifications: teacher.qualifications?.join(", ") ?? "",
        experienceYears: teacher.experienceYears?.toString() ?? "",
      });
    }
  }, [teacher]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<TeacherDetails>) => {
      const res = await fetch(`${BASE}/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teacher", id] });
      Alert.alert("Saved", "Teacher profile updated.");
    },
    onError: () => Alert.alert("Error", "Failed to update teacher."),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/admin/teachers/${id}/approve`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teacher", id] });
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
    },
    onError: () => Alert.alert("Error", "Failed to approve teacher."),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!teacher) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Teacher Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-red-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initials = teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Teacher Approvals</Text>
        </TouchableOpacity>

        <View className="items-center mb-5">
          <View className="w-16 h-16 rounded-full bg-purple-100 items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-purple-600">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{teacher.name}</Text>
          <Text className="text-sm text-gray-500">{teacher.email}</Text>
          <View className="flex-row gap-2 mt-2">
            <View className={`rounded-full px-2 py-0.5 ${teacher.isApproved ? "bg-green-100" : "bg-amber-100"}`}>
              <Text className={`text-xs font-medium ${teacher.isApproved ? "text-green-700" : "text-amber-700"}`}>
                {teacher.isApproved ? "Approved" : "Pending Approval"}
              </Text>
            </View>
            <View className={`rounded-full px-2 py-0.5 ${teacher.isEmailVerified ? "bg-blue-100" : "bg-gray-100"}`}>
              <Text className={`text-xs font-medium ${teacher.isEmailVerified ? "text-blue-700" : "text-gray-500"}`}>
                Email {teacher.isEmailVerified ? "Verified" : "Unverified"}
              </Text>
            </View>
          </View>
        </View>

        <View className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-4">
          {[
            { label: "Joined", value: new Date(teacher.createdAt).toLocaleDateString() },
            teacher.approvedAt && { label: "Approved", value: new Date(teacher.approvedAt).toLocaleDateString() },
            teacher.lastLoginAt && { label: "Last Login", value: new Date(teacher.lastLoginAt).toLocaleDateString() },
            teacher.experienceYears != null && { label: "Experience", value: `${teacher.experienceYears} years` },
            { label: "Boards", value: teacher.boards?.map(b => b.display_name).join(", ") || "None" },
          ].filter(Boolean).map((row: any, i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-sm text-gray-500">{row.label}</Text>
              <Text className="text-sm font-medium text-gray-800" numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </View>

        {teacher.qualifications?.length ? (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-2">Qualifications</Text>
            <View className="flex-row flex-wrap gap-2">
              {teacher.qualifications.map((q, i) => (
                <View key={i} className="bg-purple-50 rounded-full px-3 py-1">
                  <Text className="text-xs text-purple-700">{q}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {teacher.bio ? (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-1">Bio</Text>
            <Text className="text-sm text-gray-600">{teacher.bio}</Text>
          </View>
        ) : null}

        {!teacher.isApproved && (
          <View className="pt-4 border-t border-gray-100">
            <TouchableOpacity
              onPress={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-600 rounded-xl py-3 mb-2"
            >
              <Text className="text-center text-sm text-white font-semibold">
                {approveMutation.isPending ? "Approving..." : "Approve Teacher"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
