import React from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { ThemedText } from 'src/components/ui/ThemedText';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MODULES = [
  { key: 'tasks', title: 'Tâches', icon: 'checkmark-done', route: '/(tabs)/tasks' },
  { key: 'courses', title: 'Courses', icon: 'cart', route: '/(tabs)/courses' },
  { key: 'antiwaste', title: 'Anti-gaspi', icon: 'leaf', route: '/(tabs)/antiwaste' },
  { key: 'emotions', title: 'Émotions', icon: 'happy', route: '/(tabs)/emotions' },
  { key: 'menstruations', title: 'Menstruations', icon: 'female', route: '/(tabs)/menstruations' },
  { key: 'animaux', title: 'Animaux', icon: 'paw', route: '/(tabs)/animaux' },
  { key: 'rendezvous', title: 'Rendez-vous', icon: 'calendar', route: '/(tabs)/rendezvous' },
  { key: 'traitement', title: 'Traitement', icon: 'medkit', route: '/(tabs)/traitement' },
  { key: 'abonnements', title: 'Abonnements', icon: 'repeat', route: '/(tabs)/abonnements' },
  { key: 'progres', title: 'Progrès Sportifs', icon: 'barbell', route: '/(tabs)/progres-sportifs' },
  { key: 'album', title: 'Album photo', icon: 'images', route: '/(tabs)/album-photo' },
  { key: 'planning', title: 'Planification d’activités', icon: 'today', route: '/(tabs)/planification-activites' },
  { key: 'dates', title: 'Dates importantes', icon: 'gift', route: '/(tabs)/dates' },
  { key: 'vehicules', title: 'Véhicules', icon: 'car', route: '/(tabs)/vehicules' },
  { key: 'notifications', title: 'Notifications', icon: 'notifications', route: '/(tabs)/notifications' },
  { key: 'settings', title: 'Réglages', icon: 'settings', route: '/(tabs)/settings' },
];

export default function Hub() {
  const t = useTokens();
  const router = useRouter();
  return (
    <AppContainer>
      <FloatingNav />
      {/* Spacer to keep content clear of the floating nav */}
      <View style={{ height: 68 }} />
      <ThemedText variant="h1" style={{ marginBottom: 16 }}>Plus</ThemedText>
      <FlatList
        data={MODULES}
        keyExtractor={(it) => it.key}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 14 }}
        contentContainerStyle={{ paddingBottom: t.spacing.xl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              width: '32%',
              aspectRatio: 1,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.color.surface,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name={item.icon as any} size={24} color={t.color.text} />
            <ThemedText variant="small" style={{ marginTop: 6, textAlign: 'center' }}>{item.title}</ThemedText>
          </Pressable>
        )}
      />
    </AppContainer>
  );
}
