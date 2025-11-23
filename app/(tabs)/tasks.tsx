import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput, Alert, Image, Modal, Platform } from 'react-native';
// DateTimePicker import rendu dynamique pour éviter l'erreur de résolution quand le module n'est pas encore installé ou indisponible (web)
let DateTimePicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  DateTimePicker = null;
}
import { ThemedText } from 'src/components/ui/ThemedText';
import { AppContainer } from 'src/components/ui/AppContainer';
import FloatingNav from 'src/components/navigation/FloatingNav';
import { Card } from 'src/components/ui/Card';
import { Input } from 'src/components/ui/Input';
import { Button } from 'src/components/ui/Button';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { ensureDefaultList, fetchTasks, addTask, addTaskDetailed, toggleTask, removeTask, updateTaskTitle, removeDoneTasks, distributeTasks, claimTask, fetchAssignees, updateTaskPriority, updateTaskRoutine, updateTaskCategory, updateTaskAssignee, updateTaskDueDate, type Task, type ProfileLite } from 'src/features/tasks/tasksApi';
import { getOrCreateProfile, getCoupleMembers, type ProfileRow } from 'src/features/profile/profileApi';
import { useAuth } from 'src/lib/auth';
import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';

// Shared helpers used by Tasks and AddTaskModal
const CATEGORY_OPTIONS = ['Ménage','Courses','Cuisine','Linge','Admin','Santé','Animaux','Autre'];
const chipStyle = (bg: string, border: string) => ({ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: border, backgroundColor: bg });
const chipTextColor = (fallback: string) => ({ color: fallback });
const categoryChipColors: Record<string, { bg: string; border: string; text: string }> = {
  'Ménage': { bg: '#F2F5FF', border: '#D6DFFF', text: '#2A46FF' },
  'Courses': { bg: '#FFF8E7', border: '#FFE7A3', text: '#996C00' },
  'Cuisine': { bg: '#EAFDF5', border: '#C4F6E5', text: '#0F7B5F' },
  'Linge': { bg: '#FDECF3', border: '#F7C7DA', text: '#A61E4D' },
  'Admin': { bg: '#EEF7FF', border: '#CFE8FF', text: '#0063B1' },
  'Santé': { bg: '#FFF0F0', border: '#FFD1D1', text: '#C21F1F' },
  'Animaux': { bg: '#F3FFF0', border: '#D8F9CF', text: '#2F7B00' },
  'Autre': { bg: '#F3F0FF', border: '#E0D9FF', text: '#6B4EFF' },
};
const softGrayBg = '#EEF2F6';
const softGrayBorder = '#E6E4ED';
const softGrayText = '#5B6978';
const softVioletText = '#6E56CF';

const parseDateOnly = (s: string): Date | null => {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const y = parseInt(m[1], 10); const mo = parseInt(m[2], 10) - 1; const da = parseInt(m[3], 10);
    return new Date(y, mo, da);
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const dueBadge = (due: string | null) => {
  const todayLocal = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); })();
  const startOfWeek = (() => { const d = new Date(todayLocal); const day = d.getDay(); const diff = (day === 0 ? -6 : 1) - day; return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff); })();
  const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);
  if (!due) return { label: 'Sans échéance', kind: 'none' as const };
  const d = parseDateOnly(due); if (!d) return { label: 'Sans échéance', kind: 'none' as const };
  const diffDays = Math.floor((d.getTime() - todayLocal.getTime()) / (1000*60*60*24));
  if (diffDays < 0) return { label: 'Retard', kind: 'overdue' as const, diffDays };
  if (diffDays === 0) return { label: "Aujourd’hui", kind: 'today' as const, diffDays };
  if (diffDays === 1) return { label: 'Demain', kind: 'tomorrow' as const, diffDays };
  if (d.getTime() >= startOfWeek.getTime() && d.getTime() < endOfWeek.getTime()) return { label: 'Cette semaine', kind: 'week' as const, diffDays };
  return { label: d.toLocaleDateString(), kind: 'future' as const, diffDays };
};

