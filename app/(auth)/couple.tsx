import React, { useState } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from 'src/lib/supabase';
import { Button } from 'src/components/ui/Button';
import { ThemedText } from 'src/components/ui/ThemedText';
import { AppContainer } from 'src/components/ui/AppContainer';
import { Input } from 'src/components/ui/Input';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTokens } from 'src/components/ui/ThemeProvider';

export default function CoupleSetup() {
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onCreate = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Non authentifié');
      const { data: couple, error } = await supabase
        .from('couples')
        .insert({ name })
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('profiles').update({ couple_id: couple.id }).eq('id', user.id);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible de créer le couple');
    } finally {
      setLoading(false);
    }
  };

  const onJoin = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Non authentifié');
      // Join using public invite_code stored on couples
      const { data: cpl, error } = await supabase
        .from('couples')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle();
      if (error) throw error;
      if (!cpl) throw new Error('Code invalide');
      await supabase.from('profiles').update({ couple_id: cpl.id }).eq('id', user.id);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible de rejoindre le couple');
    } finally {
      setLoading(false);
    }
  };

  const t = useTokens();
  return (
    <AppContainer scroll>
      <Animated.View entering={FadeInDown} layout={Layout.springify()} style={{ marginBottom: 8 }}>
        <ThemedText variant="h1">Votre couple</ThemedText>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80)} layout={Layout.springify()}>
        <View style={{ gap: 12 }}>
          <ThemedText variant="h2">Créer</ThemedText>
          <Input label="Nom du couple" placeholder="ex: Jo & Max" value={name} onChangeText={setName} />
          <Button title={loading ? 'Création…' : 'Créer le couple'} onPress={onCreate} />
        </View>
      </Animated.View>

      <ThemedText variant="small" style={{ textAlign: 'center', marginVertical: 14, color: t.color.muted }}>— ou —</ThemedText>

      <Animated.View entering={FadeInDown.delay(140)} layout={Layout.springify()}>
        <View style={{ gap: 12 }}>
          <ThemedText variant="h2">Rejoindre</ThemedText>
          <Input label="Code d’invitation" placeholder="AB12CD" value={inviteCode} onChangeText={setInviteCode} />
          <Button variant="outline" title={loading ? 'Vérification…' : 'Rejoindre un couple'} onPress={onJoin} />
        </View>
      </Animated.View>
    </AppContainer>
  );
}

const styles = StyleSheet.create({});
