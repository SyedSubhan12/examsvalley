// EXTRACTED FROM: client/src/pages/student/StudentRegistrationPage.tsx
// CONVERTED TO:   app/(student)/registration.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, shadcn Form → react-hook-form + TextInput
// LOGIC CHANGES: form.handleSubmit VERBATIM; navigate → router.replace; toast → Toast.show

import { useEffect } from "react";
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

const studentRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().optional(),
  board: z.string().optional(),
  qualifications: z.string().optional(),
  subject: z.string().optional(),
  phoneNumber: z.string().optional(),
  age: z.coerce.number().int().positive().max(120).optional().or(z.literal("")),
  schoolName: z.string().optional(),
});

type FormValues = z.infer<typeof studentRegistrationSchema>;

interface RegResponse extends FormValues {
  id: string; userId: string;
}

const FIELDS: { key: keyof FormValues; label: string; placeholder: string; numeric?: boolean }[] = [
  { key: "name", label: "Name", placeholder: "Your full name" },
  { key: "fatherName", label: "Father Name", placeholder: "Father's name" },
  { key: "board", label: "Board", placeholder: "e.g. CAIE, Edexcel" },
  { key: "qualifications", label: "Qualifications", placeholder: "e.g. A-Level, IGCSE" },
  { key: "subject", label: "Subject", placeholder: "e.g. Mathematics" },
  { key: "phoneNumber", label: "Phone Number", placeholder: "+92 300 1234567" },
  { key: "age", label: "Age", placeholder: "Your age", numeric: true },
  { key: "schoolName", label: "School Name", placeholder: "Your school or college" },
];

export default function StudentRegistrationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery<RegResponse | null>({
    queryKey: ["/api/student/registration"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/student/registration`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      name: "", fatherName: "", board: "", qualifications: "",
      subject: "", phoneNumber: "", age: "", schoolName: "",
    },
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? "",
      fatherName: existing.fatherName ?? "",
      board: existing.board ?? "",
      qualifications: existing.qualifications ?? "",
      subject: existing.subject ?? "",
      phoneNumber: existing.phoneNumber ?? "",
      age: existing.age ?? "",
      schoolName: existing.schoolName ?? "",
    });
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/student/registration", values);
      return res.json() as Promise<RegResponse>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/student/registration"] });
      Toast.show({ type: "success", text1: "Saved", text2: "Your registration details have been saved." });
      if (!existing) {
        router.replace("/(student)/dashboard");
      }
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Save failed", text2: err.message });
    },
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text className="text-2xl font-bold text-gray-900 mb-1">Student Registration</Text>
          <Text className="text-sm text-gray-500 mb-6">Complete your student profile</Text>

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
                      className="border border-gray-200 rounded-xl px-3 py-3 text-gray-800"
                    />
                  )}
                />
                {errors[f.key] && (
                  <Text className="text-xs text-red-500 mt-1">{errors[f.key]?.message}</Text>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={handleSubmit(v => mutation.mutate(v))}
              disabled={mutation.isPending}
              className={`rounded-xl py-3 items-center flex-row justify-center gap-2 ${mutation.isPending ? "bg-gray-300" : "bg-blue-600"}`}
            >
              {mutation.isPending && <ActivityIndicator color="white" size="small" />}
              <Text className="text-white font-semibold">
                {mutation.isPending ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
