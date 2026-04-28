// EXTRACTED FROM: client/src/pages/subject/ResourceListPage.tsx
// CONVERTED TO:   app/subject/[subjectId]/resource/[resourceKey]/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn → RN primitives
// LOGIC CHANGES: File type filter chips, folder rows, file rows — all RN primitives; MultiViewResourceBrowser → omitted (complex web-only component)

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import type { Subject, ResourceCategory, ResourceNode, FileAsset, FileType } from "@/lib/curriculumData";
import { parseCAIEFilename } from "@/lib/caie-utils";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface SubjectContext { subject: Subject; }

const FILE_TYPE_LABELS: Record<string, string> = {
  qp: "Question Paper", ms: "Mark Scheme", sp: "Specimen Paper",
  er: "Examiner Report", gt: "Grade Threshold", syllabus: "Syllabus",
  other: "Other",
};

export default function ResourceListPage() {
  const { subjectId, resourceKey } = useLocalSearchParams<{ subjectId: string; resourceKey: string }>();
  const router = useRouter();
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);

  const { data: context, isLoading: contextLoading } = useQuery<SubjectContext>({
    queryKey: [`/api/curriculum/subjects/${subjectId}/context`],
    enabled: !!subjectId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/subjects/${subjectId}/context`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/curriculum/resource-categories"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/resource-categories`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const category = categories.find(c => c.resourceKey === resourceKey);

  const { data: rootNodes = [], isLoading: rootNodesLoading } = useQuery<ResourceNode[]>({
    queryKey: [`/api/curriculum/subjects/${subjectId}/resource-nodes`, { resourceKey, parentNodeId: null }],
    enabled: !!subjectId && !!resourceKey,
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/api/curriculum/subjects/${subjectId}/resource-nodes?resourceKey=${resourceKey}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: allFiles = [], isLoading: filesLoading } = useQuery<FileAsset[]>({
    queryKey: [`/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/files`],
    enabled: !!subjectId && !!resourceKey,
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/files`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const matchingPairs = useMemo(() => {
    const pairs = new Map<string, string>();
    allFiles.forEach(f => {
      if (f.fileType !== "qp" && f.fileType !== "ms") return;
      const targetType = f.fileType === "qp" ? "ms" : "qp";
      const related = allFiles.find(other =>
        other.id !== f.id && other.fileType === targetType &&
        other.year === f.year && other.session === f.session &&
        other.paper === f.paper && other.variant === f.variant
      );
      if (related) pairs.set(f.id, related.id);
    });
    return pairs;
  }, [allFiles]);

  const availableFileTypes = useMemo(() => {
    const types = new Set<FileType>();
    allFiles.forEach(f => types.add(f.fileType));
    return Array.from(types).sort();
  }, [allFiles]);

  const filteredFiles = selectedFileType
    ? allFiles.filter(f => f.fileType === selectedFileType)
    : allFiles;

  const isLoading = contextLoading || rootNodesLoading || filesLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!context || !category) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Not Found</Text>
        <TouchableOpacity onPress={() => router.replace("/subjects")} className="bg-blue-600 rounded-xl px-5 py-3">
          <Text className="text-white font-semibold">← Search Subjects</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { subject } = context;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-4">
        {/* Back */}
        <TouchableOpacity onPress={() => router.push(`/subject/${subjectId}` as any)} className="mb-4">
          <Text className="text-gray-500 text-sm">← {subject.subjectName}</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-1">{category.displayName}</Text>
        <Text className="text-sm text-gray-500 mb-4">{subject.subjectName}</Text>

        {/* File type filter chips */}
        {availableFileTypes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedFileType(null)}
              className={`px-3 py-1.5 rounded-full border ${selectedFileType === null ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
            >
              <Text className={selectedFileType === null ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>All Types</Text>
            </TouchableOpacity>
            {availableFileTypes.map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedFileType(type)}
                className={`px-3 py-1.5 rounded-full border ${selectedFileType === type ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
              >
                <Text className={selectedFileType === type ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>
                  {FILE_TYPE_LABELS[type] || type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Folders */}
          {rootNodes.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Folders</Text>
              {rootNodes.map(node => (
                <TouchableOpacity
                  key={node.id}
                  onPress={() => router.push(`/subject/${subjectId}/files?resource=${resourceKey}&folder=${node.id}` as any)}
                  className="flex-row items-center gap-3 p-4 border border-gray-100 rounded-xl mb-2"
                >
                  <Text className="text-xl">📁</Text>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800">{node.title}</Text>
                    {node.fileCount != null && (
                      <Text className="text-xs text-gray-400">{node.fileCount} files</Text>
                    )}
                  </View>
                  <Text className="text-gray-400">→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Files */}
          {filteredFiles.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                Files {selectedFileType ? `(${selectedFileType.toUpperCase()})` : ""}
              </Text>
              {filteredFiles.map(file => (
                <FileRow
                  key={file.id}
                  file={file}
                  relatedFileId={matchingPairs.get(file.id)}
                  onOpen={() => router.push(`/view/file/${file.id}` as any)}
                />
              ))}
            </View>
          )}

          {/* Empty state */}
          {rootNodes.length === 0 && allFiles.length === 0 && (
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-gray-500">No resources available yet</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function FileRow({
  file, relatedFileId, onOpen,
}: {
  file: FileAsset;
  relatedFileId?: string;
  onOpen: () => void;
}) {
  const typeLabel = FILE_TYPE_LABELS[file.fileType] || file.fileType?.toUpperCase() || "File";
  const subtitle = [
    file.year, file.session, file.paper ? `Paper ${file.paper}` : null,
    file.variant ? `Variant ${file.variant}` : null,
  ].filter(Boolean).join(" • ");

  return (
    <TouchableOpacity
      onPress={onOpen}
      className="flex-row items-center gap-3 p-4 border border-gray-100 rounded-xl mb-2"
    >
      <View className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center flex-shrink-0">
        <Text className="text-lg">📄</Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-medium text-gray-800 text-sm" numberOfLines={1}>
          {file.title || file.fileName || "Untitled"}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>
        ) : null}
        <View className="mt-1">
          <View className="bg-gray-100 rounded px-2 py-0.5 self-start">
            <Text className="text-xs text-gray-500">{typeLabel}</Text>
          </View>
        </View>
      </View>
      <Text className="text-gray-400">›</Text>
    </TouchableOpacity>
  );
}
