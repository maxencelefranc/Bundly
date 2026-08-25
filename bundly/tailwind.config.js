/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,tsx}", "./src/**/*.{js,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: "#FF6B9D",
          light: "#FFB3CE",
          dark: "#D94F7E",
        },
        // Couple levels palette
        level: {
          1: "#94A3B8", // Novices
          2: "#60A5FA", // Complices
          3: "#A78BFA", // Inséparables
          4: "#F59E0B", // Âmes sœurs
          5: "#EF4444", // Légendes
        },
        // Modules
        tasks: "#FF6B9D",
        calendar: "#378ADD",
        shopping: "#1D9E75",
        emotions: "#A78BFA",
        period: "#F472B6",
        pets: "#F59E0B",
        treatments: "#06B6D4",
        fitness: "#22C55E",
        subs: "#8B5CF6",
        waste: "#EF4444",
        photos: "#EC4899",
        dates: "#F97316",
        vehicles: "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        display: ["Poppins-SemiBold"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
      },
    },
  },
  plugins: [],
};
