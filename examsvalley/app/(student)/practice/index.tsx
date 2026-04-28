// EXTRACTED FROM: client/src/pages/student/QuizPracticePage.tsx
// CONVERTED TO:   app/(student)/practice/index.tsx
// BUCKET:         B_convert

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Quiz } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface Subject { id: string; subjectName: string; }
interface Topic { id: string; name: string; subjectId: string; }

function Dropdown({
  value, label, options, onSelect,
}: { value: string; label: string; options: { label: string; value: string }[]; onSelect: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="border border-gray-200 rounded-xl px-3 py-2.5 flex-row items-center justify-between"
      >
        <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>{selected?.label ?? label}</Text>
        <Text className="text-gray-400 ml-1">▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity className="flex-1 bg-black/30" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-xl mx-8 mt-40 overflow-hidden">
            <FlatList
              data={options}
              keyExtractor={o => o.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                  className={`px-4 py-3 border-b border-gray-100 ${item.value === value ? "bg-blue-50" : ""}`}
                >
                  <Text className={`text-sm ${item.value === value ? "font-semibold text-blue-700" : "text-gray-800"}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function QuizPracticePage() {
  const router = useRouter();
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/subjects`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics", subjectFilter],
    enabled: subjectFilter !== "all",
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/topics?subjectId=${subjectFilter}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes", subjectFilter, topicFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (subjectFilter !== "all") params.set("subjectId", subjectFilter);
      if (topicFilter !== "all") params.set("topicId", topicFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`${BASE}/api/quizzes?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const subjectOptions = [{ label: "All Subjects", value: "all" }, ...subjects.map(s => ({ label: s.subjectName, value: s.id }))];
  const topicOptions = [{ label: "All Topics", value: "all" }, ...topics.map(t => ({ label: t.name, value: t.id }))];
  const typeOptions = [{ label: "All Types", value: "all" }, { label: "Practice", value: "practice" }, { label: "Mock Test", value: "mock" }];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Practice</Text>
            <Text className="text-sm text-gray-500">{quizzes.length} quizzes available</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(student)/practice/history")}
            className="border border-gray-200 rounded-xl px-3 py-2"
          >
            <Text className="text-xs text-gray-600">History</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-2 mb-3">
          <Dropdown value={subjectFilter} label="All Subjects" options={subjectOptions} onSelect={v => { setSubjectFilter(v); setTopicFilter("all"); }} />
          {subjectFilter !== "all" && (
            <Dropdown value={topicFilter} label="All Topics" options={topicOptions} onSelect={setTopicFilter} />
          )}
          <View className="flex-row gap-2">
            {typeOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setTypeFilter(opt.value)}
                className={`flex-1 py-2 rounded-xl border ${typeFilter === opt.value ? "bg-blue-600 border-blue-600" : "border-gray-200"}`}
              >
                <Text className={`text-xs text-center font-medium ${typeFilter === opt.value ? "text-white" : "text-gray-600"}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : quizzes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-3xl mb-3">🎯</Text>
          <Text className="text-gray-500 text-center">No quizzes match your filters.</Text>
        </View>
      ) : (
        <FlashList
          data={quizzes}
          estimatedItemSize={120}
          keyExtractor={q => q.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          renderItem={({ item: quiz }) => {
            const subject = subjects.find(s => s.id === quiz.subjectId);
            const topic = topics.find(t => t.id === quiz.topicId);
            return (
              <View className="border border-gray-100 rounded-xl p-4 mb-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View className={`rounded-full px-2 py-0.5 ${quiz.type === "mock" ? "bg-blue-600" : "bg-gray-100"}`}>
                    <Text className={`text-xs font-medium ${quiz.type === "mock" ? "text-white" : "text-gray-600"}`}>
                      {quiz.type === "mock" ? "Mock Test" : "Practice"}
                    </Text>
                  </View>
                  {quiz.duration && (
                    <View className="bg-gray-100 rounded-full px-2 py-0.5">
                      <Text className="text-xs text-gray-600">⏱ {quiz.duration} min</Text>
                    </View>
                  )}
                </View>

                <Text className="text-base font-semibold text-gray-900 mb-1">{quiz.title}</Text>

                {(subject || topic) && (
                  <Text className="text-xs text-gray-500 mb-2">
                    {subject?.subjectName}{topic ? ` / ${topic.name}` : ""}
                  </Text>
                )}

                {quiz.description ? (
                  <Text className="text-xs text-gray-500 mb-3" numberOfLines={2}>{quiz.description}</Text>
                ) : null}

                <TouchableOpacity
                  onPress={() => router.push(`/(student)/practice/quiz/${quiz.id}`)}
                  className="bg-blue-600 rounded-xl py-2.5"
                >
                  <Text className="text-white text-sm font-semibold text-center">▶ Start Quiz</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
