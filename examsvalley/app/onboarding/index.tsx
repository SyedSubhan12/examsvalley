// EXTRACTED FROM: client/src/components/onboarding/OnboardingWizard.tsx
// CONVERTED TO:   app/onboarding/index.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: framer-motion → plain View transitions (animations dropped), shadcn Dialog/Drawer → SafeAreaView screen, shadcn Slider → +/- stepper (no @react-native-community/slider in deps), shadcn Select → TouchableOpacity row, shadcn ToggleGroup/Button/Card/Progress/Badge → RN primitives + NativeWind, lucide-react → lucide-react-native, useToast → react-native-toast-message
// LOGIC CHANGES: Single screen instead of modal. Calls /api/onboarding/complete itself (gate threads no callback); writes SecureStore flag via markOnboardingComplete(); router.replace("/") on success. Skip uses defaults same as web.

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Target,
  CheckCircle2,
  Clock,
  Zap,
  SkipForward,
  Plus,
  Minus,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import {
  SubjectMultiSelect,
} from "@/components/onboarding/SubjectMultiSelect";
import {
  markOnboardingComplete,
  getOnboardingDeviceId,
} from "@/components/OnboardingGate";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Board" },
  { id: 3, title: "Subjects" },
  { id: 4, title: "Preferences" },
  { id: 5, title: "Review" },
];

const BOARDS = [
  { key: "caie", name: "Cambridge CAIE", description: "Cambridge Assessment International Education" },
  { key: "pearson", name: "Pearson Edexcel", description: "Pearson Edexcel International" },
  { key: "ib", name: "IB", description: "International Baccalaureate" },
];

const QUALIFICATIONS: Record<string, { key: string; name: string }[]> = {
  caie: [
    { key: "igcse", name: "IGCSE" },
    { key: "as", name: "AS Level" },
    { key: "alevel", name: "A Level" },
  ],
  pearson: [
    { key: "igcse", name: "International GCSE" },
    { key: "ial", name: "International A Level" },
  ],
  ib: [
    { key: "dp", name: "Diploma Programme" },
    { key: "myp", name: "Middle Years Programme" },
  ],
};

const RESOURCE_OPTIONS = [
  { key: "past_papers", label: "Past Papers", icon: "📝" },
  { key: "notes", label: "Notes", icon: "📚" },
  { key: "videos", label: "Videos", icon: "🎬" },
  { key: "worksheets", label: "Worksheets", icon: "📋" },
];

