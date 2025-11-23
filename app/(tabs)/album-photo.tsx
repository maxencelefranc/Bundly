import React from 'react';
import { View } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { ThemedText } from 'src/components/ui/ThemedText';

export default function AlbumPhoto() {
  return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <ThemedText variant="h1" style={{ marginBottom: 12 }}>Album photo</ThemedText>
      <ThemedText style={{ opacity: 0.6 }}>Galerie partagée — à venir.</ThemedText>
    </AppContainer>
  );
}
