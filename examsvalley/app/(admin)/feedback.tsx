// EXTRACTED FROM: client/src/pages/admin/FeedbackPage.tsx
// CONVERTED TO:   app/(admin)/feedback.tsx
// BUCKET:         B_convert

import { useQuery } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface FeedbackItem {
  id: string;
  rating: number;
  comment?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ color: i <= rating ? "#fbbf24" : "#d1d5db", fontSize: 14 }}>★</Text>
      ))}
    </View>
  );
}

export default function FeedbackPage() {
  const router = useRouter();

  const { data: feedbacks = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/feedback`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-500 text-sm">← Dashboard</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 mb-1">User Feedback</Text>
        <Text className="text-sm text-gray-500 mb-4">Ratings and comments from users</Text>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 border border-gray-100 rounded-xl p-4">
            <Text className="text-xs text-gray-500 mb-1">Average Rating</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</Text>
              <Text className="text-xl text-amber-400">★</Text>
            </View>
          </View>
          <View className="flex-1 border border-gray-100 rounded-xl p-4">
            <Text className="text-xs text-gray-500 mb-1">Total Responses</Text>
            <Text className="text-2xl font-bold text-gray-900">{feedbacks.length}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : feedbacks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-3xl mb-2">💬</Text>
          <Text className="text-gray-500">No feedback submitted yet.</Text>
        </View>
      ) : (
        <FlashList
          data={feedbacks}
          estimatedItemSize={100}
          keyExtractor={f => f.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          renderItem={({ item: f }) => {
            const initials = f.userName ? f.userName[0].toUpperCase() : "?";
            return (
              <View className="border border-gray-100 rounded-xl p-4 mb-2">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                    <Text className="text-sm font-bold text-gray-600">{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{f.userName || "Anonymous"}</Text>
                    {f.userEmail && <Text className="text-xs text-gray-400">{f.userEmail}</Text>}
                  </View>
                  <Text className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</Text>
                </View>
                <StarRating rating={f.rating} />
                {f.comment ? (
                  <Text className="text-sm text-gray-600 mt-2">{f.comment}</Text>
                ) : (
                  <Text className="text-sm text-gray-400 italic mt-2">No comment</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
