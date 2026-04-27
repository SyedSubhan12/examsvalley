// EXTRACTED FROM: client/src/pages/admin/AdminResourceManagerPage.tsx
// CONVERTED TO:   app/(admin)/resources.tsx
// BUCKET:         D_replace
// WEB LIBRARIES REPLACED: UppyFolderUploader (web-only Uppy component) → expo-document-picker (single-file pick); iframe/window.confirm → RN Alert; shadcn Dialog/Select/Card/Button → RN Modal/TouchableOpacity/View
// LOGIC CHANGES: Bulk folder upload (UppyFolderUploader) replaced with single-file expo-document-picker. Multi-file batch upload not supported on native — documented limitation. File selection uses DocumentPicker.getDocumentAsync. API endpoints identical (/api/admin/boards, /api/curriculum/qualifications, etc.).

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminBoard { id: string; displayName: string; boardKey: string; isEnabled: boolean; }
interface Qualification { id: string; qualName?: string; qualKey: string; description?: string; }
interface Subject { id: string; subjectName?: string; name?: string; subjectCode?: string; slug?: string; }
interface ResourceCategory { resourceKey: string; label: string; }
interface ResourceNode { id: string; title: string; nodeType: string; sortOrder: number; }
interface FileAsset { id: string; title: string; fileName?: string; url?: string; fileSize?: number | null; year?: number; session?: string; paper?: string; downloadCount?: number; }

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

type View_ = "boards" | "qualifications" | "subjects" | "categories" | "nodes";

