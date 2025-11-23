import React, { useState, useCallback, useEffect } from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTokens } from './ThemeProvider';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export const Input = React.forwardRef<TextInput, TextInputProps & { label?: string; disableGlow?: boolean; debugFocus?: boolean; noAnimated?: boolean }>(
  ({ label, style, onFocus, onBlur, disableGlow = false, debugFocus = false, noAnimated = false, ...rest }, ref) => {
  const t = useTokens();
  const [focused, setFocused] = useState(false);
  const glow = useSharedValue(0);
  const aStyle = useAnimatedStyle(() => ({
    shadowOpacity: withTiming(disableGlow ? 0 : (glow.value ? 0.12 : 0)),
    shadowRadius: withTiming(disableGlow ? 0 : (glow.value ? 8 : 0)),
    elevation: disableGlow ? 0 : (glow.value ? 2 : 0)
  }));

  const handleFocus = (e: any) => {
    setFocused(true);
    glow.value = 1;
    if (debugFocus) console.log('[Input] focus');
    onFocus?.(e);
  };
  const handleBlur = (e: any) => {
    setFocused(false);
    glow.value = 0;
    if (debugFocus) console.log('[Input] blur');
    onBlur?.(e);
  };

  const wrappedOnChangeText = useCallback((text: string) => {
    if (rest.onChangeText) rest.onChangeText(text);
  }, [rest.onChangeText]);

  useEffect(() => {
    if (debugFocus) console.log('[Input] mount');
    return () => { if (debugFocus) console.log('[Input] unmount'); };
  }, [debugFocus]);

  const InputElement = (
    <TextInput
      placeholderTextColor={t.color.muted}
      style={[
        styles.input,
        {
          borderColor: focused ? t.color.primary : t.color.border,
          color: t.color.text,
          backgroundColor: t.mode === 'dark' ? '#141820' : '#FFFFFF',
          borderRadius: t.radius.md,
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.lg
        },
        style
      ]}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChangeText={wrappedOnChangeText}
      ref={ref as any}
      {...rest}
    />
  );

  return (
    <View style={{ gap: 6 }}>
      {label ? <ThemedText variant="small" style={{ color: t.color.muted }}>{label}</ThemedText> : null}
      {noAnimated ? (
        <View style={styles.wrap}>{InputElement}</View>
      ) : (
        <Animated.View style={[aStyle, styles.wrap]}>{InputElement}</Animated.View>
      )}
    </View>
  );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    borderWidth: 1
  },
  wrap: {
    shadowColor: '#000'
  }
});
