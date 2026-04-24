// EXTRACTED FROM: client/src/pages/student/StudentDashboardPage.tsx
// CONVERTED TO:   app/(student)/dashboard.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives
// LOGIC CHANGES: fetch URLs prefixed with BASE; quiz-attempts, assignments, quizzes queries verbatim

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import type { QuizAttempt, Assignment, Quiz } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: quizAttempts = [], isLoading: isLoadingAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts", { userId: user?.id }],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quiz-attempts?userId=${user!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/assignments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: quizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quizzes`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const totalAttempts = quizAttempts.length;
  const averageScore = totalAttempts > 0
    ? Math.round(
        (quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
          quizAttempts.reduce((sum, a) => sum + (a.totalMarks || 1), 0)) * 100
      )
    : 0;
  const activeSubjects = user?.subjectIds?.length || 0;
  const pendingAssignments = assignments.filter(a => a.dueDate && new Date(a.dueDate) > new Date()).length;

  const recentActivity = quizAttempts
    .filter(a => a.completedAt)
    .map(attempt => {
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      return {
        id: attempt.id,
        title: quiz?.title || "Quiz",
        date: attempt.completedAt!,
        meta: `Score: ${attempt.score}/${attempt.totalMarks}`,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const quickLinks = [
    { title: "Study Materials", desc: "Access notes, videos, and past papers", emoji: "📚", href: "/(student)/materials" },
    { title: "MCQ Practice", desc: "Practice with adaptive MCQ sessions", emoji: "🧠", href: "/(student)/mcq/practice" },
    { title: "Assignments", desc: "View and submit your assignments", emoji: "📋", href: "/(student)/assignments" },
  ];

  const isLoading = isLoadingAttempts || isLoadingAssignments;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
          <Text className="text-gray-500 text-sm">Welcome back, {user?.name || "Student"}!</Text>
        </View>

        {/* Stat cards */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          {[
            { emoji: "✅", title: "Quizzes Attempted", value: isLoadingAttempts ? "…" : totalAttempts },
            { emoji: "📈", title: "Average Score", value: isLoadingAttempts ? "…" : `${averageScore}%` },
            { emoji: "📚", title: "Active Subjects", value: activeSubjects },
            { emoji: "⏰", title: "Assignments Due", value: isLoadingAssignments ? "…" : pendingAssignments },
          ].map((s, i) => (
            <View key={i} className="border border-gray-200 rounded-xl p-4 items-center" style={{ width: "47.5%" }}>
              <Text className="text-2xl mb-1">{s.emoji}</Text>
              <Text className="text-2xl font-bold text-gray-900">{s.value}</Text>
              <Text className="text-xs text-gray-500 text-center mt-0.5">{s.title}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View className="border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">Recent Activity</Text>
          {isLoading ? (
            <ActivityIndicator />
          ) : recentActivity.length > 0 ? (
            recentActivity.map(a => (
              <View key={a.id} className="flex-row items-start gap-3 mb-3">
                <View className="w-9 h-9 bg-gray-100 rounded-lg items-center justify-center">
                  <Text className="text-base">🎓</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">{a.title}</Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString()}</Text>
                    <View className="bg-gray-100 rounded px-1.5 py-0.5">
                      <Text className="text-xs text-gray-500">{a.meta}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-sm text-gray-400">No recent activity to show.</Text>
          )}
        </View>

        {/* Quick Links */}
        <View className="border border-gray-200 rounded-xl p-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">Quick Links</Text>
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
