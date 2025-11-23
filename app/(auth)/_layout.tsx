import React from 'react';
import { Stack } from 'expo-router';
import { useTokens } from 'src/components/ui/ThemeProvider';

export default function AuthLayout() {
  const t = useTokens();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.color.card },
        headerTitleStyle: { color: t.color.text, fontWeight: '800' },
        headerTintColor: t.color.text,
        contentStyle: { backgroundColor: t.color.bg },
      }}
    >
      <Stack.Screen name="signin" options={{ title: 'Connexion' }} />
      <Stack.Screen name="signup" options={{ title: 'Créer un compte' }} />
      <Stack.Screen name="couple" options={{ title: 'Votre couple' }} />
    </Stack>
  );
}
