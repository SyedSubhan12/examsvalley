// EXTRACTED FROM: client/src/App.tsx (auth route group)
// CONVERTED TO:   app/(auth)/_layout.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router
// LOGIC CHANGES: Stack layout with no header for auth screens

import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
