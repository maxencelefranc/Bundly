import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from 'src/components/ui/ThemeProvider';
// TopRail deprecated; using floating nav inside screens

export default function TabsLayout() {
  const t = useTokens();
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
  headerShown: false,
        tabBarActiveTintColor: t.color.text,
        tabBarInactiveTintColor: t.color.muted,
        tabBarStyle: { display: 'none' },
      }}
    >
  <Tabs.Screen name="dashboard" options={{ title: 'Accueil', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} /> }} />
  <Tabs.Screen name="hub" options={{ title: 'Plus', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} color={color} size={22} /> }} />
    </Tabs>
  );
}
