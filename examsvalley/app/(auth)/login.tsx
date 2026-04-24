// EXTRACTED FROM: client/src/pages/public/LoginPage.tsx
// CONVERTED TO:   app/(auth)/login.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, @radix-ui/react-* → RN primitives, form → View
// LOGIC CHANGES: localStorage → SecureStore (handled in AuthContext); window.location → router; Google OAuth → Toast placeholder

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
import { useAuth } from "@/context/AuthContext";
import { validateAuthEmailAddress, AUTH_EMAIL_HELP_TEXT } from "@/lib/email-validation";

const loginSchema = z.object({
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
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [emailCheck, setEmailCheck] = useState<{ exists: boolean; checked: boolean; loading: boolean }>({
    exists: false, checked: false, loading: false,
  });

  const { control, handleSubmit, formState: { errors }, getValues } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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

  async function onSubmit(values: LoginFormValues) {
    const result = await login(values.email, values.password);

    if (result.success) {
      Toast.show({ type: "success", text1: "Welcome back!", text2: "You have been logged in successfully." });
      return;
    }

    if (result.needsEmailVerification && result.email) {
      Toast.show({ type: "info", text1: "Verify your teacher email", text2: result.error || "Enter the OTP sent to your inbox." });
      router.replace(`/(auth)/verify-teacher-email?email=${encodeURIComponent(result.email)}`);
      return;
    }

    Toast.show({ type: "error", text1: "Login failed", text2: result.error || "Invalid email or password" });
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
                <Text className="text-2xl font-bold text-gray-900">Welcome Back</Text>
                <Text className="text-sm text-gray-500 mt-1">Sign in to continue your learning journey</Text>
              </View>

              {/* Form */}
              <View className="space-y-4">
                {/* Email */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900"
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => { onBlur(); onEmailBlur(value); }}
                      />
                    )}
                  />
                  {emailCheck.loading && <ActivityIndicator size="small" className="mt-1" />}
                  {emailCheck.checked && !emailCheck.loading && !emailCheck.exists && (
                    <Text className="text-xs text-red-500 mt-1">
                      Account not found.{" "}
                      <Link href="/(auth)/register" className="underline">Register here</Link>
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
                          className="flex-1 px-3 py-3 text-base text-gray-900"
                          placeholder="Enter your password"
                          secureTextEntry={!showPassword}
                          autoComplete="password"
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

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 rounded-lg py-3 items-center mt-2"
                >
                  {isLoading
                    ? <ActivityIndicator color="white" />
                    : <Text className="text-white font-semibold text-base">Sign In</Text>
                  }
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="mx-3 text-xs text-gray-400 uppercase">Or continue with</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>

                {/* Google (placeholder) */}
                <TouchableOpacity
                  onPress={() => Toast.show({ type: "info", text1: "Coming soon", text2: "Google Sign-In will be available soon." })}
                  className="w-full border border-gray-300 rounded-lg py-3 items-center flex-row justify-center"
                >
                  <Text className="text-gray-700 font-medium">G  Continue with Google</Text>
                </TouchableOpacity>

                {/* Demo credentials */}
                <View className="rounded-lg bg-gray-50 p-4 mt-2">
                  <Text className="text-sm font-medium text-gray-700">Demo Credentials</Text>
                  <Text className="text-sm text-gray-500 mt-1">Student: student@demo.com</Text>
                  <Text className="text-sm text-gray-500">Teacher: teacher@demo.com</Text>
                  <Text className="text-sm text-gray-500">Admin: admin@demo.com</Text>
                  <Text className="text-sm text-gray-500">Password: demo123</Text>
                </View>
              </View>

              {/* Footer */}
              <View className="flex-row justify-center mt-6">
                <Text className="text-sm text-gray-500">Don't have an account? </Text>
                <Link href="/(auth)/register" className="text-sm text-blue-600 font-medium">Register</Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
