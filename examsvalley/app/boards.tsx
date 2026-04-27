// EXTRACTED FROM: client/src/pages/public/BoardSelectionPage.tsx
// CONVERTED TO:   app/boards.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter useLocation → expo-router useRouter, shadcn Card/Button → RN View/TouchableOpacity, mockBoards → /api/curriculum/boards (live data)
// LOGIC CHANGES: Boards fetched from API instead of mockData; updateUser call uses AuthContext; navigation goes to role dashboard or login

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface Board {
  id: string;
  boardKey: string;
  displayName: string;
  description: string;
  isEnabled: boolean;
}

export default function BoardSelectionPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
    (user as any)?.boardIds?.[0] || null
  );

  const { data: boards = [], isLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
  });

  const enabledBoards = boards.filter((b) => b.isEnabled);

  const handleContinue = async () => {
    if (!selectedBoardId) return;
    if (!isAuthenticated) {
      router.push("/(auth)/login" as any);
      return;
    }
    // Persist board selection
    try {
      await fetch(`${BASE}/api/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ boardIds: [selectedBoardId] }),
      });
    } catch {
      // Non-critical — navigate anyway
    }
    const role = user?.role || "student";
    router.replace(`/(${role})/dashboard` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-sm text-gray-500">← Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Select Your Education Board
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-8">
          Choose your education board to access relevant study materials and resources
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" className="py-8" />
        ) : (
          <View className="gap-3">
            {enabledBoards.map((board) => {
              const selected = selectedBoardId === board.id;
              return (
                <TouchableOpacity
                  key={board.id}
                  onPress={() => setSelectedBoardId(board.id)}
                  className={`border rounded-2xl p-5 ${
                    selected ? "border-blue-600 bg-blue-50" : "border-gray-100 bg-white"
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-base font-semibold text-gray-900">
                        {board.displayName}
                      </Text>
                      <Text className="text-xs text-gray-400 mb-2">{board.boardKey}</Text>
                      <Text className="text-sm text-gray-500">{board.description}</Text>
                    </View>
                    {selected && (
                      <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center shrink-0 mt-1">
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedBoardId}
          className={`mt-8 rounded-xl py-4 items-center ${
            selectedBoardId ? "bg-blue-600" : "bg-gray-200"
          }`}
          activeOpacity={selectedBoardId ? 0.7 : 1}
        >
          <Text className={`font-semibold ${selectedBoardId ? "text-white" : "text-gray-400"}`}>
            Continue →
          </Text>
        </TouchableOpacity>

        {!isAuthenticated && (
          <Text className="text-xs text-gray-400 text-center mt-4">
            You need to be logged in to save your board selection.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
