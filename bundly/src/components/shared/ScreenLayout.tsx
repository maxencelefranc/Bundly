import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/themeStore";

interface ScreenLayoutProps {
  title: string;
  subtitle?: string;
  color: string;
  icon: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function ScreenLayout({
  title,
  subtitle,
  color,
  icon,
  onAdd,
  children,
  rightElement,
}: ScreenLayoutProps) {
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
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: `${color}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: "600", color: theme.text }}>{title}</Text>
              {subtitle && (
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {rightElement ??
            (onAdd && (
              <TouchableOpacity
                onPress={onAdd}
                activeOpacity={0.8}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={22} color="white" />
              </TouchableOpacity>
            ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
