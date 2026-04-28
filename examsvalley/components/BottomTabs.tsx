import { View, Text, Pressable } from "@/components/tw";
import { Home, BookOpen, Search, User, HelpCircle } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, themeColors } from "@/context/ThemeContext";

const TABS = [
  { label: "Home", href: "/", icon: Home, match: (p: string) => p === "/" },
  { label: "Curriculum", href: "/curriculum", icon: BookOpen, match: (p: string) => p.startsWith("/curriculum") },
  { label: "Subjects", href: "/subjects", icon: Search, match: (p: string) => p.startsWith("/subjects") },
  { label: "Help", href: "/help", icon: HelpCircle, match: (p: string) => p.startsWith("/help") },
  { label: "Profile", href: "/(auth)/login", icon: User, match: (p: string) => p.startsWith("/(auth)") },
] as const;

export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = themeColors[theme];

  return (
    <View
      style={{
        paddingBottom: insets.bottom,
        backgroundColor: c.card,
        borderTopColor: c.border,
        borderTopWidth: 1,
      }}
      className="flex-row"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        const color = active ? c.primary : c.textMuted;
        return (
          <Pressable
            key={tab.href}
            onPress={() => router.push(tab.href as any)}
            className="flex-1 items-center py-2"
          >
            <tab.icon size={20} color={color} />
            <Text style={{ color, fontSize: 11, marginTop: 2, fontWeight: active ? "600" : "400" }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
