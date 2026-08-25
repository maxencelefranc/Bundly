import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_GOAL = 200;
const STEP = 50;
const MIN_GOAL = 50;

interface WeeklyGoalState {
  goalsByCouple: Record<string, number>;
  getGoal: (coupleId: string) => number;
  adjustGoal: (coupleId: string, delta: number) => void;
}

export const useWeeklyGoalStore = create<WeeklyGoalState>()(
  persist(
    (set, get) => ({
      goalsByCouple: {},
      getGoal: (coupleId) => get().goalsByCouple[coupleId] ?? DEFAULT_GOAL,
      adjustGoal: (coupleId, delta) =>
        set((s) => {
          const current = s.goalsByCouple[coupleId] ?? DEFAULT_GOAL;
          const next = Math.max(MIN_GOAL, current + delta);
          return { goalsByCouple: { ...s.goalsByCouple, [coupleId]: next } };
        }),
    }),
    {
      name: "bundly-weekly-goal",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { STEP as WEEKLY_GOAL_STEP };
