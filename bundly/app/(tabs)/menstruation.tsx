import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import {
  MonthCalendar,
  localDateKey,
  addDaysStr,
  eachDayKey,
  type CalendarMarker,
} from "@/components/shared/MonthCalendar";
import { useTheme } from "@/stores/themeStore";
import {
  usePeriods,
  useStartPeriod,
  useEndPeriod,
  useAddSymptom,
} from "@/features/menstruation/hooks";
import {
  SYMPTOMS,
  computeCycleStats,
  predictNextCycle,
  type Period,
} from "@/features/menstruation/api";

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
  const prediction = !activePeriod ? predictNextCycle(periods ?? []) : null;
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markersByDate = useMemo(() => {
    const map: Record<string, CalendarMarker[]> = {};
    const mark = (key: string, color: string) => (map[key] ??= []).push({ color });

    for (const p of periods ?? []) {
      const end = p.end_date ?? localDateKey(new Date());
      for (const key of eachDayKey(p.start_date, end)) mark(key, "#EC4899");
    }

    if (prediction) {
      const predictedEnd = addDaysStr(
        prediction.nextPeriodStart,
        Math.max(stats.avgDuration - 1, 0)
      );
      for (const key of eachDayKey(prediction.nextPeriodStart, predictedEnd)) mark(key, "#F9A8D4");
      for (const key of eachDayKey(prediction.fertileWindowStart, prediction.fertileWindowEnd)) {
        mark(key, "#A78BFA");
      }
    }

    return map;
  }, [periods, prediction, stats.avgDuration]);

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

      {/* Calendrier */}
      <View style={{ marginBottom: 8 }}>
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          markersByDate={markersByDate}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 16, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EC4899" }} />
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Règles</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#F9A8D4" }} />
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Prévu</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#A78BFA" }} />
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>Fenêtre fertile</Text>
        </View>
      </View>

      {/* Prédiction */}
      {prediction && (
        <View
          style={{
            backgroundColor: theme.bgCard,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Ionicons name="sparkles-outline" size={16} color="#EC4899" />
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>
              Estimation basée sur ton cycle moyen
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: theme.text, marginBottom: 4 }}>
            Prochaines règles :{" "}
            <Text style={{ fontWeight: "700", color: "#EC4899" }}>
              {new Date(prediction.nextPeriodStart).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
            </Text>{" "}
            <Text style={{ color: theme.textSecondary }}>
              (
              {prediction.daysUntilNextPeriod > 0
                ? `dans ${prediction.daysUntilNextPeriod}j`
                : "en retard"}
              )
            </Text>
          </Text>
          <Text style={{ fontSize: 14, color: theme.text }}>
            Fenêtre de fertilité :{" "}
            <Text style={{ fontWeight: "700", color: "#A78BFA" }}>
              {new Date(prediction.fertileWindowStart).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}{" "}
              →{" "}
              {new Date(prediction.fertileWindowEnd).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          </Text>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>
            Estimation indicative, pas une méthode contraceptive.
          </Text>
        </View>
      )}

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
