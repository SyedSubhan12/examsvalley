// EXTRACTED FROM: client/src/pages/teacher/TeacherDashboardPage.tsx
// CONVERTED TO:   app/(teacher)/dashboard.tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import type { Material, Quiz, Assignment } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: materials = [], isLoading: loadingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/materials`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: quizzes = [], isLoading: loadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quizzes`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/assignments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isLoading = loadingMaterials || loadingQuizzes || loadingAssignments;

  const quickLinks = [
    { title: "Materials", desc: "Manage study materials", emoji: "📚", href: "/(teacher)/materials" },
    { title: "Quizzes", desc: "Create and manage quizzes", emoji: "❓", href: "/(teacher)/quizzes" },
    { title: "Assignments", desc: "Manage student assignments", emoji: "📋", href: "/(teacher)/assignments" },
    { title: "MCQ Manager", desc: "Manage MCQ question bank", emoji: "🧠", href: "/(teacher)/mcq-manager" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mb-5">
          <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
          <Text className="text-gray-500 text-sm">Welcome back, {user?.name || "Teacher"}!</Text>
        </View>

        {/* Stat cards */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          {[
            { emoji: "📚", title: "My Materials", value: loadingMaterials ? "…" : materials.length },
            { emoji: "❓", title: "Quizzes", value: loadingQuizzes ? "…" : quizzes.length },
            { emoji: "📋", title: "Assignments", value: loadingAssignments ? "…" : assignments.length },
          ].map((s, i) => (
            <View key={i} className="border border-gray-200 rounded-xl p-4 items-center" style={{ width: "31%" }}>
              <Text className="text-2xl mb-1">{s.emoji}</Text>
              <Text className="text-2xl font-bold text-gray-900">{s.value}</Text>
              <Text className="text-xs text-gray-500 text-center mt-0.5">{s.title}</Text>
            </View>
          ))}
        </View>

        {/* Quick links */}
        <View className="border border-gray-200 rounded-xl p-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">Quick Actions</Text>
          {quickLinks.map(link => (
            <TouchableOpacity
              key={link.href}
              onPress={() => router.push(link.href as any)}
              className="flex-row items-center gap-3 p-3 rounded-lg mb-2 bg-gray-50"
            >
              <View className="w-9 h-9 bg-white rounded-lg items-center justify-center border border-gray-200">
                <Text className="text-base">{link.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">{link.title}</Text>
                <Text className="text-xs text-gray-500">{link.desc}</Text>
              </View>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
