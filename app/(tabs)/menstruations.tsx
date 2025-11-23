import React, { useEffect, useState } from 'react';
import { View, Pressable, FlatList, Alert, TextInput } from 'react-native';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { ThemedText } from 'src/components/ui/ThemedText';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { listPeriods, startPeriod, endCurrentPeriod, getMenstruationStats, updatePeriod, deletePeriod, listSymptoms, addSymptom, deleteSymptom, getMenstruationCalendar, getMenstruationPeriodSummary, type MenstruationPeriod, type MenstruationStats, type MenstruationSymptom, type MenstruationCalendarDay, type MenstruationPeriodSymptomSummary } from 'src/features/menstruations/api';
import { scheduleMenstruationNotifications } from 'src/features/menstruations/notifications';
import { Ionicons } from '@expo/vector-icons';

export default function Menstruations() {
  const t = useTokens();
  const [periods, setPeriods] = useState<MenstruationPeriod[]>([]);
  const [stats, setStats] = useState<MenstruationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [selected, setSelected] = useState<MenstruationPeriod | null>(null);
  const [editFlow, setEditFlow] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [symptoms, setSymptoms] = useState<MenstruationSymptom[]>([]);
  const [symptomType, setSymptomType] = useState('');
  const [symptomIntensity, setSymptomIntensity] = useState<number | null>(null);
  const [symptomNotes, setSymptomNotes] = useState('');
  const [symptomSaving, setSymptomSaving] = useState(false);
  const [summary, setSummary] = useState<MenstruationPeriodSymptomSummary[] | null>(null);
  const SUGGESTED_SYMPTOMS = [
    'Crampes',
    'Maux de tête',
    'Douleurs lombaires',
    'Fatigue',
    'Irritabilité',
    'Sautes d\'humeur',
    'Ballonnements',
    'Envies alimentaires',
    'Sensibilité poitrine'
  ];

  // Calendar predictions
  const [calendarDays, setCalendarDays] = useState<MenstruationCalendarDay[]>([]);
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-11
  const monthStart = new Date(calYear, calMonth, 1);
  const monthEnd = new Date(calYear, calMonth+1, 0);
  function fmt(d: Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  const loadCalendar = async () => {
    try { const data = await getMenstruationCalendar(fmt(monthStart), fmt(monthEnd)); setCalendarDays(data); } catch(e:any){ console.warn('calendar load', e.message); }
  };
  const changeMonth = (delta:number) => {
    setCalMonth(m => {
      let nm = m + delta; let y = calYear;
      if (nm < 0) { nm = 11; y -= 1; setCalYear(y); }
      else if (nm > 11) { nm = 0; y += 1; setCalYear(y); }
      return nm;
    });
  };
  useEffect(() => { loadCalendar(); }, [calMonth, calYear]);

  const load = async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([listPeriods(30), getMenstruationStats()]);
      setPeriods(list);
      setStats(st);
    } catch (e:any) {
      console.warn('menstruations load', e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); loadCalendar(); scheduleMenstruationNotifications().catch(()=>{}); }, []);

  const hasOpen = periods.some(p => !p.end_date);

  // Cycle lengths (from start_date of period to start_date of next period)
  const cycleLengths = React.useMemo(() => {
    const sorted = [...periods].sort((a,b) => a.start_date.localeCompare(b.start_date));
    const arr: { start: string; nextStart: string; length: number }[] = [];
    for (let i=0; i<sorted.length-1; i++) {
      const cur = sorted[i];
      const next = sorted[i+1];
      if (!cur.start_date || !next.start_date) continue;
      const len = (new Date(next.start_date).getTime() - new Date(cur.start_date).getTime()) / (1000*60*60*24);
      if (len > 0 && len < 100) arr.push({ start: cur.start_date, nextStart: next.start_date, length: Math.round(len) });
    }
    return arr;
  }, [periods]);
  const maxLength = cycleLengths.reduce((m,c)=> c.length>m?c.length:m, 0);
  const avgLengthLocal = cycleLengths.length ? Math.round(cycleLengths.reduce((s,c)=>s+c.length,0)/cycleLengths.length) : null;

  const onStart = async () => {
    if (hasOpen) { Alert.alert('Déjà en cours', 'Un cycle est déjà en cours. Terminez-le avant d’en démarrer un nouveau.'); return; }
    try {
      setSaving(true);
      await startPeriod();
      await load();
    } catch (e:any) { Alert.alert('Erreur', e.message || 'Impossible de démarrer'); } finally { setSaving(false); }
  };
  const onEnd = async () => {
    if (!hasOpen) { Alert.alert('Aucun cycle en cours'); return; }
    try {
      setSaving(true);
      await endCurrentPeriod();
      await load();
    } catch (e:any) { Alert.alert('Erreur', e.message || 'Impossible de terminer'); } finally { setSaving(false); }
  };

  const startEdit = (p: MenstruationPeriod) => {
    setSelected(p);
    setEditFlow(p.flow_level ?? null);
    setEditNotes(p.notes ?? '');
    setEditTitle(p.title ?? '');
    loadSymptoms(p.id);
    loadSummary(p.id);
  };

  const cancelEdit = () => {
    setSelected(null);
    setEditFlow(null);
    setEditNotes('');
    setEditTitle('');
    setSymptoms([]);
    setSummary(null);
    setSymptomType('');
    setSymptomIntensity(null);
    setSymptomNotes('');
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      setEditSaving(true);
      await updatePeriod(selected.id, { flow_level: editFlow, notes: editNotes, title: editTitle });
      await load();
      await loadCalendar();
      cancelEdit();
    } catch (e:any) { Alert.alert('Erreur', e.message || 'Sauvegarde impossible'); } finally { setEditSaving(false); }
  };
    const loadSymptoms = async (periodId: string) => {
      try {
        const list = await listSymptoms(periodId);
        setSymptoms(list);
      } catch (e:any) { console.warn('symptoms load', e.message); }
    };
    const loadSummary = async (periodId: string) => {
      try { const s = await getMenstruationPeriodSummary(periodId); setSummary(s); } catch(e:any){ console.warn('summary', e.message); }
    };

    const addNewSymptom = async () => {
      if (!selected) return;
      if (!symptomType) { Alert.alert('Type requis'); return; }
      try {
        setSymptomSaving(true);
        await addSymptom(selected.id, symptomType, symptomIntensity, symptomNotes);
        await loadSymptoms(selected.id);
        setSymptomType('');
        setSymptomIntensity(null);
        setSymptomNotes('');
      } catch (e:any) { Alert.alert('Erreur', e.message || 'Ajout impossible'); } finally { setSymptomSaving(false); }
    };

    const removeSymptom = async (id: string) => {
      Alert.alert('Supprimer', 'Supprimer ce symptôme ?', [
        { text: 'Annuler', style:'cancel' },
        { text: 'Supprimer', style:'destructive', onPress: async () => {
          try { await deleteSymptom(id); if (selected) await loadSymptoms(selected.id); } catch(e:any){ Alert.alert('Erreur', e.message || 'Suppression impossible'); }
        }}
      ]);
    };
  const removeSelected = async () => {
    if (!selected) return;
    Alert.alert('Supprimer', 'Confirmer la suppression de cette période ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { setEditSaving(true); await deletePeriod(selected.id); await load(); await loadCalendar(); cancelEdit(); }
        catch(e:any){ Alert.alert('Erreur', e.message || 'Suppression impossible'); }
        finally { setEditSaving(false); }
      } }
    ]);
  };

  const renderPeriod = ({ item }: { item: MenstruationPeriod }) => {
    const open = !item.end_date;
    const start = item.start_date;
    const end = item.end_date || '—';
    return (
      <Pressable onPress={() => startEdit(item)} style={{ padding:12, borderRadius:14, borderWidth:1, borderColor:t.color.border, backgroundColor:t.color.card, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View style={{ flex:1 }}>
          <ThemedText style={{ fontWeight:'600' }}>{open ? 'Cycle en cours' : 'Cycle'}</ThemedText>
          <ThemedText variant="small" style={{ color:t.color.muted }}>Début: {start} • Fin: {end}</ThemedText>
          {(item.flow_level || item.notes) && <ThemedText variant="small" style={{ marginTop:4, color:t.color.text }}>
            {item.flow_level ? `Flux: ${item.flow_level}` : ''} {item.notes ? `• ${item.notes.slice(0,40)}${item.notes.length>40?'…':''}` : ''}
          </ThemedText>}
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
          <Pressable onPress={() => startEdit(item)}>
            <Ionicons name="create" size={18} color={t.color.muted} />
          </Pressable>
          <Pressable onPress={() => {
            Alert.alert('Supprimer', 'Supprimer cette période ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: async () => { try { setEditSaving(true); await deletePeriod(item.id); await load(); await loadCalendar(); } catch(e:any){ Alert.alert('Erreur', e.message || 'Suppression impossible'); } finally { setEditSaving(false); } } }
            ]);
          }}>
            <Ionicons name="trash" size={20} color={t.color.muted} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <AppContainer scroll>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <ThemedText variant="h1">Menstruations</ThemedText>
        <View style={{ flexDirection:'row', gap:8 }}>
          {!hasOpen && <Pressable onPress={onStart} disabled={saving} style={{ padding:10, borderRadius:12, borderWidth:1, borderColor:t.color.border, opacity:saving?0.6:1 }}>
            <Ionicons name="play" size={20} color={t.color.text} />
          </Pressable>}
          {hasOpen && <Pressable onPress={onEnd} disabled={saving} style={{ padding:10, borderRadius:12, borderWidth:1, borderColor:t.color.border, opacity:saving?0.6:1 }}>
            <Ionicons name="stop" size={20} color={t.color.text} />
          </Pressable>}
        </View>
      </View>

      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 }}>
        <StatCard label="Cycles" value={stats?.cycles_count ?? 0} />
        <StatCard label="Cycle moyen" value={stats?.avg_cycle_length != null ? `${stats!.avg_cycle_length} j` : '—'} />
        <StatCard label="Règles moy." value={stats?.avg_period_length != null ? `${stats!.avg_period_length} j` : '—'} />
        <StatCard label="Dernier début" value={stats?.last_start || '—'} />
        <StatCard label="Prochain (est.)" value={stats?.predicted_next_start || '—'} />
      </View>

      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <ThemedText variant="h2">Calendrier</ThemedText>
        <View style={{ flexDirection:'row', gap:6 }}>
          <Pressable onPress={() => changeMonth(-1)} style={{ padding:8, borderRadius:10, borderWidth:1, borderColor:t.color.border }}>
            <Ionicons name="chevron-back" size={18} color={t.color.text} />
          </Pressable>
          <Pressable onPress={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }} style={{ padding:8, borderRadius:10, borderWidth:1, borderColor:t.color.border }}>
            <Ionicons name="calendar" size={18} color={t.color.text} />
          </Pressable>
          <Pressable onPress={() => changeMonth(1)} style={{ padding:8, borderRadius:10, borderWidth:1, borderColor:t.color.border }}>
            <Ionicons name="chevron-forward" size={18} color={t.color.text} />
          </Pressable>
        </View>
      </View>
      <ThemedText style={{ marginBottom:4, opacity:0.6 }}>{calYear}-{String(calMonth+1).padStart(2,'0')}</ThemedText>
      <CalendarMonth days={calendarDays} year={calYear} month={calMonth} />

      <ThemedText variant="h2" style={{ marginBottom:4 }}>Durées des cycles</ThemedText>
      {cycleLengths.length >= 2 ? (
        <View style={{ marginBottom:16 }}>
          <View style={{ flexDirection:'row', alignItems:'flex-end', height:60 }}>
            {cycleLengths.map((c, idx) => {
              const h = maxLength ? (c.length / maxLength) * 50 + 6 : 20;
              return (
                <View key={idx} style={{ alignItems:'center', width:24 }}>
                  <View style={{ width:14, height:h, borderRadius:6, backgroundColor:t.color.primary, opacity:0.9 }} />
                  <ThemedText variant="small" style={{ marginTop:4, fontSize:10 }}>{c.length}</ThemedText>
                </View>
              );
            })}
          </View>
          <ThemedText variant="small" style={{ color:t.color.muted, marginTop:6 }}>Moyenne locale: {avgLengthLocal ? `${avgLengthLocal} j` : '—'} (basée sur {cycleLengths.length} cycles)</ThemedText>
        </View>
      ) : (
        <ThemedText style={{ color:t.color.muted, marginBottom:16 }}>Pas assez de cycles pour afficher un graphe.</ThemedText>
      )}

      <ThemedText variant="h2" style={{ marginBottom:8 }}>Historique</ThemedText>
      <FlatList
        scrollEnabled={false}
        data={periods}
        keyExtractor={p => p.id}
        ItemSeparatorComponent={() => <View style={{ height:8 }} />}
        renderItem={renderPeriod}
        ListEmptyComponent={!loading ? <ThemedText style={{ color:t.color.muted }}>Aucun cycle enregistré.</ThemedText> : null}
      />

      {selected && (
        <View style={{ marginTop:16, padding:16, borderRadius:16, borderWidth:1, borderColor:t.color.border, backgroundColor:t.color.card }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <ThemedText variant="h2">Édition</ThemedText>
            <Pressable onPress={cancelEdit} style={{ padding:6 }}>
              <Ionicons name="close" size={20} color={t.color.muted} />
            </Pressable>
          </View>
          <ThemedText style={{ marginBottom:6 }}>Titre du cycle</ThemedText>
          <TextInput
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Ex: Cycle de reprise, vacances..."
            style={{ padding:10, borderWidth:1, borderColor:t.color.border, borderRadius:12, marginBottom:12, color:t.color.text }}
            placeholderTextColor={t.color.muted}
          />
          <ThemedText style={{ marginBottom:6 }}>Flux (1-5)</ThemedText>
          <View style={{ flexDirection:'row', gap:8, marginBottom:12 }}>
            {[1,2,3,4,5].map(n => (
              <Pressable key={n} onPress={() => setEditFlow(n)} style={{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:t.color.border, backgroundColor: editFlow===n ? t.color.primary : 'transparent' }}>
                <ThemedText style={{ color: editFlow===n ? '#fff' : t.color.text }}>{n}</ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText style={{ marginBottom:6 }}>Notes</ThemedText>
          <TextInput
            value={editNotes}
            onChangeText={setEditNotes}
            placeholder="Ajouter des notes..."
            multiline
            style={{ minHeight:80, padding:10, borderWidth:1, borderColor:t.color.border, borderRadius:12, marginBottom:12, color:t.color.text }}
            placeholderTextColor={t.color.muted}
          />
          <Pressable disabled={editSaving} onPress={saveEdit} style={{ padding:12, borderRadius:12, backgroundColor:t.color.primary, opacity: editSaving?0.6:1 }}>
            <ThemedText style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>{editSaving ? 'Sauvegarde…' : 'Enregistrer'}</ThemedText>
          </Pressable>
          <Pressable disabled={editSaving} onPress={removeSelected} style={{ marginTop:10, padding:12, borderRadius:12, backgroundColor:'#b00020', opacity: editSaving?0.6:1 }}>
            <ThemedText style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>{editSaving ? '...' : 'Supprimer'}</ThemedText>
          </Pressable>

          <View style={{ height:16 }} />
          {summary && summary.length > 0 && (
            <View style={{ marginBottom:18 }}>
              <ThemedText variant="h2" style={{ marginBottom:8 }}>Résumé</ThemedText>
              {summary.map(s => (
                <View key={s.symptom_type} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:4 }}>
                  <ThemedText style={{ flex:1 }}>{s.symptom_type}</ThemedText>
                  <ThemedText style={{ width:60, textAlign:'right', opacity:0.7 }}>{s.occurrences}x</ThemedText>
                  <ThemedText style={{ width:60, textAlign:'right', opacity:0.7 }}>{s.avg_intensity != null ? s.avg_intensity.toFixed(1) : '—'}</ThemedText>
                </View>
              ))}
            </View>
          )}
          <ThemedText variant="h2" style={{ marginBottom:8 }}>Symptômes</ThemedText>
          {symptoms.length === 0 && <ThemedText style={{ color:t.color.muted, marginBottom:8 }}>Aucun symptôme.</ThemedText>}
          {symptoms.map(s => (
            <View key={s.id} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:6 }}>
              <View style={{ flex:1 }}>
                <ThemedText style={{ fontWeight:'600' }}>{s.symptom_type}{s.intensity ? ` (${s.intensity})` : ''}</ThemedText>
                {s.notes && <ThemedText variant="small" style={{ color:t.color.muted }}>{s.notes}</ThemedText>}
              </View>
              <Pressable onPress={() => removeSymptom(s.id)} style={{ padding:6 }}>
                <Ionicons name="trash" size={18} color={t.color.muted} />
              </Pressable>
            </View>
          ))}
          <View style={{ marginTop:12, padding:12, borderRadius:12, borderWidth:1, borderColor:t.color.border }}>
            <ThemedText style={{ marginBottom:6 }}>Ajouter un symptôme</ThemedText>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {SUGGESTED_SYMPTOMS.map(s => {
                const active = symptomType === s;
                return (
                  <Pressable key={s} onPress={() => setSymptomType(s)} style={{ paddingVertical:6, paddingHorizontal:10, borderRadius:14, borderWidth:1, borderColor: active? t.color.primary : t.color.border, backgroundColor: active? t.color.primary : 'transparent' }}>
                    <ThemedText style={{ fontSize:12, color: active? '#fff' : t.color.text }}>{s}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={symptomType}
              onChangeText={setSymptomType}
              placeholder="Type (crampes, migraine, humeur...)"
              style={{ padding:8, borderWidth:1, borderColor:t.color.border, borderRadius:10, marginBottom:8, color:t.color.text }}
              placeholderTextColor={t.color.muted}
            />
            <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
              {[1,2,3,4,5].map(n => (
                <Pressable key={n} onPress={() => setSymptomIntensity(n)} style={{ width:32, height:32, borderRadius:16, marginRight:6, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:t.color.border, backgroundColor: symptomIntensity===n ? t.color.primary : 'transparent' }}>
                  <ThemedText style={{ color: symptomIntensity===n ? '#fff' : t.color.text }}>{n}</ThemedText>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={symptomNotes}
              onChangeText={setSymptomNotes}
              placeholder="Notes (optionnel)"
              multiline
              style={{ minHeight:60, padding:8, borderWidth:1, borderColor:t.color.border, borderRadius:10, marginBottom:8, color:t.color.text }}
              placeholderTextColor={t.color.muted}
            />
            <Pressable disabled={symptomSaving} onPress={addNewSymptom} style={{ padding:10, borderRadius:10, backgroundColor:t.color.primary, opacity:symptomSaving?0.6:1 }}>
              <ThemedText style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>{symptomSaving ? 'Ajout…' : 'Ajouter'}</ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    </AppContainer>
  );
}

function StatCard({ label, value }: { label:string; value:any }) {
  const t = useTokens();
  return (
    <View style={{ padding:10, borderRadius:12, borderWidth:1, borderColor:t.color.border, backgroundColor:t.color.card, minWidth:110 }}>
      <ThemedText style={{ fontSize:12, color:t.color.muted }}>{label}</ThemedText>
      <ThemedText style={{ fontWeight:'600' }}>{value}</ThemedText>
    </View>
  );
}

function CalendarMonth({ days, year, month }: { days: MenstruationCalendarDay[]; year:number; month:number }) {
  const t = useTokens();
  const first = new Date(year, month, 1);
  const last = new Date(year, month+1, 0);
  const startWeekDay = first.getDay(); // 0=Dimanche
  const totalDays = last.getDate();
  const cells: Array<{ dayNum:number|null; iso?:string; meta?:MenstruationCalendarDay[] }> = [];
  for (let i=0;i<startWeekDay;i++) cells.push({ dayNum:null });
  for (let d=1; d<=totalDays; d++) {
    const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const meta = days.filter(x => x.day === iso);
    cells.push({ dayNum:d, iso, meta });
  }
  while (cells.length % 7 !== 0) cells.push({ dayNum:null });
  const colorFor = (type:string) => {
    switch(type){
      case 'period': return t.color.primary;
      case 'predicted_period': return t.color.primary+'55';
      case 'ovulation': return '#ff7eb6';
      case 'fertile_window': return '#ffa60033';
      case 'fertile_window_start': return '#ffa600';
      case 'fertile_window_end': return '#ffa600';
      default: return 'transparent';
    }
  };
  return (
    <View style={{ borderWidth:1, borderColor:t.color.border, borderRadius:14, padding:10, marginBottom:18 }}>
      <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
        {['D','L','Ma','Me','J','V','S'].map((w,i) => (
          <View key={w+'-'+i} style={{ width:'14.285%', paddingVertical:4 }}>
            <ThemedText style={{ textAlign:'center', fontSize:12, color:t.color.muted }}>{w}</ThemedText>
          </View>
        ))}
        {cells.map((c,i) => (
          <View key={i} style={{ width:'14.285%', aspectRatio:1, padding:3 }}>
            {c.dayNum && (
              <View style={{ flex:1, borderRadius:10, padding:4, backgroundColor: c.meta && c.meta.length? colorFor(c.meta[0].type): 'transparent', borderWidth: c.meta && c.meta.some(m=> m.type==='ovulation')? 2:1, borderColor: c.meta && c.meta.some(m=> m.type==='ovulation')? '#ff7eb6': t.color.border }}>
                <ThemedText style={{ fontSize:12, fontWeight:'600' }}>{c.dayNum}</ThemedText>
              </View>
            )}
          </View>
        ))}
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:10 }}>
        {[{c:t.color.primary,l:'Règles'},{c:t.color.primary+'55',l:'Règles estim.'},{c:'#ffa60033',l:'Fertile'},{c:'#ff7eb6',l:'Ovulation'}].map(x => (
          <View key={x.l} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
            <View style={{ width:14, height:14, borderRadius:7, backgroundColor:x.c }} />
            <ThemedText style={{ fontSize:11 }}>{x.l}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}
