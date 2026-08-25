import { Redirect } from "expo-router";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/stores/themeStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { profile, couple, isLoading } = useAppStore();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (!profile) return <Redirect href="/(auth)/sign-in" />;
  if (!couple) return <Redirect href="/(auth)/couple-setup" />;
  return <Redirect href="/(tabs)/home" />;
}
