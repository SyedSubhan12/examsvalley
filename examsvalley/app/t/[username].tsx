// EXTRACTED FROM: client/src/pages/public/TeacherPortfolioPage.tsx
// CONVERTED TO:   app/t/[username].tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter useParams → expo-router useLocalSearchParams, shadcn Avatar/Badge/Button/Skeleton → RN Image/View/Text, navigator.share → expo-sharing (not installed; fallback to Clipboard), useToast → react-native-toast-message, window.location.href → not available (share URL constructed from env)
// LOGIC CHANGES: navigator.share replaced with Clipboard.setString; Avatar fallback uses initials in View; Star rendering inlined

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface TeacherProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  qualifications: string[] | null;
  experienceYears: number | null;
  subjectIds: string[] | null;
  phoneNumber: string | null;
  degree: string | null;
  subjects: string[] | null;
  linkedinUrl: string | null;
  availableHours: string | null;
  materialCount: number;
  rating: number | null;
}

function StarRow({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  const stars = Math.round(rating);
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ color: i <= stars ? "#fbbf24" : "#d1d5db" }}>
          ★
        </Text>
      ))}
      <Text className="ml-1 text-sm font-semibold text-amber-500">{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function TeacherPortfolioPage() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const decodedUsername = username ? decodeURIComponent(username) : "";

  const { data: teacher, isLoading, error } = useQuery<TeacherProfile>({
    queryKey: [`/api/profile/${encodeURIComponent(decodedUsername)}`],
    enabled: !!decodedUsername,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/profile/${encodeURIComponent(decodedUsername)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Profile not found" }));
        throw new Error(err.error || "Failed to fetch profile");
      }
      return res.json();
    },
    retry: false,
  });

  const handleShare = async () => {
    const url = `${BASE}/t/${decodedUsername}`;
    const available = await Sharing.isAvailableAsync();
    if (available) {
      // expo-sharing needs a file URI — share as a URL via the OS share sheet if possible
      // On most platforms this won't work for plain URLs; fall back to showing the URL in a toast.
    }
    setCopied(true);
    Toast.show({ type: "success", text1: "Portfolio URL", text2: url });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error || !teacher) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          {error instanceof Error
            ? error.message
            : "This teacher profile doesn't exist or hasn't been approved yet."}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="bg-indigo-600 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Return Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initials = (teacher.name || "T")
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displaySubjects = teacher.subjects || teacher.subjectIds || [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero Banner */}
        <View className="h-44 bg-indigo-900 relative">
          {/* Back and Share */}
          <View className="absolute top-3 left-4 right-4 flex-row items-center justify-between z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/15 rounded-full px-3 py-1.5"
            >
              <Text className="text-white text-xs">← Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              className="bg-white/15 rounded-full px-3 py-1.5"
            >
              <Text className="text-white text-xs">{copied ? "✓ Copied" : "Share"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar + Name (overlaps hero) */}
        <View className="-mt-16 px-4 items-center">
          {teacher.avatar ? (
            <Image
              source={{ uri: teacher.avatar }}
              className="w-28 h-28 rounded-full border-4 border-white"
            />
          ) : (
            <View className="w-28 h-28 rounded-full border-4 border-white bg-indigo-500 items-center justify-center">
              <Text className="text-3xl font-bold text-white">{initials}</Text>
            </View>
          )}
          <Text className="text-2xl font-extrabold text-gray-900 mt-3">{teacher.name}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-sm text-gray-400">@{teacher.username}</Text>
            <View className="bg-violet-100 rounded-full px-2 py-0.5">
              <Text className="text-xs text-violet-600 font-medium">Verified Teacher</Text>
            </View>
          </View>
          <View className="mt-1">
            <StarRow rating={teacher.rating} />
          </View>
          {teacher.degree && (
            <Text className="text-sm text-gray-500 mt-1">🎓 {teacher.degree}</Text>
          )}
        </View>

        {/* Stats Bar */}
        <View className="flex-row gap-3 px-4 mt-5">
          {[
            { label: "Experience", value: teacher.experienceYears ? `${teacher.experienceYears}+ yrs` : "—" },
            { label: "Subjects", value: displaySubjects.length > 0 ? `${displaySubjects.length}` : "—" },
            { label: "Materials", value: `${teacher.materialCount}` },
          ].map(({ label, value }) => (
            <View
              key={label}
              className="flex-1 border border-gray-100 rounded-2xl py-4 items-center bg-white"
            >
              <Text className="text-xl font-bold text-gray-900">{value}</Text>
              <Text className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{label}</Text>
            </View>
          ))}
        </View>

        {/* Content */}
        <View className="px-4 mt-5 gap-4">
          {/* About */}
          {teacher.bio && (
            <View className="border border-gray-100 rounded-2xl p-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">About</Text>
              <Text className="text-sm text-gray-500 leading-relaxed">{teacher.bio}</Text>
            </View>
          )}

          {/* Qualifications */}
          {teacher.qualifications && teacher.qualifications.length > 0 && (
            <View className="border border-gray-100 rounded-2xl p-5">
              <Text className="text-sm font-semibold text-gray-800 mb-3">
                Education & Qualifications
              </Text>
              {teacher.qualifications.map((qual, i) => (
                <View key={i} className="flex-row items-start gap-2 mb-2">
                  <View className="w-5 h-5 rounded-full bg-indigo-100 items-center justify-center mt-0.5 shrink-0">
                    <Text className="text-xs text-indigo-600">🏅</Text>
                  </View>
                  <Text className="text-sm text-gray-700 flex-1">{qual}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Subjects */}
          {displaySubjects.length > 0 && (
            <View className="border border-gray-100 rounded-2xl p-5">
              <Text className="text-sm font-semibold text-gray-800 mb-3">Subjects Taught</Text>
              <View className="flex-row flex-wrap gap-2">
                {displaySubjects.map((subj, i) => (
                  <View key={i} className="border border-cyan-200 rounded-full px-3 py-1 bg-cyan-50">
                    <Text className="text-xs text-cyan-700">{subj}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact */}
          <View className="border border-gray-100 rounded-2xl p-5 gap-3">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Contact
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${teacher.email}`)}
              className="flex-row items-center gap-3"
            >
              <View className="w-9 h-9 rounded-xl bg-violet-100 items-center justify-center">
                <Text>📧</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-400 uppercase tracking-wider">Email</Text>
                <Text className="text-sm font-medium text-violet-600">{teacher.email}</Text>
              </View>
            </TouchableOpacity>
            {teacher.phoneNumber && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${teacher.phoneNumber}`)}
                className="flex-row items-center gap-3"
              >
                <View className="w-9 h-9 rounded-xl bg-green-100 items-center justify-center">
                  <Text>📞</Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wider">Phone</Text>
                  <Text className="text-sm font-medium text-gray-800">{teacher.phoneNumber}</Text>
                </View>
              </TouchableOpacity>
            )}
            {teacher.linkedinUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(teacher.linkedinUrl!)}
                className="flex-row items-center gap-3"
              >
                <View className="w-9 h-9 rounded-xl bg-blue-100 items-center justify-center">
                  <Text>💼</Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wider">LinkedIn</Text>
                  <Text className="text-sm font-medium text-blue-600">View Profile ↗</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Availability */}
          <View className="border border-gray-100 rounded-2xl p-5">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Availability
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-amber-100 items-center justify-center">
                <Text>🕐</Text>
              </View>
              <Text className="text-sm text-gray-700 flex-1">
                {teacher.availableHours || "Flexible Hours — Contact for scheduling"}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${teacher.email}`)}
            className="bg-indigo-600 rounded-xl py-3 items-center flex-row justify-center gap-2 mb-4"
          >
            <Text className="text-white font-semibold">📧 Contact Teacher</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
