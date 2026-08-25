import { supabase } from "@/lib/supabase";

export interface Emotion {
  id: string;
  profile_id: string;
  emotion: string;
  mood: number;
  context: string | null;
  created_at: string;
}

export interface Debrief {
  id: string;
  emotion_id: string;
  debrief: string;
  created_at: string;
}

export const EMOTIONS = [
  { key: "happy", label: "Heureux", emoji: "😊" },
  { key: "love", label: "Amoureux", emoji: "🥰" },
  { key: "calm", label: "Calme", emoji: "😌" },
  { key: "tired", label: "Fatigué", emoji: "😴" },
  { key: "anxious", label: "Anxieux", emoji: "😰" },
  { key: "sad", label: "Triste", emoji: "😢" },
  { key: "angry", label: "En colère", emoji: "😤" },
  { key: "excited", label: "Excité", emoji: "🤩" },
] as const;

export type EmotionKey = (typeof EMOTIONS)[number]["key"];

export async function fetchEmotions(profileId: string): Promise<Emotion[]> {
  const { data, error } = await supabase
    .from("emotions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

export async function addEmotion(
  profileId: string,
  emotion: EmotionKey,
  mood: number,
  context?: string
): Promise<Emotion> {
  const { data, error } = await supabase
    .from("emotions")
    .insert({ profile_id: profileId, emotion, mood, context: context ?? null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchDebriefs(emotionId: string): Promise<Debrief[]> {
  const { data, error } = await supabase
    .from("emotion_debriefs")
    .select("*")
    .eq("emotion_id", emotionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addDebrief(emotionId: string, debrief: string): Promise<Debrief> {
  const { data, error } = await supabase
    .from("emotion_debriefs")
    .insert({ emotion_id: emotionId, debrief })
    .select()
    .single();

  if (error) throw error;
  return data;
}
