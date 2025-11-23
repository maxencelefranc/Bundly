import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ThemedText } from 'src/components/ui/ThemedText';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTokens();
  const activeIndex = state.index;

  // Ensure high contrast on light backgrounds
  const activeIconColor = t.mode === 'light' ? t.color.text : t.color.text;
  const inactiveIconColor = t.color.muted;
  const activeBg = t.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.10)';

  const items = useMemo(() => state.routes
    // Filter out nested stack routes that shouldn't appear (e.g. edit screens)
    .filter(r => !/\/edit$/.test(r.name))
    .map((route, index) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;
    const isFocused = activeIndex === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };
    const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

  const icon = options.tabBarIcon?.({ color: isFocused ? activeIconColor : inactiveIconColor, size: 22, focused: isFocused });

    return { key: route.key, label, isFocused, onPress, onLongPress, icon };
  }), [state, descriptors, navigation, activeIndex, t]);

  return (
    <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.container}>
      <View style={styles.barWrapper}>
        <BlurView intensity={28} tint={t.mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <View style={styles.barContent}>
          {items.map((it) => (
            <Pressable
              key={it.key}
              accessibilityRole="button"
              accessibilityState={it.isFocused ? { selected: true } : {}}
              onPress={it.onPress}
              onLongPress={it.onLongPress}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
                minWidth: 64,
                backgroundColor: it.isFocused ? activeBg : 'transparent',
              }}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {it.icon}
                  {it.isFocused && (
                    <ThemedText variant="small" style={{ marginTop: 4, fontSize: 11, fontWeight: '600', color: activeIconColor }}>{String(it.label)}</ThemedText>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  barWrapper: { height: 66, borderRadius: 18, overflow: 'hidden' },
  barContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
