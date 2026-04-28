// EXTRACTED FROM: client/src/pages/teacher/McqManagerPage.tsx
// CONVERTED TO:   app/(teacher)/mcq-manager.tsx
// BUCKET:         B_convert — simplified view of MCQ management

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { McqQuestion } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function McqManagerPage() {
  const router = useRouter();

  const { data: questions = [], isLoading } = useQuery<McqQuestion[]>({
    queryKey: ["/api/mcq/questions"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/mcq/questions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const DIFF_COLORS: Record<string, string> = {
    easy: "text-green-600 bg-green-50",
    medium: "text-amber-600 bg-amber-50",
    hard: "text-red-600 bg-red-50",
  };

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
            <Text className="text-2xl font-bold text-gray-900">MCQ Manager</Text>
            <Text className="text-sm text-gray-500">{questions.length} questions in bank</Text>
          </View>
        </View>

        {/* Quick stats */}
        <View className="flex-row gap-3 mb-4">
          {["easy", "medium", "hard"].map(diff => {
            const count = questions.filter(q => q.difficulty === diff).length;
            const colors = DIFF_COLORS[diff] || "text-gray-600 bg-gray-50";
            return (
              <View key={diff} className={`flex-1 rounded-xl p-3 items-center ${colors}`}>
                <Text className="text-xl font-bold">{count}</Text>
                <Text className="text-xs capitalize font-medium mt-0.5">{diff}</Text>
              </View>
            );
          })}
        </View>

        {questions.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-3">🧠</Text>
            <Text className="text-gray-500 mb-2">No MCQ questions yet.</Text>
            <Text className="text-sm text-gray-400 text-center">
              Questions can be added via the MCQ practice on student side or by contacting admin.
            </Text>
          </View>
        ) : (
          <FlashList
            data={questions}
            estimatedItemSize={70}
            keyExtractor={q => q.id}
            renderItem={({ item: q }) => (
              <View className="border border-gray-100 rounded-xl p-4 mb-2">
                <Text className="text-sm text-gray-800 mb-2" numberOfLines={2}>{q.questionText}</Text>
                <View className="flex-row gap-2">
                  <View className={`rounded-full px-2 py-0.5 ${DIFF_COLORS[q.difficulty] || "bg-gray-100 text-gray-600"}`}>
                    <Text className="text-xs font-medium capitalize">{q.difficulty}</Text>
                  </View>
                  {q.bloomsLevel && (
                    <View className="bg-purple-50 rounded-full px-2 py-0.5">
                      <Text className="text-xs text-purple-600">{q.bloomsLevel}</Text>
                    </View>
                  )}
                  <View className="bg-gray-100 rounded-full px-2 py-0.5">
                    <Text className="text-xs text-gray-500">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
