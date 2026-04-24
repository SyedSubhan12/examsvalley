// EXTRACTED FROM: client/src/pages/student/mcq/McqSessionPage.tsx
// CONVERTED TO:   app/(student)/mcq/session/[id].tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives, CSS progress → View width style
// LOGIC CHANGES: All useState/useEffect/useMutation VERBATIM; navigate → router.replace/push; button → Pressable/TouchableOpacity

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface McqOption { label: string; text: string; }
interface SessionQuestion {
  id: string; questionText: string; options: McqOption[];
  difficulty: string; marks: number; tags: string[]; bloomsLevel: string;
}
interface AnswerResult {
  isCorrect: boolean; correctOptionIndex: number;
  explanation: string; aiFeedback?: string;
}
interface SessionData {
  session: {
    id: string; mode: string; totalQuestions: number;
    answeredCount: number; correctCount: number; score?: number; completedAt?: string;
  };
  questions: SessionQuestion[];
  totalCorrect?: number; totalAnswered?: number; attempts?: any[];
}

const DIFFICULTY_BG: Record<string, string> = {
  easy: "bg-green-100", medium: "bg-amber-100", hard: "bg-red-100",
};
const DIFFICULTY_TEXT: Record<string, string> = {
  easy: "text-green-700", medium: "text-amber-700", hard: "text-red-700",
};

