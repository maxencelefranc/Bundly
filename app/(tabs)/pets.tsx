import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';

export default function Pets() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Gestion du chat 🐱</ThemedText>
      <ThemedText>Repas, vaccins, suivi du poids, carnet vétérinaire…</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' }
});
