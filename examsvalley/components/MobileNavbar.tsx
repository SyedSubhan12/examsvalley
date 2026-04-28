import { View, Text, Pressable } from "@/components/tw";
import { GraduationCap, Sun, Moon, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme, themeColors } from "@/context/ThemeContext";

export function MobileNavbar() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const c = themeColors[theme];

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderBottomColor: c.border,
        borderBottomWidth: 1,
      }}
      className="flex-row items-center justify-between px-4 py-3"
    >
      <Pressable className="flex-row items-center gap-2" onPress={() => router.push("/")}>
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <GraduationCap size={18} color="#fff" />
        </View>
        <Text style={{ color: c.text }} className="text-base font-bold">
          ExamsValley
        </Text>
      </Pressable>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={toggleTheme}
          style={{ borderColor: c.border }}
          className="h-9 w-9 items-center justify-center rounded-lg border"
        >
          {theme === "dark" ? <Sun size={16} color={c.text} /> : <Moon size={16} color={c.text} />}
        </Pressable>
        {user ? (
          <Pressable
            onPress={() => router.push(`/(${user.role})/dashboard` as any)}
            style={{ backgroundColor: c.surface }}
            className="h-9 w-9 items-center justify-center rounded-full"
          >
            <User size={18} color={c.text} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            className="rounded-lg bg-blue-600 px-3 py-2"
          >
            <Text className="text-xs font-semibold text-white">Sign In</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
