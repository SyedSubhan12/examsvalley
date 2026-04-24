// EXTRACTED FROM: client/src/pages/teacher/QuizListPage.tsx
// CONVERTED TO:   app/(teacher)/quizzes/index.tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Quiz } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function QuizListPage() {
  const router = useRouter();

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quizzes`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Quizzes</Text>
            <Text className="text-sm text-gray-500">Create and manage your quizzes</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(teacher)/quizzes/new" as any)}
            className="bg-purple-600 rounded-xl px-3 py-2"
          >
            <Text className="text-white text-sm font-medium">+ New</Text>
          </TouchableOpacity>
        </View>

        {quizzes.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-3">❓</Text>
            <Text className="text-gray-500 mb-2">No quizzes created yet.</Text>
            <TouchableOpacity
              onPress={() => router.push("/(teacher)/quizzes/new" as any)}
              className="bg-purple-600 rounded-xl px-5 py-3"
            >
              <Text className="text-white font-semibold">Create First Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={quizzes}
            estimatedItemSize={80}
            keyExtractor={q => q.id}
            renderItem={({ item: quiz }) => (
              <TouchableOpacity
                onPress={() => router.push(`/(teacher)/quizzes/${quiz.id}` as any)}
                className="border border-gray-100 rounded-xl p-4 mb-3"
              >
                <View className="flex-row items-start justify-between">
                  <Text className="font-semibold text-gray-800 text-sm flex-1" numberOfLines={2}>
                    ❓ {quiz.title}
                  </Text>
                  <View className={`ml-2 rounded-full px-2 py-0.5 ${quiz.isPublished ? "bg-green-100" : "bg-gray-100"}`}>
                    <Text className={`text-xs font-medium ${quiz.isPublished ? "text-green-700" : "text-gray-500"}`}>
                      {quiz.isPublished ? "Published" : "Draft"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3 mt-2">
                  {quiz.duration && (
                    <Text className="text-xs text-gray-400">⏱ {quiz.duration} min</Text>
                  )}
                  {quiz.totalMarks && (
                    <Text className="text-xs text-gray-400">📊 {quiz.totalMarks} marks</Text>
                  )}
                  <Text className="text-xs text-gray-400 capitalize">{quiz.type}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
