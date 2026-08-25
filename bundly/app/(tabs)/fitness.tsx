import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import { useFitnessLogs, useDeleteFitnessLog } from "@/features/fitness/hooks";
import { ACTIVITIES, type FitnessLog } from "@/features/fitness/api";

function FitnessCard({ log }: { log: FitnessLog }) {
  const theme = useTheme();
  const remove = useDeleteFitnessLog();
  const activity = ACTIVITIES.find((a) => a.key === log.activity);
  const date = new Date(log.logged_at);

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: "#F0FDF4",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 22 }}>{activity?.emoji ?? "💪"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>
          {activity?.label ?? log.activity}
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 3 }}>
          {log.duration && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="time-outline" size={11} color={theme.textSecondary} />
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>{log.duration} min</Text>
            </View>
          )}
          {log.calories && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="flame-outline" size={11} color={theme.textSecondary} />
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>{log.calories} kcal</Text>
            </View>
          )}
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>
            {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </Text>
        </View>
        {log.notes && (
          <Text
            style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}
            numberOfLines={1}
          >
            {log.notes}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => remove.mutate(log.id)} activeOpacity={0.6}>
        <Ionicons name="close" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function FitnessScreen() {
  const theme = useTheme();
  const { data: logs, isLoading } = useFitnessLogs();
  const totalDuration = logs?.reduce((acc, l) => acc + (l.duration ?? 0), 0) ?? 0;
  const totalCalories = logs?.reduce((acc, l) => acc + (l.calories ?? 0), 0) ?? 0;

  return (
    <ScreenLayout
      title="Fitness"
      subtitle={`${logs?.length ?? 0} séances · ${totalDuration} min · ${totalCalories} kcal`}
      color="#22C55E"
      icon="barbell-outline"
      onAdd={() => router.push("/(modals)/add-fitness")}
    >
      {isLoading ? (
        <ActivityIndicator color="#22C55E" style={{ marginTop: 40 }} />
      ) : logs?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#F0FDF4",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="barbell-outline" size={32} color="#22C55E" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucune séance
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Enregistrez votre première activité
          </Text>
        </View>
      ) : (
        logs?.map((l) => <FitnessCard key={l.id} log={l} />)
      )}
    </ScreenLayout>
  );
}