export default function AdminResourceManagerPage() {
  const queryClient = useQueryClient();

  const [selectedBoard, setSelectedBoard] = useState<AdminBoard | null>(null);
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCat, setSelectedCat] = useState<ResourceCategory | null>(null);
  const [nodeStack, setNodeStack] = useState<{ id: string; title: string }[]>([]);

  const [subjectSearch, setSubjectSearch] = useState("");
  const [showNewNodeModal, setShowNewNodeModal] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeType, setNewNodeType] = useState("folder");

  const currentView: View_ = !selectedBoard
    ? "boards"
    : !selectedQual
    ? "qualifications"
    : !selectedSubject
    ? "subjects"
    : !selectedCat
    ? "categories"
    : "nodes";

  const currentParentNodeId =
    nodeStack.length > 0 ? nodeStack[nodeStack.length - 1].id : null;

  const { data: boards = [], isLoading: loadingBoards } = useQuery<AdminBoard[]>({
    queryKey: ["admin-boards"],
    queryFn: () => apiFetch("/api/admin/boards"),
  });

  const { data: qualifications = [], isLoading: loadingQuals } = useQuery<Qualification[]>({
    queryKey: ["qualifications", selectedBoard?.id],
    queryFn: () => apiFetch(`/api/curriculum/qualifications?boardId=${selectedBoard!.id}`),
    enabled: !!selectedBoard,
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<Subject[]>({
    queryKey: ["qual-subjects", selectedQual?.id],
    queryFn: () => apiFetch(`/api/curriculum/subjects?qualificationId=${selectedQual!.id}`),
    enabled: !!selectedQual,
  });

  const { data: categories = [] } = useQuery<ResourceCategory[]>({
    queryKey: ["resource-categories"],
    queryFn: () => apiFetch("/api/admin/resource-categories"),
    enabled: !!selectedSubject,
  });

  const { data: nodes = [], isLoading: loadingNodes } = useQuery<ResourceNode[]>({
    queryKey: ["resource-nodes", selectedSubject?.id, selectedCat?.resourceKey, currentParentNodeId],
    queryFn: () =>
      apiFetch(
        `/api/admin/resource-nodes?subjectId=${selectedSubject!.id}&resourceKey=${selectedCat!.resourceKey}${currentParentNodeId ? `&parentNodeId=${currentParentNodeId}` : ""}`
      ),
    enabled: !!selectedSubject && !!selectedCat,
  });

  const { data: files = [], isLoading: loadingFiles } = useQuery<FileAsset[]>({
    queryKey: ["node-files", currentParentNodeId],
    queryFn: () => apiFetch(`/api/admin/resource-nodes/${currentParentNodeId}/files`),
    enabled: !!currentParentNodeId,
  });

  const createNodeMutation = useMutation({
    mutationFn: (body: object) =>
      apiFetch("/api/admin/resource-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-nodes", selectedSubject?.id, selectedCat?.resourceKey] });
      setShowNewNodeModal(false);
      setNewNodeTitle("");
      Toast.show({ type: "success", text1: "Folder Created" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  const deleteNodeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/resource-nodes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource-nodes", selectedSubject?.id, selectedCat?.resourceKey] });
      Toast.show({ type: "success", text1: "Folder Deleted" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: DocumentPicker.DocumentPickerAsset) => {
      const formData = new FormData();
      formData.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "application/pdf" } as any);
      formData.append("subjectId", selectedSubject!.id);
      formData.append("resourceKey", selectedCat!.resourceKey);
      if (currentParentNodeId) formData.append("nodeId", currentParentNodeId);
      formData.append("title", file.name.replace(/\.pdf$/i, ""));
      const res = await fetch(`${BASE}/api/admin/file-assets`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["node-files", currentParentNodeId] });
      Toast.show({ type: "success", text1: "File Uploaded" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Upload Failed", text2: e.message }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/file-assets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["node-files", currentParentNodeId] });
      Toast.show({ type: "success", text1: "File Deleted" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      uploadMutation.mutate(result.assets[0]);
    }
  };

  const handleDeleteNode = (node: ResourceNode) => {
    Alert.alert("Delete Folder", `Delete "${node.title}" and all its files?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNodeMutation.mutate(node.id) },
    ]);
  };

  const handleDeleteFile = (file: FileAsset) => {
    Alert.alert("Delete File", `Delete "${file.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteFileMutation.mutate(file.id) },
    ]);
  };

  // Breadcrumb items
  const breadcrumb = [
    { label: "Resources", onPress: () => { setSelectedBoard(null); setSelectedQual(null); setSelectedSubject(null); setSelectedCat(null); setNodeStack([]); } },
    ...(selectedBoard ? [{ label: selectedBoard.displayName, onPress: selectedQual ? () => { setSelectedQual(null); setSelectedSubject(null); setSelectedCat(null); setNodeStack([]); } : undefined }] : []),
    ...(selectedQual ? [{ label: selectedQual.qualName || selectedQual.qualKey, onPress: selectedSubject ? () => { setSelectedSubject(null); setSelectedCat(null); setNodeStack([]); } : undefined }] : []),
    ...(selectedSubject ? [{ label: selectedSubject.subjectName || selectedSubject.name || "", onPress: selectedCat ? () => { setSelectedCat(null); setNodeStack([]); } : undefined }] : []),
    ...(selectedCat ? [{ label: selectedCat.label, onPress: nodeStack.length > 0 ? () => { setNodeStack([]); } : undefined }] : []),
    ...nodeStack.map((ns, i) => ({ label: ns.title, onPress: i < nodeStack.length - 1 ? () => setNodeStack((p) => p.slice(0, i + 1)) : undefined })),
  ];

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Resource Manager</Text>
        <Text className="text-sm text-gray-500 mb-4">
          Manage curriculum resources: boards → qualifications → subjects → categories → files
        </Text>

        {/* Breadcrumb */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row items-center gap-1">
            {breadcrumb.map((item, i) => (
              <View key={i} className="flex-row items-center">
                {i > 0 && <Text className="text-gray-400 mx-1">›</Text>}
                {item.onPress ? (
                  <TouchableOpacity onPress={item.onPress}>
                    <Text className="text-sm text-blue-600 underline">{item.label}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-sm font-semibold text-gray-800">{item.label}</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Board picker */}
        {currentView === "boards" && (
          loadingBoards ? <ActivityIndicator size="large" className="py-8" /> :
          boards.filter((b) => b.isEnabled).map((board) => (
            <TouchableOpacity key={board.id} onPress={() => setSelectedBoard(board)} className="border border-gray-100 rounded-2xl p-4 bg-white mb-3 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center">
                <Text className="text-lg">📁</Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-800">{board.displayName}</Text>
                <Text className="text-xs text-gray-400">{board.boardKey}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Qualification picker */}
        {currentView === "qualifications" && (
          loadingQuals ? <ActivityIndicator size="large" className="py-8" /> :
          qualifications.length === 0 ? <Text className="text-sm text-gray-400 text-center py-8">No qualifications found.</Text> :
          qualifications.map((qual) => (
            <TouchableOpacity key={qual.id} onPress={() => setSelectedQual(qual)} className="border border-gray-100 rounded-2xl p-4 bg-white mb-3 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center">
                <Text className="text-lg">📂</Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-800">{qual.qualName || qual.qualKey}</Text>
                {qual.description && <Text className="text-xs text-gray-400" numberOfLines={1}>{qual.description}</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Subject picker */}
        {currentView === "subjects" && (
          <View>
            <TextInput value={subjectSearch} onChangeText={setSubjectSearch} placeholder="Search subjects…" className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white mb-3" />
            {loadingSubjects ? <ActivityIndicator size="large" className="py-8" /> :
              subjects
                .filter((s) => {
                  const q = subjectSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (s.subjectName || s.name || "").toLowerCase().includes(q) || (s.subjectCode || "").toLowerCase().includes(q);
                })
                .map((subj) => (
                  <TouchableOpacity key={subj.id} onPress={() => setSelectedSubject(subj)} className="border border-gray-100 rounded-2xl p-4 bg-white mb-3 flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-xl bg-green-100 items-center justify-center">
                      <Text>📄</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-gray-800">{subj.subjectName || subj.name}</Text>
                      {subj.subjectCode && <Text className="text-xs text-gray-400">{subj.subjectCode}</Text>}
                    </View>
                  </TouchableOpacity>
                ))
            }
          </View>
        )}

        {/* Category picker */}
        {currentView === "categories" && (
          categories.length === 0 ? <Text className="text-sm text-gray-400 text-center py-8">No resource categories configured.</Text> :
          categories.map((cat) => (
            <TouchableOpacity key={cat.resourceKey} onPress={() => setSelectedCat(cat)} className="border border-gray-100 rounded-2xl p-4 bg-white mb-3 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center">
                <Text className="text-lg">📁</Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-800">{cat.label}</Text>
                <Text className="text-xs text-gray-400">{cat.resourceKey}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Node explorer */}
        {currentView === "nodes" && (
          <View>
            {/* Actions */}
            <View className="flex-row gap-2 mb-4">
              {nodeStack.length > 0 && (
                <TouchableOpacity onPress={() => setNodeStack((p) => p.slice(0, -1))} className="border border-gray-200 rounded-xl px-3 py-2">
                  <Text className="text-sm text-gray-600">← Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handlePickFile} disabled={uploadMutation.isPending} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 flex-row items-center justify-center gap-1">
                {uploadMutation.isPending ? <ActivityIndicator size="small" /> : <Text>📤</Text>}
                <Text className="text-sm text-gray-700">Upload PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNewNodeModal(true)} className="bg-blue-600 rounded-xl px-3 py-2 flex-row items-center gap-1">
                <Text className="text-white text-sm">📁+ Folder</Text>
              </TouchableOpacity>
            </View>

            {/* Upload limitation notice */}
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <Text className="text-xs text-amber-700">
                Folder/bulk upload not available on mobile. Pick a single PDF file to upload.
              </Text>
            </View>

            {/* Folders */}
            {loadingNodes ? <ActivityIndicator size="small" className="py-4" /> :
              nodes.map((node) => (
                <View key={node.id} className="flex-row items-center border border-gray-100 rounded-xl p-3 bg-white mb-2">
                  <TouchableOpacity className="flex-1 flex-row items-center gap-3" onPress={() => setNodeStack((p) => [...p, { id: node.id, title: node.title }])}>
                    <Text className="text-lg">📂</Text>
                    <View>
                      <Text className="text-sm font-medium text-gray-800">{node.title}</Text>
                      <Text className="text-xs text-gray-400">{node.nodeType}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteNode(node)} disabled={deleteNodeMutation.isPending} className="p-1">
                    <Text className="text-red-400">🗑</Text>
                  </TouchableOpacity>
                </View>
              ))
            }
            {!loadingNodes && nodes.length === 0 && (
              <Text className="text-sm text-gray-400 text-center py-4">No folders yet. Create one to organize files.</Text>
            )}

            {/* Files */}
            {currentParentNodeId && (
              <View className="mt-4 border-t border-gray-100 pt-4">
                <Text className="text-sm font-semibold text-gray-800 mb-3">Files in {nodeStack[nodeStack.length - 1]?.title}</Text>
                {loadingFiles ? <ActivityIndicator size="small" /> :
                  files.length === 0 ? <Text className="text-sm text-gray-400 text-center py-4">No files yet. Upload a PDF to get started.</Text> :
                  files.map((file) => (
                    <View key={file.id} className="flex-row items-center border border-gray-100 rounded-xl p-3 bg-white mb-2">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{file.title}</Text>
                        <Text className="text-xs text-gray-400">
                          {formatSize(file.fileSize)}{file.year ? ` • ${file.year}` : ""}{file.session ? ` • ${file.session}` : ""}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteFile(file)} disabled={deleteFileMutation.isPending} className="p-1">
                        <Text className="text-red-400">🗑</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                }
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* New Folder Modal */}
      <Modal visible={showNewNodeModal} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Create New Folder</Text>
            <Text className="text-sm font-medium text-gray-700 mb-1">Folder Name</Text>
            <TextInput
              value={newNodeTitle}
              onChangeText={setNewNodeTitle}
              placeholder="e.g., 2024, May/June, Paper 1"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
            <View className="flex-row gap-2 mb-4">
              {["folder", "year", "session"].map((t) => (
                <TouchableOpacity key={t} onPress={() => setNewNodeType(t)} className={`flex-1 border rounded-xl py-2 items-center ${newNodeType === t ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}>
                  <Text className={`text-sm ${newNodeType === t ? "text-blue-600 font-medium" : "text-gray-600"}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowNewNodeModal(false)} className="flex-1 border border-gray-200 rounded-xl py-3 items-center">
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!newNodeTitle.trim() || !selectedSubject || !selectedCat) return;
                  createNodeMutation.mutate({
                    subjectId: selectedSubject.id,
                    resourceKey: selectedCat.resourceKey,
                    parentNodeId: currentParentNodeId,
                    title: newNodeTitle.trim(),
                    nodeType: newNodeType,
                    sortOrder: nodes.length,
                  });
                }}
                disabled={!newNodeTitle.trim() || createNodeMutation.isPending}
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
              >
                {createNodeMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
