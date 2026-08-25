import { create } from "zustand";
import { Appearance } from "react-native";
import { LIGHT_THEME, DARK_THEME, type Theme } from "@/theme";

interface ThemeState {
  isDark: boolean;
  theme: Theme;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

const systemDark = Appearance.getColorScheme() === "dark";

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: systemDark,
  theme: systemDark ? DARK_THEME : LIGHT_THEME,
  toggle: () =>
    set((s) => ({
      isDark: !s.isDark,
      theme: !s.isDark ? DARK_THEME : LIGHT_THEME,
    })),
  setDark: (dark) =>
    set({
      isDark: dark,
      theme: dark ? DARK_THEME : LIGHT_THEME,
    }),
}));

export function useTheme() {
  return useThemeStore((s) => s.theme);
}

export function useIsDark() {
  return useThemeStore((s) => s.isDark);
}
