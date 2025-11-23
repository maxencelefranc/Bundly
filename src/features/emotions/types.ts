export type EmotionRow = {
  id: string;
  couple_id: string;
  created_by: string | null;
  mood: number; // 1..5
  emotion?: string | null;
  tags?: string[] | null;
  note?: string | null;
  occurred_at: string; // ISO
  day?: string; // yyyy-mm-dd (generated)
  created_at?: string;
  updated_at?: string;
};

export type EmotionsStats = {
  total: number;
  avg_mood: number | null;
  mood_counts: Record<string, number>;
  first_at: string | null;
  last_at: string | null;
};

export type SeriesBucket = 'day' | 'week';
export type EmotionsSeriesPoint = { bucket_start: string; avg_mood: number | null; count: number };
