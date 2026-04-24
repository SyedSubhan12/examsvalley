// EXTRACTED FROM: client/src/pages/teacher/TeacherResourcesPage.tsx
// CONVERTED TO:   app/(teacher)/resources.tsx
// BUCKET:         B_convert — redirects teacher to curriculum browser

import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

export default function TeacherResourcesPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
      <Text className="text-4xl mb-4">📚</Text>
      <Text className="text-xl font-bold text-gray-900 mb-2">Curriculum Resources</Text>
      <Text className="text-sm text-gray-500 text-center mb-6">
        Browse past papers, notes, and syllabus materials for all subjects and boards.
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/curriculum")}
        className="bg-purple-600 rounded-xl px-6 py-3"
      >
        <Text className="text-white font-semibold">Browse Curriculum →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
