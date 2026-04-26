// EXTRACTED FROM: client/src/components/onboarding/SubjectMultiSelect.tsx
// CONVERTED TO:   components/onboarding/SubjectMultiSelect.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: shadcn Popover/Command/Badge → RN TextInput + ScrollView + TouchableOpacity, lucide-react → lucide-react-native
// LOGIC CHANGES: No popover; inline search box and scrollable list. Selected subjects render as removable chips below. Loads /api/curriculum/subjects on mount.

import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Check, X, Search } from "lucide-react-native";

const BASE = process.env.EXPO_PUBLIC_API_URL;

export interface SubjectOption {
  id: string;
  name: string;
  code?: string;
  boardKey?: string;
  qualKey?: string;
}

interface SubjectMultiSelectProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  disabled?: boolean;
}

export function SubjectMultiSelect({
  selectedIds,
  onSelectionChange,
  placeholder = "Search subjects...",
  maxSelections = 10,
  disabled = false,
}: SubjectMultiSelectProps) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/curriculum/subjects`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (cancelled) return;
        const mapped: SubjectOption[] = (Array.isArray(data) ? data : []).map(
          (s: any) => ({
            id: s.id,
            name: s.subjectName ?? s.name ?? "Unknown",
            code: s.subjectCode ?? s.code,
          })
        );
        setSubjects(mapped);
      } catch (err) {
        console.warn("Could not load subjects:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSubjects = useMemo(
    () => subjects.filter((s) => selectedIds.includes(s.id)),
    [subjects, selectedIds]
  );

  const filtered = useMemo(() => {
    if (!searchQuery) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  const toggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < maxSelections) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <View className="w-full">
      {/* Header / counter */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-gray-600">
          {selectedIds.length > 0
            ? `${selectedIds.length} subject${selectedIds.length > 1 ? "s" : ""} selected`
            : "Select subjects"}
        </Text>
        <Text className="text-xs text-gray-400">
          {selectedIds.length}/{maxSelections}
        </Text>
      </View>

      {/* Search */}
      <View className="flex-row items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white mb-3">
        <Search size={16} color="#9ca3af" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          editable={!disabled}
          className="flex-1 text-sm text-gray-900"
        />
      </View>

      {/* List */}
      <View className="border border-gray-200 rounded-lg bg-white" style={{ maxHeight: 280 }}>
        {loading ? (
          <View className="py-8 items-center">
            <ActivityIndicator />
          </View>
        ) : filtered.length === 0 ? (
          <View className="py-8 items-center">
            <Text className="text-sm text-gray-400">No subjects found.</Text>
          </View>
        ) : (
          <ScrollView nestedScrollEnabled>
            {filtered.map((subject) => {
              const isSelected = selectedIds.includes(subject.id);
              const isDisabled = !isSelected && selectedIds.length >= maxSelections;
              return (
                <TouchableOpacity
                  key={subject.id}
                  onPress={() => toggle(subject.id)}
                  disabled={isDisabled || disabled}
                  className={`flex-row items-center gap-3 px-3 py-3 border-b border-gray-100 ${
                    isDisabled ? "opacity-50" : ""
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded border items-center justify-center ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check size={12} color="#fff" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {subject.name}
                    </Text>
                    {subject.code ? (
                      <Text className="text-xs text-gray-500">{subject.code}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Selected chips */}
      {selectedSubjects.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {selectedSubjects.map((s) => (
            <View
              key={s.id}
              className="flex-row items-center gap-1 bg-gray-100 rounded-full pl-3 pr-1 py-1"
            >
              <Text className="text-xs text-gray-700 max-w-[150px]" numberOfLines={1}>
                {s.name}
              </Text>
              <TouchableOpacity
                onPress={() => toggle(s.id)}
                className="rounded-full p-1"
                accessibilityLabel={`Remove ${s.name}`}
              >
                <X size={12} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
