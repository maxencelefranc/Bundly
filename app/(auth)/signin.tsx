import React, { useState } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase, getDevCreds } from 'src/lib/supabase';
import { Button } from 'src/components/ui/Button';
import { Card } from 'src/components/ui/Card';
import { ThemedText } from 'src/components/ui/ThemedText';
import { AppContainer } from 'src/components/ui/AppContainer';
import { Input } from 'src/components/ui/Input';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { GlassCard } from 'src/components/ui/GlassCard';
import { HeroHeader } from 'src/components/ui/HeroHeader';
import { SocialButton } from 'src/components/ui/SocialButton';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dev = getDevCreds();
  const router = useRouter();

  const onSubmit = async (useDev?: boolean) => {
    try {
      setLoading(true);
      const finalEmail = (useDev && dev.email) ? dev.email : email;
      const finalPassword = (useDev && dev.password) ? dev.password : password;
      const trimmed = finalEmail.trim();
      let { error } = await supabase.auth.signInWithPassword({ email: trimmed, password: finalPassword });
      if (error && /Invalid login credentials/i.test(String(error.message))) {
        // Tentative de création du compte démo pour accélérer le setup
        const { data: created, error: createErr } = await supabase.auth.signUp({ email: trimmed, password: finalPassword });
        if (createErr) throw createErr;
        if (!created?.session) {
          Alert.alert(
            'Compte démo créé',
            "Nous avons créé le compte démo. Si la confirmation email est activée, confirmez le lien reçu ou désactivez-la temporairement dans Supabase → Auth → Email pour un login immédiat."
          );
          return;
        }
        // Session immédiate
        router.replace('/');
        return;
      } else if (error) {
        throw error;
      }
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  const t = useTokens();
  return (
    <AppContainer>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 40 }}>
        <Animated.View entering={FadeInDown} layout={Layout.springify()} style={{ marginBottom: 28 }}>
          <ThemedText variant="h1" style={{ textAlign: 'center' }}>Connexion</ThemedText>
          <ThemedText variant="small" style={{ textAlign: 'center', color: t.color.muted, marginTop: 6 }}>Retrouvez vos données partagées</ThemedText>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(60)} layout={Layout.springify()}>
          <Card elevated tone="subtle" padding="md" style={{ marginBottom: 20 }}>
            <Input label="Email" placeholder="vous@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={{ marginBottom: 12 }} />
            <Input label="Mot de passe" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} style={{ marginBottom: 16 }} />
            <Button title={loading ? 'Connexion…' : 'Se connecter'} onPress={() => onSubmit()} />
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Link href={'/(auth)/forgot' as any}>
                <ThemedText variant="small" style={{ color: t.color.muted }}>Mot de passe oublié ?</ThemedText>
              </Link>
            </View>
            {dev.email && dev.password && (
              <View style={{ marginTop: 10 }}>
                <Button title="Connexion rapide (demo)" variant="outline" onPress={() => onSubmit(true)} />
              </View>
            )}
            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <Link href="/(auth)/signup">
                <ThemedText variant="small" style={{ color: t.color.primary }}>Créer un compte</ThemedText>
              </Link>
            </View>
          </Card>
        </Animated.View>
      </View>
    </AppContainer>
  );
}

const styles = StyleSheet.create({});

// Removed decorative chips for a minimalist auth screen
