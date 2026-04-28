// EXTRACTED FROM: client/src/pages/student/mcq/McqPracticePage.tsx
// CONVERTED TO:   app/(student)/mcq/practice.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn Select → custom TouchableOpacity pickers, Slider → custom step buttons
// LOGIC CHANGES: All useState/useQuery/useMutation logic VERBATIM; navigate → router.push; Select → inline picker modal pattern

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView, FlatList } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const MODE_INFO = {
  practice: { label: "Practice", description: "Untimed, learn at your own pace", emoji: "📖" },
  timed: { label: "Timed", description: "Race against the clock", emoji: "⏱" },
  adaptive: { label: "Adaptive", description: "AI picks difficulty based on your level", emoji: "⚡" },
  exam: { label: "Exam Mode", description: "Simulate real exam conditions", emoji: "🎯" },
} as const;

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const SESSIONS_LIST = ["May/June", "Oct/Nov", "Feb/March"];
const PAPERS_LIST = ["1", "2", "3"];
const VARIANTS_LIST = ["1", "2", "3"];
const YEARS_LIST = Array.from({ length: 15 }, (_, i) => String(2024 - i));

function DropdownPicker({ label, value, options, onSelect, placeholder = "Select" }: {
  label: string; value: string; options: { label: string; value: string }[];
  onSelect: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = options.find(o => o.value === value)?.label || placeholder;
  return (
    <View className="mb-3">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="border border-gray-300 rounded-lg px-3 py-3 flex-row justify-between items-center"
      >
        <Text className={value ? "text-gray-900" : "text-gray-400"}>{display}</Text>
        <Text className="text-gray-400">▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-t-2xl max-h-80">
            <FlatList
              data={options}
              keyExtractor={i => i.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`px-5 py-4 border-b border-gray-100 ${item.value === value ? "bg-blue-50" : ""}`}
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                >
                  <Text className={item.value === value ? "text-blue-600 font-medium" : "text-gray-800"}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function McqPracticePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [boardId, setBoardId] = useState("");
  const [qualId, setQualId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [mode, setMode] = useState<keyof typeof MODE_INFO>("practice");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [paper, setPaper] = useState("");
  const [variant, setVariant] = useState("");

  const { data: boards = [] } = useQuery<any[]>({
    queryKey: ["/api/curriculum/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch boards");
      return res.json();
    }
  });

  const { data: qualifications = [] } = useQuery<any[]>({
    queryKey: ["/api/curriculum/boards", boardId, "qualifications"],
    enabled: !!boardId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards/${boardId}/qualifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/curriculum/qualifications", qualId, "branches"],
    enabled: !!qualId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/qualifications/${qualId}/branches`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ["/api/subjects", boardId, qualId, branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (boardId) params.append("boardId", boardId);
      if (qualId) params.append("qualId", qualId);
      if (branchId) params.append("branchId", branchId);
      const res = await fetch(`${BASE}/api/subjects?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: topics = [] } = useQuery<any[]>({
    queryKey: ["/api/topics", subjectId],
    enabled: !!subjectId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/topics?subjectId=${subjectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: meta } = useQuery<{ totalQuestions: number; aiAvailable: boolean }>({
    queryKey: ["/api/mcq/meta", subjectId],
    queryFn: async () => {
      const url = subjectId ? `${BASE}/api/mcq/meta?subjectId=${subjectId}` : `${BASE}/api/mcq/meta`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: recommendations = [] } = useQuery<any[]>({
    queryKey: ["/api/mcq/recommendations", subjectId],
    enabled: !!subjectId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/mcq/recommendations?subjectId=${subjectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const startSession = useMutation({
    mutationFn: async () => {
      const body: any = { subjectId, mode, questionCount };
      if (topicId) body.topicId = topicId;
      if (mode !== "adaptive") body.difficulty = difficulty;
      if (year) body.year = parseInt(year);
      if (session) body.session = session;
      if (paper) body.paper = parseInt(paper);
      if (variant) body.variant = parseInt(variant);
      if (qualId) body.qualId = qualId;
      if (branchId) body.branchId = branchId;
      const res = await fetch(`${BASE}/api/mcq/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to start session");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/mcq/sessions", data.session.id], data);
      router.push(`/(student)/mcq/session/${data.session.id}`);
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Could not start session", text2: err.message });
    },
  });

  const boardOptions = [{ label: "All Boards", value: "" }, ...boards.map((b: any) => ({ label: b.displayName || b.boardKey, value: b.id }))];
  const qualOptions = [{ label: "All Levels", value: "" }, ...qualifications.map((q: any) => ({ label: q.displayName, value: q.id }))];
  const branchOptions = [{ label: "All Branches", value: "" }, ...branches.map((b: any) => ({ label: b.displayName, value: b.id }))];
  const subjectOptions = [{ label: "Select a subject", value: "" }, ...subjects.map((s: any) => ({ label: s.subjectName, value: s.id }))];
  const topicOptions = [{ label: "All Topics", value: "" }, ...topics.map((t: any) => ({ label: t.name, value: t.id }))];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-xl font-bold text-gray-900">MCQ Practice</Text>
            <Text className="text-sm text-gray-500">AI-powered MCQ practice</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(student)/mcq/stats" as any)}
            className="border border-gray-300 rounded-lg px-3 py-2">
            <Text className="text-sm text-gray-700">📊 My Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-2 mb-5">
          <View className="flex-1 border border-gray-200 rounded-xl p-3 items-center">
            <Text className="text-xl font-bold text-gray-900">{meta?.totalQuestions ?? "—"}</Text>
            <Text className="text-xs text-gray-500">Questions</Text>
          </View>
          <View className="flex-1 border border-gray-200 rounded-xl p-3 items-center">
            <Text className="text-xl font-bold text-gray-900">{subjects.length}</Text>
            <Text className="text-xs text-gray-500">Subjects</Text>
          </View>
          <View className="flex-1 border border-gray-200 rounded-xl p-3 items-center">
            <Text className="text-xl font-bold text-gray-900">{recommendations.length || "—"}</Text>
            <Text className="text-xs text-gray-500">For You</Text>
          </View>
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View className="border border-gray-200 rounded-xl p-4 mb-5">
            <Text className="text-sm font-semibold text-gray-800 mb-3">✨ Recommended For You</Text>
            {recommendations.slice(0, 3).map((rec: any, i: number) => (
              <TouchableOpacity
                key={i}
                className="flex-row items-center justify-between p-3 rounded-lg border border-gray-100 mb-2"
                onPress={() => {
                  setTopicId(rec.topicId);
                  setDifficulty(rec.suggestedDifficulty);
                  setQuestionCount(rec.suggestedQuestionCount);
                }}
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">{rec.topicName}</Text>
                  <Text className="text-xs text-gray-500">{rec.message}</Text>
                </View>
                <Text className="text-xs text-blue-600 font-medium ml-2">{rec.suggestedDifficulty}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subject & Topic */}
        <View className="border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">Subject & Topic</Text>
          <DropdownPicker label="Board" value={boardId} options={boardOptions}
            onSelect={(v) => { setBoardId(v); setQualId(""); setBranchId(""); setSubjectId(""); setTopicId(""); }} />
          <DropdownPicker label="Level / Qualification" value={qualId} options={qualOptions}
            onSelect={(v) => { setQualId(v); setBranchId(""); setSubjectId(""); setTopicId(""); }} />
          {branches.length > 0 && (
            <DropdownPicker label="Curriculum / Branch" value={branchId} options={branchOptions}
              onSelect={(v) => { setBranchId(v); setSubjectId(""); setTopicId(""); }} />
          )}
          <DropdownPicker label="Subject *" value={subjectId} options={subjectOptions}
            placeholder="Select a subject" onSelect={(v) => { setSubjectId(v); setTopicId(""); }} />
          <DropdownPicker label="Topic (optional)" value={topicId} options={topicOptions}
            onSelect={setTopicId} />
        </View>

        {/* Past Paper Filters */}
        <View className="border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">⏱ Past Paper Filters (Optional)</Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <DropdownPicker label="Year" value={year}
                options={[{ label: "All", value: "" }, ...YEARS_LIST.map(y => ({ label: y, value: y }))]}
                onSelect={setYear} />
            </View>
            <View className="flex-1">
              <DropdownPicker label="Session" value={session}
                options={[{ label: "All", value: "" }, ...SESSIONS_LIST.map(s => ({ label: s, value: s }))]}
                onSelect={setSession} />
            </View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <DropdownPicker label="Paper" value={paper}
                options={[{ label: "All", value: "" }, ...PAPERS_LIST.map(p => ({ label: `Paper ${p}`, value: p }))]}
                onSelect={setPaper} />
            </View>
            <View className="flex-1">
              <DropdownPicker label="Variant" value={variant}
                options={[{ label: "All", value: "" }, ...VARIANTS_LIST.map(v => ({ label: v, value: v }))]}
                onSelect={setVariant} />
            </View>
          </View>
        </View>

        {/* Difficulty */}
        <View className="border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">Difficulty</Text>
          <View className="flex-row gap-2">
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity key={d} onPress={() => setDifficulty(d)} disabled={mode === "adaptive"}
                className={`flex-1 py-2 rounded-lg border items-center ${difficulty === d ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                <Text className={`text-sm font-medium capitalize ${difficulty === d ? "text-white" : "text-gray-700"}`}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {mode === "adaptive" && <Text className="text-xs text-gray-400 mt-2">Adaptive mode selects difficulty automatically</Text>}

          {/* Question count */}
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">Questions: {questionCount}</Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => setQuestionCount(Math.max(5, questionCount - 5))}
                className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center">
                <Text className="text-gray-700">−</Text>
              </TouchableOpacity>
              <Text className="text-base font-semibold w-8 text-center">{questionCount}</Text>
              <TouchableOpacity onPress={() => setQuestionCount(Math.min(50, questionCount + 5))}
                className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center">
                <Text className="text-gray-700">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mode Selection */}
        <View className="border border-gray-200 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">Practice Mode</Text>
          <View className="flex-row flex-wrap gap-2">
            {(Object.entries(MODE_INFO) as [keyof typeof MODE_INFO, any][]).map(([key, info]) => (
              <TouchableOpacity key={key} onPress={() => setMode(key)}
                className={`w-[48%] p-3 rounded-xl border-2 ${mode === key ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                <Text className="text-xl mb-1">{info.emoji}</Text>
                <Text className={`text-sm font-semibold ${mode === key ? "text-blue-700" : "text-gray-800"}`}>{info.label}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{info.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          onPress={() => startSession.mutate()}
          disabled={!subjectId || startSession.isPending}
          className={`w-full rounded-xl py-4 items-center mb-8 ${!subjectId || startSession.isPending ? "bg-blue-300" : "bg-blue-600"}`}
        >
          {startSession.isPending
            ? <ActivityIndicator color="white" />
            : <Text className="text-white text-base font-bold">▶  Start Practice</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
