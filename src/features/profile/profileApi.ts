import * as ImagePicker from 'expo-image-picker';
import { supabase } from 'src/lib/supabase';
import { TABLES, BUCKETS } from 'src/lib/dbTables';

export type ProfileRow = {
  id: string;
  email?: string | null;
  couple_id?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  emotion_debrief_enabled?: boolean | null;
  emotion_debrief_hour?: number | null;
};

export type CoupleRow = {
  id: string;
  name: string;
  invite_code?: string | null;
};

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Utilisateur non connecté');
  return data.user;
}

export async function getOrCreateProfile(): Promise<ProfileRow> {
  const user = await getSessionUser();
  const { data: existing } = await supabase
    .from(TABLES.profiles)
    .select('id, email, couple_id, display_name, avatar_url, emotion_debrief_enabled, emotion_debrief_hour')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing as ProfileRow;

  // Insert minimal row
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .insert({ id: user.id, email: user.email })
    .select('id, email, couple_id, display_name, avatar_url, emotion_debrief_enabled, emotion_debrief_hour')
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function ensureCouple(profile: ProfileRow): Promise<CoupleRow> {
  if (profile.couple_id) {
    // Try to select invite_code; if column doesn't exist, gracefully fall back
    let sel: CoupleRow | null = null;
    const trySelect = async (cols: string) => {
      const { data, error } = await supabase
        .from(TABLES.couples)
        .select(cols)
        .eq('id', profile.couple_id as string)
        .single();
      if (!error && data) sel = (data as unknown) as CoupleRow;
      return !error;
    };
    const ok = await trySelect('id, name, invite_code');
    if (!ok) {
      await trySelect('id, name');
    }
    if (!sel) throw new Error('Couple introuvable');
    return sel as CoupleRow;
  }
  // Create a couple and attach profile
  // When invite_code column is missing, selecting it can error; fall back
  let couple: CoupleRow | null = null;
  let err1: any = null;
  {
    const { data, error } = await supabase
      .from(TABLES.couples)
      .insert({ name: 'Notre couple' })
      .select('id, name, invite_code')
      .single();
    if (error) err1 = error; else couple = data as CoupleRow;
  }
  if (err1) {
    const { data, error } = await supabase
      .from(TABLES.couples)
      .insert({ name: 'Notre couple' })
      .select('id, name')
      .single();
    if (error) throw error;
    couple = data as CoupleRow;
  }
  await supabase.from(TABLES.profiles).update({ couple_id: couple!.id }).eq('id', profile.id);
  return couple as CoupleRow;
}

export async function updateProfile(patch: Partial<ProfileRow>): Promise<ProfileRow> {
  const user = await getSessionUser();
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .update(patch)
    .eq('id', user.id)
    .select('id, email, couple_id, display_name, avatar_url, emotion_debrief_enabled, emotion_debrief_hour')
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function getCoupleMembers(coupleId: string): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select('id, email, display_name, avatar_url, couple_id')
    .eq('couple_id', coupleId);
  if (error) throw error;
  return (data || []) as ProfileRow[];
}

export async function updateCoupleName(coupleId: string, name: string): Promise<void> {
  const { error } = await supabase.from(TABLES.couples).update({ name }).eq('id', coupleId);
  if (error) throw error;
}

export async function joinCoupleByCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_couple_by_code', { p_code: code });
  if (error) throw error;
  return data as string;
}

export async function regenerateInviteCode(): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code');
  if (error) throw error;
  return data as string;
}

export async function pickAndUploadAvatar(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const user = await getSessionUser();
  const path = `${user.id}/${Date.now()}.jpg`;

  const resp = await fetch(asset.uri);
  const blob = await resp.blob();
  const { error } = await supabase.storage.from(BUCKETS.avatars).upload(path, blob as any, {
    contentType: 'image/jpeg',
    upsert: true
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKETS.avatars).getPublicUrl(path);
  return data.publicUrl;
}
