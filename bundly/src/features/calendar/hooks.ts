import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAppointments, addAppointment, deleteAppointment, type Appointment } from "./api";
import { useAppStore } from "@/stores/appStore";

export function useAppointments() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["appointments", couple?.id],
    queryFn: () => fetchAppointments(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddAppointment() {
  const queryClient = useQueryClient();
  const { couple, profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (
      appointment: Pick<Appointment, "title" | "start_time"> & Partial<Appointment>
    ) => {
      const result = await addAppointment(couple!.id, profile!.id, appointment);
      await awardXP("appointment_create", "calendar");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", couple?.id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", couple?.id] });
    },
  });
}
