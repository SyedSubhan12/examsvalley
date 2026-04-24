// CONVERTED TO: app/(student)/_layout.tsx
// BUCKET: B_convert
// WEB SOURCE: StudentLayout.tsx sidebar → Expo Tabs bottom navigator

import { Tabs } from "expo-router";

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="materials/index"
        options={{
          title: "Materials",
          tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mcq/practice"
        options={{
          title: "MCQ",
          tabBarIcon: ({ color }) => <TabIcon emoji="🧠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: "Updates",
          tabBarIcon: ({ color }) => <TabIcon emoji="🔔" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
        }}
      />
      {/* Hidden screens — accessed via navigation, not tabs */}
      <Tabs.Screen name="mcq/session/[id]" options={{ href: null }} />
      <Tabs.Screen name="mcq/stats" options={{ href: null }} />
      <Tabs.Screen name="materials/[id]" options={{ href: null }} />
      <Tabs.Screen name="assignments/index" options={{ href: null }} />
      <Tabs.Screen name="assignments/[id]" options={{ href: null }} />
      <Tabs.Screen name="registration" options={{ href: null }} />
      <Tabs.Screen name="practice/index" options={{ href: null }} />
      <Tabs.Screen name="practice/quiz/[quizId]" options={{ href: null }} />
      <Tabs.Screen name="practice/history" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
