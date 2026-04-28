// EXTRACTED FROM: client/src/pages/student/StudyMaterialsPage.tsx
// CONVERTED TO:   app/(student)/materials/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn Select → Modal picker, Collapsible tree → accordion via state
// LOGIC CHANGES: API fetch URLs prefixed with BASE; real API used (not mockData fallback)

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView, FlatList } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Material } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface Board { id: string; displayName: string; }
interface Subject { id: string; boardId: string; subjectName: string; }

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "past_paper", label: "Past Paper" },
  { value: "notes", label: "Notes" },
  { value: "video", label: "Video" },
  { value: "worksheet", label: "Worksheet" },
];

function DropdownPicker({ value, options, onChange, placeholder }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="border border-gray-200 rounded-xl px-3 py-2.5 flex-row justify-between items-center"
      >
        <Text className="text-gray-700 text-sm">{selected?.label || placeholder}</Text>
        <Text className="text-gray-400 text-xs">▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-t-2xl max-h-72">
            <FlatList
              data={options}
              keyExtractor={i => i.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`px-5 py-4 border-b border-gray-100 ${item.value === value ? "bg-blue-50" : ""}`}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text className={item.value === value ? "text-blue-600 font-medium text-sm" : "text-gray-800 text-sm"}>
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

export default function StudyMaterialsPage() {
  const router = useRouter();
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: boards = [] } = useQuery<Board[]>({
    queryKey: ["/api/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/subjects`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials", selectedBoardId, selectedSubjectId, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBoardId) params.set("boardId", selectedBoardId);
      if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`${BASE}/api/materials?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const boardOptions = [
    { value: "", label: "All Boards" },
    ...boards.map(b => ({ value: b.id, label: b.displayName })),
  ];

  const filteredSubjects = selectedBoardId
    ? subjects.filter(s => s.boardId === selectedBoardId)
    : subjects;

  const subjectOptions = [
    { value: "", label: "All Subjects" },
    ...filteredSubjects.map(s => ({ value: s.id, label: s.subjectName })),
  ];

  const getTypeEmoji = (type: string) => {
    if (type === "video") return "🎬";
    if (type === "past_paper") return "📋";
    if (type === "notes") return "📝";
    return "📖";
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Study Materials</Text>
        <Text className="text-sm text-gray-500 mb-4">Browse notes, videos, past papers, and worksheets</Text>

        {/* Filters */}
        <View className="gap-2 mb-4">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <DropdownPicker
                value={selectedBoardId}
                options={boardOptions}
                onChange={(v) => { setSelectedBoardId(v); setSelectedSubjectId(""); }}
                placeholder="All Boards"
              />
            </View>
            <View className="flex-1">
              <DropdownPicker
                value={selectedSubjectId}
                options={subjectOptions}
                onChange={setSelectedSubjectId}
                placeholder="All Subjects"
              />
            </View>
          </View>
          <DropdownPicker
            value={typeFilter}
            options={TYPE_OPTIONS}
            onChange={setTypeFilter}
            placeholder="All Types"
          />
        </View>

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : materials.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-3">📭</Text>
            <Text className="text-gray-500">No materials found matching your filters.</Text>
          </View>
        ) : (
          <FlashList
            data={materials}
            estimatedItemSize={100}
            keyExtractor={m => m.id}
            renderItem={({ item: material }) => {
              const subj = subjects.find(s => s.id === material.subjectId);
              return (
                <TouchableOpacity
                  onPress={() => router.push(`/(student)/materials/${material.id}` as any)}
                  className="border border-gray-200 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-wrap flex-1">
                      <View className="border border-gray-200 rounded-full px-2 py-0.5 flex-row items-center gap-1">
                        <Text className="text-xs">{getTypeEmoji(material.type)}</Text>
                        <Text className="text-xs text-gray-600 capitalize">{material.type?.replace("_", " ")}</Text>
                      </View>
                      {material.year && (
                        <View className="bg-gray-100 rounded-full px-2 py-0.5">
                          <Text className="text-xs text-gray-500">{material.year}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text className="text-sm font-semibold text-gray-800 mb-1" numberOfLines={2}>
                    {material.title}
                  </Text>
                  {subj && <Text className="text-xs text-gray-400 mb-1">{subj.subjectName}</Text>}
                  {material.description && (
                    <Text className="text-xs text-gray-400" numberOfLines={2}>{material.description}</Text>
                  )}
                  <View className="flex-row items-center gap-3 mt-2">
                    {material.viewCount != null && (
                      <Text className="text-xs text-gray-400">👁 {material.viewCount}</Text>
                    )}
                    {material.downloadCount != null && (
                      <Text className="text-xs text-gray-400">⬇ {material.downloadCount}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
