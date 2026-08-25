import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVehicles, addVehicle, updateVehicle, deleteVehicle, type Vehicle } from "./api";
import { useAppStore } from "@/stores/appStore";

export function useVehicles() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["vehicles", couple?.id],
    queryFn: () => fetchVehicles(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddVehicle() {
  const queryClient = useQueryClient();
  const { couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (vehicle: Pick<Vehicle, "make"> & Partial<Vehicle>) => {
      const result = await addVehicle(couple!.id, vehicle);
      await awardXP("vehicle_maintenance", "vehicles");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", couple?.id] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Vehicle> }) =>
      updateVehicle(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", couple?.id] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", couple?.id] });
    },
  });
}
