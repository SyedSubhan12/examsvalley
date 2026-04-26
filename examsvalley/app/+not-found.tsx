import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter, Stack } from "expo-router";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <View className="items-center">
          <Text className="text-6xl mb-4">🔍</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Page not found</Text>
          <Text className="text-base text-gray-500 text-center mb-8">
            The screen you're looking for doesn't exist or may have been moved.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="bg-blue-600 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Go home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}
