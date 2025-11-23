import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Pressable, ScrollView, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppContainer } from 'src/components/ui/AppContainer';
import { ThemedText } from 'src/components/ui/ThemedText';
import { useTokens } from 'src/components/ui/ThemeProvider';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { getEmotionsSeries, getEmotionsStats } from 'src/features/emotions/api';
import type { EmotionsSeriesPoint } from 'src/features/emotions/types';

export default function EmotionsStatsScreen() {
  const t = useTokens();
  const [range, setRange] = useState<30|90|365|0>(30);
  const [granularity, setGranularity] = useState<'day'|'week'>('day');
  const [series, setSeries] = useState<EmotionsSeriesPoint[]>([]);
  const [stats, setStats] = useState<{ total: number; avg_mood: number | null }>({ total: 0, avg_mood: null });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const days = range === 0 ? 3650 : range;
      const [s, k] = await Promise.all([
        getEmotionsSeries(days, granularity),
        getEmotionsStats(days)
      ]);
      setSeries(s);
      setStats({ total: k.total, avg_mood: k.avg_mood });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range, granularity]);

  const kpis = useMemo(() => {
    return [
      { label: 'Entrées', value: stats.total, color: t.color.primary },
      { label: 'Humeur moy.', value: stats.avg_mood != null ? Number(stats.avg_mood).toFixed(2) : '—', color: t.color.success },
    ];
  }, [stats, t.color]);

  const panRef = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
    onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
      if (gs.dx > 80 && Math.abs(gs.dy) < 50) {
        try { router.push('/(tabs)/emotions' as any); } catch {}
      }
    }
  }));

  return (
    <AppContainer scroll {...panRef.current.panHandlers}>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 }}>
        <Pressable onPress={() => router.push('/(tabs)/emotions' as any)} style={{ padding:8, borderRadius:10 }} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={t.color.text} />
        </Pressable>
        <ThemedText variant="h1">Statistiques Émotions</ThemedText>
      </View>
      <View style={{ flexDirection:'row', gap:8, marginBottom: 10 }}>
        <Chip label="30 j" active={range===30} onPress={()=>setRange(30)} />
        <Chip label="90 j" active={range===90} onPress={()=>setRange(90)} />
        <Chip label="1 an" active={range===365} onPress={()=>setRange(365)} />
        <Chip label="Tout" active={range===0} onPress={()=>setRange(0)} />
      </View>

      <View style={styles.kpiRow}>
        {kpis.map(k => (
          <View key={k.label} style={[styles.kpiCard, { borderColor: k.color }] }>
            <ThemedText style={{ color: k.color, fontSize: 18, fontWeight:'700' }}>{k.value}</ThemedText>
            <ThemedText variant="small" style={{ color: t.color.muted }}>{k.label}</ThemedText>
          </View>
        ))}
      </View>

      <View style={{ flexDirection:'row', gap:8, marginTop: 12 }}>
        <Chip label="Jours" active={granularity==='day'} onPress={()=>setGranularity('day')} />
        <Chip label="Semaines" active={granularity==='week'} onPress={()=>setGranularity('week')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16, paddingRight: 16 }}>
        {series.length === 0 ? (
          <ThemedText style={{ color: t.color.muted, marginTop: 8 }}>Aucune donnée</ThemedText>
        ) : (
          <View style={{ flexDirection:'row', alignItems:'flex-end', gap: 10 }}>
            {series.map((pt) => (
              <MoodBar key={pt.bucket_start} label={formatLabel(pt.bucket_start, granularity)} avg={pt.avg_mood || 0} count={pt.count} />
            ))}
          </View>
        )}
      </ScrollView>
    </AppContainer>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: ()=>void }) {
  const t = useTokens();
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:999, borderWidth:1, borderColor: active? t.color.primary : t.color.border }}>
      <ThemedText style={{ color: active? t.color.primary : t.color.muted }}>{label}</ThemedText>
    </Pressable>
  );
}

function MoodBar({ label, avg, count }: { label: string; avg: number; count: number }) {
  const t = useTokens();
  const maxH = 180;
  const scale = maxH / 5; // mood 1..5
  const height = Math.max(8, Math.min(maxH, avg * scale));
  // color gradient-ish: low red -> mid amber -> high green
  const color = avg >= 4 ? t.color.success : avg >= 2.5 ? t.color.warning : t.color.danger;
  return (
    <View style={{ alignItems:'center' }}>
      <View style={{ width: 40, height, borderRadius: 10, backgroundColor: color, alignItems:'center', justifyContent:'flex-end' }}>
        <ThemedText style={{ color: '#fff', fontWeight:'700' }}>{avg.toFixed(1)}</ThemedText>
      </View>
      <View style={{ height: 2 }} />
      <ThemedText variant="small" style={{ color: t.color.muted, textAlign:'center', width: 56 }}>{label}</ThemedText>
      <ThemedText variant="small" style={{ color: t.color.muted }}>n={count}</ThemedText>
    </View>
  );
}

function formatLabel(isoDate: string, granularity: 'day'|'week') {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  if (granularity === 'day') return `${dd}/${mm}`;
  const end = new Date(d); end.setDate(end.getDate()+6);
  const dd2 = String(end.getDate()).padStart(2,'0');
  const mm2 = String(end.getMonth()+1).padStart(2,'0');
  return `${dd}/${mm}–${dd2}/${mm2}`;
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection:'row', gap: 10, marginTop: 8 },
  kpiCard: { flex:1, borderWidth:1, borderRadius: 12, padding: 12, alignItems:'center' }
});
