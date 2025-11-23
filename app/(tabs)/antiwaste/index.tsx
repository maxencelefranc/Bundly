// duplicate import block removed

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, SectionList, TextInput } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'src/lib/auth';
import { listFoodItems, consumeFoodItem, discardFoodItem } from 'src/features/antiwaste/api';
import type { FoodItem } from 'src/features/antiwaste/types';
import { computeStatus, relativeDaysLabel, formatDateShort } from 'src/features/antiwaste/types';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { AppContainer } from 'src/components/ui/AppContainer';
import { useTokens } from 'src/components/ui/ThemeProvider';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { ensureDefaultShoppingList, addOrIncrementItem } from 'src/features/shopping/shoppingApi';
import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';
import FloatingNav from 'src/components/navigation/FloatingNav';

export default function AntiWasteList() {
  const { coupleId } = useAuth();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'soon' | 'expired'>('all');
  const [q, setQ] = useState('');
  const searchTextRef = useRef('');
  const searchInputRef = useRef<TextInput | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const t = useTokens();

  const load = async () => {
    if (!coupleId) return;
    setLoading(true);
    try { const data = await listFoodItems(coupleId); setItems(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [coupleId]);
  useFocusEffect(React.useCallback(() => { load(); }, [coupleId]));

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel('public:food_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.foodItems, filter: `couple_id=eq.${coupleId}` }, () => { load(); })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [coupleId]);

  const filtered = useMemo(() => {
    const qtxt = q.trim().toLowerCase();
    return items.filter(it => {
      const matchQ = it.name.toLowerCase().includes(qtxt) || (it.location || '').toLowerCase().includes(qtxt);
      if (!matchQ) return false;
      const st = computeStatus(it.expiration_date);
      if (filter === 'soon') return st === 'soon';
      if (filter === 'expired') return st === 'expired';
      return true;
    });
  }, [items, q, filter]);

  type Section = { title: string; key: 'soon'|'expired'|'fresh'; data: FoodItem[] };
  const sections: Section[] = useMemo(() => {
    const groups: Record<'fresh'|'soon'|'expired', FoodItem[]> = { fresh: [], soon: [], expired: [] };
    for (const it of filtered) { groups[computeStatus(it.expiration_date)].push(it); }
    const byDate = (a: FoodItem, b: FoodItem) => (a.expiration_date < b.expiration_date ? -1 : a.expiration_date > b.expiration_date ? 1 : a.name.localeCompare(b.name));
    groups.fresh.sort(byDate); groups.soon.sort(byDate); groups.expired.sort(byDate);
    const res: Section[] = [];
    if (groups.soon.length) res.push({ title: 'À consommer bientôt', key: 'soon', data: groups.soon });
    if (groups.expired.length) res.push({ title: 'Périmés', key: 'expired', data: groups.expired });
    if (groups.fresh.length) res.push({ title: 'OK', key: 'fresh', data: groups.fresh });
    return res;
  }, [filtered]);

  return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <View style={styles.header}>
        <ThemedText variant="h1" style={{ marginBottom: 0 }}>Anti-gaspillage</ThemedText>
        <View style={{ flexDirection:'row', gap:12 }}>
          <Pressable onPress={() => router.push('/(tabs)/antiwaste/stats' as any)} style={{ padding:8, borderRadius:12, borderWidth:1, borderColor:t.color.border }} hitSlop={8}>
            <Ionicons name="stats-chart" size={22} color={t.color.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/antiwaste/edit')} style={{ padding:8, borderRadius:12, borderWidth:1, borderColor:t.color.border }} hitSlop={8}>
            <Ionicons name="add" size={24} color={t.color.text} />
          </Pressable>
          <Pressable onPress={() => { setSearchOpen(o=>!o); if (!searchOpen) setTimeout(()=>searchInputRef.current?.focus(),0); }} style={{ padding:8, borderRadius:12, borderWidth:1, borderColor:t.color.border }} hitSlop={8}>
            <Ionicons name="search" size={22} color={t.color.text} />
          </Pressable>
        </View>
      </View>
      <View style={{ position:'absolute', left:0, right:0, top:70, zIndex:50, opacity: searchOpen ? 1 : 0, pointerEvents: searchOpen ? 'auto' : 'none', paddingHorizontal:14 }}>
        <View style={{ borderWidth:1, borderColor:t.color.border, borderRadius:20, backgroundColor:t.color.card, paddingHorizontal:16, paddingVertical:10, flexDirection:'row', alignItems:'center', gap:10 }}>
          <TextInput
            ref={searchInputRef}
            defaultValue={q}
            placeholder="Recherche…"
            placeholderTextColor={t.color.muted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect
            style={{ flex:1, color:t.color.text, padding:0 }}
            onChangeText={(v)=>{ searchTextRef.current = v; }}
            onSubmitEditing={() => { setQ(searchTextRef.current.trim()); setSearchOpen(false); }}
          />
          <Pressable onPress={() => { setQ(searchTextRef.current.trim()); setSearchOpen(false); }} style={{ padding:4 }}>
            <Ionicons name="close" size={18} color={t.color.muted} />
          </Pressable>
        </View>
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom: 10 }}>
        <ChipBtn label={`Tous (${items.length})`} active={filter==='all'} onPress={()=>setFilter('all')} />
        <ChipBtn label={`Bientôt`} active={filter==='soon'} onPress={()=>setFilter('soon')} />
        <ChipBtn label={`Périmés`} active={filter==='expired'} onPress={()=>setFilter('expired')} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(it) => it.id}
        refreshing={loading}
        onRefresh={load}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={{ paddingBottom: 40 }}
        renderSectionHeader={({ section }) => (
          <View style={{ marginTop: 8, marginBottom: 6 }}>
            <ThemedText variant="h2" style={{ fontSize: 18 }}>{section.title} <ThemedText style={{ color: t.color.muted }}>({section.data.length})</ThemedText></ThemedText>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Animated.View entering={searchOpen ? undefined : FadeInUp.delay(index * 30)} layout={searchOpen ? undefined : (Layout as any).springify?.() || undefined}>
            <FoodRow item={item} reload={load} />
          </Animated.View>
        )}
        ListEmptyComponent={<ThemedText style={{ marginTop: 20, color: t.color.muted }}>Aucun produit. Ajoutez votre premier élément.</ThemedText>}
      />
    </AppContainer>
  );
}

function ChipBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTokens();
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderRadius:999, borderColor: active? t.color.primary : t.color.border, backgroundColor: active? (t.mode==='dark' ? '#0E1116' : '#fff') : 'transparent' }}>
      <ThemedText style={{ color: active? t.color.primary : t.color.muted }}>{label}</ThemedText>
    </Pressable>
  );
}

