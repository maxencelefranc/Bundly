import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import {
  usePeriods,
  useStartPeriod,
  useEndPeriod,
  useAddSymptom,
} from "@/features/menstruation/hooks";
import { SYMPTOMS, computeCycleStats, type Period } from "@/features/menstruation/api";

function SymptomPicker({ periodId }: { periodId: string }) {
  const theme = useTheme();
  const addSymptom = useAddSymptom(periodId);
  const [severity, setSeverity] = useState(3);

  return (
    <View style={{ marginTop: 12, padding: 12, backgroundColor: "#FDF2F8", borderRadius: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#EC4899", marginBottom: 8 }}>
        Ajouter un symptôme
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {SYMPTOMS.map((s) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => addSymptom.mutate({ symptomType: s.key, severity })}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: theme.bgCard,
              borderWidth: 0.5,
              borderColor: "rgba(236,72,153,0.2)",
            }}
          >
            <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
            <Text style={{ fontSize: 12, color: theme.text }}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ fontSize: 11, color: "#EC4899", marginBottom: 6 }}>
        Intensité : {severity}/5
      </Text>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setSeverity(n)}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: severity >= n ? "#EC4899" : theme.bgSecondary,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: severity >= n ? "white" : theme.textMuted,
              }}
            >
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PeriodCard({ period, isActive }: { period: Period; isActive: boolean }) {
  const theme = useTheme();
  const endPeriod = useEndPeriod();
  const [showSymptoms, setShowSymptoms] = useState(false);
  const start = new Date(period.start_date);
  const end = period.end_date ? new Date(period.end_date) : null;
  const duration = end
    ? Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null;

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: isActive ? "rgba(236,72,153,0.25)" : theme.border,
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
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#FDF2F8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="heart-outline" size={22} color="#EC4899" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>
            {isActive
              ? "En cours"
              : start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            {isActive
              ? `Depuis le ${start.toLocaleDateString("fr-FR")}`
              : duration
                ? `${duration} jours`
                : ""}
          </Text>
        </View>
        {isActive && (
          <TouchableOpacity
            onPress={() =>
              endPeriod.mutate({
                periodId: period.id,
                endDate: new Date().toISOString().split("T")[0],
              })
            }
            activeOpacity={0.8}
            style={{
              backgroundColor: "#EC4899",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>Terminer</Text>
          </TouchableOpacity>
        )}
      </View>
      {isActive && (
        <>
          <TouchableOpacity
            onPress={() => setShowSymptoms(!showSymptoms)}
            style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <Ionicons
              name={showSymptoms ? "chevron-up" : "chevron-down"}
              size={14}
              color="#EC4899"
            />
            <Text style={{ color: "#EC4899", fontSize: 13, fontWeight: "500" }}>
              {showSymptoms ? "Masquer" : "Ajouter des symptômes"}
            </Text>
          </TouchableOpacity>
          {showSymptoms && <SymptomPicker periodId={period.id} />}
        </>
      )}
    </View>
  );
}

export default function MenstruationScreen() {
  const theme = useTheme();
  const { data: periods, isLoading } = usePeriods();
  const startPeriod = useStartPeriod();
  const activePeriod = periods?.find((p) => !p.end_date);
  const stats = computeCycleStats(periods ?? []);

  return (
    <ScreenLayout
      title="Cycle menstruel"
      subtitle={`${periods?.length ?? 0} cycles enregistrés`}
      color="#EC4899"
      icon="heart-outline"
    >
      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.bgCard,
            borderRadius: 16,
            padding: 14,
            borderWidth: 0.5,
            borderColor: theme.border,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#EC4899" }}>
            {stats.avgCycle}j
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            Cycle moyen
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.bgCard,
            borderRadius: 16,
            padding: 14,
            borderWidth: 0.5,
            borderColor: theme.border,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#EC4899" }}>
            {stats.avgDuration}j
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            Durée moyenne
          </Text>
        </View>
      </View>

      {/* Bouton démarrer */}
      {!activePeriod && (
        <TouchableOpacity
          onPress={() => startPeriod.mutate(new Date().toISOString().split("T")[0])}
          activeOpacity={0.8}
          style={{
            height: 52,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#EC4899",
            marginBottom: 16,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>
            Démarrer ma période · +15 XP
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator color="#EC4899" style={{ marginTop: 20 }} />
      ) : (
        periods?.map((p) => <PeriodCard key={p.id} period={p} isActive={!p.end_date} />)
      )}
    </ScreenLayout>
  );
}