export default function Tasks() {
  const t = useTokens();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned' | 'today' | 'week'>('all');
  const [assignees, setAssignees] = useState<Record<string, ProfileLite>>({});
  const [editVisible, setEditVisible] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editPriority, setEditPriority] = useState<number>(2);
  const [editRoutine, setEditRoutine] = useState<boolean>(false);
  const [editEveryDays, setEditEveryDays] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editAssignee, setEditAssignee] = useState<string | null>(null);
  const [editAssigneeSelectOpen, setEditAssigneeSelectOpen] = useState(false);
  const [editDue, setEditDue] = useState<string | null>(null);
  const [members, setMembers] = useState<ProfileRow[]>([]);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Ménage');
  const [newFrequencyDays, setNewFrequencyDays] = useState<number | null>(7); // default Hebdomadaire
  const [newAssignee, setNewAssignee] = useState<string | null>(null);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [freqSelectOpen, setFreqSelectOpen] = useState(false);
  const [assigneeSelectOpen, setAssigneeSelectOpen] = useState(false);
  const [newDue, setNewDue] = useState<string | null>(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // Local aliases for shared helpers / date ranges used in memo deps
  const categoryOptions = CATEGORY_OPTIONS;
  const todayLocal = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);
  const tomorrowLocal = useMemo(() => new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate() + 1), [todayLocal]);
  const startOfWeek = useMemo(() => {
    const d = new Date(todayLocal);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  }, [todayLocal]);
  const endOfWeek = useMemo(() => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7), [startOfWeek]);

  

  const load = async () => {
    try {
      setLoading(true);
      const l = await ensureDefaultList();
      setListId(l.id);
      const data = await fetchTasks(l.id);
      setItems(data);
      if (profile?.couple_id) {
        try { const mem = await getCoupleMembers(profile.couple_id); setMembers(mem); } catch {}
      }
      const ids = data.map((d) => d.assigned_to).filter(Boolean) as string[];
      if (ids.length) {
        const map = await fetchAssignees(ids);
        setAssignees(map);
      } else {
        setAssignees({});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Realtime sync when tasks change for current list
  useEffect(() => {
    if (!listId) return;
    const channel = supabase
      .channel('public:tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.tasks, filter: `list_id=eq.${listId}` }, () => {
        load();
      });
    channel.subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [listId]);

  const onAdd = async () => {
    const text = title.trim();
    if (!text || !listId) return;
    setTitle('');
    const created = await addTask(listId, text);
    setItems((cur) => [created, ...cur]);
  };

  const onToggle = async (id: string, next: boolean) => {
    setItems((cur) => cur.map((t) => (t.id === id ? { ...t, done: next } : t)));
    try { await toggleTask(id, next); } catch {}
  };

  const onRemove = async (id: string) => {
    setItems((cur) => cur.filter((t) => t.id !== id));
    try { await removeTask(id); } catch {}
  };

  const onEditStart = (item: Task) => {
    setEditingId(item.id);
    setEditingValue(item.title);
  };

  const onEditSubmit = async () => {
    if (!editingId) return;
    const newTitle = editingValue.trim();
    if (!newTitle) { setEditingId(null); return; }
    setItems((cur) => cur.map((t) => (t.id === editingId ? { ...t, title: newTitle } : t)));
    const id = editingId;
    setEditingId(null);
    try { await updateTaskTitle(id, newTitle); } catch {}
  };

  const cyclePriority = async (item: Task) => {
    const current = item.priority ?? 2;
    const next = current >= 3 ? 1 : current + 1; // 1 low, 2 normal, 3 high
    setItems((cur) => cur.map((t) => (t.id === item.id ? { ...t, priority: next } : t)));
    try { await updateTaskPriority(item.id, next); } catch {}
  };

  const toggleRoutine = async (item: Task) => {
    const next = !item.is_routine;
    setItems((cur) => cur.map((t) => (t.id === item.id ? { ...t, is_routine: next } : t)));
    try { await updateTaskRoutine(item.id, next, item.routine_every_days ?? null); } catch {}
  };

  const onClearCompleted = async () => {
    if (!listId) return;
    const hasDone = items.some((i) => i.done);
    if (!hasDone) return;
    Alert.alert('Supprimer les terminées ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          setItems((cur) => cur.filter((i) => !i.done));
          try { await removeDoneTasks(listId); } catch {}
        }
      }
    ]);
  };

  const myId = profile?.id ?? null;
  const orderedBase = useMemo(() => {
    const undone = items.filter(i => !i.done);
    const done = items.filter(i => i.done);
    // Sort undone by due_date ASC (nulls last), then updated_at DESC
    undone.sort((a,b) => {
      const ad = a.due_date ? parseDateOnly(a.due_date) : null;
      const bd = b.due_date ? parseDateOnly(b.due_date) : null;
      if (ad && bd) {
        if (ad.getTime() !== bd.getTime()) return ad.getTime() - bd.getTime();
      } else if (ad && !bd) {
        return -1;
      } else if (!ad && bd) {
        return 1;
      }
      const au = new Date(a.updated_at).getTime();
      const bu = new Date(b.updated_at).getTime();
      return bu - au;
    });
    return [...undone, ...done];
  }, [items]);
  const filtered = useMemo(() => {
    if (filter === 'mine' && myId) return orderedBase.filter((i) => i.assigned_to === myId);
    if (filter === 'unassigned') return orderedBase.filter((i) => !i.assigned_to);
    if (filter === 'today') return orderedBase.filter(i => i.due_date && (() => { const d = parseDateOnly(i.due_date!); return !!d && d.getTime() >= todayLocal.getTime() && d.getTime() < tomorrowLocal.getTime(); })());
    if (filter === 'week') return orderedBase.filter(i => i.due_date && (() => { const d = parseDateOnly(i.due_date!); return !!d && d.getTime() >= startOfWeek.getTime() && d.getTime() < endOfWeek.getTime(); })());
    return orderedBase;
  }, [orderedBase, filter, myId, todayLocal, tomorrowLocal, startOfWeek, endOfWeek]);
  const ordered = filtered;
  const firstDoneIndex = useMemo(() => ordered.findIndex((i) => i.done), [ordered]);
  const undoneCount = items.filter((i) => !i.done).length;
  const mineUndoneCount = myId ? items.filter((i) => !i.done && i.assigned_to === myId).length : 0;
  const unassignedUndoneCount = items.filter((i) => !i.done && !i.assigned_to).length;
  const todayCount = useMemo(() => items.filter(i => !i.done && i.due_date && (() => { const d = parseDateOnly(i.due_date!); return !!d && d.getTime() >= todayLocal.getTime() && d.getTime() < tomorrowLocal.getTime(); })()).length, [items, todayLocal, tomorrowLocal]);
  const weekCount = useMemo(() => items.filter(i => !i.done && i.due_date && (() => { const d = parseDateOnly(i.due_date!); return !!d && d.getTime() >= startOfWeek.getTime() && d.getTime() < endOfWeek.getTime(); })()).length, [items, startOfWeek, endOfWeek]);
  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const undoneAssignedByMember = useMemo(() => {
    const map: Record<string, number> = {};
    items.filter(i => !i.done && i.assigned_to).forEach(i => {
      const k = i.assigned_to as string; map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [items]);
  const totalUndoneAssigned = Object.values(undoneAssignedByMember).reduce((a,b)=>a+b,0);
  const distributionRows = useMemo(() => {
    const list = (members.length ? members : (profile?.id ? [{ id: profile.id, display_name: profile.display_name, email: profile.email, avatar_url: profile.avatar_url }] as any : [])) as ProfileRow[];
    return list.map(m => {
      const count = undoneAssignedByMember[m.id] || 0;
      const pct = totalUndoneAssigned ? Math.round((count / totalUndoneAssigned) * 100) : 0;
      const label = m.display_name || m.email || 'Membre';
      return { id: m.id, label, avatar_url: (assignees[m.id]?.avatar_url ?? m.avatar_url) || null, count, pct };
    });
  }, [members, profile, assignees, undoneAssignedByMember, totalUndoneAssigned]);

  const progressionRows = useMemo(() => {
    const list = (members.length ? members : (profile?.id ? [{ id: profile.id, display_name: profile.display_name, email: profile.email, avatar_url: profile.avatar_url }] as any : [])) as ProfileRow[];
    return list.map(m => {
      const mine = items.filter(i => i.assigned_to === m.id);
      const done = mine.filter(i => i.done).length;
      const total = mine.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const label = m.display_name || m.email || 'Membre';
      return { id: m.id, label, done, total, pct };
    });
  }, [members, profile, items]);


  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onDistribute = async () => {
    if (!listId) return;
    setAssigning(true);
    try {
      await distributeTasks(listId);
      await load();
    } catch (e: any) {
      Alert.alert('Répartition impossible', e?.message ?? 'Erreur inconnue');
    } finally {
      setAssigning(false);
    }
  };

  const openEdit = (item: Task) => {
    setEditTask(item);
    setEditPriority(item.priority ?? 2);
    setEditRoutine(!!item.is_routine);
    setEditEveryDays(item.routine_every_days ?? null);
    setEditCategory(item.category || '');
    setEditAssignee(item.assigned_to || null);
    setEditDue(item.due_date || null);
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editTask) return;
    const id = editTask.id;
    setItems((cur) => cur.map((t) => t.id === id ? { ...t, priority: editPriority, is_routine: editRoutine, routine_every_days: editEveryDays, category: editCategory || null, assigned_to: editAssignee || null, due_date: editDue || null } : t));
    try {
      await updateTaskPriority(id, editPriority);
      await updateTaskRoutine(id, editRoutine, editEveryDays ?? null);
      await updateTaskCategory(id, editCategory.trim() ? editCategory.trim() : null);
      if (editAssignee !== undefined) {
        await updateTaskAssignee(id, editAssignee);
        // ensure assignees map contains selected user
        if (editAssignee && !assignees[editAssignee]) {
          const m = members.find(mm => mm.id === editAssignee);
          if (m) {
            setAssignees(cur => ({ ...cur, [m.id]: { id: m.id, display_name: m.display_name || null, avatar_url: m.avatar_url || null, email: m.email || null } }));
          } else {
            try { const map = await fetchAssignees([editAssignee]); setAssignees(cur => ({ ...cur, ...map })); } catch {}
          }
        }
      }
      if (editDue !== undefined) {
        await updateTaskDueDate(id, editDue);
      }
    } catch {}
    setEditVisible(false);
    setShowEditDatePicker(false);
  };

  const [quickAssignTaskId, setQuickAssignTaskId] = useState<string | null>(null);

  return (
    <AppContainer>
      <FloatingNav />
      <View style={{ height: 68 }} />
      <FlatList
        data={ordered}
        keyExtractor={(it) => it.id}
        ListHeaderComponent={
          <View style={{ marginBottom: 18 }}>
            <ThemedText variant="h1" style={{ marginBottom: 16 }}>Tâches</ThemedText>
            {/* Répartition des tâches */}
            <Card style={{ marginBottom: 16 }}>
              <ThemedText variant="h2" style={{ marginBottom: 8 }}>Répartition des tâches</ThemedText>
              {distributionRows.length === 0 && (
                <ThemedText style={{ color: t.color.muted }}>—</ThemedText>
              )}
              {distributionRows.map(row => (
                <View key={row.id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText>{row.label}</ThemedText>
                    <ThemedText style={{ color: t.color.muted }}>{row.count} tâches ({row.pct}%)</ThemedText>
                  </View>
                  <View style={{ height: 8, borderRadius: 999, backgroundColor: '#E9E6F0', overflow: 'hidden', marginTop: 6 }}>
                    <View style={{ width: `${row.pct}%`, height: '100%', backgroundColor: t.color.text }} />
                  </View>
                </View>
              ))}
            </Card>

            {/* Progression */}
            <Card style={{ marginBottom: 16 }}>
              <ThemedText variant="h2" style={{ marginBottom: 8 }}>Progression</ThemedText>
              {progressionRows.length === 0 && (
                <ThemedText style={{ color: t.color.muted }}>—</ThemedText>
              )}
              {progressionRows.map(row => (
                <View key={row.id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText>{row.label}</ThemedText>
                    <ThemedText style={{ color: t.color.muted }}>{row.done}/{row.total}</ThemedText>
                  </View>
                  <View style={{ height: 8, borderRadius: 999, backgroundColor: '#E9E6F0', overflow: 'hidden', marginTop: 6 }}>
                    <View style={{ width: `${row.pct}%`, height: '100%', backgroundColor: t.color.text }} />
                  </View>
                </View>
              ))}
            </Card>

            {/* Titre + icône ajouter */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <ThemedText variant="h2">Toutes les tâches</ThemedText>
              <Pressable onPress={() => setAddModalOpen(true)} style={{ padding:10, borderRadius:14, borderWidth:1, borderColor:t.color.border }} hitSlop={8}>
                <Ionicons name="add" size={22} color={t.color.text} />
              </Pressable>
            </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable onPress={onDistribute} disabled={assigning || loading} style={{ padding:10, borderRadius:14, borderWidth:1, borderColor:t.color.border, opacity: assigning?0.6:1 }} hitSlop={6}>
                    <Ionicons name="shuffle" size={20} color={t.color.text} />
                  </Pressable>
                  {items.some((i) => i.done) && (
                    <Pressable onPress={onClearCompleted} style={{ padding:10, borderRadius:14, borderWidth:1, borderColor:t.color.border }} hitSlop={6}>
                      <Ionicons name="trash-outline" size={20} color={t.color.text} />
                    </Pressable>
                  )}
                </View>
              </View>
              {loading && <ActivityIndicator />}
              {items.length === 0 && !loading && (
                <View style={{ paddingVertical: 12 }}>
                  <ThemedText style={{ color: t.color.muted }}>Aucune tâche pour le moment.</ThemedText>
                </View>
              )}
              {!loading && items.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Pressable onPress={() => setFilter('all')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: filter==='all'? t.color.primary : t.color.border, backgroundColor: filter==='all' ? t.color.card : 'transparent' }}>
                    <ThemedText style={{ color: filter==='all' ? t.color.primary : t.color.muted }}>Toutes</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setFilter('mine')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: filter==='mine'? t.color.primary : t.color.border, backgroundColor: filter==='mine' ? t.color.card : 'transparent' }}>
                    <ThemedText style={{ color: filter==='mine' ? t.color.primary : t.color.muted }}>Pour moi ({mineUndoneCount})</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setFilter('unassigned')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: filter==='unassigned'? t.color.primary : t.color.border, backgroundColor: filter==='unassigned' ? t.color.card : 'transparent' }}>
                    <ThemedText style={{ color: filter==='unassigned' ? t.color.primary : t.color.muted }}>Non assignées ({unassignedUndoneCount})</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setFilter('today')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: filter==='today'? t.color.primary : t.color.border, backgroundColor: filter==='today' ? t.color.card : 'transparent' }}>
                    <ThemedText style={{ color: filter==='today' ? t.color.primary : t.color.muted }}>Aujourd’hui ({todayCount})</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setFilter('week')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: filter==='week'? t.color.primary : t.color.border, backgroundColor: filter==='week' ? t.color.card : 'transparent' }}>
                    <ThemedText style={{ color: filter==='week' ? t.color.primary : t.color.muted }}>Cette semaine ({weekCount})</ThemedText>
                  </Pressable>
                </View>
              )}
          </View>
        }
        renderItem={({ item, index }) => {
          const showDoneHeader = firstDoneIndex !== -1 && index === firstDoneIndex;
          const editing = editingId === item.id;
          const assignedToMe = !!myId && item.assigned_to === myId;
          const unassigned = !item.assigned_to;
          const assignee = item.assigned_to ? assignees[item.assigned_to] : null;
          const initials = assignee?.display_name?.trim()?.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase() || (assignee?.email ? assignee.email[0].toUpperCase() : '');
          const priorityLabel = item.priority === 3 ? 'Urgent' : item.priority === 1 ? 'Faible' : 'Normal';
          const freqLabel = item.is_routine ? (item.routine_every_days === 1 ? 'Quotidien' : item.routine_every_days === 7 ? 'Hebdomadaire' : item.routine_every_days ? `Tous ${item.routine_every_days} j` : 'Routine') : null;
          const lastDone = item.completed_at ? new Date(item.completed_at) : null;
          const lastDoneStr = lastDone ? lastDone.toLocaleDateString() : null;
          const due = dueBadge(item.due_date);
          return (
            <View>
              <Card style={{ marginBottom: 8, padding: t.spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pressable onPress={() => onToggle(item.id, !item.done)}
                    style={{ width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.color.border, backgroundColor: item.done ? t.color.text : 'transparent' }}>
                    {item.done ? <Ionicons name="checkmark" size={14} color={t.mode === 'dark' ? '#0E1116' : '#fff'} /> : null}
                  </Pressable>
                  {editing ? (
                    <TextInput
                        value={editingValue}
                        onChangeText={(txt) => { setEditingValue(txt); }}
                        onSubmitEditing={onEditSubmit}
                        onBlur={() => { onEditSubmit(); }}
                        onFocus={() => { /* focus debug removed */ }}
                        autoFocus
                        style={{ flex: 1, paddingVertical: 4, color: t.color.text }}
                        placeholder="Modifier la tâche"
                        placeholderTextColor={t.color.muted}
                        returnKeyType="done"
                      />
                  ) : (
                    <ThemedText
                      onPress={() => onEditStart(item)}
                      style={{ flex: 1, textDecorationLine: item.done ? 'line-through' : 'none', color: item.done ? t.color.muted : t.color.text }}>
                      {item.title}
                    </ThemedText>
                  )}
                  {!item.done && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {/* Assignee avatar/initials */}
                      <Pressable onLongPress={() => setQuickAssignTaskId(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {assignee?.avatar_url ? (
                          <Image source={{ uri: assignee.avatar_url }} style={{ width: 22, height: 22, borderRadius: 11 }} />
                        ) : (
                          <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: assignedToMe ? t.color.primary : t.color.card }}>
                            <ThemedText style={{ fontSize: 11, color: assignedToMe ? (t.mode === 'dark' ? '#0E1116' : '#fff') : t.color.muted }}>{initials || '—'}</ThemedText>
                          </View>
                        )}
                      </Pressable>
                      {unassigned && myId && (
                        <Pressable onPress={async () => { 
                          try { 
                            await getOrCreateProfile();
                            await claimTask(item.id); 
                            setItems((cur)=>cur.map((x)=>x.id===item.id?{...x, assigned_to: myId}:x)); 
                          } catch (e: any) { 
                            Alert.alert('Impossible de prendre la tâche', e?.message ?? 'Erreur inconnue');
                          } 
                        }}>
                          <ThemedText style={{ color: t.color.primary }}>Prendre</ThemedText>
                        </Pressable>
                      )}
                      {/* Open details modal */}
                      <Pressable onPress={() => openEdit(item)} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Ionicons name="ellipsis-horizontal" size={18} color={t.color.muted} />
                      </Pressable>
                    </View>
                  )}
                  <Pressable onPress={() => onRemove(item.id)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}>
                    <Ionicons name="trash-outline" size={18} color={t.color.muted} />
                  </Pressable>
                </View>
                {/* Chips row */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {due && (
                    <View style={chipStyle(
                      due.kind==='overdue' ? '#FFF0F0' : due.kind==='none' ? softGrayBg : softGrayBg,
                      due.kind==='overdue' ? '#FFD1D1' : softGrayBorder
                    )}>
                      <ThemedText style={{ color: due.kind==='overdue' ? '#C21F1F' : softGrayText }}>{due.label}</ThemedText>
                    </View>
                  )}
                  {due && due.kind!=='none' && typeof due.diffDays==='number' && (
                    (() => {
                      const d = due.diffDays;
                      if (due.kind==='today' || due.kind==='tomorrow') return null; // déjà explicite
                      const txt = d < 0 ? `J+${Math.abs(d)}` : `J-${d}`;
                      return <View style={chipStyle(softGrayBg, softGrayBorder)}><ThemedText style={{ color: softGrayText }}>{txt}</ThemedText></View>;
                    })()
                  )}
                  {item.category ? (
                    <View style={chipStyle(softGrayBg, softGrayBorder)}>
                      <ThemedText style={chipTextColor(softVioletText) as any}>{item.category}</ThemedText>
                    </View>
                  ) : null}
                  {freqLabel ? (
                    <View style={chipStyle(softGrayBg, softGrayBorder)}>
                      <ThemedText style={chipTextColor(softGrayText) as any}>{freqLabel}</ThemedText>
                    </View>
                  ) : null}
                  {/* Assignee chip */}
                  {assignee ? (
                    <View style={chipStyle(softGrayBg, softGrayBorder)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="person-outline" size={12} color={softGrayText} />
                        <ThemedText style={chipTextColor(softGrayText) as any}>{assignee.display_name || assignee.email || '—'}</ThemedText>
                      </View>
                    </View>
                  ) : null}
                  {lastDoneStr ? (
                    <View style={chipStyle(softGrayBg, softGrayBorder)}>
                      <ThemedText style={{ color: softGrayText }}>Dernière fois: {lastDoneStr}</ThemedText>
                    </View>
                  ) : null}
                </View>
              </Card>
              {quickAssignTaskId === item.id && !item.done && (
                <View style={{ marginTop: -6, marginBottom: 8, paddingHorizontal: 12 }}>
                  <Card style={{ padding: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <ThemedText style={{ color: t.color.muted }}>Assigner rapidement</ThemedText>
                      <Pressable onPress={() => setQuickAssignTaskId(null)} style={{ padding: 4 }}>
                        <Ionicons name="close" size={16} color={t.color.muted} />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {members.map(m => {
                        const label = m.display_name || m.email || 'Membre';
                        const ini = (m.display_name || m.email || 'M')[0]?.toUpperCase();
                        return (
                          <Pressable key={m.id} onPress={async () => {
                            try {
                              await updateTaskAssignee(item.id, m.id);
                              setItems(cur => cur.map(x => x.id===item.id ? { ...x, assigned_to: m.id } : x));
                              if (!assignees[m.id]) {
                                setAssignees(cur => ({ ...cur, [m.id]: { id: m.id, display_name: m.display_name || null, avatar_url: m.avatar_url || null, email: m.email || null } }));
                              }
                              setQuickAssignTaskId(null);
                            } catch (e:any) {
                              Alert.alert('Erreur', e?.message || 'Assignation impossible');
                            }
                          }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: t.color.border, backgroundColor: t.color.card, flexDirection:'row', alignItems:'center', gap:6 }}>
                            <View style={{ width: 20, height: 20, borderRadius: 10, alignItems:'center', justifyContent:'center', backgroundColor: '#E6E4ED' }}>
                              <ThemedText style={{ fontSize: 11, color: '#5B6978' }}>{ini}</ThemedText>
                            </View>
                            <ThemedText>{label}</ThemedText>
                          </Pressable>
                        );
                      })}
                      <Pressable onPress={async () => { try { await updateTaskAssignee(item.id, null); setItems(cur => cur.map(x => x.id===item.id ? { ...x, assigned_to: null } : x)); setQuickAssignTaskId(null); } catch (e:any) { Alert.alert('Erreur', e?.message || 'Assignation impossible'); } }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: t.color.border }}>
                        <ThemedText>Personne</ThemedText>
                      </Pressable>
                    </View>
                  </Card>
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      {/* Edit task modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => { setEditVisible(false); setShowEditDatePicker(false); }}>
        <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: t.color.card, borderRadius: 12, padding: 16 }}>
            <ThemedText variant="h2" style={{ marginBottom: 12 }}>Paramètres de la tâche</ThemedText>
            {/* Assignee selector */}
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Assigné à</ThemedText>
              <Pressable onPress={() => setEditAssigneeSelectOpen(o=>!o)} style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F4F4F8', borderWidth:1, borderColor: '#E6E4ED', flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                <ThemedText>{ editAssignee ? (assignees[editAssignee]?.display_name || assignees[editAssignee]?.email || 'Membre') : 'Personne' }</ThemedText>
                <Ionicons name={editAssigneeSelectOpen? 'chevron-up':'chevron-down'} size={18} color={t.color.muted} />
              </Pressable>
              {editAssigneeSelectOpen && (
                <View style={{ marginTop:8, gap:8 }}>
                  {members.map(m => (
                    <Pressable key={m.id} onPress={() => { setEditAssignee(m.id); setEditAssigneeSelectOpen(false); }} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:12, paddingVertical:10, borderRadius:8, borderWidth:1, borderColor: editAssignee===m.id? t.color.primary : t.color.border }}>
                      <ThemedText style={{ color: editAssignee===m.id? t.color.primary : t.color.text }}>{m.display_name || m.email || 'Membre'}</ThemedText>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => { setEditAssignee(null); setEditAssigneeSelectOpen(false); }} style={{ paddingHorizontal:12, paddingVertical:10, borderRadius:8, borderWidth:1, borderColor: editAssignee===null? t.color.primary : t.color.border }}>
                    <ThemedText style={{ color: editAssignee===null? t.color.primary : t.color.text }}>Personne</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Priorité</ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{v:1,l:'Faible'},{v:2,l:'Normal'},{v:3,l:'Urgent'}].map(o => (
                  <Pressable key={o.v} onPress={() => setEditPriority(o.v)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: editPriority===o.v? t.color.primary : t.color.border }}>
                    <ThemedText style={{ color: editPriority===o.v? t.color.primary : t.color.muted }}>{o.l}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Catégorie</ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {categoryOptions.map(c => {
                  const selected = editCategory === c;
                  const cc = categoryChipColors[c];
                  return (
                    <Pressable key={c} onPress={() => setEditCategory(c)} style={[chipStyle(cc.bg, selected ? t.color.primary : cc.border), { borderColor: selected ? t.color.primary : cc.border }]}>
                      <ThemedText style={chipTextColor(cc.text) as any}>{c}</ThemedText>
                    </Pressable>
                  );
                })}
                <Pressable onPress={() => setEditCategory('')} style={chipStyle(t.color.card, editCategory ? t.color.border : t.color.primary)}>
                  <ThemedText style={{ color: t.color.muted }}>Aucune</ThemedText>
                </Pressable>
              </View>
            </View>
            {/* Due date */}
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Échéance</ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {[
                  {k:null as string | null, l:'Aucune'},
                  {k:'today', l:"Aujourd’hui"},
                  {k:'tomorrow', l:'Demain'},
                  {k:'week', l:'Dans 7 j'},
                ].map(o => (
                  <Pressable key={String(o.k)} onPress={() => {
                    if (o.k===null) { setEditDue(null); return; }
                    if (o.k==='today') { const d = new Date(); setEditDue(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10)); return; }
                    if (o.k==='tomorrow') { const d = new Date(); setEditDue(new Date(d.getFullYear(), d.getMonth(), d.getDate()+1).toISOString().slice(0,10)); return; }
                    if (o.k==='week') { const d = new Date(); setEditDue(new Date(d.getFullYear(), d.getMonth(), d.getDate()+7).toISOString().slice(0,10)); return; }
                  }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: (() => {
                    if (o.k===null) return editDue===null ? t.color.primary : t.color.border;
                    if (o.k==='today') return (dueBadge(editDue||null)?.kind==='today') ? t.color.primary : t.color.border;
                    if (o.k==='tomorrow') return (dueBadge(editDue||null)?.kind==='tomorrow') ? t.color.primary : t.color.border;
                    if (o.k==='week') {
                      const d = editDue ? parseDateOnly(editDue) : null;
                      const sel = !!d && Math.floor((d.getTime() - todayLocal.getTime())/(1000*60*60*24))===7;
                      return sel ? t.color.primary : t.color.border;
                    }
                    return t.color.border;
                  })() }}>
                    <ThemedText style={{ color: (() => {
                      if (o.k===null) return editDue===null ? t.color.primary : t.color.muted;
                      if (o.k==='today') return (dueBadge(editDue||null)?.kind==='today') ? t.color.primary : t.color.muted;
                      if (o.k==='tomorrow') return (dueBadge(editDue||null)?.kind==='tomorrow') ? t.color.primary : t.color.muted;
                      if (o.k==='week') {
                        const d = editDue ? parseDateOnly(editDue) : null;
                        const sel = !!d && Math.floor((d.getTime() - todayLocal.getTime())/(1000*60*60*24))===7;
                        return sel ? t.color.primary : t.color.muted;
                      }
                      return t.color.muted;
                    })() }}>{o.l}</ThemedText>
                  </Pressable>
                ))}
                <Pressable onPress={() => setShowEditDatePicker(true)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth:1, borderColor: t.color.border }}>
                  <ThemedText style={{ color: t.color.muted }}>Date libre</ThemedText>
                </Pressable>
                {editDue && (
                  <View style={chipStyle(softGrayBg, softGrayBorder)}>
                    <ThemedText style={{ color: softGrayText }}>{editDue}</ThemedText>
                  </View>
                )}
              </View>
            </View>
            {showEditDatePicker && (
              Platform.OS === 'web' ? (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={editDue || ''}
                    onChangeText={(txt) => {
                      const cleaned = txt.trim();
                      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
                        setEditDue(cleaned);
                      } else {
                        setEditDue(null);
                      }
                    }}
                    style={{ borderWidth:1, borderColor: t.color.border, borderRadius:8, paddingHorizontal:12, paddingVertical:10, color: t.color.text }}
                  />
                  <View style={{ flexDirection:'row', gap:12, marginTop:8 }}>
                    <Pressable onPress={() => { setShowEditDatePicker(false); }} style={{ padding:8 }}>
                      <ThemedText style={{ color: t.color.muted }}>Fermer</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <DateTimePicker
                  value={editDue ? (parseDateOnly(editDue) || new Date()) : new Date()}
                  mode="date"
                  display={Platform.OS==='ios' ? 'inline' : 'default'}
                  onChange={(evt: any, sel: any) => {
                    // Android dismiss event
                    if (evt?.type === 'dismissed') {
                      setShowEditDatePicker(false);
                      return;
                    }
                    if (sel) {
                      const d = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
                      setEditDue(d.toISOString().slice(0,10));
                    }
                    if (Platform.OS !== 'ios') setShowEditDatePicker(false);
                  }}
                />
              )
            )}
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Routine</ThemedText>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Pressable onPress={() => setEditRoutine((v)=>!v)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: editRoutine? t.color.primary : t.color.border }}>
                  <ThemedText style={{ color: editRoutine? t.color.primary : t.color.muted }}>{editRoutine ? 'Activée' : 'Désactivée'}</ThemedText>
                </Pressable>
                {editRoutine && (
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    {[1,2,3,7,14,30].map(n => (
                      <Pressable key={n} onPress={() => setEditEveryDays(n)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: editEveryDays===n? t.color.primary : t.color.border }}>
                        <ThemedText style={{ color: editEveryDays===n? t.color.primary : t.color.muted }}>{n} j</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable onPress={() => setEditVisible(false)} style={{ padding: 10 }}>
                <ThemedText style={{ color: t.color.muted }}>Annuler</ThemedText>
              </Pressable>
              <Pressable onPress={saveEdit} style={{ padding: 10 }}>
                <ThemedText style={{ color: t.color.primary }}>Enregistrer</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Add new task modal */}
      <AddTaskModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        members={members}
        onCreate={async (title: string, opts?: { category?: string | null; routine_every_days?: number | null; assigned_to?: string | null; due_date?: string | null }) => {
          if (!listId) return;
          try {
            const payload: any = { title };
            if (opts?.category !== undefined) payload.category = opts.category;
            if (opts?.routine_every_days !== undefined) payload.routine_every_days = opts.routine_every_days;
            if (opts?.assigned_to !== undefined) payload.assigned_to = opts.assigned_to;
            if (opts?.due_date !== undefined) payload.due_date = opts.due_date;
            // Prefer detailed creation when available
            const created = await addTaskDetailed(listId, payload);
            setItems((cur) => [created, ...cur]);
          } catch (e) {
            // ignore
          }
        }}
        initialCategory={newCategory}
      />
      
    </AppContainer>
  );
}

const styles = StyleSheet.create({});

function AddTaskModal({ visible, onClose, onCreate, initialCategory, members }: { visible: boolean; onClose: () => void; onCreate: (title: string, opts?: { category?: string | null; routine_every_days?: number | null; assigned_to?: string | null; due_date?: string | null }) => Promise<void>; initialCategory?: string | null; members?: ProfileRow[] }) {
  const t = useTokens();
  const [localTitle, setLocalTitle] = useState('');
  const [localCategory, setLocalCategory] = useState<string | null>(initialCategory ?? null);
  const [isRoutine, setIsRoutine] = useState<boolean>(!!(initialCategory));
  const [localFreqDays, setLocalFreqDays] = useState<number | null>(7);
  const [localAssignee, setLocalAssignee] = useState<string | null>(null);
  const [localDue, setLocalDue] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    // debug logs removed from Tasks modal to avoid noise during Courses debugging
  }, []);
  useEffect(() => {/* visible changed */}, [visible]);
  useEffect(() => {
    if (visible) {
      setLocalTitle('');
      setLocalCategory(initialCategory ?? null);
      setIsRoutine(false);
      setLocalFreqDays(7);
      setLocalAssignee(null);
      setLocalDue(null);
    }
  }, [visible, initialCategory]);

  const categoryOptions = ['Ménage','Courses','Cuisine','Linge','Admin','Santé','Animaux','Autre'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: t.color.card, borderRadius: 12, padding: 18 }}>
          <Pressable onPress={onClose} style={{ position: 'absolute', top: 10, right: 10, padding: 6 }}>
            <Ionicons name="close" size={18} color={t.color.muted} />
          </Pressable>
          <ThemedText variant="h2" style={{ marginBottom: 4 }}>{localCategory ? `Nouvelle tâche ${localCategory.toLowerCase()}` : 'Nouvelle tâche'}</ThemedText>
          <ThemedText style={{ color: t.color.muted, marginBottom: 16 }}>Ajoutez une nouvelle tâche et assignez-la à un membre du couple</ThemedText>

          <View style={{ marginBottom: 12 }}>
            <ThemedText style={{ marginBottom: 6 }}>Titre de la tâche</ThemedText>
            <TextInput
              placeholder="Ex: Passer l'aspirateur"
              value={localTitle}
              onChangeText={(txt) => { setLocalTitle(txt); }}
              returnKeyType="done"
              style={{ borderWidth: 1, borderColor: t.color.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: t.color.text }}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Catégorie</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORY_OPTIONS.map(c => {
                const sel = localCategory === c;
                const cc = categoryChipColors[c] || { bg: t.color.card, border: t.color.border, text: t.color.muted };
                return (
                  <Pressable key={c} onPress={() => setLocalCategory(c)} style={[chipStyle(cc.bg, sel ? String(t.color.primary) : cc.border), { borderColor: sel ? t.color.primary : cc.border }]}> 
                    <ThemedText style={chipTextColor(cc.text) as any}>{c}</ThemedText>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => setLocalCategory(null)} style={chipStyle(t.color.card, t.color.border)}>
                <ThemedText style={{ color: t.color.muted }}>Aucune</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Routine / Fréquence</ThemedText>
            <View style={{ flexDirection: 'row', alignItems:'center', gap: 8 }}>
              <Pressable onPress={() => setIsRoutine(v => !v)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: isRoutine? t.color.primary : t.color.border }}>
                <ThemedText style={{ color: isRoutine? t.color.primary : t.color.muted }}>{isRoutine ? 'Activée' : 'Désactivée'}</ThemedText>
              </Pressable>
              {isRoutine && (
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {[1,2,3,7,14,30].map(n => (
                    <Pressable key={n} onPress={() => setLocalFreqDays(n)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: localFreqDays===n? t.color.primary : t.color.border }}>
                      <ThemedText style={{ color: localFreqDays===n? t.color.primary : t.color.muted }}>{n} j</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Assigné à</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {(members || []).map(m => (
                <Pressable key={m.id} onPress={() => setLocalAssignee(m.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: localAssignee===m.id? t.color.primary : t.color.border }}>
                  <ThemedText style={{ color: localAssignee===m.id? t.color.primary : t.color.text }}>{m.display_name || m.email || 'Membre'}</ThemedText>
                </Pressable>
              ))}
              <Pressable onPress={() => setLocalAssignee(null)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: localAssignee===null? t.color.primary : t.color.border }}>
                <ThemedText style={{ color: localAssignee===null? t.color.primary : t.color.text }}>Personne</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <ThemedText style={{ marginBottom: 6, color: t.color.muted }}>Échéance</ThemedText>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pressable onPress={() => { setLocalDue(null); setShowDatePicker(false); }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: localDue===null? t.color.primary : t.color.border }}>
                <ThemedText style={{ color: localDue===null? t.color.primary : t.color.muted }}>Aucune</ThemedText>
              </Pressable>
              <Pressable onPress={() => { const d = new Date(); setLocalDue(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10)); }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: (localDue && dueBadge(localDue).kind==='today')? t.color.primary : t.color.border }}>
                <ThemedText style={{ color: (localDue && dueBadge(localDue).kind==='today')? t.color.primary : t.color.muted }}>Aujourd’hui</ThemedText>
              </Pressable>
              <Pressable onPress={() => { const d = new Date(); setLocalDue(new Date(d.getFullYear(), d.getMonth(), d.getDate()+1).toISOString().slice(0,10)); }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: (localDue && dueBadge(localDue).kind==='tomorrow')? t.color.primary : t.color.border }}>
                <ThemedText style={{ color: (localDue && dueBadge(localDue).kind==='tomorrow')? t.color.primary : t.color.muted }}>Demain</ThemedText>
              </Pressable>
              <Pressable onPress={() => setShowDatePicker(true)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: t.color.border }}>
                <ThemedText style={{ color: t.color.muted }}>Date libre</ThemedText>
              </Pressable>
              {localDue && (
                <View style={chipStyle(softGrayBg, softGrayBorder)}>
                  <ThemedText style={{ color: softGrayText }}>{localDue}</ThemedText>
                </View>
              )}
            </View>
            {showDatePicker && (
              Platform.OS === 'web' ? (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={localDue || ''}
                    onChangeText={(txt) => {
                      const cleaned = txt.trim();
                      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) { setLocalDue(cleaned); } else { setLocalDue(null); }
                    }}
                    style={{ borderWidth:1, borderColor: t.color.border, borderRadius:8, paddingHorizontal:12, paddingVertical:10, color: t.color.text, marginTop:8 }}
                  />
                  <View style={{ flexDirection:'row', gap:12, marginTop:8 }}>
                    <Pressable onPress={() => { setShowDatePicker(false); }} style={{ padding:8 }}>
                      <ThemedText style={{ color: t.color.muted }}>Fermer</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <DateTimePicker
                  value={localDue ? (parseDateOnly(localDue) || new Date()) : new Date()}
                  mode="date"
                  display={Platform.OS==='ios' ? 'inline' : 'default'}
                  onChange={(evt: any, sel: any) => {
                    if (evt?.type === 'dismissed') { setShowDatePicker(false); return; }
                    if (sel) {
                      const d = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
                      setLocalDue(d.toISOString().slice(0,10));
                    }
                    if (Platform.OS !== 'ios') setShowDatePicker(false);
                  }}
                />
              )
            )}
          </View>

          <View style={{ flexDirection:'row', gap:16 }}>
            <Pressable onPress={async () => {
              const ttl = localTitle.trim();
              if (!ttl) return;
              await onCreate(ttl, { category: localCategory, routine_every_days: isRoutine ? localFreqDays : null, assigned_to: localAssignee, due_date: localDue });
              setLocalTitle(''); setLocalCategory(null); setIsRoutine(false); setLocalFreqDays(7); setLocalAssignee(null); setLocalDue(null);
              onClose();
            }} style={{ flex:1, backgroundColor: t.color.text, paddingVertical:14, borderRadius:8, alignItems:'center', justifyContent:'center' }}>
              <ThemedText style={{ color: t.mode==='dark'? '#0E1116':'#fff', fontWeight:'600' }}>Ajouter</ThemedText>
            </Pressable>
            <Pressable onPress={onClose} style={{ flex:1, backgroundColor: t.color.card, paddingVertical:14, borderRadius:8, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: t.color.border }}>
              <ThemedText style={{ color: t.color.text }}>Annuler</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
