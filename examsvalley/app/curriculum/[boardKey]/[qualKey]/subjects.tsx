// EXTRACTED FROM: client/src/pages/curriculum/SubjectListPage.tsx (no-branch variant)
// CONVERTED TO:   app/curriculum/[boardKey]/[qualKey]/subjects.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives, SearchBar → TextInput, FilterChips → ScrollView chips

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Board, Qualification, Subject } from "@/lib/curriculumData";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export default function SubjectListPage() {
  const { boardKey, qualKey } = useLocalSearchParams<{ boardKey: string; qualKey: string }>();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersionTag, setSelectedVersionTag] = useState<string | null>(null);

  const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const board = boards.find(b => b.boardKey === boardKey);

  const { data: qualifications = [], isLoading: qualsLoading } = useQuery<Qualification[]>({
    queryKey: [`/api/curriculum/boards/${boardKey}/qualifications`],
    enabled: !!boardKey,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/boards/${boardKey}/qualifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const qualification = qualifications.find(q => q.qualKey === qualKey);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: [`/api/curriculum/qualifications/${qualification?.id}/subjects`, { branchId: null }],
    enabled: !!qualification?.id,
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/api/curriculum/qualifications/${qualification!.id}/subjects`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isLoading = boardsLoading || qualsLoading || subjectsLoading;

  const filteredSubjects = useMemo(() => {
    let result = subjects;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.subjectName.toLowerCase().includes(q) ||
        s.subjectCode?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    if (selectedVersionTag) {
      result = result.filter(s => s.versionTag === selectedVersionTag);
    }
    return result;
  }, [subjects, searchQuery, selectedVersionTag]);

  const versionTags = useMemo(() =>
    Array.from(new Set(subjects.map(s => s.versionTag).filter(Boolean) as string[])),
    [subjects]
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!board || !qualification) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <TouchableOpacity onPress={() => router.replace("/curriculum")} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Back to Curriculum</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-4">
        {/* Breadcrumb */}
        <TouchableOpacity onPress={() => router.push(`/curriculum/${boardKey}` as any)} className="mb-4">
          <Text className="text-gray-500 text-sm">← {board.displayName}</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-1">{qualification.displayName} Subjects</Text>
        <Text className="text-sm text-gray-500 mb-4">{board.displayName}</Text>

        {/* Search */}
        <View className="border border-gray-200 rounded-xl flex-row items-center px-3 mb-3">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search subjects by name or code..."
            placeholderTextColor="#9ca3af"
            className="flex-1 py-3 text-gray-800"
          />
        </View>

        {/* Version tag chips */}
        {versionTags.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedVersionTag(null)}
              className={`px-3 py-1.5 rounded-full border ${selectedVersionTag === null ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
            >
              <Text className={selectedVersionTag === null ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>All</Text>
            </TouchableOpacity>
            {versionTags.map(tag => (
              <TouchableOpacity
                key={tag}
                onPress={() => setSelectedVersionTag(tag)}
                className={`px-3 py-1.5 rounded-full border ${selectedVersionTag === tag ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
              >
                <Text className={selectedVersionTag === tag ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Count */}
        {filteredSubjects.length > 0 && (
          <Text className="text-xs text-gray-400 mb-2">{filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""}</Text>
        )}

        {/* List */}
        {filteredSubjects.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 mb-3">
              {searchQuery || selectedVersionTag ? "No subjects match your filters" : "No subjects available"}
            </Text>
            {(searchQuery || selectedVersionTag) && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSelectedVersionTag(null); }}>
                <Text className="text-blue-600 text-sm">Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlashList
            data={filteredSubjects}
            estimatedItemSize={60}
            keyExtractor={s => s.id}
            renderItem={({ item: subject }) => (
              <TouchableOpacity
                onPress={() => router.push(`/subject/${subject.id}` as any)}
                className="flex-row items-center justify-between p-4 border border-gray-100 rounded-xl mb-2"
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <Text className="font-medium text-gray-800">{subject.subjectName}</Text>
                    {subject.subjectCode && (
                      <View className="bg-gray-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-gray-600">{subject.subjectCode}</Text>
                      </View>
                    )}
                  </View>
                  {subject.versionTag && (
                    <Text className="text-xs text-gray-400 mt-0.5">{subject.versionTag}</Text>
                  )}
                </View>
                <Text className="text-gray-400">→</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
