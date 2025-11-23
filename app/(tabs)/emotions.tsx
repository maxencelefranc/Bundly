import React, { useEffect, useState } from 'react';
import { View, Pressable, FlatList } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { ThemedText } from 'src/components/ui/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { listEmotions, getEmotionsStats } from 'src/features/emotions/api';
import { useRouter } from 'expo-router';
import EmotionsEntryForm from 'src/features/emotions/EmotionsEntryForm';

export default function Emotions() {
  const t = useTokens();
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; avg_mood: number | null } | null>(null);
  const router = useRouter();

  const load = async () => {
    const [list, st] = await Promise.all([ listEmotions(50), getEmotionsStats(30) ]);
    setItems(list);
    setStats({ total: st.total, avg_mood: st.avg_mood });
  };

  useEffect(() => { load().catch(()=>{}); }, []);

  return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <ThemedText variant="h1">Émotions</ThemedText>
        <Pressable onPress={() => router.push('/(tabs)/emotions/stats' as any)} style={{ padding:8, borderRadius:12, borderWidth:1, borderColor:t.color.border }} hitSlop={8}>
          <Ionicons name="stats-chart" size={22} color={t.color.text} />
        </Pressable>
      </View>

      <EmotionsEntryForm onSaved={(created, st)=>{ setItems(cur=>[created, ...cur]); setStats(st); }} />

      <View style={{ height: 8 }} />
      <View style={{ flexDirection:'row', alignItems:'center', gap: 12, marginBottom: 8 }}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: t.color.card, borderWidth: 1, borderColor: t.color.border }}>
          <ThemedText>Entrées 30j: {stats?.total ?? 0}</ThemedText>
        </View>
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: t.color.card, borderWidth: 1, borderColor: t.color.border }}>
          <ThemedText>Humeur moy.: {stats?.avg_mood != null ? stats!.avg_mood.toFixed(2) : '—'}</ThemedText>
        </View>
      </View>

      <ThemedText variant="h2" style={{ marginBottom: 8 }}>Récents</ThemedText>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={{ flexDirection:'row', alignItems:'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: t.color.card, borderWidth: 1, borderColor: t.color.border }}>
            <ThemedText style={{ fontSize: 20 }}>{({ 1:'😞', 2:'🙁', 3:'😐', 4:'🙂', 5:'😄' } as any)[item.mood] || '🙂'}</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText>{item.emotion ? item.emotion.charAt(0).toUpperCase() + item.emotion.slice(1) : 'Humeur'}</ThemedText>
              {item.note ? <ThemedText style={{ opacity: 0.7 }} numberOfLines={1}>{item.note}</ThemedText> : null}
            </View>
            <ThemedText style={{ opacity: 0.6 }}>{new Date(item.occurred_at).toLocaleDateString()}</ThemedText>
          </View>
        )}
      />
    </AppContainer>
  );
}
 
