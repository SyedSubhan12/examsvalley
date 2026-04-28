// EXTRACTED FROM: client/src/pages/public/TeacherEmailVerificationPage.tsx
// CONVERTED TO:   app/(auth)/verify-teacher-email.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router, window.location.search → useLocalSearchParams
// LOGIC CHANGES: URL param read via useLocalSearchParams instead of URLSearchParams(window.location.search)

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "@/components/tw"
import { KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator } from "react-native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";

export default function TeacherEmailVerificationPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify() {
    setIsVerifying(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        Toast.show({ type: "error", text1: "Verification failed", text2: payload?.error || "Unable to verify this code." });
        return;
      }
      Toast.show({ type: "success", text1: "Email verified", text2: payload?.message || "Your teacher email has been verified." });
      router.replace("/(auth)/login");
    } catch {
      Toast.show({ type: "error", text1: "Verification failed", text2: "An unexpected error occurred." });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        Toast.show({ type: "error", text1: "Could not resend code", text2: payload?.error || "Unable to resend the verification code." });
        return;
      }
      Toast.show({ type: "success", text1: "Verification code sent", text2: payload?.message || "Check your inbox for the new OTP." });
    } catch {
      Toast.show({ type: "error", text1: "Could not resend code", text2: "An unexpected error occurred." });
    } finally {
      setIsResending(false);
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
                  <Text className="text-2xl">✉️</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">Verify Teacher Email</Text>
                <Text className="text-sm text-gray-500 mt-1 text-center">
                  Enter the 6-digit OTP sent to your email to activate teacher verification.
                </Text>
              </View>

              <View className="space-y-4">
                {/* Email */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-3 text-base"
                    placeholder="teacher@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* OTP */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Verification code</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-3 text-base tracking-widest"
                    placeholder="123456"
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                  />
                </View>

                {/* Verify button */}
                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={isVerifying || !email.trim() || otp.trim().length !== 6}
                  className={`w-full rounded-lg py-3 items-center ${isVerifying || !email.trim() || otp.trim().length !== 6 ? "bg-blue-300" : "bg-blue-600"}`}
                >
                  {isVerifying
                    ? <ActivityIndicator color="white" />
                    : <Text className="text-white font-semibold text-base">Verify Email</Text>
                  }
                </TouchableOpacity>

                {/* Info box */}
                <View className="rounded-lg bg-gray-50 p-4">
                  <Text className="text-sm text-gray-500">
                    Teacher accounts stay pending until the email OTP is verified. Admin approval still applies after verification.
                  </Text>
                </View>

                {/* Resend button */}
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={isResending || !email.trim()}
                  className="w-full border border-gray-300 rounded-lg py-3 items-center"
                >
                  {isResending
                    ? <ActivityIndicator size="small" />
                    : <Text className="text-gray-700 font-medium">↺  Resend OTP</Text>
                  }
                </TouchableOpacity>

                <View className="flex-row justify-center mt-2">
                  <Text className="text-sm text-gray-500">Already verified? </Text>
                  <Link href="/(auth)/login" className="text-sm text-blue-600 font-medium">Go to login</Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
