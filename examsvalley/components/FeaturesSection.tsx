import { View, Text } from "@/components/tw";
import { FileText, CheckSquare, BookOpen, BarChart2, GraduationCap } from "lucide-react-native";
import { useTheme, themeColors } from "@/context/ThemeContext";

const features = [
  {
    icon: FileText,
    title: "Past Papers",
    desc: "Practice with real exam papers from previous years to sharpen your exam technique.",
  },
  {
    icon: CheckSquare,
    title: "Mark Schemes",
    desc: "Understand exactly what examiners are looking for with detailed marking criteria.",
  },
  {
    icon: BookOpen,
    title: "Study Notes",
    desc: "Concise, topic-wise notes crafted to help you revise efficiently and effectively.",
  },
  {
    icon: BarChart2,
    title: "Grade Thresholds",
    desc: "Track grade boundaries to set realistic targets and measure your progress.",
  },
];

export function FeaturesSection() {
  const { theme } = useTheme();
  const c = themeColors[theme];
  const isDark = theme === "dark";

  return (
    <View className="py-10 px-1">
      <View
        style={{
          borderColor: isDark ? "#1e40af66" : "#bfdbfe",
          backgroundColor: isDark ? "#1e3a8a33" : "#eff6ff",
        }}
        className="mb-5 flex-row items-center self-start gap-2 rounded-full border px-3 py-1"
      >
        <GraduationCap size={14} color={c.primary} />
        <Text style={{ color: c.primary }} className="text-xs font-medium">
          Your Complete Study Companion
        </Text>
      </View>

      <Text
        style={{ color: c.text }}
        className="text-2xl font-bold tracking-tight leading-tight"
      >
        Everything You Need <Text style={{ color: c.primary }}>to Ace</Text> Your Exams
      </Text>

      <Text style={{ color: c.textMuted }} className="mt-3 text-sm leading-relaxed">
        Access curated resources for CAIE, Edexcel, and IB — all in one place. From past papers
        to grade thresholds, we have you covered.
      </Text>

      <View className="mt-6 gap-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <View
            key={title}
            style={{
              borderColor: c.border,
              backgroundColor: c.card,
            }}
            className="rounded-xl border p-4"
          >
            <View
              style={{ backgroundColor: isDark ? "#1e3a8a55" : "#dbeafe" }}
              className="mb-3 h-9 w-9 items-center justify-center rounded-lg"
            >
              <Icon size={18} color={c.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ color: c.text }} className="text-sm font-semibold">
              {title}
            </Text>
            <Text style={{ color: c.textMuted }} className="mt-1 text-xs leading-relaxed">
              {desc}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
