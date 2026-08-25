// ─── Auth & Couple ────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  couple_id: string | null;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Couple {
  id: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export interface CoupleXP {
  couple_id: string;
  total_xp: number;
  level: number;
  level_name: string;
  xp_to_next: number;
  weekly_xp: number;
  streak_days: number;
}

export interface XPEvent {
  id: string;
  couple_id: string;
  profile_id: string;
  module: ModuleKey;
  action: string;
  xp_earned: number;
  created_at: string;
}

export type ModuleKey =
  | "tasks"
  | "calendar"
  | "shopping"
  | "emotions"
  | "menstruation"
  | "pets"
  | "treatments"
  | "fitness"
  | "subscriptions"
  | "anti-waste"
  | "photos"
  | "dates"
  | "vehicles";

// ─── Niveaux de couple ────────────────────────────────────────────────────────

export const COUPLE_LEVELS = [
  { level: 1, name: "Novices", min: 0, max: 500, color: "#94A3B8" },
  { level: 2, name: "Complices", min: 500, max: 1500, color: "#60A5FA" },
  { level: 3, name: "Inséparables", min: 1500, max: 3000, color: "#A78BFA" },
  { level: 4, name: "Indestructibles", min: 3000, max: 6000, color: "#F59E0B" },
  { level: 5, name: "Légendaires", min: 6000, max: Infinity, color: "#EF4444" },
] as const;

// ─── XP par action ────────────────────────────────────────────────────────────

export const XP_REWARDS: Record<string, number> = {
  // Tâches
  task_complete: 10,
  task_create: 5,
  task_routine: 15,
  // Calendrier
  appointment_create: 15,
  appointment_attend: 20,
  // Courses
  item_add: 3,
  list_complete: 25,
  // Émotions
  emotion_log: 10,
  emotion_debrief: 20,
  // Menstruation
  period_log: 15,
  symptom_log: 5,
  // Animaux
  pet_weight: 5,
  pet_vet: 20,
  pet_vaccine: 15,
  // Traitements
  treatment_taken: 10,
  treatment_streak_7: 50,
  // Fitness
  fitness_log: 15,
  fitness_streak_7: 50,
  // Anti-gaspillage
  food_add: 5,
  food_consumed: 10,
  zero_waste_week: 100,
  // Photos
  photo_upload: 10,
  // Dates importantes
  date_add: 5,
  date_celebrated: 30,
  // Abonnements
  sub_add: 5,
  // Véhicules
  vehicle_maintenance: 20,
  // Bonus couple
  daily_both_active: 30,
  weekly_all_modules: 100,
} as const;

// ─── Modules config ────────────────────────────────────────────────────────────

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  icon: string;
  color: string;
  route: string;
  xpPerAction: number;
}

export const MODULES: ModuleConfig[] = [
  {
    key: "tasks",
    label: "Tâches",
    icon: "checklist",
    color: "#FF6B9D",
    route: "/tasks",
    xpPerAction: 10,
  },
  {
    key: "calendar",
    label: "Rendez-vous",
    icon: "calendar",
    color: "#378ADD",
    route: "/calendar",
    xpPerAction: 15,
  },
  {
    key: "shopping",
    label: "Courses",
    icon: "shopping-cart",
    color: "#1D9E75",
    route: "/shopping",
    xpPerAction: 5,
  },
  {
    key: "emotions",
    label: "Émotions",
    icon: "heart",
    color: "#A78BFA",
    route: "/emotions",
    xpPerAction: 15,
  },
  {
    key: "menstruation",
    label: "Cycle",
    icon: "calendar-stats",
    color: "#F472B6",
    route: "/menstruation",
    xpPerAction: 10,
  },
  { key: "pets", label: "Animaux", icon: "paw", color: "#F59E0B", route: "/pets", xpPerAction: 10 },
  {
    key: "treatments",
    label: "Traitements",
    icon: "pill",
    color: "#06B6D4",
    route: "/treatments",
    xpPerAction: 10,
  },
  {
    key: "fitness",
    label: "Fitness",
    icon: "barbell",
    color: "#22C55E",
    route: "/fitness",
    xpPerAction: 15,
  },
  {
    key: "subscriptions",
    label: "Abonnements",
    icon: "credit-card",
    color: "#8B5CF6",
    route: "/subscriptions",
    xpPerAction: 5,
  },
  {
    key: "anti-waste",
    label: "Anti-gaspillage",
    icon: "leaf",
    color: "#EF4444",
    route: "/anti-waste",
    xpPerAction: 8,
  },
  {
    key: "photos",
    label: "Photos",
    icon: "camera",
    color: "#EC4899",
    route: "/photos",
    xpPerAction: 10,
  },
  {
    key: "dates",
    label: "Dates",
    icon: "confetti",
    color: "#F97316",
    route: "/dates",
    xpPerAction: 5,
  },
  {
    key: "vehicles",
    label: "Véhicules",
    icon: "car",
    color: "#64748B",
    route: "/vehicles",
    xpPerAction: 15,
  },
];
