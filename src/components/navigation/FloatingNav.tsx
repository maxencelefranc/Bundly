import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { BlurView } from 'expo-blur';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useScrollY } from './ScrollContext';

// Floating pill with Home + Hub icons
export default function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTokens();
  const isHome = pathname?.includes('/dashboard');
  const isHub = pathname?.includes('/hub');
  const y = useScrollY();

  // Animate pill out when scrolling down a bit
  const aStyle = useAnimatedStyle(() => {
    const ty = interpolate(y.value, [0, 40], [0, -60]);
    const op = interpolate(y.value, [0, 30], [1, 0.0]);
    return {
      transform: [{ translateY: withTiming(ty, { duration: 180 }) }],
      opacity: withTiming(op, { duration: 180 })
    };
  }, []);

  // Compact mode: shrink width and show only active icon
  const compactProgress = useAnimatedStyle(() => {
    const w = interpolate(y.value, [0, 80], [176, 56], Extrapolation.CLAMP);
    return { width: withTiming(w, { duration: 180 }) };
  });
  const activeKey = isHome ? 'home' : isHub ? 'hub' : 'profile';
  const homeStyle = useAnimatedStyle(() => {
    const sc = interpolate(y.value, [0, 80], [1, activeKey === 'home' ? 1 : 0], Extrapolation.CLAMP);
    const op = interpolate(y.value, [0, 80], [1, activeKey === 'home' ? 1 : 0], Extrapolation.CLAMP);
    return { transform: [{ scale: withTiming(sc, { duration: 100 }) }], opacity: withTiming(op, { duration: 100 }) };
  });
  const hubStyle = useAnimatedStyle(() => {
    const sc = interpolate(y.value, [0, 80], [1, activeKey === 'hub' ? 1 : 0], Extrapolation.CLAMP);
    const op = interpolate(y.value, [0, 80], [1, activeKey === 'hub' ? 1 : 0], Extrapolation.CLAMP);
    return { transform: [{ scale: withTiming(sc, { duration: 100 }) }], opacity: withTiming(op, { duration: 100 }) };
  });
  const profStyle = useAnimatedStyle(() => {
    const sc = interpolate(y.value, [0, 80], [1, activeKey === 'profile' ? 1 : 0], Extrapolation.CLAMP);
    const op = interpolate(y.value, [0, 80], [1, activeKey === 'profile' ? 1 : 0], Extrapolation.CLAMP);
    return { transform: [{ scale: withTiming(sc, { duration: 100 }) }], opacity: withTiming(op, { duration: 100 }) };
  });

  // Halo effect intensity diminishes when scrolling down
  const haloStyle = useAnimatedStyle(() => {
    const op = interpolate(y.value, [0, 80], [0.12, 0], Extrapolation.CLAMP);
    return { opacity: withTiming(op, { duration: 180 }) };
  });

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, aStyle]}>
      <Animated.View style={[styles.blur, compactProgress]}>
        <BlurView intensity={30} tint={t.mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.halo, haloStyle]} />
      </Animated.View>
      <View style={styles.row}>
        <Animated.View style={homeStyle}>
        <Pressable
          onPress={() => router.push('/(tabs)/dashboard' as any)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }, isHome && styles.active]}
        >
          <Ionicons name={isHome ? 'home' : 'home-outline'} size={22} color={t.color.text} />
        </Pressable>
        </Animated.View>
        <Animated.View style={hubStyle}>
        <Pressable
          onPress={() => router.push('/(tabs)/hub' as any)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }, isHub && styles.active]}
        >
          <Ionicons name={isHub ? 'grid' : 'grid-outline'} size={22} color={t.color.text} />
        </Pressable>
        </Animated.View>
        <Animated.View style={profStyle}>
        <Pressable
          onPress={() => router.push('/(tabs)/profile' as any)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name={'person-circle'} size={22} color={t.color.text} />
        </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  blur: {
    position: 'absolute',
    top: 0,
    width: 176,
    height: 54,
    borderRadius: 28,
  },
  halo: {
    borderRadius: 28,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    // subtle blur-like halo overlay, tuned via animated opacity
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: 'rgba(0,0,0,0.06)'
  }
});
