import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';

export default function Cycle() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Cycle & Santé 🌸</ThemedText>
      <ThemedText>Suivi du cycle, traitements, rendez-vous…</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' }
});
