import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_KEY = "ExamsValley_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(systemScheme === "dark" ? "dark" : "light");

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setThemeState(stored);
    });
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    SecureStore.setItemAsync(THEME_KEY, next).catch(() => {});
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export const themeColors = {
  light: {
    bg: "#ffffff",
    card: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    primary: "#2563eb",
  },
  dark: {
    bg: "#0a0f1c",
    card: "#111827",
    surface: "#1e293b",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "#334155",
    primary: "#60a5fa",
  },
} as const;
