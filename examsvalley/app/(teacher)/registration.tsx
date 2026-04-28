// EXTRACTED FROM: client/src/pages/teacher/TutorRegistrationPage.tsx
// CONVERTED TO:   app/(teacher)/registration.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: shadcn Form → react-hook-form + TextInput; toast → Toast.show

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "@/components/tw"
import { SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { apiRequest } from "@/lib/queryClient";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const tutorRegistrationSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  degree: z.string().optional(),
  experienceYears: z.coerce.number().int().nonnegative().max(60).optional().or(z.literal("")),
  bio: z.string().optional(),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  availableHours: z.string().optional(),
});

type FormValues = z.infer<typeof tutorRegistrationSchema>;

interface RegResponse extends FormValues {
  id: string; userId: string; status: "pending" | "approved" | "rejected";
}

const STATUS_COLORS = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "⏳ Pending Review" },
  approved: { bg: "bg-green-100", text: "text-green-800", label: "✅ Approved" },
  rejected: { bg: "bg-red-100", text: "text-red-800", label: "❌ Rejected" },
};

export default function TutorRegistrationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");

  const { data: existing, isLoading } = useQuery<RegResponse | null>({
    queryKey: ["/api/tutor/registration"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/tutor/registration`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(tutorRegistrationSchema),
    defaultValues: { name: "", email: "", phoneNumber: "", degree: "", experienceYears: "", bio: "", linkedinUrl: "", availableHours: "" },
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? "",
      email: existing.email ?? "",
      phoneNumber: existing.phoneNumber ?? "",
      degree: existing.degree ?? "",
      experienceYears: existing.experienceYears ?? "",
      bio: existing.bio ?? "",
      linkedinUrl: existing.linkedinUrl ?? "",
      availableHours: existing.availableHours ?? "",
    });
    if ((existing as any).subjects) setSubjects((existing as any).subjects);
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/tutor/registration", { ...values, subjects });
      return res.json() as Promise<RegResponse>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tutor/registration"] });
      Toast.show({ type: "success", text1: "Saved", text2: "Your registration has been submitted." });
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Save failed", text2: err.message });
    },
  });

  const addSubject = () => {
    const s = subjectInput.trim();
    if (s && !subjects.includes(s)) {
      setSubjects(prev => [...prev, s]);
      setSubjectInput("");
    }
  };

  const removeSubject = (s: string) => setSubjects(prev => prev.filter(x => x !== s));

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const statusConfig = existing?.status ? STATUS_COLORS[existing.status] : null;

  const FIELDS: { key: keyof FormValues; label: string; placeholder: string; multiline?: boolean; numeric?: boolean }[] = [
    { key: "name", label: "Full Name", placeholder: "Your full name" },
    { key: "email", label: "Email", placeholder: "your@email.com" },
    { key: "phoneNumber", label: "Phone Number", placeholder: "+92 300 1234567" },
    { key: "degree", label: "Degree", placeholder: "e.g. BSc Mathematics" },
    { key: "experienceYears", label: "Years of Experience", placeholder: "e.g. 5", numeric: true },
    { key: "availableHours", label: "Available Hours", placeholder: "e.g. Weekdays 9am-5pm" },
    { key: "linkedinUrl", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/..." },
    { key: "bio", label: "Bio", placeholder: "Tell students about yourself...", multiline: true },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-gray-500 text-sm">← Profile</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-1">Tutor Registration</Text>
          <Text className="text-sm text-gray-500 mb-4">Complete your tutor profile</Text>

          {/* Status badge */}
          {statusConfig && (
            <View className={`${statusConfig.bg} rounded-xl p-3 mb-4`}>
              <Text className={`font-medium text-sm ${statusConfig.text}`}>{statusConfig.label}</Text>
            </View>
          )}

          <View className="border border-gray-200 rounded-2xl p-5">
            <Text className="text-base font-semibold text-gray-800 mb-4">Registration Form</Text>

            {FIELDS.map(f => (
              <View key={f.key} className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">{f.label}</Text>
                <Controller
                  control={control}
                  name={f.key}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      value={value?.toString() ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={f.placeholder}
                      placeholderTextColor="#9ca3af"
                      keyboardType={f.numeric ? "numeric" : "default"}
                      multiline={f.multiline}
                      numberOfLines={f.multiline ? 4 : 1}
                      textAlignVertical={f.multiline ? "top" : "center"}
                      className={`border border-gray-200 rounded-xl px-3 py-3 text-gray-800 ${f.multiline ? "min-h-[96px]" : ""}`}
                    />
                  )}
                />
                {errors[f.key] && (
                  <Text className="text-xs text-red-500 mt-1">{errors[f.key]?.message}</Text>
                )}
              </View>
            ))}

            {/* Subjects tag input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Subjects</Text>
              <View className="flex-row gap-2 mb-2">
                <TextInput
                  value={subjectInput}
                  onChangeText={setSubjectInput}
                  placeholder="Add a subject..."
                  placeholderTextColor="#9ca3af"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-gray-800"
                  onSubmitEditing={addSubject}
                />
                <TouchableOpacity
                  onPress={addSubject}
                  className="bg-purple-600 rounded-xl px-3 items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg">+</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {subjects.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => removeSubject(s)}
                    className="bg-purple-50 border border-purple-200 rounded-full px-3 py-1 flex-row items-center gap-1"
                  >
                    <Text className="text-purple-700 text-xs">{s}</Text>
                    <Text className="text-purple-400 text-xs">✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit(v => mutation.mutate(v))}
              disabled={mutation.isPending}
              className={`rounded-xl py-3 items-center flex-row justify-center gap-2 ${mutation.isPending ? "bg-gray-300" : "bg-purple-600"}`}
            >
              {mutation.isPending && <ActivityIndicator color="white" size="small" />}
              <Text className="text-white font-semibold">
                {mutation.isPending ? "Saving..." : existing ? "Update Registration" : "Submit Registration"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
