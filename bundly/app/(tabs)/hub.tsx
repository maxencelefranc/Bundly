import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/themeStore";

const MODULES = [
  {
    label: "Tâches",
    icon: "checkmark-circle-outline",
    route: "/(tabs)/tasks",
    color: "#FF6B9D",
    bg: "#FFF5F8",
  },
  {
    label: "Courses",
    icon: "cart-outline",
    route: "/(tabs)/shopping",
    color: "#1D9E75",
    bg: "#ECFDF5",
  },
  {
    label: "Rendez-vous",
    icon: "calendar-outline",
    route: "/(tabs)/calendar",
    color: "#378ADD",
    bg: "#EFF6FF",
  },
  {
    label: "Émotions",
    icon: "heart-outline",
    route: "/(tabs)/emotions",
    color: "#A78BFA",
    bg: "#F5F3FF",
  },
  {
    label: "Traitements",
    icon: "medical-outline",
    route: "/(tabs)/treatments",
    color: "#06B6D4",
    bg: "#ECFEFF",
  },
  {
    label: "Anti-gaspillage",
    icon: "leaf-outline",
    route: "/(tabs)/anti-waste",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  { label: "Animaux", icon: "paw-outline", route: "/(tabs)/pets", color: "#F59E0B", bg: "#FFFBEB" },
  {
    label: "Photos",
    icon: "camera-outline",
    route: "/(tabs)/photos",
    color: "#EC4899",
    bg: "#FDF2F8",
  },
  { label: "Dates", icon: "gift-outline", route: "/(tabs)/dates", color: "#F97316", bg: "#FFF7ED" },
  {
    label: "Fitness",
    icon: "barbell-outline",
    route: "/(tabs)/fitness",
    color: "#22C55E",
    bg: "#F0FDF4",
  },
  {
    label: "Abonnements",
    icon: "card-outline",
    route: "/(tabs)/subs",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
  {
    label: "Véhicules",
    icon: "car-outline",
    route: "/(tabs)/vehicles",
    color: "#64748B",
    bg: "#F8FAFC",
  },
  {
    label: "Cycle",
    icon: "heart-outline",
    route: "/(tabs)/menstruation",
    color: "#EC4899",
    bg: "#FDF2F8",
  },
  {
    label: "Nutrition",
    icon: "restaurant-outline",
    route: "/(tabs)/nutrition",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
];

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: theme.bgCard,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "600", color: theme.text }}>Modules</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
          Chaque action rapporte des XP
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.label}
              onPress={() => router.push(mod.route as any)}
              activeOpacity={0.7}
              style={{
                width: "47%",
                backgroundColor: theme.bgCard,
                borderRadius: 20,
                padding: 16,
                borderWidth: 0.5,
                borderColor: theme.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: mod.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name={mod.icon as any} size={24} color={mod.color} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
                {mod.label}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="arrow-forward-outline" size={12} color={mod.color} />
                <Text style={{ fontSize: 11, color: mod.color, fontWeight: "500" }}>Ouvrir</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
