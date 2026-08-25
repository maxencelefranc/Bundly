import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPets,
  addPet,
  deletePet,
  fetchVaccinations,
  addVaccination,
  fetchWeights,
  addWeight,
  fetchVetVisits,
  addVetVisit,
  type Pet,
  type PetVaccination,
  type PetWeight,
  type PetVetVisit,
} from "./api";
import { useAppStore } from "@/stores/appStore";

export function usePets() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["pets", couple?.id],
    queryFn: () => fetchPets(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddPet() {
  const queryClient = useQueryClient();
  const { couple, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (pet: Pick<Pet, "name"> & Partial<Pet>) => {
      const result = await addPet(couple!.id, pet);
      await awardXP("pet_weight", "pets");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets", couple?.id] });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: deletePet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets", couple?.id] });
    },
  });
}

export function useVaccinations(petId?: string) {
  return useQuery({
    queryKey: ["vaccinations", petId],
    queryFn: () => fetchVaccinations(petId!),
    enabled: !!petId,
  });
}

export function useAddVaccination(petId?: string) {
  const queryClient = useQueryClient();
  const { awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (vac: Omit<PetVaccination, "id" | "pet_id">) => {
      const result = await addVaccination(petId!, vac);
      await awardXP("pet_vaccine", "pets");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations", petId] });
    },
  });
}

export function useWeights(petId?: string) {
  return useQuery({
    queryKey: ["weights", petId],
    queryFn: () => fetchWeights(petId!),
    enabled: !!petId,
  });
}

export function useAddWeight(petId?: string) {
  const queryClient = useQueryClient();
  const { awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (weight: number) => {
      const result = await addWeight(petId!, weight);
      await awardXP("pet_weight", "pets");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weights", petId] });
    },
  });
}

export function useVetVisits(petId?: string) {
  return useQuery({
    queryKey: ["vet-visits", petId],
    queryFn: () => fetchVetVisits(petId!),
    enabled: !!petId,
  });
}

export function useAddVetVisit(petId?: string) {
  const queryClient = useQueryClient();
  const { awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (visit: Omit<PetVetVisit, "id" | "pet_id">) => {
      const result = await addVetVisit(petId!, visit);
      await awardXP("pet_vet", "pets");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vet-visits", petId] });
    },
  });
}
