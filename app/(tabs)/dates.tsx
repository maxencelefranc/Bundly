import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';

export default function ImportantDates() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Dates importantes 📅</ThemedText>
      <ThemedText>Anniversaires, surprises, milestones…</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' }
});
