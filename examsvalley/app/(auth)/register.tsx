// EXTRACTED FROM: client/src/pages/public/RegisterPage.tsx
// CONVERTED TO:   app/(auth)/register.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, RadioGroup → TouchableOpacity role selector, window.location → router
// LOGIC CHANGES: localStorage replaced by AuthContext SecureStore; window.location.href → router.replace

import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { validateAuthEmailAddress, AUTH_EMAIL_HELP_TEXT } from "@/lib/email-validation";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .superRefine((value, ctx) => {
      const validation = validateAuthEmailAddress(value);
      if (!validation.isValid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: validation.error });
      }
    })
    .transform((value) => value.toLowerCase()),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  confirmPassword: z.string(),
  role: z.enum(["student", "teacher"], { required_error: "Please select a role" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailCheck, setEmailCheck] = useState<{ exists: boolean; checked: boolean; loading: boolean }>({
    exists: false, checked: false, loading: false,
  });

  const { control, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", role: undefined },
  });

  const selectedRole = watch("role");

  async function onEmailBlur(email: string) {
    if (!email || email.trim().length === 0) return;
    const validation = validateAuthEmailAddress(email);
    if (!validation.isValid) return;
    setEmailCheck((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validation.normalizedEmail }),
      });
      const data = await response.json();
      setEmailCheck({ exists: data.exists, checked: true, loading: false });
    } catch {
      setEmailCheck((prev) => ({ ...prev, loading: false }));
    }
  }

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password, role: values.role }),
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload.requiresEmailVerification && payload.role === "teacher") {
          Toast.show({ type: "info", text1: "Verify your teacher email", text2: payload.message || "We sent a 6-digit OTP to your email." });
          router.replace(`/(auth)/verify-teacher-email?email=${encodeURIComponent(payload.email)}`);
          return;
        }
        Toast.show({ type: "success", text1: "Account created!", text2: "Welcome to ExamsValley." });
        router.replace(`/(${payload.role})/dashboard` as any);
      } else {
        const error = await response.json();
        Toast.show({ type: "error", text1: "Registration failed", text2: error.error || "Failed to create account" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Registration failed", text2: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 items-center justify-center px-4 py-12">
            <View className="w-full max-w-md">
              {/* Header */}
              <View className="items-center mb-6">
                <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-4">
                  <Text className="text-2xl">🎓</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">Create Account</Text>
                <Text className="text-sm text-gray-500 mt-1">Join ExamsValley and start your learning journey</Text>
              </View>

              <View className="space-y-4">
                {/* Name */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                        placeholder="Enter your full name"
                        autoComplete="name"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  />
                  {errors.name && <Text className="text-xs text-red-500 mt-1">{errors.name.message}</Text>}
                </View>

                {/* Email */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-row border border-gray-300 rounded-lg items-center">
                        <TextInput
                          className="flex-1 px-3 py-3 text-base"
                          placeholder="Enter your email"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          value={value}
                          onChangeText={onChange}
                          onBlur={() => { onBlur(); onEmailBlur(value); }}
                        />
                        {emailCheck.loading && <ActivityIndicator size="small" className="mr-3" />}
                      </View>
                    )}
                  />
                  {emailCheck.checked && !emailCheck.loading && emailCheck.exists && (
                    <Text className="text-xs text-red-500 mt-1">
                      Email already registered. <Link href="/(auth)/login" className="underline">Sign in instead</Link>
                    </Text>
                  )}
                  <Text className="text-xs text-gray-400 mt-1">{AUTH_EMAIL_HELP_TEXT}</Text>
                  {errors.email && <Text className="text-xs text-red-500 mt-1">{errors.email.message}</Text>}
                </View>

                {/* Password */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-row border border-gray-300 rounded-lg items-center">
                        <TextInput
                          className="flex-1 px-3 py-3 text-base"
                          placeholder="Create a password"
                          secureTextEntry={!showPassword}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
                          <Text className="text-gray-500">{showPassword ? "🙈" : "👁"}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.password && <Text className="text-xs text-red-500 mt-1">{errors.password.message}</Text>}
                </View>

                {/* Confirm Password */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-row border border-gray-300 rounded-lg items-center">
                        <TextInput
                          className="flex-1 px-3 py-3 text-base"
                          placeholder="Confirm your password"
                          secureTextEntry={!showConfirmPassword}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="px-3">
                          <Text className="text-gray-500">{showConfirmPassword ? "🙈" : "👁"}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.confirmPassword && <Text className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</Text>}
                </View>

                {/* Role selector */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">I am a</Text>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field: { onChange, value } }) => (
                      <View className="flex-row gap-3">
                        {(["student", "teacher"] as const).map((role) => (
                          <TouchableOpacity
                            key={role}
                            onPress={() => onChange(role)}
                            className={`flex-1 border rounded-lg py-3 items-center ${value === role ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
                          >
                            <Text className={`font-medium capitalize ${value === role ? "text-blue-600" : "text-gray-700"}`}>{role}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                  {errors.role && <Text className="text-xs text-red-500 mt-1">{errors.role.message}</Text>}
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 rounded-lg py-3 items-center mt-2"
                >
                  {isLoading
                    ? <ActivityIndicator color="white" />
                    : <Text className="text-white font-semibold text-base">Create Account</Text>
                  }
                </TouchableOpacity>

                {/* Divider + Google */}
                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="mx-3 text-xs text-gray-400 uppercase">Or continue with</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>
                <TouchableOpacity
                  onPress={() => Toast.show({ type: "info", text1: "Coming soon", text2: "Google Sign-Up will be available soon." })}
                  className="w-full border border-gray-300 rounded-lg py-3 items-center"
                >
                  <Text className="text-gray-700 font-medium">G  Continue with Google</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-center mt-6">
                <Text className="text-sm text-gray-500">Already have an account? </Text>
                <Link href="/(auth)/login" className="text-sm text-blue-600 font-medium">Sign In</Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
