// EXTRACTED FROM: client/src/pages/student/QuizAttemptPage.tsx
// CONVERTED TO:   app/(student)/practice/quiz/[quizId].tsx
// BUCKET:         B_convert

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import type { Question, Quiz } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface QuizWithQuestions extends Quiz {
  questions?: Question[];
}

export default function QuizAttemptPage() {
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: quiz, isLoading } = useQuery<QuizWithQuestions>({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quizzes/${quizId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/quizzes", quizId, "questions"],
    enabled: !!quizId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/quizzes/${quizId}/questions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createAttemptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/quiz-attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          quizId, userId: user?.id, answers: [], score: 0, totalMarks: 0, startedAt: new Date(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => setAttemptId(data.id),
  });

  const submitAttemptMutation = useMutation({
    mutationFn: async (data: { score: number; totalMarks: number; answers: string[] }) => {
      if (!attemptId) throw new Error("No attempt ID");
      const res = await fetch(`${BASE}/api/quiz-attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, completedAt: new Date() }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] }),
  });

  useEffect(() => {
    if (quiz && user && !attemptId && !isSubmitted) {
      createAttemptMutation.mutate();
    }
  }, [quiz, user]);

  useEffect(() => {
    if (quiz?.duration && !isSubmitted) {
      setTimeRemaining(quiz.duration * 60);
    }
  }, [quiz?.duration]);

  useEffect(() => {
    if (!quiz?.duration || isSubmitted || timeRemaining <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quiz?.duration, isSubmitted]);

  const calculateScore = () => {
    let score = 0;
    let totalMarks = 0;
    questions.forEach(q => {
      totalMarks += q.marks;
      if (answers[q.id] === String(q.correctOptionIndex)) score += q.marks;
    });
    return { score, totalMarks };
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const { score, totalMarks } = calculateScore();
    const answersArray = Object.entries(answers).map(([questionId, answer]) =>
      JSON.stringify({ questionId, answer })
    );
    submitAttemptMutation.mutate({ score, totalMarks, answers: answersArray });
    setIsSubmitted(true);
    setCurrentIdx(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Quiz Not Found</Text>
        <Text className="text-sm text-gray-500 mb-5">No questions available for this quiz.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Results screen
  if (isSubmitted) {
    const { score, totalMarks } = calculateScore();
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const answered = Object.keys(answers).length;

    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View className="items-center py-6">
            <Text className="text-5xl mb-3">🏆</Text>
            <Text className="text-2xl font-bold text-gray-900 mb-1">Quiz Completed!</Text>
            <Text className="text-sm text-gray-500 mb-6">{quiz.title}</Text>

            <View className="flex-row gap-4 mb-6">
              {[
                { label: "Score", value: `${score}/${totalMarks}` },
                { label: "Percentage", value: `${pct}%` },
                { label: "Answered", value: `${answered}/${questions.length}` },
              ].map(stat => (
                <View key={stat.label} className="items-center flex-1">
                  <Text className="text-2xl font-bold text-gray-900">{stat.value}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{stat.label}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row gap-3 mb-8">
              <TouchableOpacity
                onPress={() => router.push("/(student)/practice/")}
                className="border border-gray-200 rounded-xl px-4 py-2.5"
              >
                <Text className="text-sm text-gray-700">← Practice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(student)/practice/history")}
                className="bg-blue-600 rounded-xl px-4 py-2.5"
              >
                <Text className="text-sm text-white font-semibold">View History</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-sm font-semibold text-gray-800 mb-3">Review Answers</Text>
          {questions.map((q, i) => {
            const selected = answers[q.id] ?? null;
            const isCorrect = selected === String(q.correctOptionIndex);
            return (
              <View key={q.id} className="border border-gray-100 rounded-xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-gray-500">Q{i + 1} · {q.marks} mark{q.marks !== 1 ? "s" : ""}</Text>
                  <Text className={`text-xs font-medium ${isCorrect ? "text-green-600" : selected ? "text-red-600" : "text-gray-400"}`}>
                    {isCorrect ? "✓ Correct" : selected ? "✗ Wrong" : "Not answered"}
                  </Text>
                </View>
                <Text className="text-sm text-gray-800 mb-3">{q.questionText}</Text>
                {q.options?.map((opt, idx) => {
                  const isOpt = selected === String(idx);
                  const isCorrectOpt = String(idx) === String(q.correctOptionIndex);
                  let bg = "bg-gray-50";
                  if (isCorrectOpt) bg = "bg-green-50";
                  else if (isOpt && !isCorrectOpt) bg = "bg-red-50";
                  return (
                    <View key={idx} className={`rounded-lg px-3 py-2 mb-1 border ${isCorrectOpt ? "border-green-300" : isOpt ? "border-red-300" : "border-transparent"} ${bg}`}>
                      <Text className={`text-sm ${isCorrectOpt ? "text-green-800" : isOpt ? "text-red-800" : "text-gray-700"}`}>
                        {isCorrectOpt ? "✓ " : isOpt ? "✗ " : "  "}{opt}
                      </Text>
                    </View>
                  );
                })}
                {q.explanation ? (
                  <View className="mt-2 bg-blue-50 rounded-lg p-3">
                    <Text className="text-xs font-semibold text-blue-700 mb-0.5">Explanation</Text>
                    <Text className="text-xs text-blue-600">{q.explanation}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Attempt screen
  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-500">{quiz.title}</Text>
          {quiz.duration && timeRemaining > 0 && (
            <View className={`rounded-full px-2 py-1 ${timeRemaining < 60 ? "bg-red-100" : "bg-gray-100"}`}>
              <Text className={`text-xs font-mono font-semibold ${timeRemaining < 60 ? "text-red-600" : "text-gray-700"}`}>
                ⏱ {formatTime(timeRemaining)}
              </Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View className="h-1.5 bg-gray-100 rounded-full mb-1">
          <View className="h-1.5 bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
        </View>
        <Text className="text-xs text-gray-400 mb-3">
          Question {currentIdx + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }}>
        <View className="border border-gray-100 rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="bg-blue-100 rounded-full px-2 py-0.5">
              <Text className="text-xs font-semibold text-blue-700">Q{currentIdx + 1}</Text>
            </View>
            <View className="bg-gray-100 rounded-full px-2 py-0.5">
              <Text className="text-xs text-gray-600">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Text>
            </View>
          </View>
          <Text className="text-base text-gray-900">{q.questionText}</Text>
        </View>

        {q.options?.map((opt, idx) => {
          const isSelected = answers[q.id] === String(idx);
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => setAnswers(prev => ({ ...prev, [q.id]: String(idx) }))}
              className={`border rounded-xl p-4 mb-2 flex-row items-center gap-3 ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            >
              <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? "border-blue-500" : "border-gray-300"}`}>
                {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </View>
              <Text className={`text-sm flex-1 ${isSelected ? "text-blue-800 font-medium" : "text-gray-700"}`}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Nav footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex-row gap-3">
        <TouchableOpacity
          onPress={() => setCurrentIdx(p => p - 1)}
          disabled={currentIdx === 0}
          className={`flex-1 py-3 rounded-xl border ${currentIdx === 0 ? "border-gray-100 bg-gray-50" : "border-gray-200"}`}
        >
          <Text className={`text-center text-sm font-medium ${currentIdx === 0 ? "text-gray-300" : "text-gray-700"}`}>← Prev</Text>
        </TouchableOpacity>

        {currentIdx < questions.length - 1 ? (
          <TouchableOpacity
            onPress={() => setCurrentIdx(p => p + 1)}
            className="flex-1 bg-blue-600 py-3 rounded-xl"
          >
            <Text className="text-center text-sm font-semibold text-white">Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitAttemptMutation.isPending}
            className="flex-1 bg-green-600 py-3 rounded-xl"
          >
            <Text className="text-center text-sm font-semibold text-white">
              {submitAttemptMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
