// EXTRACTED FROM: client/src/pages/teacher/QuizBuilderPage.tsx + QuizResultsPage.tsx
// CONVERTED TO:   app/(teacher)/quizzes/[id].tsx
// BUCKET:         B_convert — quiz detail with questions list

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Quiz, Question } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function QuizDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: quiz, isLoading: quizLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quizzes/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: questions = [], isLoading: qsLoading } = useQuery<Question[]>({
    queryKey: [`/api/quizzes/${id}/questions`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quizzes/${id}/questions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (quizLoading || qsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-purple-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Quizzes</Text>
        </TouchableOpacity>

        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-xl font-bold text-gray-900 flex-1 mr-2">{quiz.title}</Text>
          <View className={`rounded-full px-2.5 py-1 ${quiz.isPublished ? "bg-green-100" : "bg-gray-100"}`}>
            <Text className={`text-xs font-medium ${quiz.isPublished ? "text-green-700" : "text-gray-500"}`}>
              {quiz.isPublished ? "Published" : "Draft"}
            </Text>
          </View>
        </View>

        {quiz.description && (
          <Text className="text-sm text-gray-500 mb-4">{quiz.description}</Text>
        )}

        <View className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-4">
          {[
            { label: "Type", value: quiz.type },
            { label: "Duration", value: quiz.duration ? `${quiz.duration} min` : null },
            { label: "Total Marks", value: quiz.totalMarks },
            { label: "Questions", value: questions.length },
          ].filter(r => r.value != null).map((row, i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-sm text-gray-500">{row.label}</Text>
              <Text className="text-sm font-medium text-gray-800 capitalize">{String(row.value)}</Text>
            </View>
          ))}
        </View>

        {questions.length > 0 && (
          <View>
            <Text className="text-sm font-semibold text-gray-800 mb-3">Questions ({questions.length})</Text>
            {questions.map((q, i) => (
              <View key={q.id} className="border border-gray-100 rounded-xl p-4 mb-2">
                <View className="flex-row gap-2 items-start">
                  <View className="w-6 h-6 bg-purple-100 rounded-full items-center justify-center flex-shrink-0">
                    <Text className="text-xs font-bold text-purple-700">{i + 1}</Text>
                  </View>
                  <Text className="text-sm text-gray-800 flex-1" numberOfLines={3}>{q.questionText}</Text>
                </View>
                <View className="flex-row gap-2 mt-2 ml-8">
                  <View className="bg-gray-100 rounded px-2 py-0.5">
                    <Text className="text-xs text-gray-500">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
