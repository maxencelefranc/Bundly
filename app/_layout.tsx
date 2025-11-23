import React from 'react';
import { Slot } from 'expo-router';
import { ThemeProvider } from 'src/components/ui/ThemeProvider';
import { AuthProvider } from 'src/lib/auth';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function RootLayout() {
  const ioniconsMap = (Ionicons as any)?.font ? { ...(Ionicons as any).font } : {};
  const [fontsLoaded] = useFonts({
    ...ioniconsMap,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  });
  if (!fontsLoaded) {
    // Keep a minimal placeholder while icon fonts load
    return <View style={{ flex: 1, backgroundColor: '#0000' }} />;
  }
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Slot />
      </AuthProvider>
    </ThemeProvider>
  );
}
