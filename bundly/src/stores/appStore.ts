import { create } from "zustand";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import type { Profile, Couple, CoupleXP, ModuleKey, XP_REWARDS } from "@/types";
import { COUPLE_LEVELS, XP_REWARDS as XP } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppState {
  // Auth
  profile: Profile | null;
  partner: Profile | null;
  couple: Couple | null;
  coupleXP: CoupleXP | null;
  isLoading: boolean;

  // Actions auth
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;

  // Actions couple
  createCouple: () => Promise<string>;
  joinCouple: (code: string) => Promise<void>;

  // Actions XP
  awardXP: (action: keyof typeof XP_REWARDS, module: ModuleKey) => Promise<void>;
  refreshXP: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLevel(totalXP: number) {
  const level = COUPLE_LEVELS.findLast((l) => totalXP >= l.min) ?? COUPLE_LEVELS[0];
  const nextLevel = COUPLE_LEVELS.find((l) => l.level === level.level + 1);
  return {
    level: level.level,
    level_name: level.name,
    xp_to_next: nextLevel ? nextLevel.min - totalXP : 0,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  partner: null,
  couple: null,
  coupleXP: null,
  isLoading: true,

  // ── Auth ──────────────────────────────────────────────────────────────────

  loadSession: async () => {
    set({ isLoading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return set({ isLoading: false });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile?.couple_id) {
      const [{ data: couple }, { data: xp }, { data: partners }] = await Promise.all([
        supabase.from("couples").select("*").eq("id", profile.couple_id).single(),
        supabase.from("couple_xp").select("*").eq("couple_id", profile.couple_id).single(),
        supabase
          .from("profiles")
          .select("*")
          .eq("couple_id", profile.couple_id)
          .neq("id", session.user.id),
      ]);

      const levelData = computeLevel(xp?.total_xp ?? 0);

      set({
        profile,
        couple,
        partner: partners?.[0] ?? null,
        coupleXP: xp ? { ...xp, ...levelData } : null,
        isLoading: false,
      });
    } else {
      set({ profile, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await get().loadSession();
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
      });
    }
    await get().loadSession();
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null, partner: null, couple: null, coupleXP: null });
  },

  // ── Couple ────────────────────────────────────────────────────────────────

  createCouple: async () => {
    const { profile } = get();
    if (!profile) throw new Error("Not authenticated");

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: couple, error } = await supabase
      .from("couples")
      .insert({ invite_code: code, created_by: profile.id })
      .select()
      .single();

    if (error) throw error;

    await Promise.all([
      supabase.from("profiles").update({ couple_id: couple.id }).eq("id", profile.id),
      supabase
        .from("couple_xp")
        .insert({ couple_id: couple.id, total_xp: 0, weekly_xp: 0, streak_days: 0 }),
    ]);

    await get().loadSession();
    return code;
  },

  joinCouple: async (code) => {
    const { profile } = get();
    if (!profile) throw new Error("Not authenticated");

    const { data: couple, error } = await supabase
      .from("couples")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error || !couple) throw new Error("Code invalide");

    await supabase.from("profiles").update({ couple_id: couple.id }).eq("id", profile.id);
    await get().loadSession();
  },

  // ── XP ────────────────────────────────────────────────────────────────────

  awardXP: async (action, module) => {
    const { profile, couple } = get();
    if (!profile || !couple) return;

    const xpEarned = XP[action] ?? 0;
    if (xpEarned === 0) return;

    const levelBefore = get().coupleXP?.level;

    await Promise.all([
      supabase.from("xp_events").insert({
        couple_id: couple.id,
        profile_id: profile.id,
        module,
        action,
        xp_earned: xpEarned,
      }),
      supabase.rpc("increment_couple_xp", {
        p_couple_id: couple.id,
        p_xp: xpEarned,
      }),
    ]);

    await get().refreshXP();

    const levelAfter = get().coupleXP?.level;
    if (levelAfter !== undefined && levelBefore !== undefined && levelAfter > levelBefore) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  },

  refreshXP: async () => {
    const { couple } = get();
    if (!couple) return;

    const { data: xp } = await supabase
      .from("couple_xp")
      .select("*")
      .eq("couple_id", couple.id)
      .single();

    if (xp) {
      const levelData = computeLevel(xp.total_xp);
      set({ coupleXP: { ...xp, ...levelData } });
    }
  },
}));
