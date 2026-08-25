import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPeriods,
  startPeriod,
  endPeriod,
  addSymptom,
  fetchSymptoms,
  type SymptomKey,
} from "./api";
import { useAppStore } from "@/stores/appStore";

export function usePeriods() {
  const profile = useAppStore((s) => s.profile);

  return useQuery({
    queryKey: ["periods", profile?.id],
    queryFn: () => fetchPeriods(profile!.id),
    enabled: !!profile?.id,
  });
}

export function useSymptoms(periodId?: string) {
  return useQuery({
    queryKey: ["symptoms", periodId],
    queryFn: () => fetchSymptoms(periodId!),
    enabled: !!periodId,
  });
}

export function useStartPeriod() {
  const queryClient = useQueryClient();
  const { profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (startDate: string) => {
      const result = await startPeriod(profile!.id, startDate);
      await awardXP("period_log", "menstruation");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods", profile?.id] });
    },
  });
}

export function useEndPeriod() {
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.profile);

  return useMutation({
    mutationFn: ({ periodId, endDate }: { periodId: string; endDate: string }) =>
      endPeriod(periodId, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods", profile?.id] });
    },
  });
}

export function useAddSymptom(periodId?: string) {
  const queryClient = useQueryClient();
  const { awardXP } = useAppStore();

  return useMutation({
    mutationFn: async ({
      symptomType,
      severity,
    }: {
      symptomType: SymptomKey;
      severity: number;
    }) => {
      const result = await addSymptom(periodId!, symptomType, severity);
      await awardXP("symptom_log", "menstruation");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symptoms", periodId] });
    },
  });
}