const EXAM_SESSIONS = [
  { value: "m25", label: "May/June 2025" },
  { value: "o25", label: "Oct/Nov 2025" },
  { value: "m26", label: "May/June 2026" },
];

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function OnboardingScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [boardKey, setBoardKey] = useState("");
  const [qualKey, setQualKey] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [studyMinutes, setStudyMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [resourceFocus, setResourceFocus] = useState<string[]>(["past_papers"]);
  const [examSession, setExamSession] = useState("");

  const progress = (step / 5) * 100;

  const canAdvance = () => {
    if (step === 2) return !!boardKey && !!qualKey;
    return true;
  };

  const handleNext = () => {
    if (step < 5 && canAdvance()) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleResource = (key: string) => {
    setResourceFocus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const adjustMinutes = (delta: number) => {
    setStudyMinutes((m) => {
      const next = m + delta;
      if (next < 15) return 15;
      if (next > 120) return 120;
      return next;
    });
  };

  const submitToServer = async (payload: any) => {
    const deviceId = await getOnboardingDeviceId();
    const res = await fetch(`${BASE}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ deviceId, ...payload }),
    });
    if (!res.ok) throw new Error("Failed to save onboarding");
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const data = {
      boardKey,
      qualKey,
      subjectIds,
      studyMinutesDaily: studyMinutes,
      difficulty,
      resourceFocus,
      examSessionTarget: examSession || undefined,
    };
    const serverPayload = {
      boardKey,
      qualKey,
      subjectIds,
      preferences: {
        studyMinutesDaily: studyMinutes,
        difficulty,
        resourceFocus,
        examSessionTarget: examSession || undefined,
      },
    };
    try {
      await submitToServer(serverPayload);
      await markOnboardingComplete(data);
      Toast.show({
        type: "success",
        text1: "Welcome to ExamsValley!",
        text2: "Your profile has been set up successfully.",
      });
      router.replace("/");
    } catch (err) {
      console.error("Onboarding save error:", err);
      // Save locally even if server fails (matches web behavior).
      await markOnboardingComplete(data);
      Toast.show({
        type: "info",
        text1: "Profile saved locally",
        text2: "Your preferences will sync when you're back online.",
      });
      router.replace("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    const defaults = {
      boardKey: "",
      qualKey: "",
      subjectIds: [] as string[],
      studyMinutesDaily: 30,
      difficulty: "medium",
      resourceFocus: ["past_papers"],
    };
    const serverPayload = {
      boardKey: defaults.boardKey,
      qualKey: defaults.qualKey,
      subjectIds: defaults.subjectIds,
      preferences: {
        studyMinutesDaily: defaults.studyMinutesDaily,
        difficulty: defaults.difficulty,
        resourceFocus: defaults.resourceFocus,
      },
    };
    // Fire and forget for server, but always persist locally.
    submitToServer(serverPayload).catch((e) =>
      console.warn("Skip server save failed:", e)
    );
    await markOnboardingComplete(defaults);
    Toast.show({
      type: "info",
      text1: "Skipped for now",
      text2: "You can set up your profile later in Settings.",
    });
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress bar */}
      <View className="px-6 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs text-gray-500">Step {step} of 5</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {STEPS[step - 1].title}
          </Text>
        </View>
        <View className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-2 bg-blue-600 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Step content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        {step === 1 && (
          <View className="items-center gap-5 py-4">
            <View className="p-5 rounded-full bg-blue-600">
              <Sparkles size={40} color="#fff" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Welcome to ExamsValley!
            </Text>
            <Text className="text-base text-gray-500 text-center max-w-md">
              Let's personalize your learning experience. This will only take a minute.
            </Text>
            <View className="gap-2 mt-2">
              {[
                "Choose your exam board",
                "Select your subjects",
                "Set your study preferences",
              ].map((line) => (
                <View key={line} className="flex-row items-center gap-2">
                  <CheckCircle2 size={18} color="#22c55e" />
                  <Text className="text-sm text-gray-600">{line}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-6">
            <View className="items-center gap-1">
              <Text className="text-xl font-semibold text-gray-900">
                Choose Your Exam Board
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Select the examination board you're studying under
              </Text>
            </View>

            <View className="gap-3">
              {BOARDS.map((board) => {
                const selected = boardKey === board.key;
                return (
                  <TouchableOpacity
                    key={board.key}
                    onPress={() => {
                      setBoardKey(board.key);
                      setQualKey("");
                    }}
                    className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                      selected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <View className="p-2 rounded-lg bg-blue-100">
                      <GraduationCap size={20} color="#2563eb" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900">
                        {board.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {board.description}
                      </Text>
                    </View>
                    {selected && <CheckCircle2 size={20} color="#2563eb" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!boardKey && (
              <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700">
                  Qualification Level
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {QUALIFICATIONS[boardKey]?.map((q) => {
                    const selected = qualKey === q.key;
                    return (
                      <TouchableOpacity
                        key={q.key}
                        onPress={() => setQualKey(q.key)}
                        className={`flex-1 min-w-[45%] items-center py-3 rounded-lg border ${
                          selected
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selected ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {q.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <View className="items-center gap-1">
              <Text className="text-xl font-semibold text-gray-900">
                Select Your Subjects
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Choose the subjects you're studying (up to 10)
              </Text>
            </View>

            <SubjectMultiSelect
              selectedIds={subjectIds}
              onSelectionChange={setSubjectIds}
              maxSelections={10}
            />

            {subjectIds.length > 0 && (
              <View className="p-3 bg-gray-50 rounded-lg">
                <Text className="text-sm text-gray-600">
                  <Text className="font-semibold">{subjectIds.length}</Text>{" "}
                  subject{subjectIds.length !== 1 ? "s" : ""} selected
                </Text>
              </View>
            )}
          </View>
        )}

        {step === 4 && (
          <View className="gap-6">
            <View className="items-center gap-1">
              <Text className="text-xl font-semibold text-gray-900">
                Study Preferences
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Customize your learning experience
              </Text>
            </View>

            {/* Study minutes stepper */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Clock size={16} color="#374151" />
                  <Text className="text-sm font-medium text-gray-700">
                    Daily study goal
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  {studyMinutes} min
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => adjustMinutes(-15)}
                  className="p-3 rounded-lg border border-gray-200 bg-white"
                >
                  <Minus size={16} color="#374151" />
                </TouchableOpacity>
                <View className="flex-1 items-center py-3 bg-gray-50 rounded-lg">
                  <Text className="text-base font-semibold text-gray-900">
                    {studyMinutes} minutes
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => adjustMinutes(15)}
                  className="p-3 rounded-lg border border-gray-200 bg-white"
                >
                  <Plus size={16} color="#374151" />
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-400">15 min</Text>
                <Text className="text-xs text-gray-400">1 hour</Text>
                <Text className="text-xs text-gray-400">2 hours</Text>
              </View>
            </View>

            {/* Difficulty */}
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Zap size={16} color="#374151" />
                <Text className="text-sm font-medium text-gray-700">
                  Practice difficulty
                </Text>
              </View>
              <View className="flex-row gap-2">
                {DIFFICULTIES.map((d) => {
                  const selected = difficulty === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDifficulty(d)}
                      className={`flex-1 items-center py-3 rounded-lg border ${
                        selected
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium capitalize ${
                          selected ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Resource focus */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-gray-700">
                Resource focus (select all that apply)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {RESOURCE_OPTIONS.map((opt) => {
                  const selected = resourceFocus.includes(opt.key);
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => toggleResource(opt.key)}
                      className={`flex-row items-center gap-2 px-3 py-2 rounded-full border ${
                        selected
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text>{opt.icon}</Text>
                      <Text
                        className={`text-sm ${
                          selected ? "text-white font-medium" : "text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Exam session */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-gray-700">
                Target exam session (optional)
              </Text>
              <View className="gap-2">
                {EXAM_SESSIONS.map((s) => {
                  const selected = examSession === s.value;
                  return (
                    <TouchableOpacity
                      key={s.value}
                      onPress={() =>
                        setExamSession(selected ? "" : s.value)
                      }
                      className={`flex-row items-center justify-between px-4 py-3 rounded-lg border ${
                        selected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selected ? "text-blue-700 font-medium" : "text-gray-700"
                        }`}
                      >
                        {s.label}
                      </Text>
                      {selected && <CheckCircle2 size={18} color="#2563eb" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {step === 5 && (
          <View className="gap-5">
            <View className="items-center gap-2">
              <View className="p-3 rounded-full bg-green-100">
                <CheckCircle2 size={32} color="#22c55e" />
              </View>
              <Text className="text-xl font-semibold text-gray-900">
                You're All Set!
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Here's a summary of your preferences
              </Text>
            </View>

            <View className="border border-gray-200 rounded-xl p-4 bg-white">
              {[
                {
                  label: "Board",
                  value:
                    BOARDS.find((b) => b.key === boardKey)?.name || "Not selected",
                },
                {
                  label: "Level",
                  value:
                    QUALIFICATIONS[boardKey]?.find((q) => q.key === qualKey)?.name ||
                    "Not selected",
                },
                { label: "Subjects", value: `${subjectIds.length} selected` },
                { label: "Daily goal", value: `${studyMinutes} minutes` },
                { label: "Difficulty", value: difficulty },
              ].map((row, idx, arr) => (
                <View
                  key={row.label}
                  className={`flex-row items-center justify-between py-3 ${
                    idx < arr.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <Text className="text-sm text-gray-500">{row.label}</Text>
                  <View className="px-2 py-1 bg-gray-100 rounded-md">
                    <Text className="text-xs font-medium text-gray-700 capitalize">
                      {row.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View className="px-6 py-4 border-t border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={handleSkip}
          disabled={isSubmitting}
          className="flex-row items-center gap-1 px-2 py-2"
        >
          <SkipForward size={14} color="#6b7280" />
          <Text className="text-sm text-gray-500">Skip for now</Text>
        </TouchableOpacity>

        <View className="flex-row gap-2">
          {step > 1 && (
            <TouchableOpacity
              onPress={handleBack}
              disabled={isSubmitting}
              className="flex-row items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 bg-white"
            >
              <ChevronLeft size={16} color="#374151" />
              <Text className="text-sm font-medium text-gray-700">Back</Text>
            </TouchableOpacity>
          )}
          {step < 5 ? (
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canAdvance() || isSubmitting}
              className={`flex-row items-center gap-1 px-4 py-2 rounded-lg ${
                canAdvance() ? "bg-blue-600" : "bg-blue-300"
              }`}
            >
              <Text className="text-sm font-medium text-white">Next</Text>
              <ChevronRight size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleComplete}
              disabled={isSubmitting}
              className="flex-row items-center gap-1 px-4 py-2 rounded-lg bg-blue-600"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text className="text-sm font-medium text-white">
                    Get Started
                  </Text>
                  <Sparkles size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
