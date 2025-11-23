import React, { useEffect, useMemo, useState } from 'react';
import { View, Image, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import { ThemedText } from 'src/components/ui/ThemedText';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { Card } from 'src/components/ui/Card';
import { Input } from 'src/components/ui/Input';
import { Button } from 'src/components/ui/Button';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { useAuth } from 'src/lib/auth';
import { getOrCreateProfile, ensureCouple, pickAndUploadAvatar, updateProfile, type CoupleRow, getCoupleMembers, updateCoupleName, joinCoupleByCode, regenerateInviteCode } from 'src/features/profile/profileApi';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

export default function Profile() {
  const t = useTokens();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [couple, setCouple] = useState<CoupleRow | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [coupleName, setCoupleName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [debEnabled, setDebEnabled] = useState<boolean>(true);
  const [debHour, setDebHour] = useState<number>(21);

  useEffect(() => {
    const run = async () => {
      try {
        const p = await getOrCreateProfile();
        setDisplayName(p.display_name ?? '');
        setAvatarUrl(p.avatar_url ?? null);
        setDebEnabled(p.emotion_debrief_enabled ?? true);
        setDebHour(p.emotion_debrief_hour ?? 21);
        const c = await ensureCouple(p);
        setCouple(c);
        setCoupleName(c?.name || '');
        if (c?.id) {
          const ms = await getCoupleMembers(c.id);
          setMembers(ms);
        }
      } catch (e: any) {
        console.warn('Profile init failed', e?.message || e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [session?.user?.id]);

  const initials = useMemo(() => {
    if (!displayName?.trim()) return '🫶';
    return displayName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [displayName]);

  const onPickAvatar = async () => {
    try {
      setSaving(true);
      const url = await pickAndUploadAvatar();
      if (url) {
        await updateProfile({ avatar_url: url });
        setAvatarUrl(url);
      }
    } catch (e: any) {
      Alert.alert('Upload impossible', "Assure-toi d'avoir créé le bucket 'avatars' en public côté Supabase.");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      await updateProfile({ display_name: displayName, emotion_debrief_enabled: debEnabled, emotion_debrief_hour: debHour });
      Alert.alert('Profil mis à jour');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  };

  const onSaveCouple = async () => {
    if (!couple?.id) return;
    try {
      setSaving(true);
      await updateCoupleName(couple.id, coupleName);
      Alert.alert('Nom du couple mis à jour');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  };

  const onJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      setSaving(true);
      const cId = await joinCoupleByCode(joinCode.trim());
      const p = await getOrCreateProfile();
      p.couple_id = cId;
      const c = await ensureCouple(p);
      setCouple(c);
      setCoupleName(c.name || '');
      if (c.id) setMembers(await getCoupleMembers(c.id));
      Alert.alert('Rejoint', 'Couple rejoint avec succès');
    } catch (e: any) {
      Alert.alert('Code invalide', e?.message || 'Impossible de rejoindre');
    } finally {
      setSaving(false);
    }
  };

  const onRegenerateInvite = async () => {
    try {
      setSaving(true);
      const newCode = await regenerateInviteCode();
      setCouple((c) => (c ? { ...c, invite_code: newCode } : c));
      Alert.alert('Code régénéré');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de régénérer');
    } finally {
      setSaving(false);
    }
  };

  const onCopyCode = async () => {
    if (!couple?.invite_code) return;
    await Clipboard.setStringAsync(couple.invite_code);
    Alert.alert('Code copié');
  };

  const onShare = async () => {
    if (!couple?.invite_code) return;
    await Share.share({
      title: 'Rejoindre notre couple',
      message: `Voici notre code pour rejoindre le couple sur l'app : ${couple.invite_code}`
    });
  };

  return (
    <AppContainer scroll>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <ThemedText variant="h1" style={{ marginBottom: 16 }}>Profil</ThemedText>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Card style={{ alignItems: 'center', marginBottom: 16 }}>
            <Pressable onPress={onPickAvatar} style={{ marginBottom: 12 }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }}
                  style={{ width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: t.color.border }} />
              ) : (
                <View
                  style={{ width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: t.mode === 'dark' ? '#1f2430' : '#F1EEF5', borderWidth: 1, borderColor: t.color.border }}
                >
                  <ThemedText style={{ fontSize: 28 }}>{initials}</ThemedText>
                </View>
              )}
            </Pressable>
            <Input label="Nom affiché" value={displayName} onChangeText={setDisplayName} placeholder="Votre nom" />
            <View style={{ marginTop: 14, alignSelf:'stretch', gap:8 }}>
              <ThemedText variant="h2" style={{ fontSize:16 }}>Débrief émotions</ThemedText>
              <Pressable onPress={() => setDebEnabled(e=>!e)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderRadius:12, borderWidth:1, borderColor: debEnabled? t.color.primary : t.color.border, backgroundColor: debEnabled? t.color.card : 'transparent' }}>
                <ThemedText>{debEnabled ? 'Activé' : 'Désactivé'}</ThemedText>
                <View style={{ width:42, height:24, borderRadius:12, backgroundColor: debEnabled? t.color.primary : t.color.border, alignItems: debEnabled? 'flex-end':'flex-start', padding:3 }}>
                  <View style={{ width:18, height:18, borderRadius:9, backgroundColor:'#fff' }} />
                </View>
              </Pressable>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                <ThemedText style={{ flex:1 }}>Heure d'envoi (0-23)</ThemedText>
                <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                  <Pressable onPress={() => setDebHour(h=> Math.max(0, h-1))} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, borderWidth:1, borderColor:t.color.border }}>
                    <ThemedText>-</ThemedText>
                  </Pressable>
                  <View style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:8, borderWidth:1, borderColor:t.color.primary, minWidth:54, alignItems:'center' }}>
                    <ThemedText>{debHour}</ThemedText>
                  </View>
                  <Pressable onPress={() => setDebHour(h=> Math.min(23, h+1))} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, borderWidth:1, borderColor:t.color.border }}>
                    <ThemedText>+</ThemedText>
                  </Pressable>
                </View>
              </View>
              <ThemedText variant="small" style={{ color:t.color.muted }}>Un résumé des émotions du jour sera envoyé à votre partenaire vers {debHour}h si activé.</ThemedText>
            </View>
            <Button title={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={onSave} disabled={saving} style={{ marginTop: 12, alignSelf: 'stretch' }} />
          </Card>

          {couple?.id ? (
            <>
              <Card style={{ marginBottom: 16 }}>
                <ThemedText variant="h2" style={{ marginBottom: 8 }}>Couple</ThemedText>
                <Input label="Nom du couple" value={coupleName} onChangeText={setCoupleName} placeholder="Ex: Nous deux" />
                <Button title={saving ? 'Enregistrement…' : 'Sauvegarder'} onPress={onSaveCouple} disabled={saving} style={{ marginTop: 12 }} />
              </Card>

              <Card style={{ marginBottom: 16 }}>
                <ThemedText variant="h2" style={{ marginBottom: 8 }}>Membres</ThemedText>
                <View style={{ gap: 8 }}>
                  {members.map((m) => (
                    <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: t.mode === 'dark' ? '#1f2430' : '#F1EEF5' }}>
                        <ThemedText variant="small">{(m.display_name?.[0] || m.email?.[0] || '?').toUpperCase()}</ThemedText>
                      </View>
                      <ThemedText>{m.display_name || m.email || m.id}</ThemedText>
                    </View>
                  ))}
                </View>
              </Card>

              <Card style={{ marginBottom: 16 }}>
                <ThemedText variant="h2" style={{ marginBottom: 8 }}>Invitation</ThemedText>
                <ThemedText style={{ marginBottom: 10 }}>{couple?.invite_code ?? '—'}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button title="Copier" variant="outline" onPress={onCopyCode} />
                  <Button title="Partager" variant="ghost" onPress={onShare} />
                  <Button title="Régénérer" variant="outline" onPress={onRegenerateInvite} />
                </View>
              </Card>
            </>
          ) : (
            <Card style={{ marginBottom: 16 }}>
              <ThemedText variant="h2" style={{ marginBottom: 8 }}>Rejoindre un couple</ThemedText>
              <Input placeholder="Code d'invitation" value={joinCode} onChangeText={setJoinCode} />
              <Button title={saving ? 'Rejoindre…' : 'Rejoindre'} onPress={onJoin} disabled={saving} style={{ marginTop: 12 }} />
            </Card>
          )}

          <Card style={{ marginBottom: 16 }}>
            <ThemedText variant="h2" style={{ marginBottom: 8 }}>Raccourcis</ThemedText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Réglages" variant="outline" onPress={() => router.push('/(tabs)/settings' as any)} />
              <Button title="Hub" variant="ghost" onPress={() => router.push('/(tabs)/hub' as any)} />
            </View>
          </Card>

          <Button title="Se déconnecter" onPress={signOut} />
        </>
      )}
    </AppContainer>
  );
}
