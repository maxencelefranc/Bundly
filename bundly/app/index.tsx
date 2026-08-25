import { Redirect } from "expo-router";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/stores/themeStore";
import { View, Image, ActivityIndicator } from "react-native";

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
          gap: 20,
        }}
      >
        <Image
          source={require("../assets/splash-icon.png")}
          style={{ width: 88, height: 88 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={theme.brand} />
      </View>
    );
  }

  if (!profile) return <Redirect href="/(auth)/sign-in" />;
  if (!couple) return <Redirect href="/(auth)/couple-setup" />;
  return <Redirect href="/(tabs)/home" />;
}
