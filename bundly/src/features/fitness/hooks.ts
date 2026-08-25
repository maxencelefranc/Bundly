import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFitnessLogs, addFitnessLog, deleteFitnessLog, type FitnessLog } from "./api";
import { useAppStore } from "@/stores/appStore";

export function useFitnessLogs() {
  const profile = useAppStore((s) => s.profile);

  return useQuery({
    queryKey: ["fitness", profile?.id],
    queryFn: () => fetchFitnessLogs(profile!.id),
    enabled: !!profile?.id,
  });
}

export function useAddFitnessLog() {
  const queryClient = useQueryClient();
  const { profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (log: Pick<FitnessLog, "activity"> & Partial<FitnessLog>) => {
      const result = await addFitnessLog(profile!.id, log);
      await awardXP("fitness_log", "fitness");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fitness", profile?.id] });
    },
  });
}

export function useDeleteFitnessLog() {
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.profile);

  return useMutation({
    mutationFn: deleteFitnessLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fitness", profile?.id] });
    },
  });
}
