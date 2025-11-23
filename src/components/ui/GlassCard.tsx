import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTokens } from './ThemeProvider';

export const GlassCard: React.FC<{ style?: ViewStyle; children?: React.ReactNode }> = ({ style, children }) => {
  const t = useTokens();
  const tint = t.mode === 'dark' ? 'dark' : 'light';
  const bgOverlay = t.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)';
  return (
    <View style={{ borderRadius: t.radius.lg, overflow: 'hidden' }}>
      <BlurView intensity={50} tint={tint} style={{}}
      >
        <View
          style={{
            backgroundColor: bgOverlay,
            padding: t.spacing.lg,
            borderRadius: t.radius.lg,
            borderWidth: 1,
            borderColor: t.color.border,
          }}
        >
          {children}
        </View>
      </BlurView>
    </View>
  );
};
