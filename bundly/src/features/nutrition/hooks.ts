import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTodayMeals,
  fetchGoal,
  upsertGoal,
  addMealWithItems,
  deleteMeal,
  type NutritionGoal,
  type AIFoodItem,
  type MealTypeKey,
} from "./api";
import { useAppStore } from "@/stores/appStore";

export function useTodayMeals() {
  const { profile, couple } = useAppStore();

  return useQuery({
    queryKey: ["nutrition-meals", profile?.id, new Date().toISOString().split("T")[0]],
    queryFn: () => fetchTodayMeals(profile!.id, couple!.id),
    enabled: !!profile?.id && !!couple?.id,
  });
}

export function useNutritionGoal() {
  const profile = useAppStore((s) => s.profile);

  return useQuery({
    queryKey: ["nutrition-goal", profile?.id],
    queryFn: () => fetchGoal(profile!.id),
    enabled: !!profile?.id,
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.profile);

  return useMutation({
    mutationFn: (goal: NutritionGoal) => upsertGoal(profile!.id, goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-goal", profile?.id] });
    },
  });
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  const { profile, couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async ({
      mealType,
      items,
      shared,
      name,
    }: {
      mealType: MealTypeKey;
      items: AIFoodItem[];
      shared?: boolean;
      name?: string;
    }) => {
      const result = await addMealWithItems(profile!.id, couple!.id, mealType, items, shared, name);
      await awardXP("fitness_log", "fitness");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-meals"] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-meals"] });
    },
  });
}
