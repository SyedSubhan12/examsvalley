// EXTRACTED FROM: client/src/pages/subjects/SubjectsSearchPage.tsx
// CONVERTED TO:   app/subjects/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives, SearchBar → TextInput, FilterChips → ScrollView

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Board, Qualification, Subject } from "@/lib/curriculumData";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function GlobalSubjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedQualId, setSelectedQualId] = useState<string | null>(null);

  const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: qualifications = [] } = useQuery<Qualification[]>({
    queryKey: [`/api/curriculum/boards/${selectedBoardId}/qualifications`],
    enabled: !!selectedBoardId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards/${selectedBoardId}/qualifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: allSubjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/curriculum/subjects"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/subjects`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const handleBoardChange = (id: string | null) => {
    setSelectedBoardId(id);
    setSelectedQualId(null);
  };

  const filteredSubjects = useMemo(() => {
    let result = allSubjects;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.subjectName.toLowerCase().includes(q) ||
        s.subjectCode?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    if (selectedBoardId) result = result.filter(s => s.boardId === selectedBoardId);
    if (selectedQualId) result = result.filter(s => s.qualId === selectedQualId);
    return result;
  }, [allSubjects, searchQuery, selectedBoardId, selectedQualId]);

  const isLoading = boardsLoading || subjectsLoading;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gray-500 text-sm">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Search Subjects</Text>
        <Text className="text-sm text-gray-500 mb-4">Find subjects across all boards and qualifications</Text>

        {/* Search */}
        <View className="border border-gray-200 rounded-xl flex-row items-center px-3 mb-4">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by subject name or code..."
            placeholderTextColor="#9ca3af"
            className="flex-1 py-3 text-gray-800"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Board filter */}
        <Text className="text-xs font-medium text-gray-500 mb-2">Filter by Board</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleBoardChange(null)}
            className={`px-3 py-1.5 rounded-full border ${selectedBoardId === null ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
          >
            <Text className={selectedBoardId === null ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>All Boards</Text>
          </TouchableOpacity>
          {boards.map(b => (
            <TouchableOpacity
              key={b.id}
              onPress={() => handleBoardChange(b.id)}
              className={`px-3 py-1.5 rounded-full border ${selectedBoardId === b.id ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
            >
              <Text className={selectedBoardId === b.id ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>{b.displayName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Qual filter (when board selected) */}
        {selectedBoardId && qualifications.length > 0 && (
          <>
            <Text className="text-xs font-medium text-gray-500 mb-2">Filter by Qualification</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSelectedQualId(null)}
                className={`px-3 py-1.5 rounded-full border ${selectedQualId === null ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
              >
                <Text className={selectedQualId === null ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>All</Text>
              </TouchableOpacity>
              {qualifications.map(q => (
                <TouchableOpacity
                  key={q.id}
                  onPress={() => setSelectedQualId(q.id)}
                  className={`px-3 py-1.5 rounded-full border ${selectedQualId === q.id ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
                >
                  <Text className={selectedQualId === q.id ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>{q.displayName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : filteredSubjects.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 mb-3">
              {searchQuery || selectedBoardId ? "No subjects match your search" : "No subjects available"}
            </Text>
            {(searchQuery || selectedBoardId) && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSelectedBoardId(null); setSelectedQualId(null); }}>
                <Text className="text-blue-600 text-sm">Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text className="text-xs text-gray-400 mb-2">
              {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""} found
            </Text>
            <FlashList
              data={filteredSubjects}
              estimatedItemSize={60}
              keyExtractor={s => s.id}
              renderItem={({ item: subject }) => {
                const board = boards.find(b => b.id === subject.boardId);
                return (
                  <TouchableOpacity
                    onPress={() => router.push(`/subject/${subject.id}` as any)}
                    className="flex-row items-center gap-3 p-4 border border-gray-100 rounded-xl mb-2"
                  >
                    <View className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center flex-shrink-0">
                      <Text className="text-blue-600 font-bold text-sm">{subject.subjectName[0]}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="font-medium text-gray-800">{subject.subjectName}</Text>
                        {subject.subjectCode && (
                          <View className="bg-gray-100 px-2 py-0.5 rounded">
                            <Text className="text-xs text-gray-500">{subject.subjectCode}</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        {board && <Text className="text-xs text-gray-400">{board.displayName}</Text>}
                        {subject.versionTag && (
                          <>
                            {board && <Text className="text-xs text-gray-300">•</Text>}
                            <Text className="text-xs text-gray-400">{subject.versionTag}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <Text className="text-gray-400">→</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
