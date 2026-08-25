import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/themeStore";

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const tabs = [
    { name: "home", icon: "home", label: "Accueil" },
    { name: "tasks", icon: "checkbox", label: "Tâches" },
    { name: "hub", icon: "grid", label: "Modules" },
    { name: "profile", icon: "person", label: "Profil" },
  ];

  return (
    <View
      style={{
        paddingBottom: insets.bottom,
        backgroundColor: theme.navBg,
        borderTopWidth: 0.5,
        borderTopColor: theme.navBorder,
        flexDirection: "row",
      }}
    >
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: "center", paddingTop: 10, paddingBottom: 4, gap: 3 }}
          >
            <Ionicons
              name={(isFocused ? tab.icon : `${tab.icon}-outline`) as any}
              size={22}
              color={isFocused ? theme.navActive : theme.navInactive}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "500",
                color: isFocused ? theme.navActive : theme.navInactive,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="hub" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="shopping" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="emotions" options={{ href: null }} />
      <Tabs.Screen name="treatments" options={{ href: null }} />
      <Tabs.Screen name="anti-waste" options={{ href: null }} />
      <Tabs.Screen name="dates" options={{ href: null }} />
      <Tabs.Screen name="fitness" options={{ href: null }} />
      <Tabs.Screen name="menstruation" options={{ href: null }} />
      <Tabs.Screen name="pets" options={{ href: null }} />
      <Tabs.Screen name="photos" options={{ href: null }} />
      <Tabs.Screen name="subs" options={{ href: null }} />
      <Tabs.Screen name="vehicles" options={{ href: null }} />
      <Tabs.Screen name="nutrition" options={{ href: null }} />
      <Tabs.Screen name="levels" options={{ href: null }} />
    </Tabs>
  );
}
