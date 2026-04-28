// EXTRACTED FROM: client/src/pages/subject/FileBrowserPage.tsx
// CONVERTED TO:   app/subject/[subjectId]/files.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter useSearch → useLocalSearchParams, shadcn → RN primitives
// LOGIC CHANGES: Query params via useLocalSearchParams; Paper/Variant filter chips → TouchableOpacity rows

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Subject, ResourceCategory, ResourceNode, FileAsset, FileType } from "@/lib/curriculumData";
import { parseCAIEFilename } from "@/lib/caie-utils";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface SubjectContext { subject: Subject; }

const FILE_TYPE_LABELS: Record<string, string> = {
  qp: "QP", ms: "MS", sp: "SP", er: "ER", gt: "GT", syllabus: "SYL", other: "Other",
};

export default function FileBrowserPage() {
  const { subjectId, resource, folder, mode } = useLocalSearchParams<{
    subjectId: string; resource?: string; folder?: string; mode?: string;
  }>();
  const router = useRouter();

  const resourceKey = resource || "past_papers";
  const folderId = folder || null;

  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

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

  const { data: folderNodes = [], isLoading: folderNodesLoading } = useQuery<ResourceNode[]>({
    queryKey: [`/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/nodes`, { parentNodeId: folderId }],
    enabled: !!subjectId && !!resourceKey,
    queryFn: async () => {
      const url = new URL(`${BASE}/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/nodes`);
      if (folderId) url.searchParams.set("parentNodeId", folderId);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<FileAsset[]>({
    queryKey: [`/api/curriculum/nodes/${folderId}/files`],
    enabled: !!folderId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/nodes/${folderId}/files`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: currentFolder } = useQuery<ResourceNode>({
    queryKey: [`/api/curriculum/nodes/${folderId}`],
    enabled: !!folderId,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/curriculum/nodes/${folderId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Enrich files with CAIE metadata
  const enrichedFiles = useMemo(() => {
    return files.map(file => {
      if (file.fileType !== "other") return file;
      const parsed = parseCAIEFilename(file.title || file.fileName || "");
      if (parsed.isValid) {
        return {
          ...file,
          fileType: parsed.fileType,
          year: file.year || parsed.year || undefined,
          session: file.session || parsed.sessionCode || undefined,
          paper: file.paper || parsed.paper || undefined,
          variant: file.variant || parsed.variant || undefined,
        };
      }
      return file;
    });
  }, [files]);

  const availableFileTypes = useMemo(() => {
    const types = new Set<FileType>();
    enrichedFiles.forEach(f => types.add(f.fileType));
    return Array.from(types).sort();
  }, [enrichedFiles]);

  const availablePapers = useMemo(() => {
    const papers = new Set<number>();
    enrichedFiles.forEach(f => { if (f.paper != null) papers.add(f.paper); });
    return Array.from(papers).sort((a, b) => a - b);
  }, [enrichedFiles]);

  const availableVariants = useMemo(() => {
    const variants = new Set<number>();
    enrichedFiles.forEach(f => {
      if (f.variant != null) {
        if (selectedPaper === null || f.paper === selectedPaper) variants.add(f.variant);
      }
    });
    return Array.from(variants).sort((a, b) => a - b);
  }, [enrichedFiles, selectedPaper]);

  const matchingPairs = useMemo(() => {
    const pairs = new Map<string, string>();
    enrichedFiles.forEach(f => {
      if (f.fileType !== "qp" && f.fileType !== "ms") return;
      const targetType = f.fileType === "qp" ? "ms" : "qp";
      const related = enrichedFiles.find(other =>
        other.id !== f.id && other.fileType === targetType &&
        other.year === f.year && other.session === f.session &&
        other.paper === f.paper && other.variant === f.variant
      );
      if (related) pairs.set(f.id, related.id);
    });
    return pairs;
  }, [enrichedFiles]);

  const filteredFiles = useMemo(() => {
    return enrichedFiles.filter(f => {
      const typeMatch = !selectedFileType || f.fileType === selectedFileType;
      const paperMatch = selectedPaper === null || f.paper === selectedPaper;
      const variantMatch = selectedVariant === null || f.variant === selectedVariant;
      return typeMatch && paperMatch && variantMatch;
    });
  }, [enrichedFiles, selectedFileType, selectedPaper, selectedVariant]);

  const isLoading = contextLoading || folderNodesLoading || (filesLoading && !!folderId);

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
  const title = currentFolder?.title || category.displayName;
  const backHref = folderId
    ? `/subject/${subjectId}/resource/${resourceKey}`
    : `/subject/${subjectId}`;

  const getFolderHref = (nodeId: string) => {
    const params = new URLSearchParams({ resource: resourceKey, folder: nodeId });
    if (mode) params.set("mode", mode);
    return `/subject/${subjectId}/files?${params.toString()}`;
  };

  const hasFilters = selectedFileType || selectedPaper !== null || selectedVariant !== null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-4">
        {/* Back */}
        <TouchableOpacity onPress={() => router.push(backHref as any)} className="mb-4">
          <Text className="text-gray-500 text-sm">← {folderId ? category.displayName : subject.subjectName}</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900 mb-1">{title}</Text>
        <Text className="text-sm text-gray-500 mb-4">{subject.subjectName}</Text>

        {/* Filters */}
        {availableFileTypes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedFileType(null)}
              className={`px-3 py-1.5 rounded-full border ${selectedFileType === null ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
            >
              <Text className={selectedFileType === null ? "text-white text-xs font-medium" : "text-gray-600 text-xs"}>All</Text>
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

        {/* Paper / variant filters */}
        {availablePapers.length > 0 && (
          <View className="flex-row items-center gap-2 mb-2 flex-wrap">
            <Text className="text-xs font-medium text-gray-500">Paper:</Text>
            <TouchableOpacity
              onPress={() => setSelectedPaper(null)}
              className={`px-2.5 py-1 rounded border text-xs ${selectedPaper === null ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
            >
              <Text className={selectedPaper === null ? "text-white font-medium" : "text-gray-500"}>All</Text>
            </TouchableOpacity>
            {availablePapers.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => { setSelectedPaper(p); setSelectedVariant(null); }}
                className={`px-2.5 py-1 rounded border text-xs ${selectedPaper === p ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
              >
                <Text className={selectedPaper === p ? "text-white font-medium" : "text-gray-500"}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {availableVariants.length > 0 && (
          <View className="flex-row items-center gap-2 mb-2 flex-wrap">
            <Text className="text-xs font-medium text-gray-500">Variant:</Text>
            <TouchableOpacity
              onPress={() => setSelectedVariant(null)}
              className={`px-2.5 py-1 rounded border text-xs ${selectedVariant === null ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
            >
              <Text className={selectedVariant === null ? "text-white font-medium" : "text-gray-500"}>All</Text>
            </TouchableOpacity>
            {availableVariants.map(v => (
              <TouchableOpacity
                key={v}
                onPress={() => setSelectedVariant(v)}
                className={`px-2.5 py-1 rounded border text-xs ${selectedVariant === v ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
              >
                <Text className={selectedVariant === v ? "text-white font-medium" : "text-gray-500"}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {hasFilters && (
          <TouchableOpacity
            onPress={() => { setSelectedFileType(null); setSelectedPaper(null); setSelectedVariant(null); }}
            className="mb-3 self-end"
          >
            <Text className="text-xs text-blue-600">Reset all filters</Text>
          </TouchableOpacity>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Folders */}
          {folderNodes.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs font-medium text-gray-500 mb-2">Folders</Text>
              {folderNodes.map(node => (
                <TouchableOpacity
                  key={node.id}
                  onPress={() => router.push(getFolderHref(node.id) as any)}
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
              <Text className="text-xs font-medium text-gray-500 mb-2">
                Files {selectedFileType ? `(${selectedFileType.toUpperCase()})` : ""}
              </Text>
              {filteredFiles.map(file => (
                <TouchableOpacity
                  key={file.id}
                  onPress={() => router.push(`/view/file/${file.id}` as any)}
                  className="flex-row items-center gap-3 p-4 border border-gray-100 rounded-xl mb-2"
                >
                  <View className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center flex-shrink-0">
                    <Text className="text-lg">📄</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-medium text-gray-800 text-sm" numberOfLines={1}>
                      {file.title || file.fileName || "Untitled"}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {[file.year, file.session, file.paper != null ? `P${file.paper}` : null, file.variant != null ? `V${file.variant}` : null].filter(Boolean).join(" • ")}
                    </Text>
                    {file.fileType && (
                      <View className="bg-gray-100 rounded px-1.5 py-0.5 self-start mt-1">
                        <Text className="text-xs text-gray-500">{FILE_TYPE_LABELS[file.fileType] || file.fileType}</Text>
                      </View>
                    )}
                  </View>
                  {matchingPairs.has(file.id) && (
                    <View className="bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                      <Text className="text-xs text-blue-600">Paired</Text>
                    </View>
                  )}
                  <Text className="text-gray-400">›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty state */}
          {folderNodes.length === 0 && files.length === 0 && (
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-gray-500 mb-2">This folder is empty</Text>
              <TouchableOpacity onPress={() => router.push(`/subject/${subjectId}/resource/${resourceKey}` as any)}>
                <Text className="text-blue-600 text-sm">← Back to {category.displayName}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
