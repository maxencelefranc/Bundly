import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, Pressable, TextInput, Keyboard } from 'react-native';
import { ThemedText } from 'src/components/ui/ThemedText';
import { Button } from 'src/components/ui/Button';
import { useAuth } from 'src/lib/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { upsertFoodItem } from 'src/features/antiwaste/api';
import { supabase } from 'src/lib/supabase';
import { AppContainer } from 'src/components/ui/AppContainer';
import { Input } from 'src/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from 'src/components/ui/ThemeProvider';

export default function AntiWasteEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { coupleId } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [expiration, setExpiration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTokens();
  const nameInputRef = useRef<TextInput | null>(null);
  const expirationInputRef = useRef<TextInput | null>(null);
  const nameValueRef = useRef('');
  const expirationValueRef = useRef('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('food_items').select('*').eq('id', id).single();
      if (!error && data) {
        setName(data.name);
        setCategory(data.category || '');
        setLocation(data.location || '');
        setExpiration(data.expiration_date?.slice(0, 10) || '');
        setQuantity(data.quantity?.toString() || '');
        // populate uncontrolled inputs
        nameValueRef.current = data.name;
        expirationValueRef.current = data.expiration_date?.slice(0, 10) || '';
        if (nameInputRef.current) {
          try {
            console.log('[AntiWasteEdit] setting native text for name:', nameValueRef.current);
            nameInputRef.current.setNativeProps({ text: nameValueRef.current });
          } catch (e) { console.log('[AntiWasteEdit] setNativeProps name error', e); }
        }
        if (expirationInputRef.current) {
          try {
            console.log('[AntiWasteEdit] setting native text for expiration:', expirationValueRef.current);
            expirationInputRef.current.setNativeProps({ text: expirationValueRef.current });
          } catch (e) { console.log('[AntiWasteEdit] setNativeProps expiration error', e); }
        }
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const onShow = () => console.log('[AntiWasteEdit] keyboardDidShow');
    const onHide = () => console.log('[AntiWasteEdit] keyboardDidHide');
    const showSub = Keyboard.addListener('keyboardDidShow', onShow as any);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide as any);
    return () => {
      try { showSub.remove(); } catch {}
      try { hideSub.remove(); } catch {}
    };
  }, []);

  const onSave = async () => {
    try {
      if (!coupleId) throw new Error('Couple inconnu');
      const finalName = (nameValueRef.current || name).trim();
      const finalExpiration = (expirationValueRef.current || expiration).trim();
      console.log('[AntiWasteEdit] onSave values', { finalName, finalExpiration, category, location, quantity });
      if (!finalName || !finalExpiration) throw new Error('Nom et date de péremption requis');
      const isoDate = finalExpiration;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || isNaN(new Date(isoDate).getTime())) {
        throw new Error('Format de date invalide (attendu AAAA-MM-JJ)');
      }
      setLoading(true);
      await upsertFoodItem({
        id: id as string | undefined,
        couple_id: coupleId,
        name: finalName,
        category: category || null,
        location: location || null,
        expiration_date: isoDate,
        quantity: quantity ? Number(quantity) : 1
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Échec de l’enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer scroll>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <ThemedText variant="h1" style={{ marginBottom:0 }}>{isEdit ? 'Modifier' : 'Ajouter'} un produit</ThemedText>
        <Pressable onPress={()=>router.back()} hitSlop={8} style={{ padding:6 }}>
          <Ionicons name="close" size={26} color={t.color.text} />
        </Pressable>
      </View>
      <Input
        noAnimated
        label="Nom"
        placeholder="Ex: Yaourt"
        ref={nameInputRef}
        defaultValue={name}
        onFocus={() => console.log('[AntiWasteEdit] name focus')}
        onBlur={() => console.log('[AntiWasteEdit] name blur')}
        onChangeText={(v) => { nameValueRef.current = v; console.log('[AntiWasteEdit] name change', v); }}
      />
      <Input 
        noAnimated 
        label="Catégorie" 
        placeholder="Ex: Produits laitiers" 
        value={category} 
        onChangeText={setCategory} 
        style={{ marginTop: 12 }} 
      />
      <Input noAnimated label="Lieu" placeholder="Frigo, placard, congélateur" value={location} onChangeText={setLocation} style={{ marginTop: 12 }} />
      <Input
        noAnimated
        label="Date de péremption"
        placeholder="YYYY-MM-DD"
        ref={expirationInputRef}
        defaultValue={expiration}
        onFocus={() => console.log('[AntiWasteEdit] expiration focus')}
        onBlur={() => console.log('[AntiWasteEdit] expiration blur')}
        onChangeText={(v) => { expirationValueRef.current = v; console.log('[AntiWasteEdit] expiration change', v); }}
        style={{ marginTop: 12 }}
      />
      <Input noAnimated label="Quantité" placeholder="Optionnel" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" style={{ marginTop: 12, marginBottom: 12 }} />
      <Button title={loading ? 'Enregistrement…' : 'Enregistrer'} onPress={onSave} />
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' }
});
