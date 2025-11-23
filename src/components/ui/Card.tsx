import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTokens } from './ThemeProvider';

type CardProps = {
  style?: ViewStyle;
  children?: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean; // adds press feedback styling when used with Pressable outside
  tone?: 'default' | 'subtle';
  padding?: 'sm' | 'md' | 'lg';
};

export const Card: React.FC<CardProps> = ({ style, children, elevated = false, interactive = false, tone = 'default', padding = 'lg' }) => {
  const t = useTokens();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tone === 'subtle' ? (t.mode === 'dark' ? '#131822' : '#FBFAFC') : t.color.card,
          borderColor: t.color.border,
          borderRadius: t.radius.lg,
          padding: padding === 'sm' ? t.spacing.md : padding === 'md' ? t.spacing.lg : t.spacing.xl,
          ...(elevated ? (t.shadow.card as any) : {})
        },
        interactive && { borderColor: t.mode === 'dark' ? '#2B3340' : '#DED9E6' },
        style as any
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1
  }
});
