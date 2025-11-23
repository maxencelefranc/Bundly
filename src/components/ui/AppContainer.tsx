import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { useTokens } from './ThemeProvider';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { ScrollProvider, useScrollY } from 'src/components/navigation/ScrollContext';

export const AppContainer: React.FC<{ scroll?: boolean; style?: ViewStyle; children?: React.ReactNode }> = ({ scroll = false, style, children }) => {
  const t = useTokens();

  const Inner = () => (
    <View
      style={[
        styles.content,
        { paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.xl + 6, paddingBottom: t.spacing.lg },
        style
      ]}
    >
      {children}
    </View>
  );

  const Scrollable = () => {
    const y = useScrollY();
    const handler = useAnimatedScrollHandler((event) => {
      y.value = event.contentOffset.y;
    });
    return (
      <Animated.ScrollView onScroll={handler} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: t.spacing.xxl }}>
        <Inner />
      </Animated.ScrollView>
    );
  };
  return (
    <LinearGradient colors={[t.color.bg, t.color.surface]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      {/* Softer background accents */}
      <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: t.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', top: -90, right: -70 }} />
      <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: t.mode === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)', bottom: -60, left: -50 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollProvider>
          {scroll ? (
            <Scrollable />
          ) : (
            <Inner />
          )}
        </ScrollProvider>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1
  }
});
