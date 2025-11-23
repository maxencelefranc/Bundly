import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTokens } from './ThemeProvider';

export const ThemedText: React.FC<TextProps & { variant?: 'h1' | 'h2' | 'body' | 'small' }> = ({ style, children, variant = 'body', ...rest }) => {
  const t = useTokens();
  const preset = t.typography[variant] || t.typography.body;
  return (
    <Text style={[{ color: t.color.text }, preset, style]} {...rest}>
      {children}
    </Text>
  );
};
