// EXTRACTED FROM: client/src/pages/student/QuizHistoryPage.tsx
// CONVERTED TO:   app/(student)/practice/history.tsx
// BUCKET:         B_convert — uses real API instead of mockData

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useAuth } from "@/context/AuthContext";
import type { Quiz } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number | null;
  totalMarks: number | null;
  completedAt: string | null;
  duration?: number | null;
}

export default function QuizHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quiz-attempts`, { credentials: "include" });
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

  const userAttempts = attempts
    .filter(a => !user || a.userId === user.id)
    .sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

  const getQuizTitle = (quizId: string) => quizzes.find(q => q.id === quizId)?.title ?? "Unknown Quiz";

  const getScoreBg = (score: number | null, total: number | null) => {
    if (!score || !total) return "bg-gray-100 text-gray-600";
    const pct = (score / total) * 100;
    if (pct >= 80) return "bg-green-100 text-green-700";
    if (pct >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const formatDuration = (mins: number | null | undefined) => {
    if (!mins) return "-";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-500 text-sm">← Practice</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Quiz History</Text>
        <Text className="text-sm text-gray-500 mb-3">Your past quiz attempts</Text>
      </View>

      {attemptsLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : userAttempts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-3">📋</Text>
          <Text className="text-gray-500 text-center mb-5">You haven't attempted any quizzes yet.</Text>
          <TouchableOpacity
            onPress={() => router.push("/(student)/practice/")}
            className="bg-blue-600 rounded-xl px-5 py-3"
          >
            <Text className="text-white font-semibold">Start Practicing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={userAttempts}
          estimatedItemSize={85}
          keyExtractor={a => a.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          renderItem={({ item: attempt }) => {
            const scoreBg = getScoreBg(attempt.score, attempt.totalMarks);
            return (
              <View className="border border-gray-100 rounded-xl p-4 mb-2">
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2" numberOfLines={2}>
                    {getQuizTitle(attempt.quizId)}
                  </Text>
                  {attempt.score != null && attempt.totalMarks != null && (
                    <View className={`rounded-full px-2 py-0.5 ${scoreBg}`}>
                      <Text className="text-xs font-semibold">{attempt.score}/{attempt.totalMarks}</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center gap-3 mt-1">
                  {attempt.completedAt ? (
                    <Text className="text-xs text-gray-400">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </Text>
                  ) : (
                    <Text className="text-xs text-amber-500">In progress</Text>
                  )}
                  {attempt.duration && (
                    <Text className="text-xs text-gray-400">⏱ {formatDuration(attempt.duration)}</Text>
                  )}
                  {attempt.score != null && attempt.totalMarks != null && attempt.totalMarks > 0 && (
                    <Text className="text-xs text-gray-500">
                      {Math.round((attempt.score / attempt.totalMarks) * 100)}%
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
