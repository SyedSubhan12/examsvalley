// EXTRACTED FROM: client/src/pages/teacher/MaterialEditorPage.tsx
// CONVERTED TO:   app/(teacher)/materials/[id].tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: react-hook-form/zod → manual useState; shadcn Select/Input/Textarea/FileDropper →
//   RN TextInput/TouchableOpacity/expo-document-picker; wouter → expo-router; useToast → Toast.show
// LOGIC CHANGES: id==='new' → create mode (POST /api/materials); else edit mode (PATCH /api/materials/:id).
//   Board→Qual→Subject→Topic cascade fully implemented. File upload via expo-document-picker.

import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

type ResourceType = "notes" | "video" | "worksheet" | "ebook" | "past_paper";
type Difficulty = "easy" | "medium" | "hard";

interface Board { id: string; displayName: string; }
interface Qualification { id: string; qualName?: string; qualKey: string; }
interface Subject { id: string; subjectName?: string; name?: string; }
interface Topic { id: string; name: string; }

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "notes", label: "Notes" },
  { value: "past_paper", label: "Past Paper" },
  { value: "video", label: "Video" },
  { value: "worksheet", label: "Worksheet" },
  { value: "ebook", label: "eBook" },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

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
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean; required?: boolean;
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
        className={`border rounded-xl px-4 py-3 flex-row items-center justify-between ${
          disabled ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"
        }`}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text className={`text-sm ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected?.label ?? (disabled ? "—" : "Select…")}
        </Text>
        {!disabled && <Text className="text-gray-400">{open ? "▾" : "▸"}</Text>}
      </TouchableOpacity>
      {open && (
        <View className="border border-gray-100 rounded-xl mt-1 bg-white overflow-hidden shadow-sm z-10">
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { onChange(opt.value); setOpen(false); }}
              className={`px-4 py-3 border-b border-gray-50 ${value === opt.value ? "bg-purple-50" : ""}`}
            >
              <Text className={`text-sm ${value === opt.value ? "text-purple-600 font-medium" : "text-gray-800"}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MaterialEditorPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== "new";

  const [form, setForm] = useState({
    title: "", description: "", type: "notes" as ResourceType,
    boardId: "", qualId: "", subjectId: "", topicId: "",
    year: "", difficulty: "medium" as Difficulty,
    fileUrl: "", videoUrl: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const f = <K extends keyof typeof form>(k: K) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Load existing material
  const { isLoading: materialLoading } = useQuery({
    queryKey: [`/api/materials/${id}`],
    enabled: isEditing && !loaded,
    queryFn: () => apiFetch(`/api/materials/${id}`),
    // @ts-ignore — onSuccess is valid in RQ v4 compat mode
    onSuccess: (m: any) => {
      setForm({
        title: m.title ?? "",
        description: m.description ?? "",
        type: (m.type ?? "notes") as ResourceType,
        boardId: m.boardId ?? "",
        qualId: m.qualId ?? "",
        subjectId: m.subjectId ?? "",
        topicId: m.topicId ?? "",
        year: m.year ? String(m.year) : "",
        difficulty: (m.difficulty ?? "medium") as Difficulty,
        fileUrl: m.fileUrl ?? "",
        videoUrl: m.videoUrl ?? "",
      });
      setLoaded(true);
    },
  });

  const { data: boards = [] } = useQuery<Board[]>({ queryKey: ["/api/curriculum/boards"] });

  const { data: quals = [] } = useQuery<Qualification[]>({
    queryKey: [`/api/curriculum/boards/${form.boardId}/qualifications`],
    enabled: !!form.boardId,
    queryFn: () => apiFetch(`/api/curriculum/boards/${form.boardId}/qualifications`),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: [`/api/curriculum/qualifications/${form.qualId}/subjects`],
    enabled: !!form.qualId,
    queryFn: () => apiFetch(`/api/curriculum/qualifications/${form.qualId}/subjects`),
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: [`/api/topics`, form.subjectId],
    enabled: !!form.subjectId,
    queryFn: () => apiFetch(`/api/topics?subjectId=${form.subjectId}`),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: DocumentPicker.DocumentPickerAsset) => {
      const fd = new FormData();
      fd.append("file", { uri: file.uri, name: file.name, type: file.mimeType ?? "application/pdf" } as any);
      const res = await fetch(`${BASE}/api/teacher/upload`, { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      isEditing
        ? apiFetch(`/api/materials/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : apiFetch("/api/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      Toast.show({ type: "success", text1: isEditing ? "Material updated" : "Material created" });
      router.back();
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Save failed", text2: e.message }),
  });

  const handlePickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (!res.canceled && res.assets?.[0]) {
      setPickedFile(res.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Toast.show({ type: "error", text1: "Title is required" }); return; }
    if (!form.boardId) { Toast.show({ type: "error", text1: "Board is required" }); return; }
    if (!form.subjectId) { Toast.show({ type: "error", text1: "Subject is required" }); return; }

    let finalFileUrl = form.fileUrl;
    if (pickedFile) {
      try {
        const up = await uploadMutation.mutateAsync(pickedFile);
        finalFileUrl = up.url;
      } catch (e: any) { Toast.show({ type: "error", text1: "Upload failed", text2: e.message }); return; }
    }

    saveMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      boardId: form.boardId,
      qualId: form.qualId || null,
      subjectId: form.subjectId,
      topicId: form.topicId || null,
      year: form.year ? parseInt(form.year) : null,
      difficulty: form.difficulty,
      fileUrl: finalFileUrl || null,
      videoUrl: form.type === "video" ? (form.videoUrl || null) : null,
    });
  };

  const isSaving = uploadMutation.isPending || saveMutation.isPending;

  if (isEditing && materialLoading && !loaded) {
    return <SafeAreaView className="flex-1 bg-white items-center justify-center"><ActivityIndicator size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 56 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-3 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-gray-500">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">
            {isEditing ? "Edit Material" : "Create Material"}
          </Text>
        </View>

        {/* Title */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Title <Text className="text-red-500">*</Text></Text>
          <TextInput value={form.title} onChangeText={f("title")} placeholder="e.g., Chapter 3 Notes"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-800" />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
          <TextInput value={form.description} onChangeText={f("description")} placeholder="Brief description…"
            multiline numberOfLines={3} textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-800" style={{ minHeight: 70 }} />
        </View>

        {/* Type */}
        <PickerField label="Type" value={form.type} options={RESOURCE_TYPES} onChange={f("type")} required />

        {/* Board → Qual → Subject → Topic cascade */}
        <PickerField label="Board" value={form.boardId} required
          options={boards.map((b) => ({ value: b.id, label: b.displayName }))}
          onChange={(v) => setForm((p) => ({ ...p, boardId: v, qualId: "", subjectId: "", topicId: "" }))} />

        <PickerField label="Qualification" value={form.qualId} disabled={!form.boardId}
          options={quals.map((q) => ({ value: q.id, label: q.qualName || q.qualKey }))}
          onChange={(v) => setForm((p) => ({ ...p, qualId: v, subjectId: "", topicId: "" }))} />

        <PickerField label="Subject" value={form.subjectId} required disabled={!form.qualId}
          options={subjects.map((s) => ({ value: s.id, label: s.subjectName || s.name || "" }))}
          onChange={(v) => setForm((p) => ({ ...p, subjectId: v, topicId: "" }))} />

        <PickerField label="Topic (optional)" value={form.topicId} disabled={!form.subjectId}
          options={topics.map((t) => ({ value: t.id, label: t.name }))} onChange={f("topicId")} />

        {/* Year */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Year</Text>
          <TextInput value={form.year} onChangeText={f("year")} placeholder="e.g., 2024"
            keyboardType="numeric"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-800" />
        </View>

        {/* Difficulty */}
        <PickerField label="Difficulty" value={form.difficulty} options={DIFFICULTIES} onChange={f("difficulty")} />

        {/* File */}
        {form.type !== "video" && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">File (PDF / image)</Text>
            <TouchableOpacity onPress={handlePickFile}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 items-center bg-white">
              <Text className="text-2xl mb-1">📎</Text>
              <Text className="text-sm text-gray-500" numberOfLines={1}>
                {pickedFile ? pickedFile.name : (form.fileUrl ? form.fileUrl.split("/").pop() : "Tap to pick a file")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Video URL */}
        {form.type === "video" && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Video URL</Text>
            <TextInput value={form.videoUrl} onChangeText={f("videoUrl")}
              placeholder="https://youtube.com/…" autoCapitalize="none" keyboardType="url"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-800" />
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 pt-5 border-t border-gray-100 mt-2">
          <TouchableOpacity onPress={handleSubmit} disabled={isSaving}
            className="flex-1 bg-purple-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2">
            {isSaving && <ActivityIndicator size="small" color="#fff" />}
            <Text className="text-white font-semibold">{isEditing ? "Save Changes" : "Create Material"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} disabled={isSaving}
            className="flex-1 border border-gray-200 rounded-xl py-3.5 items-center bg-white">
            <Text className="text-gray-600 font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
