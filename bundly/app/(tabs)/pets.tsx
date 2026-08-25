import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import {
  usePets,
  useDeletePet,
  useVaccinations,
  useAddVaccination,
  useWeights,
  useAddWeight,
  useVetVisits,
  useAddVetVisit,
} from "@/features/pets/hooks";
import { PET_TYPES, type Pet } from "@/features/pets/api";

function PetCard({ pet }: { pet: Pet }) {
  const theme = useTheme();
  const remove = useDeletePet();
  const [expanded, setExpanded] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const petType = PET_TYPES.find((p) => p.key === pet.type);
  const { data: weights } = useWeights(expanded ? pet.id : undefined);
  const { data: vaccinations } = useVaccinations(expanded ? pet.id : undefined);
  const { data: vetVisits } = useVetVisits(expanded ? pet.id : undefined);
  const addWeight = useAddWeight(pet.id);
  const addVaccination = useAddVaccination(pet.id);
  const addVetVisit = useAddVetVisit(pet.id);

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: "#FFFBEB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>{petType?.emoji ?? "🐾"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text }}>{pet.name}</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
            {petType?.label ?? pet.type}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => remove.mutate(pet.id)} activeOpacity={0.6}>
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={{ marginTop: 14, gap: 14 }}>
          {/* Poids */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.textMuted,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Poids{weights?.[0] ? ` · ${weights[0].weight} kg` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: theme.bgSecondary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 44,
                  color: theme.text,
                }}
                placeholder="Ex: 12.5 kg"
                placeholderTextColor={theme.textMuted}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                onPress={() => {
                  if (weightInput) {
                    addWeight.mutate(parseFloat(weightInput));
                    setWeightInput("");
                  }
                }}
                activeOpacity={0.8}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#F59E0B",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Vaccins */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.textMuted,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Vaccinations ({vaccinations?.length ?? 0})
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.prompt("Nouveau vaccin", "Nom du vaccin", (name) => {
                  if (name)
                    addVaccination.mutate({
                      name,
                      date: new Date().toISOString().split("T")[0],
                      next_date: null,
                    });
                })
              }
              activeOpacity={0.8}
              style={{
                backgroundColor: "#FFFBEB",
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderWidth: 0.5,
                borderColor: "rgba(245,158,11,0.2)",
              }}
            >
              <Ionicons name="add" size={16} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "600" }}>
                Ajouter un vaccin · +15 XP
              </Text>
            </TouchableOpacity>
            {vaccinations?.map((v) => (
              <View
                key={v.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color="#F59E0B" />
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  {v.name}
                  {v.date ? ` · ${new Date(v.date).toLocaleDateString("fr-FR")}` : ""}
                </Text>
              </View>
            ))}
          </View>

          {/* Véto */}
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.textMuted,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Visites vétérinaires ({vetVisits?.length ?? 0})
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.prompt("Visite véto", "Motif", (reason) => {
                  if (reason)
                    addVetVisit.mutate({
                      reason,
                      visited_at: new Date().toISOString().split("T")[0],
                      next_visit: null,
                    });
                })
              }
              activeOpacity={0.8}
              style={{
                backgroundColor: "#FFFBEB",
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderWidth: 0.5,
                borderColor: "rgba(245,158,11,0.2)",
              }}
            >
              <Ionicons name="add" size={16} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "600" }}>
                Ajouter une visite · +20 XP
              </Text>
            </TouchableOpacity>
            {vetVisits?.map((v) => (
              <View
                key={v.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}
              >
                <Ionicons name="medical-outline" size={14} color="#F59E0B" />
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  {v.reason}
                  {v.visited_at ? ` · ${new Date(v.visited_at).toLocaleDateString("fr-FR")}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function PetsScreen() {
  const theme = useTheme();
  const { data: pets, isLoading } = usePets();

  return (
    <ScreenLayout
      title="Animaux"
      subtitle={`${pets?.length ?? 0} animal(aux)`}
      color="#F59E0B"
      icon="paw-outline"
      onAdd={() => router.push("/(modals)/add-pet")}
    >
      {isLoading ? (
        <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />
      ) : pets?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#FFFBEB",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="paw-outline" size={32} color="#F59E0B" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucun animal
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Ajoutez votre premier compagnon
          </Text>
        </View>
      ) : (
        pets?.map((p) => <PetCard key={p.id} pet={p} />)
      )}
    </ScreenLayout>
  );
}
