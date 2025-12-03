import React, { useEffect, useState, useCallback } from 'react';
import { View, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { ThemedText } from 'src/components/ui/ThemedText';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { Button } from 'src/components/ui/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NotificationsLib from 'src/lib/notifications';

const STORAGE_KEYS = {
  EMOTIONS: 'notify:emotions',
  CYCLES: 'notify:cycles',
  TASKS: 'notify:tasks',
  GENERAL: 'notify:general'
};

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  const t = useTokens();
  return (
    <Pressable onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.color.border, marginBottom: 8 }}>
      <ThemedText>{label}</ThemedText>
      <View style={{ width: 46, height: 26, borderRadius: 16, backgroundColor: value ? t.color.primary : t.color.border, padding: 3, alignItems: value ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );
}

export default function Notifications() {
  const t = useTokens();
  const [loading, setLoading] = useState(true);
  const [pushInfo, setPushInfo] = useState<{ supported: boolean; token: string | null; reason: string | null } | null>(null);
  const [emotions, setEmotions] = useState(false);
  const [cycles, setCycles] = useState(false);
  const [tasks, setTasks] = useState(false);
  const [general, setGeneral] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPrefs = useCallback(async () => {
    try {
      const [e, c, r, g] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EMOTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.CYCLES),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.GENERAL),
      ]);
      setEmotions(e === '1');
      setCycles(c === '1');
      setTasks(r === '1');
      setGeneral(g === '1');
    } catch (err) {
      console.warn('Load notif prefs failed', err);
    }
  }, []);

  const savePref = useCallback(async (key: string, val: boolean) => {
    try {
      await AsyncStorage.setItem(key, val ? '1' : '0');
    } catch (err) {
      console.warn('Save pref failed', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await loadPrefs();
        const info = await NotificationsLib.getPushToken();
        if (!mounted) return;
        setPushInfo(info as any);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [loadPrefs]);

  const requestEnablePush = async () => {
    try {
      setSaving(true);
      const info = await NotificationsLib.initNotifications();
      setPushInfo(info as any);
      if (info.token) {
        Alert.alert('Push activées', 'Le token a été récupéré (voir la console pour le token).');
      } else if (!info.supported) {
        Alert.alert('Non supporté', info.reason || 'Push non supportées');
      } else {
        Alert.alert('Permissions non accordées');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d’activer');
    } finally { setSaving(false); }
  };

  const sendTest = async () => {
    try {
      await NotificationsLib.scheduleLocal('Test App_Couple', 'Ceci est une notification de test', 3);
      Alert.alert('Envoyé', 'Notification locale planifiée dans ~3s');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible d’envoyer la notification de test');
    }
  };

  if (loading) return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <ThemedText variant="h1" style={{ marginBottom: 12 }}>Notifications</ThemedText>
      <ActivityIndicator />
    </AppContainer>
  );

  return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <ThemedText variant="h1" style={{ marginBottom: 12 }}>Notifications</ThemedText>

      <View style={{ marginBottom: 12 }}>
        <ThemedText variant="h2">Push distantes</ThemedText>
        <ThemedText style={{ color: t.color.muted, marginBottom: 8 }}>{pushInfo?.supported ? (pushInfo?.token ? 'Push configurées' : 'Permissions non accordées') : 'Push distantes non supportées en mode Expo Go'}</ThemedText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Activer / Demander" onPress={requestEnablePush} disabled={saving} />
          <Button title="Envoyer un test" variant="outline" onPress={sendTest} />
        </View>
        {pushInfo?.token ? <ThemedText variant="small" style={{ marginTop: 8, color: t.color.muted }}>Token: {pushInfo.token.slice(0, 16)}…</ThemedText> : null}
      </View>

      <View style={{ marginBottom: 12 }}>
        <ThemedText variant="h2">Préférences</ThemedText>
        <ToggleRow label="Débrief émotions" value={emotions} onToggle={async () => { const next = !emotions; setEmotions(next); await savePref(STORAGE_KEYS.EMOTIONS, next); }} />
        <ToggleRow label="Rappels cycles" value={cycles} onToggle={async () => { const next = !cycles; setCycles(next); await savePref(STORAGE_KEYS.CYCLES, next); }} />
        <ToggleRow label="Rappels tâches" value={tasks} onToggle={async () => { const next = !tasks; setTasks(next); await savePref(STORAGE_KEYS.TASKS, next); }} />
        <ToggleRow label="Notifications générales" value={general} onToggle={async () => { const next = !general; setGeneral(next); await savePref(STORAGE_KEYS.GENERAL, next); }} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <ThemedText variant="h2">Gestion</ThemedText>
        <ThemedText style={{ color: t.color.muted, marginBottom: 8 }}>Vous pouvez tester les notifications locales ou activer les tokens push pour envoyer des push distantes depuis votre backend.</ThemedText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Test local" onPress={sendTest} />
          <Button title="Suppr. prefs" variant="outline" onPress={async () => { setSaving(true); try { await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS)); await loadPrefs(); Alert.alert('Supprimées'); } finally { setSaving(false); } }} />
        </View>
      </View>

      {Platform.OS === 'android' && (
        <ThemedText variant="small" style={{ color: t.color.muted }}>Sur Android, vérifiez les permissions d’app dans les paramètres si vous ne recevez rien.</ThemedText>
      )}
    </AppContainer>
  );
}
 
