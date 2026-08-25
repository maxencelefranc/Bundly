import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDates, addDate, deleteDate, type ImportantDate } from "./api";
import { useAppStore } from "@/stores/appStore";
import { scheduleDateReminder, cancelDateReminder } from "@/lib/notifications";

export function useDates() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["dates", couple?.id],
    queryFn: () => fetchDates(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddDate() {
  const queryClient = useQueryClient();
  const { couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (item: Pick<ImportantDate, "title" | "date"> & Partial<ImportantDate>) => {
      const result = await addDate(couple!.id, item);
      await awardXP("date_add", "dates");
      scheduleDateReminder(result.id, result.title, result.date, result.reminder_days).catch(
        () => {}
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates", couple?.id] });
    },
  });
}

export function useDeleteDate() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDate(id);
      await cancelDateReminder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dates", couple?.id] });
    },
  });
}
