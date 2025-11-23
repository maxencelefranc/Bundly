import React, { useState } from 'react';
import { View, Pressable, Modal, Platform, TextInput, Alert } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';
import { Input } from 'src/components/ui/Input';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { addTaskDetailed, type Task, type ProfileLite } from './tasksApi';
import type { ProfileRow } from 'src/features/profile/profileApi';

export type DueBadge = { label: string; kind: 'none'|'overdue'|'today'|'tomorrow'|'thisweek'|'future' };

export type AddTaskModalProps = {
  visible: boolean;
  onClose: () => void;
  listId: string | null;
  members: ProfileRow[];
  assignees: Record<string, ProfileLite>;
  todayLocal: Date;
  parseDateOnly: (s: string) => Date | null;
  dueBadge: (due: string | null) => DueBadge;
  onTaskCreated: (task: Task) => void;
};

export default function AddTaskModal(props: AddTaskModalProps) {
  const { visible, onClose, listId, members, assignees, todayLocal, parseDateOnly, dueBadge, onTaskCreated } = props;
  const t = useTokens();

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Ménage');
  const [newFrequencyDays, setNewFrequencyDays] = useState<number | null>(7);
  const [newAssignee, setNewAssignee] = useState<string | null>(null);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [freqSelectOpen, setFreqSelectOpen] = useState(false);
  const [assigneeSelectOpen, setAssigneeSelectOpen] = useState(false);
  const [newDue, setNewDue] = useState<string | null>(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);

  const softGrayBg = '#EEF2F6';
  const softGrayBorder = '#E6E4ED';
  const softGrayText = '#5B6978';
  const chipStyle = (bg: string, border: string) => ({ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: border, backgroundColor: bg });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: t.color.card, borderRadius: 12, padding: 18 }}>
          <Pressable onPress={onClose} style={{ position: 'absolute', top: 10, right: 10, padding: 6 }}>
            <Ionicons name="close" size={18} color={t.color.muted} />
          </Pressable>
          {(() => {
            const adjectiveMap: Record<string,string> = { 'Ménage':'ménagère','Courses':'courses','Cuisine':'cuisine','Linge':'linge','Admin':'administrative','Santé':'santé','Animaux':'animaux','Autre':'' };
            const adj = adjectiveMap[newCategory] || '';
            const titleLabel = adj ? `Nouvelle tâche ${adj}` : 'Nouvelle tâche';
            return <ThemedText variant="h2" style={{ marginBottom: 4 }}>{titleLabel}</ThemedText>;
          })()}
          <ThemedText style={{ color: t.color.muted, marginBottom: 16 }}>Ajoutez une nouvelle tâche et assignez-la à un membre du couple</ThemedText>
          {/* Title */}
          <View style={{ marginBottom: 14 }}>
            <ThemedText style={{ marginBottom: 6 }}>Titre de la tâche</ThemedText>
            <Input placeholder="Ex: Passer l'aspirateur" value={newTitle} onChangeText={setNewTitle} returnKeyType="done" noAnimated />
          </View>
          {/* Category */}
          <View style={{ marginBottom: 14 }}>
            <ThemedText style={{ marginBottom: 6 }}>Catégorie</ThemedText>
            <Pressable onPress={() => setCategorySelectOpen(o=>!o)} style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F4F4F8', borderWidth:1, borderColor: '#E6E4ED', flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <ThemedText>{newCategory}</ThemedText>
              <Ionicons name={categorySelectOpen? 'chevron-up':'chevron-down'} size={18} color={t.color.muted} />
            </Pressable>
            {categorySelectOpen && (
              <View style={{ marginTop: 8, flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {['Ménage','Courses','Cuisine','Linge','Admin','Santé','Animaux','Autre'].map(c => (
                  <Pressable key={c} onPress={() => { setNewCategory(c); setCategorySelectOpen(false); }} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, borderWidth:1, borderColor: newCategory===c? t.color.primary : t.color.border, backgroundColor: newCategory===c? t.color.card : 'transparent' }}>
                    <ThemedText style={{ color: newCategory===c? t.color.primary : t.color.muted }}>{c}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {/* Frequency */}
          <View style={{ marginBottom: 14 }}>
            <ThemedText style={{ marginBottom: 6 }}>Fréquence</ThemedText>
            <Pressable onPress={() => setFreqSelectOpen(o=>!o)} style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F4F4F8', borderWidth:1, borderColor: '#E6E4ED', flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <ThemedText>{newFrequencyDays === 1 ? 'Quotidien' : newFrequencyDays === 7 ? 'Hebdomadaire' : newFrequencyDays ? `Tous ${newFrequencyDays} j` : 'Aucune'}</ThemedText>
              <Ionicons name={freqSelectOpen? 'chevron-up':'chevron-down'} size={18} color={t.color.muted} />
            </Pressable>
            {freqSelectOpen && (
              <View style={{ marginTop: 8, flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {[null,1,7,14,30].map(v => (
                  <Pressable key={String(v)} onPress={() => { setNewFrequencyDays(v); setFreqSelectOpen(false); }} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, borderWidth:1, borderColor: newFrequencyDays===v? t.color.primary : t.color.border, backgroundColor: newFrequencyDays===v? t.color.card : 'transparent' }}>
                    <ThemedText style={{ color: newFrequencyDays===v? t.color.primary : t.color.muted }}>{v===null? 'Aucune' : v===1? 'Quotidien' : v===7? 'Hebdomadaire' : `Tous ${v} j`}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {/* Due date add */}
          <View style={{ marginBottom: 14 }}>
            <ThemedText style={{ marginBottom: 6 }}>Échéance</ThemedText>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
              {[
                {k:null as string | null, l:'Aucune'},
                {k:'today', l:"Aujourd’hui"},
                {k:'tomorrow', l:'Demain'},
                {k:'week', l:'Dans 7 j'},
              ].map(o => (
                <Pressable key={String(o.k)} onPress={() => {
                  if (o.k===null) { setNewDue(null); return; }
                  const base = new Date();
                  if (o.k==='today') { setNewDue(new Date(base.getFullYear(), base.getMonth(), base.getDate()).toISOString().slice(0,10)); return; }
                  if (o.k==='tomorrow') { setNewDue(new Date(base.getFullYear(), base.getMonth(), base.getDate()+1).toISOString().slice(0,10)); return; }
                  if (o.k==='week') { setNewDue(new Date(base.getFullYear(), base.getMonth(), base.getDate()+7).toISOString().slice(0,10)); return; }
                }} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, borderWidth:1, borderColor: (()=>{
                  if (o.k===null) return newDue===null ? t.color.primary : t.color.border;
                  if (o.k==='today') return (dueBadge(newDue||null)?.kind==='today') ? t.color.primary : t.color.border;
                  if (o.k==='tomorrow') return (dueBadge(newDue||null)?.kind==='tomorrow') ? t.color.primary : t.color.border;
                  if (o.k==='week') { const d = newDue ? parseDateOnly(newDue) : null; const sel = !!d && Math.floor((d.getTime()-todayLocal.getTime())/(1000*60*60*24))===7; return sel? t.color.primary : t.color.border; }
                  return t.color.border;
                })() }}>
                  <ThemedText style={{ color: (()=>{
                    if (o.k===null) return newDue===null ? t.color.primary : t.color.muted;
                    if (o.k==='today') return (dueBadge(newDue||null)?.kind==='today') ? t.color.primary : t.color.muted;
                    if (o.k==='tomorrow') return (dueBadge(newDue||null)?.kind==='tomorrow') ? t.color.primary : t.color.muted;
                    if (o.k==='week') { const d = newDue ? parseDateOnly(newDue) : null; const sel = !!d && Math.floor((d.getTime()-todayLocal.getTime())/(1000*60*60*24))===7; return sel? t.color.primary : t.color.muted; }
                    return t.color.muted;
                  })() }}>{o.l}</ThemedText>
                </Pressable>
              ))}
              <Pressable onPress={() => setShowAddDatePicker(true)} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:999, borderWidth:1, borderColor: t.color.border }}>
                <ThemedText style={{ color: t.color.muted }}>Date libre</ThemedText>
              </Pressable>
              {newDue && (
                <View style={chipStyle(softGrayBg, softGrayBorder)}>
                  <ThemedText style={{ color: softGrayText }}>{newDue}</ThemedText>
                </View>
              )}
            </View>
            {showAddDatePicker && (
              Platform.OS === 'web' ? (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={newDue || ''}
                    onChangeText={(txt) => {
                      const cleaned = txt.trim();
                      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
                        setNewDue(cleaned);
                      } else {
                        setNewDue(null);
                      }
                    }}
                    style={{ borderWidth:1, borderColor: t.color.border, borderRadius:8, paddingHorizontal:12, paddingVertical:10, color: t.color.text }}
                  />
                  <View style={{ flexDirection:'row', gap:12, marginTop:8 }}>
                    <Pressable onPress={() => { setShowAddDatePicker(false); }} style={{ padding:8 }}>
                      <ThemedText style={{ color: t.color.muted }}>Fermer</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                // Native date picker
                // @ts-ignore dynamic import not needed here as module exists natively
                <>
                  {/* Using community DateTimePicker if available via parent project dependencies */}
                  {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
                  {(() => {
                    const Picker = require('@react-native-community/datetimepicker').default;
                    return (
                      <Picker
                        value={newDue ? (parseDateOnly(newDue) || new Date()) : new Date()}
                        mode="date"
                        display={Platform.OS==='ios' ? 'inline' : 'default'}
                        onChange={(evt: any, sel: any) => {
                          if (evt?.type === 'dismissed') {
                            setShowAddDatePicker(false);
                            return;
                          }
                          if (sel) {
                            const d = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
                            setNewDue(d.toISOString().slice(0,10));
                          }
                          if (Platform.OS !== 'ios') setShowAddDatePicker(false);
                        }}
                      />
                    );
                  })()}
                </>
              )
            )}
          </View>
          {/* Assignee */}
          <View style={{ marginBottom: 18 }}>
            <ThemedText style={{ marginBottom: 6 }}>Assigné à</ThemedText>
            <Pressable onPress={() => setAssigneeSelectOpen(o=>!o)} style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F4F4F8', borderWidth:1, borderColor: '#E6E4ED', flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <ThemedText>{(newAssignee && (assignees[newAssignee]?.display_name || assignees[newAssignee]?.email)) || 'Personne'}</ThemedText>
              <Ionicons name={assigneeSelectOpen? 'chevron-up':'chevron-down'} size={18} color={t.color.muted} />
            </Pressable>
            {assigneeSelectOpen && (
              <View style={{ marginTop:8, gap:8 }}>
                {members.map(m => (
                  <Pressable key={m.id} onPress={() => { setNewAssignee(m.id); setAssigneeSelectOpen(false); }} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:12, paddingVertical:10, borderRadius:8, borderWidth:1, borderColor: newAssignee===m.id? t.color.primary : t.color.border }}>
                    <ThemedText style={{ color: newAssignee===m.id? t.color.primary : t.color.text }}>{m.display_name || m.email || 'Membre'}</ThemedText>
                  </Pressable>
                ))}
                <Pressable onPress={() => { setNewAssignee(null); setAssigneeSelectOpen(false); }} style={{ paddingHorizontal:12, paddingVertical:10, borderRadius:8, borderWidth:1, borderColor: newAssignee===null? t.color.primary : t.color.border }}>
                  <ThemedText style={{ color: newAssignee===null? t.color.primary : t.color.text }}>Personne</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
          <View style={{ flexDirection:'row', gap:16 }}>
            <Pressable onPress={async () => {
              const ttl = newTitle.trim();
              if (!ttl || !listId) return;
              try {
                const created = await addTaskDetailed(listId, { title: ttl, category: newCategory || null, assigned_to: newAssignee, frequency_days: newFrequencyDays, due_date: newDue });
                onTaskCreated(created);
                setNewTitle('');
                onClose();
                setNewDue(null);
              } catch (e:any) {
                Alert.alert('Erreur', e?.message || 'Impossible d\'ajouter la tâche');
              }
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
