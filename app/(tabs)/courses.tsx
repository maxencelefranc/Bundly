import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { View, SectionList, FlatList, Pressable, TextInput, ActivityIndicator, SectionListData, Modal } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { ThemedText } from 'src/components/ui/ThemedText';
import { Input } from 'src/components/ui/Input';
import { Card } from 'src/components/ui/Card';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { ensureDefaultShoppingList, fetchShoppingItems, addOrIncrementItem, updateItemPicked, updateItemQuantity, updateItemName, updateItemCategory, removeItem, clearPicked, inferShoppingCategory, type ShoppingItem } from 'src/features/shopping/shoppingApi';
import { listExpiringSoon } from 'src/features/antiwaste/api';
import type { FoodItem } from 'src/features/antiwaste/types';
import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';

// Helpers top-level so child components can use them
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const catChip = (c?: string | null) => {
  if (!c) return { bg: '#EEF2F6', border: '#E6E4ED', text: '#5B6978' };
  const map: Record<string,{bg:string;border:string;text:string}> = {
    'Boulangerie': { bg:'#FFF7E6', border:'#FFE5B3', text:'#8A5A00' },
    'Fruits/Légumes': { bg:'#EAFDF5', border:'#C4F6E5', text:'#0F7B5F' },
    'Boucherie': { bg:'#FFF0F0', border:'#FFD1D1', text:'#C21F1F' },
    'Charcuterie': { bg:'#FFF0F4', border:'#FFD6E3', text:'#A01243' },
    'Poissonnerie': { bg:'#EEF7FF', border:'#CFE8FF', text:'#0063B1' },
    'Fromagerie': { bg:'#FFF8EB', border:'#FFE6BF', text:'#A46900' },
    'Crèmerie': { bg:'#F2F5FF', border:'#D6DFFF', text:'#2A46FF' },
    'Traiteur': { bg:'#EFFFF4', border:'#CFF5DE', text:'#177245' },
    'Épicerie salée': { bg:'#F3F0FF', border:'#E0D9FF', text:'#6B4EFF' },
    'Épicerie sucrée': { bg:'#FDECF3', border:'#F7C7DA', text:'#A61E4D' },
    'Vrac': { bg:'#F0FFF5', border:'#D5F5E3', text:'#2E7D32' },
    'Boissons': { bg:'#E6F7FF', border:'#B3E5FF', text:'#005C99' },
    'Jus frais': { bg:'#FFF7E6', border:'#FFE1B5', text:'#9A5D00' },
    'Surgelés': { bg:'#EAF7FF', border:'#CBEAFF', text:'#0A66A1' },
    'Petit-déjeuner': { bg:'#FFF1E8', border:'#FFD8C2', text:'#9F3E00' },
    'Bébé': { bg:'#F7ECFF', border:'#E3D0FF', text:'#6F38C5' },
    'Animaux': { bg:'#EAFBF1', border:'#C7F0D7', text:'#0E7C3A' },
    'Parfumerie': { bg:'#FFF0F6', border:'#FFD6E7', text:'#9C1A5B' },
    'Hygiène': { bg:'#EFF7FF', border:'#D7E9FF', text:'#0A66A1' },
    'Droguerie': { bg:'#F0FFFA', border:'#D2F7EB', text:'#146356' },
    'Textile': { bg:'#F5F5FF', border:'#E1E1FF', text:'#4A46A3' },
    'Bazar': { bg:'#FFF7F0', border:'#FFE0C7', text:'#9A4A00' },
    'Hygiène/Ménage': { bg:'#F3FFF0', border:'#D8F9CF', text:'#2F7B00' },
    'Autre': { bg:'#EEF2F6', border:'#E6E4ED', text:'#5B6978' },
  };
  return map[c] || map['Autre'];
};

