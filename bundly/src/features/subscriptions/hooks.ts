import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSubscriptions, addSubscription, deleteSubscription, type Subscription } from "./api";
import { useAppStore } from "@/stores/appStore";
import { scheduleSubscriptionReminder, cancelSubscriptionReminder } from "@/lib/notifications";

export function useSubscriptions() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["subscriptions", couple?.id],
    queryFn: () => fetchSubscriptions(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddSubscription() {
  const queryClient = useQueryClient();
  const { couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (sub: Pick<Subscription, "name"> & Partial<Subscription>) => {
      const result = await addSubscription(couple!.id, sub);
      await awardXP("sub_add", "subscriptions");
      if (result.renewal_date) {
        scheduleSubscriptionReminder(result.id, result.name, result.renewal_date).catch(() => {});
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", couple?.id] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteSubscription(id);
      await cancelSubscriptionReminder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", couple?.id] });
    },
  });
}
