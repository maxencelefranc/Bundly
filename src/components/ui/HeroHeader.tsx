import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTokens } from './ThemeProvider';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

export const HeroHeader: React.FC<Props> = ({ icon = 'heart', title, subtitle }) => {
  const t = useTokens();
  return (
    <LinearGradient
      // Assure TypeScript que le tableau contient au moins deux couleurs
      colors={t.gradient.primary as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: t.radius.xl,
        padding: t.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Decorative subtle circles */}
      <View
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: 'rgba(255,255,255,0.08)',
          top: -40,
          right: -40
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(255,255,255,0.06)',
          bottom: -30,
          left: -30
        }}
      />

      <Ionicons name={icon} size={30} color="#fff" />
      <ThemedText variant="h2" style={{ color: '#fff', marginTop: 6 }}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText variant="small" style={{ color: '#fff', opacity: 0.9, textAlign: 'center' }}>{subtitle}</ThemedText>
      ) : null}
    </LinearGradient>
  );
};
