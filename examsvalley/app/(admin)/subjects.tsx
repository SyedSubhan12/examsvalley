// EXTRACTED FROM: client/src/pages/admin/SubjectsTopicsPage.tsx
// CONVERTED TO:   app/(admin)/subjects.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn Select/Dialog/AlertDialog/Card/Input/Textarea/Button/Label → RN Picker/Modal/View/TextInput/TouchableOpacity, PageHeader → inline header, useToast → react-native-toast-message
// LOGIC CHANGES: Select dropdowns → TouchableOpacity pickers with inline list; Dialog/AlertDialog → RN Modal; tree expand/collapse preserved; topic CRUD and subject CRUD APIs identical (/api/admin/subjects, /api/admin/topics, /api/admin/boards).

import { useState, useEffect } from "react";
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
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface AdminBoard { id: string; displayName: string; boardKey: string; isEnabled: boolean; }
interface AdminSubject { id: string; subjectName: string; subjectCode?: string; name?: string; code?: string; description?: string | null; isActive: boolean; boardId?: string; }
interface AdminTopic { id: string; name: string; description?: string | null; parentId?: string | null; subjectId: string; }

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

function TopicRow({
  topic,
  topics,
  level,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: {
  topic: AdminTopic;
  topics: AdminTopic[];
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (t: AdminTopic) => void;
  onDelete: (t: AdminTopic) => void;
  onAddChild: (parentId: string) => void;
}) {
  const children = topics.filter((t) => t.parentId === topic.id);
  const isExpanded = expanded.has(topic.id);

  return (
    <View>
      <View
        className="flex-row items-center py-2.5 border-b border-gray-50"
        style={{ paddingLeft: level * 16 + 12 }}
      >
        {children.length > 0 ? (
          <TouchableOpacity onPress={() => onToggle(topic.id)} className="mr-1 w-5">
            <Text className="text-gray-400">{isExpanded ? "▾" : "▸"}</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-6" />
        )}
        <Text className="flex-1 text-sm text-gray-800">{topic.name}</Text>
        <TouchableOpacity onPress={() => onAddChild(topic.id)} className="p-1 ml-1">
          <Text className="text-xs text-blue-500">+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(topic)} className="p-1">
          <Text className="text-xs text-gray-400">✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(topic)} className="p-1">
          <Text className="text-xs text-red-400">🗑</Text>
        </TouchableOpacity>
      </View>
      {isExpanded &&
        children.map((child) => (
          <TopicRow
            key={child.id}
            topic={child}
            topics={topics}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </View>
  );
}

export default function SubjectsTopicsPage() {
  const queryClient = useQueryClient();

  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Subject modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AdminSubject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" });

  // Topic modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<AdminTopic | null>(null);
  const [parentTopicId, setParentTopicId] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({ name: "", description: "" });

  const { data: boards = [] } = useQuery<AdminBoard[]>({
    queryKey: ["admin-boards"],
    queryFn: () => apiFetch("/api/admin/boards"),
  });

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<AdminSubject[]>({
    queryKey: ["admin-subjects", selectedBoardId],
    queryFn: () => apiFetch(`/api/admin/subjects?boardId=${selectedBoardId}`),
    enabled: !!selectedBoardId,
  });

  const { data: topics = [], isLoading: isLoadingTopics } = useQuery<AdminTopic[]>({
    queryKey: ["admin-topics", selectedSubjectId],
    queryFn: () => apiFetch(`/api/admin/topics?subjectId=${selectedSubjectId}`),
    enabled: !!selectedSubjectId,
  });

  const rootTopics = topics.filter((t) => !t.parentId);

  // Subject mutations
  const createSubjectMutation = useMutation({
    mutationFn: (body: object) =>
      apiFetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects", selectedBoardId] });
      setIsSubjectModalOpen(false);
      Toast.show({ type: "success", text1: "Subject created", text2: s.subjectName });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      apiFetch(`/api/admin/subjects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects", selectedBoardId] });
      setIsSubjectModalOpen(false);
      Toast.show({ type: "success", text1: "Subject updated" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  // Topic mutations
  const createTopicMutation = useMutation({
    mutationFn: (body: object) =>
      apiFetch("/api/admin/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics", selectedSubjectId] });
      setIsTopicModalOpen(false);
      Toast.show({ type: "success", text1: "Topic created" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      apiFetch(`/api/admin/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics", selectedSubjectId] });
      setIsTopicModalOpen(false);
      Toast.show({ type: "success", text1: "Topic updated" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/topics/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics", selectedSubjectId] });
      Toast.show({ type: "success", text1: "Topic deleted" });
    },
    onError: (e: any) => Toast.show({ type: "error", text1: "Error", text2: e.message }),
  });

  const handleToggleTopic = (id: string) =>
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAddTopic = (parentId: string | null = null) => {
    setEditingTopic(null);
    setParentTopicId(parentId);
    setTopicForm({ name: "", description: "" });
    setIsTopicModalOpen(true);
  };

  const handleEditTopic = (t: AdminTopic) => {
    setEditingTopic(t);
    setParentTopicId(t.parentId || null);
    setTopicForm({ name: t.name, description: t.description || "" });
    setIsTopicModalOpen(true);
  };

  const handleDeleteTopic = (t: AdminTopic) => {
    Alert.alert("Delete Topic", `Delete "${t.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTopicMutation.mutate(t.id),
      },
    ]);
  };

  const handleSaveTopic = () => {
    if (!topicForm.name.trim()) {
      Toast.show({ type: "error", text1: "Topic name is required" });
      return;
    }
    if (editingTopic) {
      updateTopicMutation.mutate({
        id: editingTopic.id,
        data: { name: topicForm.name, description: topicForm.description || null },
      });
    } else {
      createTopicMutation.mutate({
        name: topicForm.name,
        subjectId: selectedSubjectId,
        parentId: parentTopicId,
        description: topicForm.description || null,
      });
    }
  };

  const handleSaveSubject = () => {
    if (!subjectForm.name.trim()) {
      Toast.show({ type: "error", text1: "Subject name is required" });
      return;
    }
    if (!subjectForm.code.trim()) {
      Toast.show({ type: "error", text1: "Subject code is required" });
      return;
    }
    if (editingSubject) {
      updateSubjectMutation.mutate({
        id: editingSubject.id,
        data: { name: subjectForm.name, code: subjectForm.code, description: subjectForm.description || null },
      });
    } else {
      createSubjectMutation.mutate({
        name: subjectForm.name,
        code: subjectForm.code,
        boardId: selectedBoardId,
        description: subjectForm.description || null,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Subjects & Topics</Text>
        <Text className="text-sm text-gray-500 mb-5">Manage subject curriculum and topic hierarchy</Text>

        {/* Board picker */}
        <View className="border border-gray-100 rounded-2xl bg-white p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Select Board</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {boards.filter((b) => b.isEnabled).map((board) => (
              <TouchableOpacity
                key={board.id}
                onPress={() => { setSelectedBoardId(board.id); setSelectedSubjectId(""); }}
                className={`rounded-xl px-4 py-2 mr-2 ${selectedBoardId === board.id ? "bg-blue-600" : "border border-gray-200"}`}
              >
                <Text className={`text-sm font-medium ${selectedBoardId === board.id ? "text-white" : "text-gray-700"}`}>
                  {board.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Subjects panel */}
        {selectedBoardId && (
          <View className="border border-gray-100 rounded-2xl bg-white p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold text-gray-800">Subjects</Text>
              <TouchableOpacity
                onPress={() => { setEditingSubject(null); setSubjectForm({ name: "", code: "", description: "" }); setIsSubjectModalOpen(true); }}
                className="bg-blue-600 rounded-xl px-3 py-1.5"
              >
                <Text className="text-white text-xs font-semibold">+ Add Subject</Text>
              </TouchableOpacity>
            </View>
            {isLoadingSubjects ? (
              <ActivityIndicator size="small" />
            ) : (
              subjects.map((subj) => (
                <TouchableOpacity
                  key={subj.id}
                  onPress={() => setSelectedSubjectId(subj.id)}
                  className={`flex-row items-center justify-between border rounded-xl px-3 py-2.5 mb-2 ${selectedSubjectId === subj.id ? "border-blue-600 bg-blue-50" : "border-gray-100"}`}
                >
                  <View>
                    <Text className="text-sm font-medium text-gray-800">{subj.subjectName || subj.name}</Text>
                    <Text className="text-xs text-gray-400">{subj.subjectCode || subj.code}</Text>
                  </View>
                  <View className="flex-row gap-1">
                    <TouchableOpacity onPress={() => { setEditingSubject(subj); setSubjectForm({ name: subj.subjectName || subj.name || "", code: subj.subjectCode || subj.code || "", description: subj.description || "" }); setIsSubjectModalOpen(true); }} className="p-1">
                      <Text className="text-xs">✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateSubjectMutation.mutate({ id: subj.id, data: { isActive: !subj.isActive } })} className="p-1">
                      <Text className="text-xs text-gray-400">{subj.isActive ? "Hide" : "Show"}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Topics panel */}
        {selectedSubjectId && (
          <View className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-50">
              <Text className="text-sm font-semibold text-gray-800">Topic Tree</Text>
              <TouchableOpacity
                onPress={() => handleAddTopic(null)}
                className="bg-blue-600 rounded-xl px-3 py-1.5"
              >
                <Text className="text-white text-xs font-semibold">+ Add Topic</Text>
              </TouchableOpacity>
            </View>
            {isLoadingTopics ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : rootTopics.length === 0 ? (
              <Text className="text-sm text-gray-400 text-center py-8">
                No topics yet. Add your first topic.
              </Text>
            ) : (
              rootTopics.map((topic) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  topics={topics}
                  level={0}
                  expanded={expandedTopics}
                  onToggle={handleToggleTopic}
                  onEdit={handleEditTopic}
                  onDelete={handleDeleteTopic}
                  onAddChild={handleAddTopic}
                />
              ))
            )}
          </View>
        )}

        {!selectedBoardId && (
          <View className="py-12 items-center">
            <Text className="text-sm text-gray-400">Select a board above to get started.</Text>
          </View>
        )}
      </ScrollView>

      {/* Topic Modal */}
      <Modal visible={isTopicModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editingTopic ? "Edit Topic" : "Add Topic"}
            </Text>
            <Text className="text-sm font-medium text-gray-700 mb-1">Topic Name</Text>
            <TextInput
              value={topicForm.name}
              onChangeText={(v) => setTopicForm((p) => ({ ...p, name: v }))}
              placeholder="e.g., Linear Equations"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              value={topicForm.description}
              onChangeText={(v) => setTopicForm((p) => ({ ...p, description: v }))}
              placeholder="Brief description…"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4"
              style={{ minHeight: 72 }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setIsTopicModalOpen(false)} className="flex-1 border border-gray-200 rounded-xl py-3 items-center">
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveTopic}
                disabled={createTopicMutation.isPending || updateTopicMutation.isPending}
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">
                  {editingTopic ? "Save Changes" : "Add Topic"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Modal */}
      <Modal visible={isSubjectModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {editingSubject ? "Edit Subject" : "Add Subject"}
            </Text>
            <Text className="text-sm font-medium text-gray-700 mb-1">Subject Name</Text>
            <TextInput
              value={subjectForm.name}
              onChangeText={(v) => setSubjectForm((p) => ({ ...p, name: v }))}
              placeholder="e.g., Mathematics"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-1">Subject Code</Text>
            <TextInput
              value={subjectForm.code}
              onChangeText={(v) => setSubjectForm((p) => ({ ...p, code: v.toUpperCase() }))}
              placeholder="e.g., MATH"
              autoCapitalize="characters"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3"
            />
            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              value={subjectForm.description}
              onChangeText={(v) => setSubjectForm((p) => ({ ...p, description: v }))}
              placeholder="Brief description…"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4"
              style={{ minHeight: 56 }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setIsSubjectModalOpen(false)} className="flex-1 border border-gray-200 rounded-xl py-3 items-center">
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSubject}
                disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">
                  {editingSubject ? "Save Changes" : "Add Subject"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
