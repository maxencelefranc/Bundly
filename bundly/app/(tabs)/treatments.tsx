import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import {
  useTreatments,
  useTodayLogs,
  useMarkTaken,
  useDeleteTreatment,
} from "@/features/treatments/hooks";
import type { Treatment } from "@/features/treatments/api";

function TreatmentCard({ treatment, takenToday }: { treatment: Treatment; takenToday: boolean }) {
  const theme = useTheme();
  const mark = useMarkTaken();
  const remove = useDeleteTreatment();

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: takenToday ? "rgba(6,182,212,0.2)" : theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#ECFEFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="medical-outline" size={22} color="#06B6D4" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>
            {treatment.name}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            {[treatment.dosage, treatment.frequency].filter(Boolean).join(" · ") ||
              "Pas de détails"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => remove.mutate(treatment.id)} activeOpacity={0.6}>
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => !takenToday && mark.mutate(treatment.id)}
        activeOpacity={takenToday ? 1 : 0.8}
        style={{
          height: 42,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
          backgroundColor: takenToday ? "#F0FDF4" : "#06B6D4",
        }}
      >
        <Ionicons
          name={takenToday ? "checkmark-circle" : "add-circle-outline"}
          size={18}
          color={takenToday ? "#22C55E" : "white"}
        />
        <Text style={{ fontSize: 14, fontWeight: "600", color: takenToday ? "#22C55E" : "white" }}>
          {takenToday ? "Pris aujourd'hui" : "Marquer comme pris · +10 XP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TreatmentsScreen() {
  const theme = useTheme();
  const { data: treatments, isLoading } = useTreatments();
  const ids = treatments?.map((t) => t.id) ?? [];
  const { data: takenIds } = useTodayLogs(ids);

  return (
    <ScreenLayout
      title="Traitements"
      subtitle={`${takenIds?.length ?? 0}/${treatments?.length ?? 0} pris aujourd'hui`}
      color="#06B6D4"
      icon="medical-outline"
      onAdd={() => router.push("/(modals)/add-treatment")}
    >
      {isLoading ? (
        <ActivityIndicator color="#06B6D4" style={{ marginTop: 40 }} />
      ) : treatments?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#ECFEFF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="medical-outline" size={32} color="#06B6D4" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucun traitement
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Ajoutez vos médicaments quotidiens
          </Text>
        </View>
      ) : (
        treatments?.map((t) => (
          <TreatmentCard key={t.id} treatment={t} takenToday={takenIds?.includes(t.id) ?? false} />
        ))
      )}
    </ScreenLayout>
  );
}
