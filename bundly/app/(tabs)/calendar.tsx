import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import {
  MonthCalendar,
  localDateKey,
  type CalendarMarker,
} from "@/components/shared/MonthCalendar";
import { useTheme } from "@/stores/themeStore";
import { useAppointments, useDeleteAppointment } from "@/features/calendar/hooks";
import type { Appointment } from "@/features/calendar/api";

function AppointmentCard({ appt }: { appt: Appointment }) {
  const theme = useTheme();
  const remove = useDeleteAppointment();
  const date = new Date(appt.start_time);
  const isToday = date.toDateString() === new Date().toDateString();
  const isPast = date < new Date() && !isToday;

  return (
    <View style={{ opacity: isPast ? 0.5 : 1, marginBottom: 8 }}>
      <View
        style={{
          backgroundColor: theme.bgCard,
          borderRadius: 16,
          padding: 14,
          borderWidth: 0.5,
          borderColor: isToday ? "rgba(55,138,221,0.3)" : theme.border,
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
        {/* Date block */}
        <View
          style={{
            width: 48,
            alignItems: "center",
            backgroundColor: isToday ? "#EFF6FF" : theme.bgSecondary,
            borderRadius: 12,
            padding: 8,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: isToday ? "#378ADD" : theme.textMuted,
              lineHeight: 22,
            }}
          >
            {date.getDate()}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: isToday ? "#378ADD" : theme.textMuted,
              fontWeight: "500",
            }}
          >
            {date.toLocaleDateString("fr-FR", { month: "short" })}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>{appt.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
            <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {appt.location ? ` · ${appt.location}` : ""}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => remove.mutate(appt.id)} activeOpacity={0.6}>
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const theme = useTheme();
  const { data: appointments, isLoading } = useAppointments();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markersByDate = useMemo(() => {
    const map: Record<string, CalendarMarker[]> = {};
    for (const a of appointments ?? []) {
      const key = localDateKey(new Date(a.start_time));
      (map[key] ??= []).push({ color: "#378ADD" });
    }
    return map;
  }, [appointments]);

  const visible = selectedDate
    ? (appointments ?? []).filter((a) => localDateKey(new Date(a.start_time)) === selectedDate)
    : (appointments ?? []);
  const upcoming = visible.filter((a) => new Date(a.start_time) >= new Date());
  const past = visible.filter((a) => new Date(a.start_time) < new Date());

  return (
    <ScreenLayout
      title="Rendez-vous"
      subtitle={`${(appointments ?? []).filter((a) => new Date(a.start_time) >= new Date()).length} à venir`}
      color="#378ADD"
      icon="calendar-outline"
      onAdd={() => router.push("/(modals)/add-appointment")}
    >
      <View style={{ marginBottom: 16 }}>
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          markersByDate={markersByDate}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
        />
      </View>

      {selectedDate && (
        <TouchableOpacity
          onPress={() => setSelectedDate(null)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            backgroundColor: theme.brandLight,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: theme.brand, fontWeight: "500" }}>
            {new Date(selectedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </Text>
          <Ionicons name="close-circle" size={14} color={theme.brand} />
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator color="#378ADD" style={{ marginTop: 40 }} />
      ) : visible.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            {selectedDate ? "Aucun rendez-vous ce jour-là" : "Planifiez votre premier rendez-vous"}
          </Text>
        </View>
      ) : (
        <>
          {upcoming.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.textMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                À venir
              </Text>
              {upcoming.map((a) => (
                <AppointmentCard key={a.id} appt={a} />
              ))}
            </View>
          )}
          {past.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: theme.textMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Passés
              </Text>
              {past.map((a) => (
                <AppointmentCard key={a.id} appt={a} />
              ))}
            </View>
          )}
        </>
      )}
    </ScreenLayout>
  );
}
