import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
// Flat solid button for a mature, clean look
import { useTokens } from './ThemeProvider';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost' | 'outline';
  disabled?: boolean;
};

export const Button: React.FC<Props> = ({ title, onPress, style, variant = 'primary', disabled }) => {
  const t = useTokens();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onIn = () => { scale.value = withSpring(0.98, { stiffness: 300, damping: 20 }); };
  const onOut = () => { scale.value = withSpring(1, { stiffness: 200, damping: 18 }); };
  const base = (
    <Pressable
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor:
            variant === 'primary' ? t.color.primary : 'transparent',
          borderColor: variant === 'outline' ? t.color.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.6 : 1
        },
        pressed && { transform: [{ scale: 0.98 }] },
        style
      ]}
    >
      <Text style={[styles.label, { color: variant === 'primary' ? '#fff' : t.color.text }]}>{title}</Text>
    </Pressable>
  );

  return <Animated.View style={aStyle}>{base}</Animated.View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontSize: 16,
    fontWeight: '700'
  }
});
