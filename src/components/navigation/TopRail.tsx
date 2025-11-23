import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from 'src/components/ui/ThemeProvider';

export default function TopRail() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTokens();
  const isHome = pathname?.includes('/dashboard');
  const isHub = pathname?.includes('/hub');

  return (
    <View style={styles.outside} pointerEvents="box-none">
      <BlurView
        intensity={30}
        tint={t.mode === 'dark' ? 'dark' : 'light'}
        style={styles.blur}
      />
      <View style={styles.verticalRail}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/dashboard' as any)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }, isHome && styles.activeBtn]}
        >
          <Ionicons name={isHome ? 'home' : 'home-outline'} size={22} color={t.color.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/hub' as any)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }, isHub && styles.activeBtn]}
        >
          <Ionicons name={isHub ? 'grid' : 'grid-outline'} size={22} color={t.color.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outside: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  blur: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 56,
    paddingVertical: 10,
    bottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  verticalRail: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)'
  }
});
