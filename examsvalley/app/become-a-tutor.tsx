// EXTRACTED FROM: client/src/pages/public/BecomeTutorPage.tsx
// CONVERTED TO:   app/become-a-tutor.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter Link → expo-router useRouter, motion (framer-motion) → static View (no animation library), shadcn Button/Card → TouchableOpacity/View, ThemeContext dropped (no dark mode on mobile yet)
// LOGIC CHANGES: Animations removed; avatar placeholder images removed (DiceBear URLs avoided); role CTA mapped to expo-router paths

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const benefits = [
  {
    title: "Reach Thousands",
    description:
      "Connect with eager students globally and make a real impact on their academic journey.",
    emoji: "🌍",
  },
  {
    title: "Competitive Earnings",
    description:
      "Set your own rates or enjoy performance-based incentives for creating quality materials.",
    emoji: "💰",
  },
  {
    title: "Flexible Schedule",
    description:
      "Teach whenever and wherever you want. You are in full control of your commitment.",
    emoji: "🕐",
  },
  {
    title: "Digital Presence",
    description:
      "Build a verified professional profile that showcases your expertise to students and parents.",
    emoji: "🌐",
  },
];

const steps = [
  {
    label: "Apply",
    title: "Submit Profile",
    desc: "Register and fill the professional registration form",
    step: 1,
  },
  {
    label: "Review",
    title: "Get Verified",
    desc: "Our team reviews your credentials",
    step: 2,
  },
  {
    label: "Share",
    title: "Upload & Earn",
    desc: "Upload quality materials and interact with students",
    step: 3,
  },
];

export default function BecomeTutorPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => router.back()} className="px-4 pt-4 mb-2">
          <Text className="text-sm text-gray-500">← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View className="px-6 pt-4 pb-8 bg-indigo-600">
          <View className="bg-indigo-500/40 rounded-full px-4 py-2 self-start mb-4 flex-row items-center gap-2">
            <Text className="text-white text-sm font-medium">✨ Join our Educator Community</Text>
          </View>
          <Text className="text-3xl font-extrabold text-white leading-tight mb-3">
            Teach the world's{"\n"}
            <Text className="text-yellow-300">Best Students</Text>
          </Text>
          <Text className="text-indigo-100 text-base mb-6">
            ExamsValley is looking for experienced CAIE, Edexcel, and IB tutors to share their
            knowledge.
          </Text>

          {isAuthenticated ? (
            user?.role === "teacher" ? (
              <TouchableOpacity
                onPress={() => router.push("/(teacher)/dashboard" as any)}
                className="bg-white rounded-xl px-6 py-3 self-start flex-row items-center gap-2"
              >
                <Text className="text-indigo-700 font-semibold">Enter Tutor Portal →</Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-white/20 rounded-xl p-4">
                <Text className="text-white font-semibold text-sm">
                  Current role: {user?.role}
                </Text>
                <Text className="text-indigo-100 text-xs mt-1">
                  To become a tutor, register with a teacher account or contact support.
                </Text>
              </View>
            )
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register" as any)}
              className="bg-white rounded-xl px-6 py-3 self-start"
            >
              <Text className="text-indigo-700 font-semibold">Register as a Tutor →</Text>
            </TouchableOpacity>
          )}

          <Text className="text-indigo-200 text-xs mt-4">
            Join 500+ educators sharing materials across 30+ subjects.
          </Text>
        </View>

        {/* Benefits */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Why teach on ExamsValley?</Text>
          <View className="flex-row flex-wrap gap-3">
            {benefits.map((b) => (
              <View
                key={b.title}
                className="border border-gray-100 rounded-2xl p-4 bg-white"
                style={{ width: "48%" }}
              >
                <Text className="text-2xl mb-2">{b.emoji}</Text>
                <Text className="text-sm font-bold text-gray-800 mb-1">{b.title}</Text>
                <Text className="text-xs text-gray-500 leading-relaxed">{b.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View className="px-4 mt-8 pt-6 border-t border-gray-100">
          <Text className="text-lg font-bold text-gray-900 text-center mb-1">How it works</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Get verified and start sharing your materials in three easy steps.
          </Text>
          {steps.map((s) => (
            <View key={s.step} className="flex-row items-start gap-4 mb-5">
              <View className="w-10 h-10 rounded-full bg-indigo-600 items-center justify-center shrink-0">
                <Text className="text-white font-bold">{s.step}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
                  {s.label}
                </Text>
                <Text className="text-sm font-bold text-gray-800">{s.title}</Text>
                <Text className="text-sm text-gray-500">{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Banner */}
        <View className="mx-4 mt-6 rounded-3xl bg-indigo-600 p-8 items-center">
          <Text className="text-2xl font-extrabold text-white text-center leading-tight mb-3">
            Expertly Crafted.{"\n"}Student Approved.{"\n"}Become a Creator.
          </Text>
          <Text className="text-indigo-200 text-sm text-center mb-5">
            Ready to turn your knowledge into impact? We're waiting for you.
          </Text>
          {isAuthenticated ? (
            <TouchableOpacity
              onPress={() => router.push("/(teacher)/dashboard" as any)}
              className="bg-white rounded-xl px-8 py-3"
            >
              <Text className="text-indigo-700 font-bold">Go to Dashboard</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register" as any)}
              className="bg-white rounded-xl px-8 py-3"
            >
              <Text className="text-indigo-700 font-bold">Apply Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
