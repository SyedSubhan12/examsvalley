// EXTRACTED FROM: client/src/components/RegistrationGate.tsx
// CONVERTED TO:   components/RegistrationGate.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: framer-motion → ActivityIndicator (no animation needed for loading)
// LOGIC CHANGES: Modal-based registration prompts; StudentRegistrationModal/TutorRegistrationModal rendered inline as Modals

import { useEffect, useState, type ReactNode } from "react";
import { View, Text, ActivityIndicator, Modal, SafeAreaView } from "react-native";
import { useAuth } from "@/context/AuthContext";

interface RegistrationGateProps {
  children: ReactNode;
}

export function RegistrationGate({ children }: RegistrationGateProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const checkRegistration = async () => {
      if (!isAuthenticated || !user) {
        setIsChecking(false);
        return;
      }

      if (user.role === "student") {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/student/registration`, { credentials: "include" });
          if (!response.ok) { setShowStudentModal(true); return; }
          const data = await response.json();
          setShowStudentModal(!data);
        } catch {
          setShowStudentModal(true);
        } finally {
          setIsChecking(false);
        }
        return;
      }

      if (user.role === "teacher") {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/tutor/registration`, { credentials: "include" });
          if (!response.ok) { setShowTutorModal(true); return; }
          const data = await response.json();
          setShowTutorModal(!data);
        } catch {
          setShowTutorModal(true);
        } finally {
          setIsChecking(false);
        }
        return;
      }

      setIsChecking(false);
    };

    checkRegistration();
  }, [isAuthenticated, user]);

  if (isChecking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading your profile...</Text>
      </View>
    );
  }

  return (
    <>
      {children}
      {/* Student registration reminder modal */}
      <Modal visible={showStudentModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
          <Text className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile</Text>
          <Text className="text-gray-500 text-center mb-6">
            Please complete your student registration to access all features.
          </Text>
          {/* StudentRegistrationModal content is handled in app/(student)/registration.tsx */}
        </SafeAreaView>
      </Modal>
      {/* Tutor registration reminder modal */}
      <Modal visible={showTutorModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
          <Text className="text-xl font-bold text-gray-900 mb-2">Complete Tutor Registration</Text>
          <Text className="text-gray-500 text-center mb-6">
            Please complete your tutor registration to access all features.
          </Text>
        </SafeAreaView>
      </Modal>
    </>
  );
}
