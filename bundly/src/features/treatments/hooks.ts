import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTreatments,
  addTreatment,
  deleteTreatment,
  markTaken,
  fetchTodayLogs,
  fetchLogsInRange,
  type Treatment,
} from "./api";
import { useAppStore } from "@/stores/appStore";
import { scheduleTreatmentReminder, cancelTreatmentReminder } from "@/lib/notifications";

export function useTreatments() {
  const profile = useAppStore((s) => s.profile);

  return useQuery({
    queryKey: ["treatments", profile?.id],
    queryFn: () => fetchTreatments(profile!.id),
    enabled: !!profile?.id,
  });
}

export function useTodayLogs(treatmentIds: string[]) {
  return useQuery({
    queryKey: ["treatment-logs-today", treatmentIds],
    queryFn: () => fetchTodayLogs(treatmentIds),
    enabled: treatmentIds.length > 0,
  });
}

export function useMonthLogs(treatmentIds: string[], monthStart: Date, monthEnd: Date) {
  const startISO = monthStart.toISOString();
  const endISO = monthEnd.toISOString();

  return useQuery({
    queryKey: ["treatment-logs-range", treatmentIds, startISO, endISO],
    queryFn: () => fetchLogsInRange(treatmentIds, startISO, endISO),
    enabled: treatmentIds.length > 0,
  });
}

export function useAddTreatment() {
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.profile);

  return useMutation({
    mutationFn: async (treatment: Pick<Treatment, "name"> & Partial<Treatment>) => {
      const result = await addTreatment(profile!.id, treatment);
      scheduleTreatmentReminder(result.id, result.name, result.reminder_time).catch(() => {});
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments", profile?.id] });
    },
  });
}

export function useDeleteTreatment() {
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.profile);

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteTreatment(id);
      await cancelTreatmentReminder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments", profile?.id] });
    },
  });
}

export function useMarkTaken() {
  const queryClient = useQueryClient();
  const { profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (treatmentId: string) => {
      const result = await markTaken(treatmentId);
      await awardXP("treatment_taken", "treatments");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-logs-today"] });
      queryClient.invalidateQueries({ queryKey: ["treatment-logs-range"] });
    },
  });
}
