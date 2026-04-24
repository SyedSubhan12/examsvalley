// EXTRACTED FROM: client/src/pages/student/mcq/McqStatsPage.tsx
// CONVERTED TO:   app/(student)/mcq/stats.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives, recharts → View progress bars
// LOGIC CHANGES: All useQuery logic VERBATIM; CSS progress bars → View with width style; Select → DropdownPicker

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, Modal, FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface TopicBreakdown {
  topicId: string; topicName?: string; mastery: number; level: string;
  accuracy: number; totalAttempted: number; avgTimeMs: number | null;
  streak: number; confidenceLevel: string;
}
interface PerformanceSnapshot {
  overallMastery: number; totalQuestionsAnswered: number;
  totalCorrect: number; overallAccuracy: number;
  topicBreakdown: TopicBreakdown[];
  strengths: string[]; weaknesses: string[];
  studyStreak: number; recommendedFocus: string[];
}

const MASTERY_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  Mastered: { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  Advanced: { bar: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
  Proficient: { bar: "bg-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" },
  Developing: { bar: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  Beginner: { bar: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
};

export default function McqStatsPage() {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/subjects`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: overallStats, isLoading: loadingOverall } = useQuery<PerformanceSnapshot>({
    queryKey: ["/api/mcq/stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/mcq/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: subjectStats } = useQuery<PerformanceSnapshot>({
    queryKey: [`/api/mcq/stats/subject/${subjectId}`],
    enabled: !!subjectId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/mcq/stats/subject/${subjectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/mcq/sessions"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/mcq/sessions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const stats = subjectId ? subjectStats : overallStats;

  if (loadingOverall) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><ActivityIndicator size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-xl font-bold text-gray-900">Performance Dashboard</Text>
            <Text className="text-sm text-gray-500">Track your mastery and find areas to improve</Text>
          </View>
          <TouchableOpacity onPress={() => router.replace("/(student)/mcq/practice")}
            className="bg-blue-600 rounded-lg px-3 py-2">
            <Text className="text-white text-sm font-medium">📖 Practice</Text>
          </TouchableOpacity>
        </View>

        {/* Subject Filter */}
        <TouchableOpacity onPress={() => setPickerOpen(true)}
          className="border border-gray-300 rounded-lg px-3 py-3 flex-row justify-between items-center mb-5">
          <Text className="text-gray-700">{subjectId ? subjects.find((s: any) => s.id === subjectId)?.subjectName : "All Subjects"}</Text>
          <Text className="text-gray-400">▾</Text>
        </TouchableOpacity>
        <Modal visible={pickerOpen} transparent animationType="fade">
          <TouchableOpacity className="flex-1 bg-black/40 justify-end" onPress={() => setPickerOpen(false)}>
            <View className="bg-white rounded-t-2xl max-h-72">
              <FlatList
                data={[{ id: "", subjectName: "All Subjects" }, ...subjects]}
                keyExtractor={(i: any) => i.id}
                renderItem={({ item }: any) => (
                  <TouchableOpacity className={`px-5 py-4 border-b border-gray-100 ${item.id === subjectId ? "bg-blue-50" : ""}`}
                    onPress={() => { setSubjectId(item.id); setPickerOpen(false); }}>
                    <Text className={item.id === subjectId ? "text-blue-600 font-medium" : "text-gray-800"}>{item.subjectName}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Key Metrics */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {[
            { emoji: "🧠", value: `${stats?.overallMastery ?? 0}%`, label: "Overall Mastery" },
            { emoji: "🎯", value: `${stats?.overallAccuracy ?? 0}%`, label: "Accuracy" },
            { emoji: "📊", value: stats?.totalQuestionsAnswered ?? 0, label: "Questions" },
            { emoji: "🔥", value: stats?.studyStreak ?? 0, label: "Day Streak" },
          ].map((m, i) => (
            <View key={i} className="border border-gray-200 rounded-xl p-3 items-center" style={{ width: "47.5%" }}>
              <Text className="text-xl mb-1">{m.emoji}</Text>
              <Text className="text-2xl font-bold text-gray-900">{m.value}</Text>
              <Text className="text-xs text-gray-500 text-center">{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Mastery overview bar */}
        {stats && stats.overallMastery > 0 && (
          <View className="border border-gray-200 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">Mastery Overview</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-500">Overall Mastery</Text>
              <Text className="text-xs font-medium text-gray-800">{stats.overallMastery}%</Text>
            </View>
            <View className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-4 bg-blue-500 rounded-full" style={{ width: `${stats.overallMastery}%` }} />
            </View>
            <View className="flex-row justify-between mt-1">
              {["Beginner", "Developing", "Proficient", "Advanced", "Mastered"].map(l => (
                <Text key={l} className="text-xs text-gray-400">{l}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Strengths & Weaknesses */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 border border-gray-200 rounded-xl p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-2">⭐ Strengths</Text>
            {stats?.strengths && stats.strengths.length > 0
              ? stats.topicBreakdown.filter(t => stats.strengths.includes(t.topicId)).map(t => (
                <View key={t.topicId} className="flex-row justify-between items-center py-1">
                  <Text className="text-xs text-gray-700 flex-1" numberOfLines={1}>{t.topicName || t.topicId}</Text>
                  <Text className="text-xs text-green-600 font-medium ml-1">{t.mastery}%</Text>
                </View>
              ))
              : <Text className="text-xs text-gray-400">Complete more sessions to identify strengths</Text>
            }
          </View>
          <View className="flex-1 border border-gray-200 rounded-xl p-4">
            <Text className="text-sm font-semibold text-gray-800 mb-2">⚠️ Improve</Text>
            {stats?.weaknesses && stats.weaknesses.length > 0
              ? stats.topicBreakdown.filter(t => stats.weaknesses.includes(t.topicId)).map(t => (
                <View key={t.topicId} className="flex-row justify-between items-center py-1">
                  <Text className="text-xs text-gray-700 flex-1" numberOfLines={1}>{t.topicName || t.topicId}</Text>
                  <Text className="text-xs text-red-500 font-medium ml-1">{t.mastery}%</Text>
                </View>
              ))
              : <Text className="text-xs text-gray-400">No weak areas identified yet — keep practicing!</Text>
            }
          </View>
        </View>

        {/* Topic Breakdown */}
        {stats?.topicBreakdown && stats.topicBreakdown.length > 0 && (
          <View className="border border-gray-200 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">Topic Breakdown</Text>
            {stats.topicBreakdown.map(topic => {
              const colors = MASTERY_COLORS[topic.level] || MASTERY_COLORS.Beginner;
              return (
                <View key={topic.topicId} className="mb-3">
                  <View className="flex-row justify-between items-center mb-1">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{topic.topicName || topic.topicId}</Text>
                      <View className={`px-2 py-0.5 rounded-full ${colors.bg}`}>
                        <Text className={`text-xs ${colors.text}`}>{topic.level}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500">{topic.accuracy}% • {topic.totalAttempted}Q</Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View className={`h-2 rounded-full ${colors.bar}`} style={{ width: `${topic.mastery}%` }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <View className="border border-gray-200 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">Recent Sessions</Text>
            {sessions.slice(0, 10).map((s: any) => (
              <View key={s.id} className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View>
                  <Text className="text-sm font-medium text-gray-800 capitalize">{s.mode} session</Text>
                  <Text className="text-xs text-gray-500">
                    {s.answeredCount}/{s.totalQuestions} questions • {new Date(s.startedAt).toLocaleDateString()}
                  </Text>
                </View>
                {s.score != null && (
                  <View className={`px-2 py-1 rounded-full ${s.score >= 70 ? "bg-green-100" : s.score >= 40 ? "bg-amber-100" : "bg-red-100"}`}>
                    <Text className={`text-xs font-bold ${s.score >= 70 ? "text-green-700" : s.score >= 40 ? "text-amber-700" : "text-red-700"}`}>
                      {s.score}%
                    </Text>
                  </View>
                )}
                {!s.completedAt && (
                  <View className="border border-gray-300 px-2 py-1 rounded-full">
                    <Text className="text-xs text-gray-500">In Progress</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {(!stats || stats.totalQuestionsAnswered === 0) && (
          <View className="border border-gray-200 rounded-xl p-10 items-center">
            <Text className="text-4xl mb-3">🧠</Text>
            <Text className="text-lg font-semibold text-gray-800 mb-1">No data yet</Text>
            <Text className="text-sm text-gray-500 text-center mb-4">
              Complete some practice sessions to see your performance analytics
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(student)/mcq/practice")}
              className="bg-blue-600 rounded-xl px-6 py-3">
              <Text className="text-white font-semibold">⚡ Start Practicing</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