export default function McqSessionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [answers, setAnswers] = useState<Map<string, AnswerResult>>(new Map());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [localSession, setLocalSession] = useState<SessionData | null>(null);

  // Load session data from cache or API
  useEffect(() => {
    const cached = queryClient.getQueryData<SessionData>(["/api/mcq/sessions", id]);
    if (cached) {
      setLocalSession(cached);
    } else {
      fetch(`${BASE}/api/mcq/sessions/${id}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => setLocalSession(data))
        .catch(() => router.replace("/(student)/mcq/practice"));
    }
  }, [id]);

  // Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Track time per question
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  const questions = localSession?.questions || [];
  const session = localSession?.session;
  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + (answerResult ? 1 : 0)) / questions.length) * 100 : 0;

  const submitAnswer = useMutation({
    mutationFn: async (optionIndex: number) => {
      const timeSpentMs = Date.now() - questionStartTime;
      const res = await fetch(`${BASE}/api/mcq/sessions/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId: currentQuestion.id, selectedOptionIndex: optionIndex, timeSpentMs }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return res.json();
    },
    onSuccess: (data: AnswerResult) => {
      setAnswerResult(data);
      setAnswers(prev => new Map(prev).set(currentQuestion.id, data));
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Error submitting answer", text2: err.message });
    },
  });

  const completeSession = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/mcq/sessions/${id}/complete`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete session");
      return res.json();
    },
    onSuccess: (data) => {
      setIsComplete(true);
      setLocalSession(prev => prev ? {
        ...prev, session: { ...prev.session, ...data.session, score: data.score }
      } : null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
  });

  const handleSelectOption = (index: number) => {
    if (answerResult || submitAnswer.isPending) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    submitAnswer.mutate(selectedOption);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswerResult(null);
    } else {
      completeSession.mutate();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── COMPLETION SCREEN ─────────────────────────────────────────────────────
  if (isComplete && session) {
    const score = session.score ?? 0;
    const isGood = score >= 70;
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Score card */}
          <View className="rounded-2xl border border-gray-200 p-6 items-center mb-4">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isGood ? "bg-green-100" : "bg-amber-100"}`}>
              <Text className="text-4xl">{isGood ? "🏆" : "💪"}</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {isGood ? "Great Job!" : "Keep Practicing!"}
            </Text>
            <Text className="text-gray-500">You scored {score}% on this session</Text>
            <View className="flex-row gap-6 mt-6 mb-6">
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">{session.correctCount}</Text>
                <Text className="text-xs text-gray-500">Correct</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-500">{session.answeredCount - session.correctCount}</Text>
                <Text className="text-xs text-gray-500">Incorrect</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-700">{formatTime(elapsed)}</Text>
                <Text className="text-xs text-gray-500">Time</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => router.replace("/(student)/mcq/practice")}
                className="flex-1 border border-gray-300 rounded-xl py-3 items-center">
                <Text className="text-gray-700 font-medium">← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(student)/mcq/stats" as any)}
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center">
                <Text className="text-white font-medium">📊 Stats</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Review Answers */}
          <View className="rounded-2xl border border-gray-200 p-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">Review Answers</Text>
            <FlashList
              data={questions}
              estimatedItemSize={70}
              keyExtractor={q => q.id}
              renderItem={({ item: q, index: i }) => {
                const result = answers.get(q.id);
                return (
                  <View className="flex-row items-start gap-3 p-3 rounded-xl border border-gray-100 mb-2">
                    <View className={`w-7 h-7 rounded-full items-center justify-center flex-shrink-0 ${result?.isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                      <Text className={`text-xs font-bold ${result?.isCorrect ? "text-green-600" : "text-red-600"}`}>{i + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-gray-800" numberOfLines={2}>{q.questionText}</Text>
                      {result && (
                        <Text className="text-xs text-gray-500 mt-1">
                          {result.isCorrect ? "✓ Correct" : `✗ Answer: ${q.options[result.correctOptionIndex]?.label}`}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (!currentQuestion || !session) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // ── QUESTION VIEW ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-4">
        {/* Header bar */}
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.replace("/(student)/mcq/practice")}
            className="flex-row items-center">
            <Text className="text-gray-600 text-sm">← Exit</Text>
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <View className="border border-gray-200 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-600">⏱ {formatTime(elapsed)}</Text>
            </View>
            <View className="border border-gray-200 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-600">{currentIndex + 1} / {questions.length}</Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View className="h-2 bg-gray-100 rounded-full mb-4">
          <View className="h-2 bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Question card */}
          <View className="rounded-2xl border border-gray-200 p-4 mb-3">
            <View className="flex-row gap-2 mb-3">
              <View className={`px-2 py-1 rounded-full ${DIFFICULTY_BG[currentQuestion.difficulty] || "bg-gray-100"}`}>
                <Text className={`text-xs font-medium ${DIFFICULTY_TEXT[currentQuestion.difficulty] || "text-gray-600"}`}>
                  {currentQuestion.difficulty}
                </Text>
              </View>
              {currentQuestion.marks > 1 && (
                <View className="border border-gray-200 px-2 py-1 rounded-full">
                  <Text className="text-xs text-gray-600">{currentQuestion.marks} marks</Text>
                </View>
              )}
            </View>
            <Text className="text-base font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.questionText}
            </Text>
          </View>

          {/* Options */}
          {currentQuestion.options.map((opt, i) => {
            let borderClass = "border-gray-200";
            let bgClass = "";
            if (selectedOption === i && !answerResult) { borderClass = "border-blue-500"; bgClass = "bg-blue-50"; }
            if (answerResult) {
              if (i === answerResult.correctOptionIndex) { borderClass = "border-green-500"; bgClass = "bg-green-50"; }
              else if (selectedOption === i && !answerResult.isCorrect) { borderClass = "border-red-500"; bgClass = "bg-red-50"; }
              else { bgClass = "opacity-50"; }
            }
            return (
              <Pressable
                key={i}
                onPress={() => handleSelectOption(i)}
                disabled={!!answerResult}
                className={`flex-row items-center gap-3 p-4 rounded-2xl border-2 mb-2 ${borderClass} ${bgClass}`}
              >
                <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center flex-shrink-0">
                  <Text className="text-sm font-bold text-gray-700">{opt.label}</Text>
                </View>
                <Text className="flex-1 text-sm text-gray-800">{opt.text}</Text>
                {answerResult && i === answerResult.correctOptionIndex && <Text className="text-green-600">✓</Text>}
                {answerResult && selectedOption === i && !answerResult.isCorrect && <Text className="text-red-500">✗</Text>}
              </Pressable>
            );
          })}

          {/* Feedback */}
          {answerResult && (
            <View className={`rounded-2xl border-2 p-4 mb-3 ${answerResult.isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
              <View className="flex-row items-start gap-2">
                <Text className="text-lg">{answerResult.isCorrect ? "✅" : "❌"}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">
                    {answerResult.isCorrect ? "Correct!" : "Incorrect"}
                  </Text>
                  {answerResult.explanation && (
                    <Text className="text-sm text-gray-600 mt-1">{answerResult.explanation}</Text>
                  )}
                  {answerResult.aiFeedback && (
                    <View className="mt-2 p-2 rounded-lg bg-purple-50 border border-purple-200">
                      <Text className="text-xs text-purple-600">✨ {answerResult.aiFeedback}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action buttons */}
        <View className="flex-row justify-between pt-3 border-t border-gray-100">
          <TouchableOpacity
            disabled={currentIndex === 0}
            onPress={() => {
              setCurrentIndex(prev => prev - 1);
              const prevResult = answers.get(questions[currentIndex - 1]?.id);
              setAnswerResult(prevResult || null);
              setSelectedOption(null);
            }}
            className={`border border-gray-300 rounded-xl px-4 py-3 ${currentIndex === 0 ? "opacity-40" : ""}`}
          >
            <Text className="text-gray-700">← Prev</Text>
          </TouchableOpacity>

          {!answerResult ? (
            <TouchableOpacity
              disabled={selectedOption === null || submitAnswer.isPending}
              onPress={handleSubmitAnswer}
              className={`bg-blue-600 rounded-xl px-6 py-3 flex-row items-center gap-2 ${selectedOption === null || submitAnswer.isPending ? "opacity-50" : ""}`}
            >
              {submitAnswer.isPending ? <ActivityIndicator color="white" size="small" /> : null}
              <Text className="text-white font-semibold">Submit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleNext} className="bg-blue-600 rounded-xl px-6 py-3">
              <Text className="text-white font-semibold">
                {currentIndex < questions.length - 1 ? "Next →" : "🏁 Finish"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
