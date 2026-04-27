// components/ScreenHeader.tsx
// Standardised back-button + title bar reused across teacher, admin, and public screens.
// Drop-in replacement for the web PageHeader / ScreenHeader components.

import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shown as "← label" back button. Defaults to router.back(). */
  backLabel?: string;
  backHref?: string;
  /** Inline breadcrumb trail rendered below the back button */
  breadcrumbs?: BreadcrumbItem[];
  /** Right-side action element */
  action?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  backLabel = "Back",
  backHref,
  breadcrumbs,
  action,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref as any);
    } else {
      router.back();
    }
  };

  return (
    <View className="mb-5">
      {/* Back button */}
      <View className="flex-row items-center justify-between mb-1">
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-sm text-gray-400">← {backLabel}</Text>
        </TouchableOpacity>
        {action && <View>{action}</View>}
      </View>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <View className="flex-row flex-wrap items-center gap-1 mb-1">
          {breadcrumbs.map((bc, i) => (
            <View key={i} className="flex-row items-center">
              {i > 0 && <Text className="text-xs text-gray-300 mx-1">›</Text>}
              {bc.href ? (
                <TouchableOpacity onPress={() => router.push(bc.href as any)}>
                  <Text className="text-xs text-blue-500">{bc.label}</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-xs text-gray-500">{bc.label}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-900 leading-tight">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
      )}
    </View>
  );
}
