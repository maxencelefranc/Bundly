import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppContainer } from 'src/components/ui/AppContainer';
import { ThemedText } from 'src/components/ui/ThemedText';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { getAntiWasteStats, type AntiWasteStats, getAntiWasteSeries, type AntiWasteSeriesPoint, type SeriesGranularity } from 'src/features/antiwaste/api';
import FloatingNav from 'src/components/navigation/FloatingNav';

export default function AntiWasteStatsScreen() {
  const t = useTokens();
  const [range, setRange] = useState<30|90|365|0>(30);
  const [stats, setStats] = useState<AntiWasteStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [granularity, setGranularity] = useState<SeriesGranularity>('day');
  const [series, setSeries] = useState<AntiWasteSeriesPoint[]>([]);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const days = range === 0 ? 3650 : range;
      const s = await getAntiWasteStats(days); setStats(s);
      const g = await getAntiWasteSeries(days, granularity); setSeries(g);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range, granularity]);

  const kpis = useMemo(() => {
    return [
      { label: 'Évité', value: stats?.avoided_waste ?? 0, color: t.color.success },
      { label: 'Gaspillé', value: stats?.discarded ?? 0, color: t.color.danger },
      { label: 'Après péremption', value: stats?.consumed_after_expiry ?? 0, color: t.color.warning },
    ];
  }, [stats, t.color]);

  // Swipe right pour revenir
  const panRef = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
    onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
      if (gs.dx > 80 && Math.abs(gs.dy) < 50) {
        try { router.push('/(tabs)/antiwaste' as any); } catch {}
      }
    }
  }));

  return (
    <AppContainer scroll {...panRef.current.panHandlers}>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 }}>
        <Pressable onPress={() => router.push('/(tabs)/antiwaste' as any)} style={{ padding:8, borderRadius:10 }} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={t.color.text} />
        </Pressable>
        <ThemedText variant="h1">Statistiques Anti-gaspi</ThemedText>
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
              <StackedBar key={pt.key} label={pt.label} avoided={pt.avoided} discarded={pt.discarded} />
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

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const height = Math.min(160, Math.max(6, value * 18));
  const t = useTokens();
  return (
    <View style={{ alignItems:'center', marginRight: 18 }}>
      <View style={{ width: 52, height, backgroundColor: color, borderRadius: 10, justifyContent:'flex-end' }}>
        <ThemedText style={{ color: '#fff', textAlign:'center', fontWeight:'700' }}>{value}</ThemedText>
      </View>
      <ThemedText variant="small" style={{ color: t.color.muted, marginTop: 6, textAlign:'center', width: 64 }}>{label}</ThemedText>
    </View>
  );
}

function StackedBar({ label, avoided, discarded }: { label: string; avoided: number; discarded: number }) {
  const t = useTokens();
  const total = avoided + discarded;
  const maxH = 180;
  const unit = 14; // px per unit
  const height = Math.max(8, Math.min(maxH, total * unit));
  const avoidedH = Math.round((total ? avoided / total : 0) * height);
  const discardedH = height - avoidedH;
  return (
    <View style={{ alignItems:'center' }}>
      <View style={{ width: 40, height, borderRadius: 10, overflow: 'hidden', backgroundColor: t.color.border }}>
        <View style={{ height: avoidedH, backgroundColor: t.color.success }} />
        <View style={{ height: discardedH, backgroundColor: t.color.danger }} />
      </View>
      <View style={{ height: 6 }} />
      <ThemedText variant="small" style={{ color: t.color.muted, textAlign:'center', width: 56 }}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection:'row', gap: 10, marginTop: 8 },
  kpiCard: { flex:1, borderWidth:1, borderRadius: 12, padding: 12, alignItems:'center' }
});
