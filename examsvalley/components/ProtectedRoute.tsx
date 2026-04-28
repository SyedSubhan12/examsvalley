// EXTRACTED FROM: client/src/components/ProtectedRoute.tsx
// CONVERTED TO:   components/ProtectedRoute.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter → expo-router
// LOGIC CHANGES: useLocation/setLocation → useRouter/usePathname; div spinner → ActivityIndicator View

import { useEffect, type ReactNode } from "react";
import { View, Text } from "@/components/tw"
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAuth?: boolean;
}

export function ProtectedRoute({ children, requiredAuth = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (requiredAuth && !user) {
      router.replace("/(auth)/login");
      return;
    }
    if (!requiredAuth && user) {
      router.replace(`/(${user.role})/dashboard` as any);
    }
  }, [user, isLoading, requiredAuth]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-sm text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (requiredAuth && !user) return null;
  if (!requiredAuth && user) return null;

  return <>{children}</>;
}