const getItemEmoji = (name: string): string | null => {
  const n = normalize(name);
  if (/\b(lait)\b/.test(n)) return '🥛';
  if (/\b(yaourt|yogourt)\b/.test(n)) return '🥣';
  if (/\b(fromage)\b/.test(n)) return '🧀';
  if (/\b(beurre)\b/.test(n)) return '🧈';
  if (/\b(oeuf|oeufs|egg)\b/.test(n)) return '🥚';
  if (/\b(pain|baguette|brioche|croissant)\b/.test(n)) return '🥖';
  if (/\b(riz)\b/.test(n)) return '🍚';
  if (/\b(pates|pâtes)\b/.test(n)) return '🍝';
  if (/\b(semoule)\b/.test(n)) return '🍲';
  if (/\b(quinoa|lentilles|pois|haricots)\b/.test(n)) return '🫘';
  if (/\b(thon|saumon|poisson)\b/.test(n)) return '🐟';
  if (/\b(crevettes)\b/.test(n)) return '🦐';
  if (/\b(steak|boeuf)\b/.test(n)) return '🥩';
  if (/\b(poulet|volaille)\b/.test(n)) return '🍗';
  if (/\b(porc|jambon|lardons|bacon)\b/.test(n)) return '🥓';
  if (/\b(pomme|banane|tomate|salade|carotte|oignon|avocat|poivron|fruit|legume|légume|légumes|legumes)\b/.test(n)) return '🍎';
  if (/\b(eau)\b/.test(n)) return '💧';
  if (/\b(biere|biere|beer)\b/.test(n)) return '🍺';
  if (/\b(vin)\b/.test(n)) return '🍷';
  if (/\b(cafe|café|the|thé)\b/.test(n)) return '☕';
  if (/\b(biscuits|gateau|gâteau|gateaux|gâteaux|chocolat|sucre|farine)\b/.test(n)) return '🍪';
  if (/\b(savon|shampoing|dentifrice|papier|essuie|lessive|vaisselle)\b/.test(n)) return '🧼';
  return null;
};

const getItemIcon = (name: string, category?: string | null): keyof typeof Ionicons.glyphMap => {
  const n = normalize(name);
  if (/\b(oeuf|oeufs|egg)\b/.test(n)) return 'egg-outline';
  if (/\b(lait|fromage|yaourt|beurre|creme)\b/.test(n)) return 'ice-cream-outline';
  if (/\b(pomme|banane|tomate|salade|carotte|oignon|avocat|poivron|fruit|legume|legumes)\b/.test(n)) return 'nutrition-outline';
  if (/\b(pain|baguette|brioche|croissant)\b/.test(n)) return 'fast-food-outline';
  if (/\b(thon|saumon|crevettes|poisson)\b/.test(n)) return 'fish-outline';
  if (/\b(steak|poulet|boeuf|porc|jambon|lardons|viande)\b/.test(n)) return 'restaurant-outline';
  if (/\b(eau)\b/.test(n)) return 'water-outline';
  if (/\b(biere|biere|beer)\b/.test(n)) return 'beer-outline';
  if (/\b(vin)\b/.test(n)) return 'wine-outline';
  if (/\b(cafe|café|the|thé)\b/.test(n)) return 'cafe-outline';
  if (/\b(biscuits|gateau|gateaux|chocolat|sucre|farine|sucree|sucrees)\b/.test(n)) return 'ice-cream-outline';
  if (/\b(savon|shampoing|dentifrice|papier|essuie|lessive|vaisselle)\b/.test(n)) return 'shirt-outline';
  // fallback on category
  switch (category) {
    case 'Fruits/Légumes': return 'nutrition-outline';
    case 'Boulangerie': return 'fast-food-outline';
    case 'Poissonnerie': return 'fish-outline';
    case 'Boucherie': return 'restaurant-outline';
    case 'Charcuterie': return 'restaurant-outline';
    case 'Fromagerie': return 'ice-cream-outline';
    case 'Traiteur': return 'restaurant-outline';
    case 'Boissons': return 'wine-outline';
    case 'Jus frais': return 'cafe-outline';
    case 'Épicerie sucrée': return 'ice-cream-outline';
    case 'Crèmerie': return 'ice-cream-outline';
    case 'Vrac': return 'basket-outline';
    case 'Parfumerie': return 'color-palette-outline';
    case 'Hygiène': return 'medkit-outline';
    case 'Droguerie': return 'color-wand-outline';
    case 'Textile': return 'shirt-outline';
    case 'Bazar': return 'construct-outline';
    case 'Hygiène/Ménage': return 'shirt-outline';
    default: return 'cart-outline';
  }
};

