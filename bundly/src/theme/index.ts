export const LIGHT_THEME = {
  // Backgrounds
  bg: "#FFF5F8",
  bgCard: "white",
  bgSecondary: "#FFF0F5",
  bgInput: "#FFF5F8",

  // Gradient header
  gradientStart: "#FF6B9D",
  gradientEnd: "#FF8E53",
  gradientMiddle: "#FF7AB5",

  // Text
  text: "#1C1C1E",
  textSecondary: "#8E8E93",
  textMuted: "#C7C7CC",
  textOnGradient: "white",
  textOnGradientMuted: "rgba(255,255,255,0.75)",

  // Borders
  border: "rgba(0,0,0,0.06)",
  borderStrong: "rgba(0,0,0,0.12)",

  // Cards
  cardShadow: "0 2px 12px rgba(255,107,157,0.08)",
  cardBorder: "rgba(255,107,157,0.1)",

  // Brand
  brand: "#FF6B9D",
  brandLight: "#FFF0F5",
  brandMid: "#FF8E53",

  // Nav
  navBg: "white",
  navBorder: "rgba(0,0,0,0.06)",
  navActive: "#FF6B9D",
  navInactive: "#C7C7CC",

  // Modules colors
  tasks: "#FF6B9D",
  calendar: "#378ADD",
  shopping: "#1D9E75",
  emotions: "#A78BFA",
  treatments: "#06B6D4",
  fitness: "#22C55E",
  antiwaste: "#EF4444",
  dates: "#F97316",
  nutrition: "#8B5CF6",
  pets: "#F59E0B",
  subs: "#8B5CF6",
  vehicles: "#64748B",
  photos: "#EC4899",
  menstruation: "#EC4899",
};

export const DARK_THEME = {
  // Backgrounds
  bg: "#0F0F1A",
  bgCard: "#1A1A2E",
  bgSecondary: "#16213E",
  bgInput: "#1A1A2E",

  // Gradient header
  gradientStart: "#FF6B9D",
  gradientEnd: "#7B4FCF",
  gradientMiddle: "#C84B9E",

  // Text
  text: "rgba(255,255,255,0.92)",
  textSecondary: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.25)",
  textOnGradient: "white",
  textOnGradientMuted: "rgba(255,255,255,0.7)",

  // Borders
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",

  // Cards
  cardShadow: "none",
  cardBorder: "rgba(255,255,255,0.06)",

  // Brand
  brand: "#FF9EC8",
  brandLight: "rgba(255,107,157,0.15)",
  brandMid: "#C84B9E",

  // Nav
  navBg: "#0F0F1A",
  navBorder: "rgba(255,255,255,0.07)",
  navActive: "#FF9EC8",
  navInactive: "rgba(255,255,255,0.3)",

  // Modules colors
  tasks: "#FF9EC8",
  calendar: "#85B7EB",
  shopping: "#5DCAA5",
  emotions: "#C4B5FD",
  treatments: "#67E8F9",
  fitness: "#86EFAC",
  antiwaste: "#FCA5A5",
  dates: "#FDB47C",
  nutrition: "#C4B5FD",
  pets: "#FCD34D",
  subs: "#C4B5FD",
  vehicles: "#94A3B8",
  photos: "#F9A8D4",
  menstruation: "#F9A8D4",
};

export type Theme = typeof LIGHT_THEME;
