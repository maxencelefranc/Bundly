import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';
import { Input } from 'src/components/ui/Input';
import { Button } from 'src/components/ui/Button';
import { useTokens } from 'src/components/ui/ThemeProvider';
import { addEmotion, getEmotionsStats } from './api';
import type { EmotionRow } from './types';

export type EmotionsEntryFormProps = {
  onSaved: (created: EmotionRow, stats: { total: number; avg_mood: number | null }) => void;
};

export const EmotionsEntryForm: React.FC<EmotionsEntryFormProps> = ({ onSaved }) => {
  const t = useTokens();
  const [mood, setMood] = useState<number | null>(4);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const quicks = useMemo(() => [
    { k: 'joie', label: 'Joie' },
    { k: 'amour', label: 'Amour' },
    { k: 'stress', label: 'Stress' },
    { k: 'colère', label: 'Colère' },
    { k: 'fatigue', label: 'Fatigue' },
    { k: 'calme', label: 'Calme' },
  ], []);

  const emojiForMood = (m: number) => ({ 1:'😞', 2:'🙁', 3:'😐', 4:'🙂', 5:'😄' } as any)[m] || '🙂';
  const labelForMood = (m: number) => ({ 1:'Mauvais', 2:'Moyen', 3:'OK', 4:'Bon', 5:'Très bon' } as any)[m] || '';

  const onSave = async () => {
    if (!mood) return;
    try {
      setLoading(true);
      const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const created = await addEmotion({ mood, emotion, tags: tags.length? tags : null, note: note?.trim() ? note.trim() : null });
      const st = await getEmotionsStats(30);
      onSaved(created, { total: st.total, avg_mood: st.avg_mood });
      setNote('');
      setEmotion(null);
      setTagsInput('');
      setMood(4);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <View style={{ gap: 12, marginBottom: 14 }}>
      <ThemedText variant="h2">Comment te sens-tu ?</ThemedText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[5,4,3,2,1].map(v => (
          <Pressable key={v} onPress={() => setMood(v)} style={{ alignItems:'center', gap:4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: mood===v? t.color.primary : t.color.border, backgroundColor: mood===v? t.color.card : 'transparent' }}>
            <ThemedText style={{ fontSize: 20 }}>{emojiForMood(v)}</ThemedText>
            <ThemedText variant="small" style={{ color: mood===v? t.color.primary : t.color.muted }}>{labelForMood(v)}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ThemedText variant="h2" style={{ marginTop: 6 }}>Émotion</ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {quicks.map(q => {
          const active = emotion === q.k;
          return (
            <Pressable key={q.k} onPress={() => setEmotion(active ? null : q.k)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: active? t.color.primary : t.color.border, backgroundColor: active? t.color.card : 'transparent' }}>
              <ThemedText>{q.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Input label="Émotion personnalisée" placeholder="Ex: fierté" value={emotion && !quicks.some(q=>q.k===emotion) ? emotion : ''} onChangeText={(txt) => setEmotion(txt.trim() ? txt.trim().toLowerCase() : null)} noAnimated />
      {/* Hidden legacy tags input retained as no-op */}
      <Input label="Tags (séparés par virgules)" placeholder="ex: travail, famille" value={''} onChangeText={()=>{}} style={{ display:'none' }} noAnimated />
      <Input label="Tags" placeholder="travail, famille…" value={tagsInput} onChangeText={setTagsInput} noAnimated />
      <Input label="Note (optionnel)" placeholder="Quelques mots…" value={note} onChangeText={setNote} multiline noAnimated />
      <Button title={loading ? 'Enregistrement…' : 'Enregistrer'} onPress={onSave} disabled={loading || !mood} />
    </View>
  );
};

export default React.memo(EmotionsEntryForm);
