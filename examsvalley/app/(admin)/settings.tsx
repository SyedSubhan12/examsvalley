// EXTRACTED FROM: client/src/pages/admin/SystemSettingsPage.tsx
// CONVERTED TO:   app/(admin)/settings.tsx
// BUCKET:         B_convert — placeholder save handlers (same as web)

import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Switch, Alert,
} from "react-native";
import { useRouter } from "expo-router";

export default function SystemSettingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security">("general");

  const [general, setGeneral] = useState({
    siteName: "ExamsValley Educational Platform",
    supportEmail: "support@examsvalley.edu",
  });

  const [notifications, setNotifications] = useState({
    emailNewUsers: true,
    emailContentUploads: true,
    emailAssignmentSubmissions: true,
    emailQuizCompletions: false,
    emailWeeklyDigest: true,
  });

  const [security, setSecurity] = useState({
    minPasswordLength: "8",
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeout: "30",
  });

  const handleSave = () => {
    Alert.alert("Saved", "Settings have been saved.");
  };

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Security" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">System Settings</Text>
        <Text className="text-sm text-gray-500 mb-5">Configure platform settings and preferences</Text>

        {/* Tab strip */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mb-5">
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg ${activeTab === tab.key ? "bg-white shadow-sm" : ""}`}
            >
              <Text className={`text-xs text-center font-medium ${activeTab === tab.key ? "text-gray-900" : "text-gray-500"}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "general" && (
          <View>
            <Text className="text-sm font-semibold text-gray-800 mb-3">General Settings</Text>

            <Text className="text-sm text-gray-600 mb-1">Site Name</Text>
            <TextInput
              value={general.siteName}
              onChangeText={v => setGeneral(p => ({ ...p, siteName: v }))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-4"
            />

            <Text className="text-sm text-gray-600 mb-1">Support Email</Text>
            <TextInput
              value={general.supportEmail}
              onChangeText={v => setGeneral(p => ({ ...p, supportEmail: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-4"
            />

            <TouchableOpacity onPress={handleSave} className="bg-red-600 rounded-xl py-3">
              <Text className="text-center text-sm text-white font-semibold">Save General Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "notifications" && (
          <View>
            <Text className="text-sm font-semibold text-gray-800 mb-3">Notification Settings</Text>

            {([
              { key: "emailNewUsers", label: "New User Registrations" },
              { key: "emailContentUploads", label: "Content Uploads" },
              { key: "emailAssignmentSubmissions", label: "Assignment Submissions" },
              { key: "emailQuizCompletions", label: "Quiz Completions" },
              { key: "emailWeeklyDigest", label: "Weekly Digest" },
            ] as { key: keyof typeof notifications; label: string }[]).map(item => (
              <View key={item.key} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <Text className="text-sm text-gray-700">{item.label}</Text>
                <Switch
                  value={notifications[item.key]}
                  onValueChange={v => setNotifications(p => ({ ...p, [item.key]: v }))}
                  trackColor={{ true: "#dc2626" }}
                />
              </View>
            ))}

            <TouchableOpacity onPress={handleSave} className="bg-red-600 rounded-xl py-3 mt-4">
              <Text className="text-center text-sm text-white font-semibold">Save Notification Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "security" && (
          <View>
            <Text className="text-sm font-semibold text-gray-800 mb-3">Security Settings</Text>

            <Text className="text-sm text-gray-600 mb-1">Min Password Length</Text>
            <TextInput
              value={security.minPasswordLength}
              onChangeText={v => setSecurity(p => ({ ...p, minPasswordLength: v }))}
              keyboardType="numeric"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-4"
            />

            <Text className="text-sm text-gray-600 mb-1">Session Timeout (minutes)</Text>
            <TextInput
              value={security.sessionTimeout}
              onChangeText={v => setSecurity(p => ({ ...p, sessionTimeout: v }))}
              keyboardType="numeric"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-4"
            />

            {([
              { key: "requireUppercase", label: "Require Uppercase Letters" },
              { key: "requireNumbers", label: "Require Numbers" },
              { key: "requireSpecialChars", label: "Require Special Characters" },
            ] as { key: keyof typeof security; label: string }[]).map(item => (
              typeof security[item.key] === "boolean" && (
                <View key={item.key} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <Text className="text-sm text-gray-700">{item.label}</Text>
                  <Switch
                    value={security[item.key] as boolean}
                    onValueChange={v => setSecurity(p => ({ ...p, [item.key]: v }))}
                    trackColor={{ true: "#dc2626" }}
                  />
                </View>
              )
            ))}

            <TouchableOpacity onPress={handleSave} className="bg-red-600 rounded-xl py-3 mt-4">
              <Text className="text-center text-sm text-white font-semibold">Save Security Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mt-6 pt-4 border-t border-gray-100">
          <Text className="text-sm font-semibold text-gray-800 mb-3">More Admin Tools</Text>
          {[
            { label: "Analytics", sub: "Platform usage stats", route: "/(admin)/analytics" },
            { label: "User Feedback", sub: "Ratings and comments", route: "/(admin)/feedback" },
            { label: "Manage Boards", sub: "Configure exam boards", route: "/(admin)/boards/" },
          ].map(link => (
            <TouchableOpacity
              key={link.label}
              onPress={() => router.push(link.route as any)}
              className="flex-row items-center border border-gray-100 rounded-xl p-4 mb-2"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">{link.label}</Text>
                <Text className="text-xs text-gray-500">{link.sub}</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