function FoodRow({ item, reload }: { item: FoodItem; reload: () => void }) {
  const router = useRouter();
  const t = useTokens();
  const st = computeStatus(item.expiration_date);
  const dotColor = st === 'expired' ? t.color.danger : st === 'soon' ? t.color.warning : t.color.success;
  const baseLabel = relativeDaysLabel(item.expiration_date);
  const short = formatDateShort(item.expiration_date);
  const rel = short ? `${baseLabel} (${short})` : baseLabel;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/antiwaste/edit', params: { id: item.id } })}
      style={({ pressed }) => [styles.row, { backgroundColor: t.color.surface, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.name}>{item.name}</ThemedText>
          <ThemedText variant="small" style={{ color: t.color.muted }}>{rel} • {item.location || 'Lieu ?'}</ThemedText>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push({ pathname: '/(tabs)/antiwaste/edit', params: { id: item.id } })}
          style={({ pressed }) => [styles.actionBtn, { borderColor: t.color.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText variant="small" style={{ color: t.color.muted }}>Éditer</ThemedText>
        </Pressable>
        <Pressable
          onPress={async () => { try { const l = await ensureDefaultShoppingList(); await addOrIncrementItem(l.id, item.name, null); } finally { reload(); } }}
          style={({ pressed }) => [styles.actionBtn, { borderColor: t.color.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText variant="small" style={{ color: t.color.muted }}>+ Courses</ThemedText>
        </Pressable>
        <Pressable
          onPress={async () => { await consumeFoodItem(item.id); reload(); }}
          style={({ pressed }) => [styles.actionBtn, { borderColor: t.color.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText variant="small" style={{ color: t.color.muted }}>Consommé</ThemedText>
        </Pressable>
        <Pressable
          onPress={async () => { await discardFoodItem(item.id); reload(); }}
          style={({ pressed }) => [styles.actionBtn, { borderColor: t.color.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText variant="small" style={{ color: t.color.muted }}>Jeté</ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 8
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontWeight: '600', marginBottom: 2, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 8, justifyContent: 'flex-start' },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8 },
});
