// EXTRACTED FROM: client/src/pages/teacher/QuizBuilderPage.tsx + QuizResultsPage.tsx
// CONVERTED TO:   app/(teacher)/quizzes/[id].tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: react-hook-form/zod → manual useState; shadcn Dialog/Switch/Select/RadioGroup →
//   RN Modal/Switch/TouchableOpacity; wouter → expo-router; useToast → Toast.show; mockData removed
// LOGIC CHANGES: id==='new' → create mode (POST /api/quizzes); else edit/view mode (PATCH /api/quizzes/:id).
//   Full question CRUD: add/edit/delete via modals. Drag-reorder replaced with up/down buttons.
//   Questions: text, 4 options (A-D), correctOptionIndex, marks, explanation.

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "@/components/tw"
import { ActivityIndicator, Switch, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface Board { id: string; displayName: string; }
interface Subject { id: string; subjectName?: string; name?: string; }
interface Topic { id: string; name: string; }

interface QuestionData {
  id?: string;
  questionText: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
  order?: number;
}

const BLANK_QUESTION: QuestionData = {
  questionText: "", options: ["", "", "", ""], correctOptionIndex: 0, explanation: "", marks: 1,
};

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `${res.status}`);
  }
  return res.json();
}

function PickerField({
  label, value, options, onChange, disabled = false, required = false,
}: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void; disabled?: boolean; required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {label}{required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => !disabled && setOpen((v) => !v)}
        className={`border rounded-xl px-4 py-3 flex-row items-center justify-between ${disabled ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"}`}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text className={`text-sm ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected?.label ?? (disabled ? "—" : "Select…")}
        </Text>
        {!disabled && <Text className="text-gray-400">{open ? "▾" : "▸"}</Text>}
      </TouchableOpacity>
      {open && (
        <View className="border border-gray-100 rounded-xl mt-1 bg-white overflow-hidden shadow-sm">
          {options.map((opt) => (
            <TouchableOpacity key={opt.value}
              onPress={() => { onChange(opt.value); setOpen(false); }}
              className={`px-4 py-3 border-b border-gray-50 ${value === opt.value ? "bg-purple-50" : ""}`}>
              <Text className={`text-sm ${value === opt.value ? "text-purple-600 font-medium" : "text-gray-800"}`}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function QuestionModal({
  visible, question, onSave, onClose,
}: {
  visible: boolean;
  question: QuestionData;
  onSave: (q: QuestionData) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState<QuestionData>(question);

  const setOption = (i: number, v: string) =>
    setQ((p) => { const opts = [...p.options] as [string,string,string,string]; opts[i] = v; return { ...p, options: opts }; });

  const handleSave = () => {
    if (!q.questionText.trim()) { Toast.show({ type: "error", text1: "Question text is required" }); return; }
    if (q.options.some((o) => !o.trim())) { Toast.show({ type: "error", text1: "All 4 options are required" }); return; }
    onSave(q);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {q.id ? "Edit Question" : "Add Question"}
            </Text>

            {/* Question text */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Question text *</Text>
            <TextInput value={q.questionText} onChangeText={(v) => setQ((p) => ({ ...p, questionText: v }))}
              placeholder="Enter the question…" multiline numberOfLines={3} textAlignVertical="top"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white"
              style={{ minHeight: 72 }} />

            {/* Options A-D */}
            {(["A", "B", "C", "D"] as const).map((letter, i) => (
              <View key={i} className="mb-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <TouchableOpacity
                    onPress={() => setQ((p) => ({ ...p, correctOptionIndex: i }))}
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${q.correctOptionIndex === i ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                    {q.correctOptionIndex === i && <Text className="text-white text-xs font-bold">✓</Text>}
                  </TouchableOpacity>
                  <Text className="text-sm font-medium text-gray-700">Option {letter} *</Text>
                  {q.correctOptionIndex === i && (
                    <View className="bg-green-100 rounded-full px-2 py-0.5">
                      <Text className="text-xs text-green-600 font-medium">Correct</Text>
                    </View>
                  )}
                </View>
                <TextInput value={q.options[i]} onChangeText={(v) => setOption(i, v)}
                  placeholder={`Option ${letter}…`}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white" />
              </View>
            ))}

            {/* Marks */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Marks</Text>
              <TextInput value={String(q.marks)} onChangeText={(v) => setQ((p) => ({ ...p, marks: parseInt(v) || 1 }))}
                keyboardType="numeric" className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white" />
            </View>

            {/* Explanation */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-1">Explanation (optional)</Text>
              <TextInput value={q.explanation} onChangeText={(v) => setQ((p) => ({ ...p, explanation: v }))}
                placeholder="Why is this the correct answer?" multiline numberOfLines={2} textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white" style={{ minHeight: 56 }} />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 border border-gray-200 rounded-xl py-3 items-center">
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} className="flex-1 bg-purple-600 rounded-xl py-3 items-center">
                <Text className="text-white font-semibold">{q.id ? "Save" : "Add Question"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function QuizBuilderPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== "new";

  const [meta, setMeta] = useState({
    title: "", description: "", boardId: "", subjectId: "", topicId: "",
    isTimed: false, duration: "",
  });
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(isEditing ? id : null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQ, setEditingQ] = useState<QuestionData>(BLANK_QUESTION);

  const setM = <K extends keyof typeof meta>(k: K) => (v: any) => setMeta((p) => ({ ...p, [k]: v }));

  // Load quiz metadata
  useQuery({
    queryKey: [`/api/quizzes/${id}`],
    enabled: isEditing && !metaLoaded,
    queryFn: () => apiFetch(`/api/quizzes/${id}`),
    // @ts-ignore
    onSuccess: (q: any) => {
      setMeta({
        title: q.title ?? "", description: q.description ?? "",
        boardId: q.boardId ?? "", subjectId: q.subjectId ?? "", topicId: q.topicId ?? "",
        isTimed: !!q.duration, duration: q.duration ? String(q.duration) : "",
      });
      setMetaLoaded(true);
    },
  });

  // Load questions
  useQuery({
    queryKey: [`/api/quizzes/${id}/questions`],
    enabled: isEditing,
    queryFn: () => apiFetch(`/api/quizzes/${id}/questions`),
    // @ts-ignore
    onSuccess: (qs: any[]) => {
      setQuestions(qs.map((q) => ({
        id: q.id, questionText: q.questionText,
        options: q.options ?? ["", "", "", ""],
        correctOptionIndex: q.correctOptionIndex ?? 0,
        explanation: q.explanation ?? "", marks: q.marks ?? 1, order: q.order,
      })));
    },
  });

  const { data: boards = [] } = useQuery<Board[]>({ queryKey: ["/api/curriculum/boards"] });
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: [`/api/curriculum/subjects`, meta.boardId],
    enabled: !!meta.boardId,
    queryFn: () => apiFetch(`/api/curriculum/subjects?boardId=${meta.boardId}`),
  });
  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: [`/api/topics`, meta.subjectId],
    enabled: !!meta.subjectId,
    queryFn: () => apiFetch(`/api/topics?subjectId=${meta.subjectId}`),
  });

  // Save quiz metadata
  const saveMetaMutation = useMutation({
    mutationFn: (payload: object) =>
      quizId
        ? apiFetch(`/api/quizzes/${quizId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : apiFetch("/api/quizzes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    onSuccess: (saved: any) => {
      if (!quizId) setQuizId(saved.id);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      Toast.show({ type: "success", text1: "Quiz saved" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Save failed", text2: e.message }),
  });

  // Add/update question
  const saveQuestionMutation = useMutation({
    mutationFn: (q: QuestionData) => {
      const payload = {
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || null,
        marks: q.marks,
        order: q.id ? q.order : questions.length,
      };
      if (q.id) {
        return apiFetch(`/api/questions/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      return apiFetch(`/api/quizzes/${quizId}/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    },
    onSuccess: (saved: any, vars) => {
      if (vars.id) {
        setQuestions((p) => p.map((q) => q.id === vars.id ? { ...vars, id: vars.id } : q));
      } else {
        setQuestions((p) => [...p, { ...vars, id: saved.id, order: saved.order ?? p.length }]);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}/questions`] });
      Toast.show({ type: "success", text1: vars.id ? "Question updated" : "Question added" });
      setModalVisible(false);
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Failed", text2: e.message }),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (qId: string) => apiFetch(`/api/questions/${qId}`, { method: "DELETE" }),
    onSuccess: (_, qId) => {
      setQuestions((p) => p.filter((q) => q.id !== qId));
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}/questions`] });
      Toast.show({ type: "success", text1: "Question deleted" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Delete failed", text2: e.message }),
  });

  const handleSaveMeta = () => {
    if (!meta.title.trim()) { Toast.show({ type: "error", text1: "Title is required" }); return; }
    saveMetaMutation.mutate({
      title: meta.title.trim(),
      description: meta.description.trim() || null,
      boardId: meta.boardId || null,
      subjectId: meta.subjectId || null,
      topicId: meta.topicId || null,
      isTimed: meta.isTimed,
      duration: meta.isTimed && meta.duration ? parseInt(meta.duration) : null,
    });
  };

  const handleAddQuestion = () => {
    if (!quizId) { Toast.show({ type: "error", text1: "Save the quiz first before adding questions" }); return; }
    setEditingQ({ ...BLANK_QUESTION });
    setModalVisible(true);
  };

  const handleEditQuestion = (q: QuestionData) => {
    setEditingQ({ ...q });
    setModalVisible(true);
  };

  const handleDeleteQuestion = (q: QuestionData) => {
    if (!q.id) return;
    Alert.alert("Delete Question", "Remove this question?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteQuestionMutation.mutate(q.id!) },
    ]);
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    const next = [...questions];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
  };

  const OPTION_LABELS = ["A", "B", "C", "D"];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 56 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-gray-500">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">
            {quizId ? (isEditing ? "Edit Quiz" : "New Quiz") : "Create Quiz"}
          </Text>
        </View>

        {/* ─── Quiz Metadata ─── */}
        <View className="border border-gray-100 rounded-2xl bg-white p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">Quiz Details</Text>

          <Text className="text-sm font-medium text-gray-700 mb-1">Title <Text className="text-red-500">*</Text></Text>
          <TextInput value={meta.title} onChangeText={setM("title")} placeholder="e.g., Chapter 5 Practice Quiz"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 bg-gray-50" />

          <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
          <TextInput value={meta.description} onChangeText={setM("description")} placeholder="Optional description…"
            multiline numberOfLines={2} textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 bg-gray-50" style={{ minHeight: 56 }} />

          <PickerField label="Board" value={meta.boardId}
            options={boards.map((b) => ({ value: b.id, label: b.displayName }))}
            onChange={(v) => setMeta((p) => ({ ...p, boardId: v, subjectId: "", topicId: "" }))} />

          <PickerField label="Subject" value={meta.subjectId} disabled={!meta.boardId}
            options={subjects.map((s) => ({ value: s.id, label: s.subjectName || s.name || "" }))}
            onChange={(v) => setMeta((p) => ({ ...p, subjectId: v, topicId: "" }))} />

          <PickerField label="Topic (optional)" value={meta.topicId} disabled={!meta.subjectId}
            options={topics.map((t) => ({ value: t.id, label: t.name }))} onChange={setM("topicId")} />

          {/* Timed toggle */}
          <View className="flex-row items-center justify-between py-3 border-t border-gray-50 mt-1">
            <View>
              <Text className="text-sm font-medium text-gray-800">Timed Quiz</Text>
              <Text className="text-xs text-gray-400">Set a time limit for students</Text>
            </View>
            <Switch value={meta.isTimed} onValueChange={setM("isTimed")} trackColor={{ true: "#9333ea" }} />
          </View>
          {meta.isTimed && (
            <View className="mt-2">
              <Text className="text-sm font-medium text-gray-700 mb-1">Duration (minutes)</Text>
              <TextInput value={meta.duration} onChangeText={setM("duration")} keyboardType="numeric"
                placeholder="e.g., 45"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50" />
            </View>
          )}

          <TouchableOpacity onPress={handleSaveMeta} disabled={saveMetaMutation.isPending}
            className="mt-4 bg-purple-600 rounded-xl py-3 items-center flex-row justify-center gap-2">
            {saveMetaMutation.isPending && <ActivityIndicator size="small" color="#fff" />}
            <Text className="text-white font-semibold">{quizId ? "Save Quiz Details" : "Create Quiz"}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Questions ─── */}
        <View className="border border-gray-100 rounded-2xl bg-white overflow-hidden mb-4">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-50">
            <Text className="text-sm font-semibold text-gray-800">
              Questions ({questions.length})
            </Text>
            <TouchableOpacity onPress={handleAddQuestion}
              className={`rounded-xl px-3 py-1.5 ${quizId ? "bg-purple-600" : "bg-gray-200"}`}>
              <Text className={`text-xs font-semibold ${quizId ? "text-white" : "text-gray-400"}`}>+ Add Question</Text>
            </TouchableOpacity>
          </View>

          {questions.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-8">
              {quizId ? "No questions yet. Add your first one." : "Save the quiz above to start adding questions."}
            </Text>
          ) : (
            questions.map((q, i) => (
              <View key={q.id ?? i} className="px-4 py-3 border-b border-gray-50">
                <View className="flex-row items-start gap-2">
                  <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center shrink-0 mt-0.5">
                    <Text className="text-xs font-bold text-purple-700">{i + 1}</Text>
                  </View>
                  <Text className="text-sm text-gray-800 flex-1" numberOfLines={2}>{q.questionText}</Text>
                </View>

                {/* Correct answer preview */}
                <View className="ml-8 mt-1.5 flex-row items-center gap-2">
                  <View className="bg-green-100 rounded-full px-2 py-0.5">
                    <Text className="text-xs text-green-600">
                      {OPTION_LABELS[q.correctOptionIndex]}: {q.options[q.correctOptionIndex]}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Text>
                </View>

                {/* Row actions */}
                <View className="flex-row gap-2 mt-2 ml-8">
                  <TouchableOpacity onPress={() => moveQuestion(i, -1)} disabled={i === 0}
                    className="border border-gray-100 rounded-lg px-2 py-1">
                    <Text className={`text-xs ${i === 0 ? "text-gray-300" : "text-gray-500"}`}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveQuestion(i, 1)} disabled={i === questions.length - 1}
                    className="border border-gray-100 rounded-lg px-2 py-1">
                    <Text className={`text-xs ${i === questions.length - 1 ? "text-gray-300" : "text-gray-500"}`}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEditQuestion(q)}
                    className="border border-gray-100 rounded-lg px-2 py-1">
                    <Text className="text-xs text-blue-500">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteQuestion(q)}
                    className="border border-red-100 rounded-lg px-2 py-1">
                    <Text className="text-xs text-red-400">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Done button */}
        {quizId && (
          <TouchableOpacity onPress={() => router.back()}
            className="border border-gray-200 rounded-xl py-3.5 items-center bg-white">
            <Text className="text-gray-600 font-medium">Done — Back to Quizzes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Question Modal */}
      <QuestionModal
        visible={modalVisible}
        question={editingQ}
        onSave={(q) => saveQuestionMutation.mutate(q)}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