export default function Courses() {
  const _cid = React.useRef(Math.floor(Math.random()*1e6));
  console.log('[Courses] render id=', _cid.current);
  const t = useTokens();
  const [loading, setLoading] = useState(true);
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [q, setQ] = useState('');
  const qDeferred = React.useDeferredValue(q);
  const [newName, setNewName] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocusToken, setSearchFocusToken] = useState(0);
  // useRef to hold transient search text without causing parent re-renders
  const searchTextRef = React.useRef('');
  const searchInputRef = React.useRef<TextInput>(null);
  const [filter, setFilter] = useState<'all' | 'unp' | 'picked'>('all');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  // On déplace les états du formulaire d'ajout dans un composant enfant pour éviter rerenders parent
  const [importOpen, setImportOpen] = useState(false);
  const [importDays, setImportDays] = useState(3);
  const [importLoading, setImportLoading] = useState(false);
  const [antiItems, setAntiItems] = useState<FoodItem[]>([]);
  const [antiSel, setAntiSel] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  // État d'édition déplacé également dans composant enfant
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const editSuggestedCat = null; // calculé dans le composant enfant

  const catOrder: Record<string, number> = useMemo(() => ({
    'Boulangerie': 1,
    'Fruits/Légumes': 2,
    'Boucherie': 3,
    'Charcuterie': 3.5,
    'Poissonnerie': 4,
    'Fromagerie': 5,
    'Crèmerie': 6,
    'Traiteur': 7,
    'Épicerie salée': 6,
    'Épicerie sucrée': 7,
    'Vrac': 8,
    'Boissons': 9,
    'Jus frais': 10,
    'Surgelés': 11,
    'Petit-déjeuner': 12,
    'Bébé': 13,
    'Animaux': 14,
    'Parfumerie': 15,
    'Hygiène': 16,
    'Droguerie': 17,
    'Textile': 18,
    'Bazar': 19,
    'Hygiène/Ménage': 20,
    'Autre': 99,
  }), []);


  const load = async () => {
    try {
      setLoading(true);
      const l = await ensureDefaultShoppingList();
      setListId(l.id);
      const data = await fetchShoppingItems(l.id);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { console.log('[Courses] mounted id=', _cid.current); load(); return () => console.log('[Courses] unmounted id=', _cid.current); }, []);

  useEffect(() => {
    if (!listId) return;
    const channel = supabase
      .channel('public:shopping_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.shoppingItems, filter: `list_id=eq.${listId}` }, () => { load(); });
    channel.subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [listId]);

  type Section = { title: string; data: ShoppingItem[] };
  const sections: Section[] = useMemo(() => {
    console.log('[Courses] computing sections for q=', qDeferred, 'items=', items.length, 'filter=', filter);
    const txt = qDeferred.trim().toLowerCase();
    let base = items;
    if (filter === 'unp') base = base.filter(i => !i.picked);
    if (filter === 'picked') base = base.filter(i => i.picked);
    if (txt) base = base.filter(i => i.name.toLowerCase().includes(txt) || (i.category||'').toLowerCase().includes(txt));
    const group: Record<string, ShoppingItem[]> = {};
    base.forEach(i => { const k = i.category || 'Autre'; (group[k] ||= []).push(i); });
    const cats = Object.keys(group).sort((a,b) => (catOrder[a]||999) - (catOrder[b]||999) || a.localeCompare(b));
    return cats.map(c => {
      const arr = group[c];
      const unp = arr.filter(i => !i.picked).sort((a,b)=>a.name.localeCompare(b.name));
      const pk = arr.filter(i => i.picked).sort((a,b)=>a.name.localeCompare(b.name));
      const data = collapsed[c] ? [] : [...unp, ...pk];
      return { title: c, data };
    });
  }, [items, qDeferred, filter, collapsed]);
  const unpCount = items.filter(i => !i.picked).length;
  const pickedCount = items.filter(i => i.picked).length;
  useEffect(() => { console.log('[Courses] searchOpen=', searchOpen); }, [searchOpen]);
  useEffect(() => { console.log('[Courses] q=', q, 'qDeferred=', qDeferred); }, [q, qDeferred]);
  useEffect(() => { console.log('[Courses] render after search ref change, searchOpen=', searchOpen); }, [searchOpen]);
  // When opening search, initialize the ref with current committed query
  useEffect(() => { if (searchOpen) { searchTextRef.current = q; } }, [searchOpen, q]);
  useEffect(() => {
    if (searchOpen) {
      console.log('[Courses] focus search input');
      // Defer focus to next tick to ensure view is laid out
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  const onAdd = async () => {
    if (!listId) return;
    const n = newName.trim();
    if (!n) return;
    setNewName('');
    try {
      const created = await addOrIncrementItem(listId, n, null);
      setItems(cur => {
        const idx = cur.findIndex(x => x.id === created.id);
        if (idx >= 0) { const next = [...cur]; next[idx] = created; return next; }
        return [created, ...cur];
      });
    } catch {}
  };

  const inc = async (id: string, q: number) => {
    const it = items.find(i => i.id === id); if (!it) return;
    const next = Math.max(1, it.quantity + q);
    setItems(cur => cur.map(x => x.id===id ? { ...x, quantity: next } : x));
    try { await updateItemQuantity(id, next); } catch {}
  };

  const toggle = async (id: string, picked: boolean) => {
    setItems(cur => cur.map(x => x.id===id ? { ...x, picked } : x));
    try { await updateItemPicked(id, picked); } catch {}
  };

  const remove = async (id: string) => {
    setItems(cur => cur.filter(x => x.id !== id));
    try { await removeItem(id); } catch {}
  };

  const clear = async () => {
    if (!listId) return;
    setItems(cur => cur.filter(x => !x.picked));
    try { await clearPicked(listId); } catch {}
  };

  return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <ThemedText variant="h1" style={{ marginBottom: 12 }}>Courses</ThemedText>
      <Card style={{ marginBottom: 12, padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => { setAddOpen(true); }}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.color.text, alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="add" size={22} color={t.mode==='dark' ? '#0E1116' : '#fff'} />
          </Pressable>
          <Pressable onPress={() => setPasteOpen(true)} style={{ width: 48, height: 48, borderRadius: 24, borderWidth:1, borderColor: t.color.border, alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="clipboard-outline" size={20} color={t.color.text} />
          </Pressable>
          <Pressable onPress={async () => {
            setImportOpen(true);
            try {
              setImportLoading(true);
              const data = await listExpiringSoon(importDays);
              setAntiItems(data);
              const nextSel: Record<string, boolean> = {};
              data.forEach(it => { nextSel[it.id] = true; });
              setAntiSel(nextSel);
            } finally {
              setImportLoading(false);
            }
          }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth:1, borderColor: t.color.border, alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="leaf-outline" size={20} color={t.color.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => setSearchOpen(s => { const next = !s; if (!s) setSearchFocusToken(tk => tk + 1); return next; })} style={{ width: 48, height: 48, borderRadius: 24, borderWidth:1, borderColor: t.color.border, alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="search-outline" size={20} color={t.color.text} />
          </Pressable>
        </View>
        {/* Search input moved to portal overlay (Modal) to avoid keyboard bounce */}
      </Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Pressable onPress={() => setFilter('all')} style={{ height: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: filter==='all'? t.color.primary : t.color.border, alignItems:'center', justifyContent:'center' }}>
          <ThemedText style={{ color: filter==='all'? t.color.primary : t.color.muted }}>Tous</ThemedText>
        </Pressable>
        <Pressable onPress={() => setFilter('unp')} style={{ height: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: filter==='unp'? t.color.primary : t.color.border, alignItems:'center', justifyContent:'center' }}>
          <ThemedText style={{ color: filter==='unp'? t.color.primary : t.color.muted }}>À acheter ({unpCount})</ThemedText>
        </Pressable>
        <Pressable onPress={() => setFilter('picked')} style={{ height: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: filter==='picked'? t.color.primary : t.color.border, alignItems:'center', justifyContent:'center' }}>
          <ThemedText style={{ color: filter==='picked'? t.color.primary : t.color.muted }}>Pris ({pickedCount})</ThemedText>
        </Pressable>
        {pickedCount>0 && (
          <Pressable onPress={clear} style={{ height: 44, paddingHorizontal: 12, borderRadius: 999, alignItems:'center', justifyContent:'center' }}>
            <ThemedText style={{ color: t.color.muted }}>Vider les pris</ThemedText>
          </Pressable>
        )}
      </View>
      {loading && <ActivityIndicator />}
      {!loading && (
        <ItemsList
          sections={sections}
          items={items}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          toggle={toggle}
          inc={inc}
          remove={remove}
        />
      )}
      {/* Inline, always-mounted search overlay to prevent remounts */}
      <View
        style={{
          opacity: searchOpen ? 1 : 0,
          pointerEvents: searchOpen ? 'auto' : 'none',
          position: 'absolute',
          left: 0,
          right: 0,
          top: 58,
          zIndex: 50,
        }}
      >
        <Card style={{ padding: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                ref={searchInputRef}
                placeholder="Recherche…"
                placeholderTextColor={t.color.muted}
                defaultValue={q}
                onChangeText={(v) => { searchTextRef.current = v; }}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect
                onSubmitEditing={() => { const v = searchTextRef.current.trim(); setQ(v); setSearchOpen(false); }}
                keyboardAppearance={t.mode === 'dark' ? 'dark' : 'light'}
                style={{
                  minHeight: 45,
                  borderRadius: 24,
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: t.color.primary,
                  color: t.color.text,
                  backgroundColor: t.mode === 'dark' ? '#141820' : '#FFFFFF',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              />
            </View>
            <Pressable onPress={() => { setQ(searchTextRef.current.trim()); setSearchOpen(false); }} style={{ padding: 6 }}>
              <ThemedText style={{ color: t.color.muted }}>Fermer</ThemedText>
            </Pressable>
          </View>
        </Card>
      </View>
      
      <PasteListModal
        visible={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onSubmit={async (text) => {
          if (!listId) return;
          const lines = text.split(/\r?\n|,|;|·|•|-/).map(s=>s.trim()).filter(Boolean);
          for (const ln of lines) { try { await addOrIncrementItem(listId, ln, null); } catch {} }
          await load();
        }}
      />
      <AddItemModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={async (name, qty, cat) => {
          if (!listId) return;
          for (let k=0; k<qty; k++) { await addOrIncrementItem(listId, name, cat); }
          await load();
        }}
      />
      {importOpen && (
        <View style={{ position:'absolute', left:0, right:0, top:0, bottom:0, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', padding:20 }}>
          <Card style={{ padding: 14, maxHeight:'80%' }}>
            <ThemedText variant="h2" style={{ marginBottom: 8 }}>Importer depuis Anti-gaspi</ThemedText>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom: 8 }}>
              <ThemedText style={{ color:t.color.muted }}>Jusqu’à</ThemedText>
              <Pressable onPress={async () => {
                const next = Math.max(0, importDays - 1); setImportDays(next);
                try { setImportLoading(true); const d = await listExpiringSoon(next); setAntiItems(d); const ns:Record<string,boolean>={}; d.forEach(it=>ns[it.id]=antiSel[it.id] ?? true); setAntiSel(ns);} finally { setImportLoading(false); }
              }} style={{ paddingHorizontal:10, paddingVertical:6, borderWidth:1, borderColor:t.color.border, borderRadius:8 }}>
                <ThemedText>-1j</ThemedText>
              </Pressable>
              <ThemedText>{importDays} jours</ThemedText>
              <Pressable onPress={async () => {
                const next = importDays + 1; setImportDays(next);
                try { setImportLoading(true); const d = await listExpiringSoon(next); setAntiItems(d); const ns:Record<string,boolean>={}; d.forEach(it=>ns[it.id]=antiSel[it.id] ?? true); setAntiSel(ns);} finally { setImportLoading(false); }
              }} style={{ paddingHorizontal:10, paddingVertical:6, borderWidth:1, borderColor:t.color.border, borderRadius:8 }}>
                <ThemedText>+1j</ThemedText>
              </Pressable>
            </View>
            <View style={{ borderWidth:1, borderColor:t.color.border, borderRadius:8, padding:8 }}>
              {importLoading ? <ActivityIndicator /> : (
                <FlatList<FoodItem>
                  data={antiItems}
                  keyExtractor={(it: FoodItem)=>it.id}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }: { item: FoodItem }) => {
                    const sel = !!antiSel[item.id];
                    return (
                      <Pressable onPress={() => setAntiSel(cur => ({ ...cur, [item.id]: !sel }))} style={{ flexDirection:'row', alignItems:'center', paddingVertical:8, gap:10 }}>
                        <View style={{ width:22, height:22, borderRadius:6, borderWidth:1, borderColor:t.color.border, backgroundColor: sel ? t.color.text : 'transparent', alignItems:'center', justifyContent:'center' }}>
                          {sel ? <Ionicons name="checkmark" size={14} color={t.mode==='dark' ? '#0E1116' : '#fff'} /> : null}
                        </View>
                        <View style={{ flex:1 }}>
                          <ThemedText>{item.name}</ThemedText>
                          <ThemedText style={{ color:t.color.muted, fontSize:12 }}>{item.expiration_date}{item.quantity ? ` • x${item.quantity}`:''}</ThemedText>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
              <Pressable onPress={() => { const all = antiItems.reduce((acc, it) => (acc && !!antiSel[it.id]), true); const next:Record<string,boolean>={}; antiItems.forEach(it=>next[it.id]=!all); setAntiSel(next); }} style={{ padding:8 }}>
                <ThemedText style={{ color: t.color.muted }}>Tout {antiItems.every(it=>antiSel[it.id]) ? 'désélectionner' : 'sélectionner'}</ThemedText>
              </Pressable>
              <View style={{ flexDirection:'row', gap:12 }}>
                <Pressable onPress={() => setImportOpen(false)} style={{ padding:8 }}><ThemedText style={{ color: t.color.muted }}>Annuler</ThemedText></Pressable>
                <Pressable onPress={async () => {
                  if (!listId) return;
                  for (const it of antiItems) {
                    if (!antiSel[it.id]) continue;
                    const times = Math.max(1, it.quantity ?? 1);
                    for (let k=0; k<times; k++) {
                      try { await addOrIncrementItem(listId, it.name, it.category ?? null); } catch {}
                    }
                  }
                  setImportOpen(false);
                  await load();
                }} style={{ padding:8 }}><ThemedText style={{ color: t.color.primary }}>Importer</ThemedText></Pressable>
              </View>
            </View>
          </Card>
        </View>
      )}
      <EditItemModal
        item={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, newName) => {
          const current = items.find(i => i.id === id);
          if (!current) return;
          const currentCat = current.category || 'Autre';
          const inferred = inferShoppingCategory(newName);
          setItems(cur => cur.map(it => it.id===id ? { ...it, name: newName, category: inferred!==currentCat ? inferred : it.category } : it));
          await updateItemName(id, newName);
          if (inferred !== currentCat) { await updateItemCategory(id, inferred); }
        }}
      />
    </AppContainer>
  );
}

// Composant ajout article avec état local pour éviter remount parent
const AddItemModal = memo(({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (name: string, qty: number, cat: string | null) => Promise<void>; }) => {
  const t = useTokens();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [cat, setCat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const suggested = useMemo(() => name.trim() ? inferShoppingCategory(name.trim()) : null, [name]);

  const submit = useCallback(async () => {
    const n = name.trim();
    if (!n) return;
    try {
      setSaving(true);
      await onAdd(n, qty, cat ?? suggested ?? null);
      setName(''); setQty(1); setCat(null);
      onClose();
    } finally { setSaving(false); }
  }, [name, qty, cat, suggested, onAdd, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', padding:20 }}>
        <Card style={{ padding:14 }}>
          <ThemedText variant="h2" style={{ marginBottom:8 }}>Nouvel article</ThemedText>
          <Input label="Nom de l’article" placeholder="Ex: Lait entier" value={name} onChangeText={setName} autoFocus disableGlow debugFocus noAnimated style={{ marginBottom:10 }} />
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <ThemedText style={{ color:t.color.muted }}>Quantité</ThemedText>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
              <Pressable onPress={() => setQty(q => Math.max(1, q-1))} style={{ paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor:t.color.border, borderRadius:10 }}>
                <ThemedText>-</ThemedText>
              </Pressable>
              <ThemedText>{qty}</ThemedText>
              <Pressable onPress={() => setQty(q => q+1)} style={{ paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor:t.color.border, borderRadius:10 }}>
                <ThemedText>+</ThemedText>
              </Pressable>
            </View>
          </View>
          <Input label="Catégorie (optionnel)" placeholder={suggested ? `Suggestion: ${suggested}` : 'Ex: Épicerie salée'} value={cat || ''} onChangeText={(v)=>setCat(v||null)} disableGlow noAnimated />
            {suggested && !cat && (
              <ThemedText style={{ color:t.color.muted, marginTop:6 }}>Suggestion détectée: {suggested}</ThemedText>
            )}
          <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:12, marginTop:12 }}>
            <Pressable disabled={saving} onPress={onClose} style={{ padding:8 }}>
              <ThemedText style={{ color: t.color.muted }}>Annuler</ThemedText>
            </Pressable>
            <Pressable disabled={saving} onPress={submit} style={{ padding:8 }}>
              <ThemedText style={{ color: t.color.primary }}>{saving ? 'Ajout…' : 'Ajouter'}</ThemedText>
            </Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  );
});

// Composant édition article avec état local
const EditItemModal = memo(({ item, onClose, onSave }: { item: ShoppingItem | null; onClose: () => void; onSave: (id: string, newName: string) => Promise<void>; }) => {
  const t = useTokens();
  const [name, setName] = useState(item?.name || '');
  const [saving, setSaving] = useState(false);
  const suggested = useMemo(() => name.trim() ? inferShoppingCategory(name.trim()) : null, [name]);
  useEffect(() => { setName(item?.name || ''); }, [item]);

  const submit = useCallback(async () => {
    if (!item) return; const n = name.trim(); if (!n) return;
    try {
      setSaving(true);
      await onSave(item.id, n);
      onClose();
    } finally { setSaving(false); }
  }, [item, name, onSave, onClose]);

  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      {item && (
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', padding:20 }}>
          <Card style={{ padding:16 }}>
            <ThemedText variant="h2" style={{ marginBottom:10 }}>Modifier l’article</ThemedText>
            <Input label="Nom" value={name} onChangeText={setName} autoFocus disableGlow debugFocus noAnimated />
            {suggested && suggested !== (item.category||'Autre') && (
              <View style={{ marginTop:10 }}>
                <ThemedText style={{ color:t.color.muted }}>Catégorie suggérée: {suggested}</ThemedText>
              </View>
            )}
            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:14, marginTop:16 }}>
              <Pressable disabled={saving} onPress={onClose} style={{ padding:8 }}>
                <ThemedText style={{ color:t.color.muted }}>Annuler</ThemedText>
              </Pressable>
              <Pressable disabled={saving} onPress={submit} style={{ padding:8 }}>
                <ThemedText style={{ color:t.color.primary }}>{saving ? 'Sauvegarde…' : 'Enregistrer'}</ThemedText>
              </Pressable>
            </View>
          </Card>
        </View>
      )}
    </Modal>
  );
});

// Composant coller une liste avec état local pour stabilité clavier
const PasteListModal = memo(({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (text: string) => Promise<void>; }) => {
  const t = useTokens();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = useCallback(async () => {
    const payload = text.trim();
    if (!payload) { onClose(); return; }
    try {
      setSaving(true);
      await onSubmit(payload);
      setText('');
      onClose();
    } finally { setSaving(false); }
  }, [text, onSubmit, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', padding:20 }}>
        <Card style={{ padding: 14 }}>
          <ThemedText variant="h2" style={{ marginBottom: 8 }}>Coller une liste</ThemedText>
          <Input
            multiline
            autoFocus
            blurOnSubmit={false}
            noAnimated
            disableGlow
            placeholder={'Ex.\nLait\nPain\nRiz'}
            value={text}
            onChangeText={setText}
            style={{ minHeight:120 }}
          />
          <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:12, marginTop:10 }}>
            <Pressable disabled={saving} onPress={onClose} style={{ padding:8 }}><ThemedText style={{ color: t.color.muted }}>Annuler</ThemedText></Pressable>
            <Pressable disabled={saving} onPress={submit} style={{ padding:8 }}><ThemedText style={{ color: t.color.primary }}>{saving? 'Ajout…' : 'Ajouter'}</ThemedText></Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  );
});

// (SearchBar component removed; inline TextInput used in overlay)

// (Removed) SearchOverlay component — inlined overlay is used to avoid any remounts

// Liste des items isolée pour réduire les rerenders qui perturbent le clavier
function ItemsList({
  sections,
  items,
  collapsed,
  setCollapsed,
  toggle,
  inc,
  remove
}: {
  sections: Array<{ title: string; data: ShoppingItem[] }>;
  items: ShoppingItem[];
  collapsed: Record<string, boolean>;
  setCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggle: (id: string, picked: boolean) => void;
  inc: (id: string, q: number) => void;
  remove: (id: string) => void;
}) {
  const t = useTokens();

  const renderSectionHeader = useCallback(({ section }: any) => {
    const isCollapsed = !!collapsed[section.title];
    const chip = catChip(section.title);
    return (
      <Pressable
        onPress={() => setCollapsed(cur => ({ ...cur, [section.title]: !isCollapsed }))}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingVertical: 8, paddingHorizontal: 8, marginTop: 8,
          borderRadius: 10, backgroundColor: chip.bg, borderWidth: 1, borderColor: chip.border
        }}>
        <ThemedText style={{ color: chip.text, fontWeight: '600' }}>{section.title}</ThemedText>
        <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={16} color={t.color.muted} />
      </Pressable>
    );
  }, [collapsed, setCollapsed, t]);

  const renderItem = useCallback(({ item }: { item: ShoppingItem }) => {
    const icon = getItemIcon(item.name, item.category);
    const emoji = getItemEmoji(item.name);
    const dim = item.picked ? 0.4 : 1;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, opacity: dim }}>
        <Pressable onPress={() => toggle(item.id, !item.picked)}
          style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 1, borderColor: t.color.border, alignItems: 'center', justifyContent: 'center', backgroundColor: item.picked ? t.color.text : 'transparent' }}>
          {item.picked ? <Ionicons name="checkmark" size={16} color={t.mode==='dark' ? '#0E1116' : '#fff'} /> : null}
        </Pressable>
        <View style={{ width: 22, alignItems: 'center' }}>
          {emoji ? <ThemedText style={{ fontSize: 16 }}>{emoji}</ThemedText> : <Ionicons name={icon} size={18} color={t.color.muted} />}
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText>{item.name}</ThemedText>
          {item.category ? <ThemedText style={{ color: t.color.muted, fontSize: 12 }}>{item.category}</ThemedText> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => inc(item.id, -1)} style={{ paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: t.color.border, borderRadius: 8 }}>
            <ThemedText>-</ThemedText>
          </Pressable>
          <ThemedText>{item.quantity}</ThemedText>
          <Pressable onPress={() => inc(item.id, +1)} style={{ paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: t.color.border, borderRadius: 8 }}>
            <ThemedText>+</ThemedText>
          </Pressable>
        </View>
        <Pressable onPress={() => remove(item.id)} style={{ padding: 6 }}>
          <Ionicons name="trash-outline" size={18} color={t.color.muted} />
        </Pressable>
      </View>
    );
  }, [inc, remove, toggle, t]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(it) => it.id}
      stickySectionHeadersEnabled
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      contentContainerStyle={{ paddingBottom: 120 }}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
    />
  );
}
