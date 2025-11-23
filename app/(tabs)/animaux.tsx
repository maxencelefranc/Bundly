import React from 'react';
import { View } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { ThemedText } from 'src/components/ui/ThemedText';

export default function Animaux() {
  return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <ThemedText variant="h1" style={{ marginBottom: 12 }}>Animaux</ThemedText>
      <ThemedText style={{ opacity: 0.6 }}>Carnet vétérinaire, repas, poids — à venir.</ThemedText>
    </AppContainer>
  );
}
