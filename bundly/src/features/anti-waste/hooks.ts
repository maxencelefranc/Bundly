import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFoodItems, addFoodItem, markConsumed, deleteFoodItem, type FoodItem } from "./api";
import { useAppStore } from "@/stores/appStore";

export function useFoodItems() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["food-items", couple?.id],
    queryFn: () => fetchFoodItems(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddFoodItem() {
  const queryClient = useQueryClient();
  const { couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (item: Pick<FoodItem, "name"> & Partial<FoodItem>) => {
      const result = await addFoodItem(couple!.id, item);
      await awardXP("food_add", "anti-waste");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-items", couple?.id] });
    },
  });
}

export function useMarkConsumed() {
  const queryClient = useQueryClient();
  const { couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (id: string) => {
      await markConsumed(id);
      await awardXP("food_consumed", "anti-waste");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-items", couple?.id] });
    },
  });
}

export function useDeleteFoodItem() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: deleteFoodItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-items", couple?.id] });
    },
  });
}
