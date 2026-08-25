import { supabase } from "@/lib/supabase";

export interface Period {
  id: string;
  profile_id: string;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  created_at: string;
}

export interface Symptom {
  id: string;
  period_id: string;
  symptom_type: string;
  severity: number;
  recorded_at: string;
}

export const SYMPTOMS = [
  { key: "cramps", label: "Crampes", emoji: "😣" },
  { key: "headache", label: "Maux de tête", emoji: "🤕" },
  { key: "fatigue", label: "Fatigue", emoji: "😴" },
  { key: "bloating", label: "Ballonnements", emoji: "😮" },
  { key: "mood", label: "Sautes d'humeur", emoji: "😤" },
  { key: "back", label: "Mal de dos", emoji: "🔙" },
  { key: "nausea", label: "Nausées", emoji: "🤢" },
  { key: "other", label: "Autre", emoji: "💊" },
] as const;

export type SymptomKey = (typeof SYMPTOMS)[number]["key"];

export async function fetchPeriods(profileId: string): Promise<Period[]> {
  const { data, error } = await supabase
    .from("menstruation_periods")
    .select("*")
    .eq("profile_id", profileId)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function startPeriod(profileId: string, startDate: string): Promise<Period> {
  const { data, error } = await supabase
    .from("menstruation_periods")
    .insert({ profile_id: profileId, start_date: startDate })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endPeriod(periodId: string, endDate: string): Promise<Period> {
  const { data, error } = await supabase
    .from("menstruation_periods")
    .update({ end_date: endDate })
    .eq("id", periodId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addSymptom(
  periodId: string,
  symptomType: SymptomKey,
  severity: number
): Promise<Symptom> {
  const { data, error } = await supabase
    .from("menstruation_symptoms")
    .insert({ period_id: periodId, symptom_type: symptomType, severity })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSymptoms(periodId: string): Promise<Symptom[]> {
  const { data, error } = await supabase
    .from("menstruation_symptoms")
    .select("*")
    .eq("period_id", periodId)
    .order("recorded_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function computeCycleStats(periods: Period[]): { avgCycle: number; avgDuration: number } {
  if (periods.length < 2) return { avgCycle: 28, avgDuration: 5 };

  const durations = periods
    .filter((p) => p.end_date)
    .map((p) => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date!);
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });

  const cycles = periods.slice(0, -1).map((p, i) => {
    const start = new Date(p.start_date);
    const next = new Date(periods[i + 1].start_date);
    return Math.floor((start.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
  });

  const avgDuration =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 5;
  const avgCycle =
    cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 28;

  return { avgCycle, avgDuration };
}

export interface CyclePrediction {
  nextPeriodStart: string;
  daysUntilNextPeriod: number;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// `new Date("YYYY-MM-DD")` parses as UTC midnight; adding whole days in
// milliseconds keeps every date UTC-anchored so the result never drifts by a
// day depending on the device's local timezone (unlike `Date#setDate`, which
// operates in local time).
function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS);
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Estimates the next period start and fertile window from the most recent
 * period start date plus the average cycle length. Ovulation is approximated
 * at 14 days before the next period (luteal phase length is far more stable
 * across cycles than the follicular phase), with a 5-day fertile window
 * ending the day after ovulation — the standard sperm-survival heuristic.
 */
export function predictNextCycle(periods: Period[]): CyclePrediction | null {
  if (periods.length === 0) return null;

  const { avgCycle } = computeCycleStats(periods);
  const lastStart = new Date(periods[0].start_date);

  const nextPeriod = addDays(lastStart, avgCycle);
  const ovulation = addDays(nextPeriod, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);

  const today = new Date();
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntilNextPeriod = Math.round((nextPeriod.getTime() - todayUTC) / DAY_MS);

  return {
    nextPeriodStart: toISODate(nextPeriod),
    daysUntilNextPeriod,
    ovulationDate: toISODate(ovulation),
    fertileWindowStart: toISODate(fertileStart),
    fertileWindowEnd: toISODate(fertileEnd),
  };
}
