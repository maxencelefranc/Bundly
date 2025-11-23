import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from 'src/lib/supabase';
import { AppContainer } from 'src/components/ui/AppContainer';
import { Card } from 'src/components/ui/Card';
import { Button } from 'src/components/ui/Button';
import { Input } from 'src/components/ui/Input';
import { ThemedText } from 'src/components/ui/ThemedText';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTokens } from 'src/components/ui/ThemeProvider';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useTokens();

  const onSubmit = async () => {
    try {
      if (!email) {
        Alert.alert('Email requis', "Veuillez saisir votre adresse email.");
        return;
      }
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'envoyer le lien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 40 }}>
        <Animated.View entering={FadeInDown} layout={Layout.springify()} style={{ marginBottom: 28 }}>
          <ThemedText variant="h1" style={{ textAlign: 'center' }}>Mot de passe oublié</ThemedText>
          <ThemedText variant="small" style={{ textAlign: 'center', color: t.color.muted, marginTop: 6 }}>
            Recevez un lien de réinitialisation par email
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60)} layout={Layout.springify()}>
          <Card elevated tone="subtle" padding="md">
            {!sent ? (
              <>
                <Input label="Email" placeholder="vous@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={{ marginBottom: 16 }} />
                <Button title={loading ? 'Envoi…' : 'Envoyer le lien'} onPress={onSubmit} />
              </>
            ) : (
              <>
                <ThemedText style={{ marginBottom: 12, textAlign: 'center' }}>
                  Lien envoyé. Vérifiez votre boîte mail et suivez les instructions.
                </ThemedText>
                <Link href="/(auth)/signin" style={{ alignSelf: 'center', marginTop: 4 }}>
                  <ThemedText variant="small" style={{ color: t.color.primary }}>Retour à la connexion</ThemedText>
                </Link>
              </>
            )}
          </Card>
        </Animated.View>
      </View>
    </AppContainer>
  );
}
