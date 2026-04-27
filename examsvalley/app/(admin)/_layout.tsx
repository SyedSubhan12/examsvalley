// EXTRACTED FROM: admin routing in App.tsx
// CONVERTED TO:   app/(admin)/_layout.tsx
// BUCKET:         B_convert — Tabs navigator for admin panel

import { Tabs } from "expo-router";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#dc2626",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#f3f4f6" },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarLabel: "Dashboard" }} />
      <Tabs.Screen name="users/index" options={{ title: "Users", tabBarLabel: "Users" }} />
      <Tabs.Screen name="moderation" options={{ title: "Moderation", tabBarLabel: "Content" }} />
      <Tabs.Screen name="teachers/index" options={{ title: "Teachers", tabBarLabel: "Teachers" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarLabel: "Settings" }} />

      {/* Hidden screens — accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="users/[id]" options={{ href: null }} />
      <Tabs.Screen name="teachers/[id]" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="feedback" options={{ href: null }} />
      <Tabs.Screen name="boards/index" options={{ href: null }} />
      <Tabs.Screen name="boards/[id]" options={{ href: null }} />
      <Tabs.Screen name="subjects" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ href: null }} />
    </Tabs>
  );
}
