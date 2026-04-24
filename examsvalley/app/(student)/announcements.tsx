// EXTRACTED FROM: client/src/pages/student/AnnouncementsPage.tsx
// CONVERTED TO:   app/(student)/announcements.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: shadcn Collapsible → useState expand; mockData → real /api/announcements

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator,
} from "react-native";
import type { Announcement } from "@/types";

const BASE = process.env.EXPO_PUBLIC_API_URL;

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const [isOpen, setIsOpen] = useState(false);
  const PREVIEW_LEN = 150;
  const needsExpand = announcement.content.length > PREVIEW_LEN;

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case "school": return "School-wide";
      case "board": return "Board";
      case "subject": return "Subject";
      default: return scope;
    }
  };

  const getScopeBg = (scope: string) => {
    switch (scope) {
      case "school": return "bg-blue-600";
      case "board": return "bg-gray-500";
      case "subject": return "border border-gray-300 bg-white";
      default: return "bg-gray-400";
    }
  };

  const getScopeText = (scope: string) => {
    return scope === "subject" ? "text-gray-700" : "text-white";
  };

  return (
    <View className="border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className={`rounded-full px-2.5 py-1 ${getScopeBg(announcement.scope)}`}>
            <Text className={`text-xs font-medium ${getScopeText(announcement.scope)}`}>
              {getScopeLabel(announcement.scope)}
            </Text>
          </View>
          {announcement.createdAt && (
            <Text className="text-xs text-gray-400">
              📅 {new Date(announcement.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>
        {needsExpand && (
          <TouchableOpacity onPress={() => setIsOpen(!isOpen)}>
            <Text className="text-gray-400 text-lg">{isOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-base font-semibold text-gray-900 mb-2">{announcement.title}</Text>

      <Text className="text-sm text-gray-500">
        {needsExpand && !isOpen
          ? announcement.content.slice(0, PREVIEW_LEN) + "..."
          : announcement.content}
      </Text>
    </View>
  );
}

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/announcements`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const active = announcements
    .filter(a => a.isActive)
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Announcements</Text>
        <Text className="text-sm text-gray-500 mb-4">Stay updated with the latest news and updates</Text>

        {active.length > 0 ? (
          active.map(a => <AnnouncementCard key={a.id} announcement={a} />)
        ) : (
          <View className="border border-gray-200 rounded-xl p-12 items-center">
            <Text className="text-4xl mb-3">🔔</Text>
            <Text className="text-gray-500">No announcements at this time.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
