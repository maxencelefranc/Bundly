import React, { useState } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from 'src/lib/supabase';
import { Button } from 'src/components/ui/Button';
import { ThemedText } from 'src/components/ui/ThemedText';
import { AppContainer } from 'src/components/ui/AppContainer';
import { Card } from 'src/components/ui/Card';
import { Input } from 'src/components/ui/Input';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTokens } from 'src/components/ui/ThemeProvider';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Champs requis', "Merci de renseigner un email et un mot de passe.");
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      // Si la confirmation email est activée, Supabase ne renvoie pas de session immédiate
      if (!data?.session) {
        Alert.alert(
          'Confirmez votre email',
          "Nous vous avons envoyé un email de confirmation. Cliquez sur le lien puis revenez vous connecter."
        );
        return;
      }
      router.replace('/(auth)/couple');
    } catch (e: any) {
      const msg = String(e?.message || e || 'Création impossible');
      // Aide rapide si souci de réseau / config
      if (msg.includes('Network request failed')) {
        Alert.alert(
          'Connexion impossible',
          "La requête n'a pas pu atteindre le serveur. Vérifiez:\n\n• Connexion Internet de l'émulateur\n• Configuration Supabase (.env)\n• Redémarrez Expo après modification (.env)\n• Essayez en mode tunnel: expo start --tunnel"
        );
      } else {
        Alert.alert('Erreur', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debug helper removed for a cleaner signup UI

  const t = useTokens();
  return (
    <AppContainer>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 40 }}>
        <Animated.View entering={FadeInDown} layout={Layout.springify()} style={{ marginBottom: 28 }}>
          <ThemedText variant="h1" style={{ textAlign: 'center' }}>Créer un compte</ThemedText>
          <ThemedText variant="small" style={{ textAlign: 'center', color: t.color.muted, marginTop: 6 }}>Rejoignez votre espace partagé</ThemedText>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(60)} layout={Layout.springify()}>
          <Card elevated tone="subtle" padding="md">
            <Input label="Email" placeholder="vous@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={{ marginBottom: 12 }} />
            <Input label="Mot de passe" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} style={{ marginBottom: 16 }} />
            <Button title={loading ? 'Création…' : 'Créer'} onPress={onSubmit} />
          </Card>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(140)} layout={Layout.springify()}>
          <Link href="/(auth)/signin" style={{ marginTop: 16, alignSelf: 'center' }}>
            <ThemedText variant="small" style={{ color: t.color.primary }}>Déjà un compte ? Se connecter</ThemedText>
          </Link>
        </Animated.View>
      </View>
    </AppContainer>
  );
}

// Removed unused styles object for cleanliness
