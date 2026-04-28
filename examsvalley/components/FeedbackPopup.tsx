// EXTRACTED FROM: client/src/components/FeedbackPopup.tsx
// CONVERTED TO:   components/FeedbackPopup.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: Dialog → RN Modal, Textarea → TextInput, emoji-rating → emoji TouchableOpacity row, useToast → Toast.show
// LOGIC CHANGES: delayMinutes prop preserved; timer fires only when user is authenticated; dismissed by pressing outside or skip.

import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "@/components/tw"
import { Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useFeedbackStore } from "@/hooks/useFeedbackStore";
import Toast from "react-native-toast-message";

const BASE = process.env.EXPO_PUBLIC_API_URL;

const EMOJIS = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😐", label: "Fair" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 4, emoji: "😊", label: "Great" },
  { value: 5, emoji: "🤩", label: "Excellent" },
];

interface FeedbackPopupProps {
  delayMs?: number; // default 2 minutes
}

export function FeedbackPopup({ delayMs = 2 * 60 * 1000 }: FeedbackPopupProps) {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const { canShowFeedback, setFeedbackSubmitted } = useFeedbackStore();

  useEffect(() => {
    if (!user || !canShowFeedback()) return;
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [user, delayMs]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({ type: "error", text1: "Please select a rating" });
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`${BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment }),
      });
      setFeedbackSubmitted();
      Toast.show({ type: "success", text1: "Thank you! 🎉", text2: "Your feedback helps us improve." });
      setVisible(false);
    } catch {
      Toast.show({ type: "error", text1: "Could not send feedback", text2: "Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setFeedbackSubmitted(); // suppress for today
    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleSkip}
          className="flex-1 bg-black/40 items-center justify-center px-6"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              {/* Header */}
              <Text className="text-lg font-bold text-gray-900 text-center mb-1">
                How's your experience? 😊
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-5">
                Your feedback helps us make ExamsValley better.
              </Text>

              {/* Emoji rating */}
              <View className="flex-row justify-center gap-3 mb-5">
                {EMOJIS.map(({ value, emoji, label }) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setRating(value)}
                    className="items-center"
                  >
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${
                      rating === value ? "bg-purple-100 border-2 border-purple-500" : "bg-gray-50"
                    }`}>
                      <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    </View>
                    <Text className={`text-xs mt-1 ${rating === value ? "text-purple-600 font-medium" : "text-gray-400"}`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment */}
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Anything specific? (optional)"
                multiline numberOfLines={3} textAlignVertical="top"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 mb-4"
                style={{ minHeight: 72 }}
              />

              {/* Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleSkip} className="flex-1 border border-gray-100 rounded-xl py-3 items-center">
                  <Text className="text-gray-500 text-sm">Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-purple-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-semibold text-sm">
                    {submitting ? "Sending…" : "Submit"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
