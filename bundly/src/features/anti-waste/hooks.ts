import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFoodItems, addFoodItem, markConsumed, deleteFoodItem, type FoodItem } from "./api";
import { useAppStore } from "@/stores/appStore";
import {
  getOrCreateActiveList,
  fetchItems as fetchShoppingItems,
  addItem as addShoppingItem,
} from "@/features/shopping/api";

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
  const { couple, profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await markConsumed(id);
      await awardXP("food_consumed", "anti-waste");

      // Consumed = used up, so it's a natural shopping-list candidate. Skip
      // it if it's already sitting in the list unpicked to avoid duplicates.
      if (couple?.id && profile?.id) {
        const list = await getOrCreateActiveList(couple.id);
        const existing = await fetchShoppingItems(list.id);
        const alreadyListed = existing.some(
          (i) => !i.picked && i.text.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (!alreadyListed) {
          await addShoppingItem(list.id, profile.id, name);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-items", couple?.id] });
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
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
