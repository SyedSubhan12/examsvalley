// CONVERTED TO: app/(teacher)/_layout.tsx
// BUCKET: B_convert
// WEB SOURCE: TeacherLayout.tsx sidebar → Expo Tabs bottom navigator

import { Tabs } from "expo-router";

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7c3aed",
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
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="materials/index"
        options={{
          title: "Materials",
          tabBarIcon: () => <TabIcon emoji="📚" />,
        }}
      />
      <Tabs.Screen
        name="quizzes/index"
        options={{
          title: "Quizzes",
          tabBarIcon: () => <TabIcon emoji="❓" />,
        }}
      />
      <Tabs.Screen
        name="assignments/index"
        options={{
          title: "Tasks",
          tabBarIcon: () => <TabIcon emoji="📋" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="materials/[id]" options={{ href: null }} />
      <Tabs.Screen name="quizzes/[id]" options={{ href: null }} />
      <Tabs.Screen name="assignments/[id]" options={{ href: null }} />
      <Tabs.Screen name="registration" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="mcq-manager" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
