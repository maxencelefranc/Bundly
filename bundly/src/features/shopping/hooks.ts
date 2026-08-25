import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrCreateActiveList,
  fetchItems,
  addItem,
  togglePicked,
  deleteItem,
  clearPicked,
} from "./api";
import { useAppStore } from "@/stores/appStore";

export function useShoppingList() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["shopping-list", couple?.id],
    queryFn: () => getOrCreateActiveList(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useShoppingItems(listId?: string) {
  return useQuery({
    queryKey: ["shopping-items", listId],
    queryFn: () => fetchItems(listId!),
    enabled: !!listId,
  });
}

export function useAddItem(listId?: string) {
  const queryClient = useQueryClient();
  const { profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async ({ text, category }: { text: string; category?: string }) => {
      const item = await addItem(listId!, profile!.id, text, category);
      await awardXP("item_add", "shopping");
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
    },
  });
}

export function useTogglePicked(listId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, picked }: { id: string; picked: boolean }) => togglePicked(id, picked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
    },
  });
}

export function useDeleteItem(listId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
    },
  });
}

export function useClearPicked(listId?: string) {
  const queryClient = useQueryClient();
  const { awardXP } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      await clearPicked(listId!);
      await awardXP("list_complete", "shopping");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items", listId] });
    },
  });
}
