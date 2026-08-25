import { useMemo, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/stores/themeStore";
import { useWeeklyGoalStore, WEEKLY_GOAL_STEP } from "@/stores/weeklyGoalStore";
import { COUPLE_LEVELS } from "@/types";
import { useTasks } from "@/features/tasks/hooks";
import { useShoppingList, useShoppingItems } from "@/features/shopping/hooks";
import { useAppointments } from "@/features/calendar/hooks";
import { useTreatments, useTodayLogs } from "@/features/treatments/hooks";
import { useDates } from "@/features/dates/hooks";
import { daysUntil } from "@/features/dates/api";
import { useFoodItems } from "@/features/anti-waste/hooks";
import { useSubscriptions } from "@/features/subscriptions/hooks";
import { usePeriods } from "@/features/menstruation/hooks";
import { predictNextCycle } from "@/features/menstruation/api";
import { fetchRecentActivity } from "@/lib/supabase";
import {
  MonthCalendar,
  localDateKey,
  dateKey,
  eachDayKey,
  type CalendarMarker,
} from "@/components/shared/MonthCalendar";

function getGreeting(name: string): string {
  const h = new Date().getHours();
  if (h < 6) return `Bonne nuit\n${name}`;
  if (h < 12) return `Bonjour\n${name}`;
  if (h < 14) return `Bon appétit\n${name}`;
  if (h < 18) return `Bonne après-midi\n${name}`;
  if (h < 21) return `Bonsoir\n${name}`;
  return `Bonne soirée\n${name}`;
}

function getModuleEmoji(module: string): { icon: string; color: string; bg: string } {
  const map: Record<string, { icon: string; color: string; bg: string }> = {
    tasks: { icon: "checkmark", color: "#FF6B9D", bg: "#FFF5F8" },
    calendar: { icon: "calendar", color: "#378ADD", bg: "#EFF6FF" },
    shopping: { icon: "cart", color: "#1D9E75", bg: "#ECFDF5" },
    emotions: { icon: "heart", color: "#A78BFA", bg: "#F5F3FF" },
    menstruation: { icon: "heart", color: "#EC4899", bg: "#FDF2F8" },
    pets: { icon: "paw", color: "#F59E0B", bg: "#FFFBEB" },
    treatments: { icon: "medical", color: "#06B6D4", bg: "#ECFEFF" },
    fitness: { icon: "barbell", color: "#22C55E", bg: "#F0FDF4" },
    subscriptions: { icon: "card", color: "#8B5CF6", bg: "#F5F3FF" },
    "anti-waste": { icon: "leaf", color: "#EF4444", bg: "#FEF2F2" },
    photos: { icon: "camera", color: "#EC4899", bg: "#FDF2F8" },
    dates: { icon: "gift", color: "#F97316", bg: "#FFF7ED" },
    vehicles: { icon: "car", color: "#64748B", bg: "#F8FAFC" },
    nutrition: { icon: "nutrition", color: "#8B5CF6", bg: "#F5F3FF" },
  };
  return map[module] ?? { icon: "flash", color: "#FF6B9D", bg: "#FFF5F8" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
}

function getModuleLabel(module: string): string {
  const labels: Record<string, string> = {
    tasks: "Tâche complétée",
    calendar: "RDV ajouté",
    shopping: "Article ajouté",
    emotions: "Émotion notée",
    treatments: "Traitement pris",
    fitness: "Sport logué",
    menstruation: "Cycle mis à jour",
    pets: "Animal suivi",
    "anti-waste": "Aliment ajouté",
    photos: "Photo ajoutée",
    dates: "Date ajoutée",
    nutrition: "Repas enregistré",
  };
  return labels[module] ?? "Action";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { profile, partner, coupleXP, couple } = useAppStore();
  const weeklyGoal = useWeeklyGoalStore((s) => (couple?.id ? s.getGoal(couple.id) : 200));
  const adjustWeeklyGoal = useWeeklyGoalStore((s) => s.adjustGoal);

  const { data: tasks } = useTasks();
  const { data: shoppingList } = useShoppingList();
  const { data: items } = useShoppingItems(shoppingList?.id);
  const { data: appointments } = useAppointments();
  const { data: treatments } = useTreatments();
  const { data: takenIds } = useTodayLogs(treatments?.map((t) => t.id) ?? []);
  const { data: dates } = useDates();
  const { data: foodItems } = useFoodItems();
  const { data: subscriptions } = useSubscriptions();
  const { data: periods } = usePeriods();
  const { data: activity } = useQuery({
    queryKey: ["activity", couple?.id],
    queryFn: () => fetchRecentActivity(couple!.id, 10),
    enabled: !!couple?.id,
  });

  const pending = tasks?.filter((t) => !t.completed).length ?? 0;
  const done = tasks?.filter((t) => t.completed).length ?? 0;
  const shopping = items?.filter((i) => !i.picked).length ?? 0;
  const nextAppt = appointments?.find((a) => new Date(a.start_time) >= new Date());
  const treatmentsDone = takenIds?.length ?? 0;
  const treatmentsTotal = treatments?.length ?? 0;
  const upcomingDates =
    dates?.filter((d) => {
      const day = daysUntil(d.date, d.recurring);
      return day >= 0 && day <= 14;
    }) ?? [];
  const partnerActivity = activity?.filter((a: any) => a.profile_id !== profile?.id) ?? [];

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);

  const { markersByDate, eventsByDate } = useMemo(() => {
    const markers: Record<string, CalendarMarker[]> = {};
    const events: Record<string, { label: string; color: string; icon: string; route: string }[]> =
      {};
    const add = (day: string, label: string, color: string, icon: string, route: string) => {
      (markers[day] ??= []).push({ color });
      (events[day] ??= []).push({ label, color, icon, route });
    };

    const year = calendarMonth.getFullYear();
    const month1to12 = calendarMonth.getMonth() + 1;

    for (const a of appointments ?? []) {
      add(
        localDateKey(new Date(a.start_time)),
        a.title,
        theme.calendar,
        "calendar-outline",
        "/(tabs)/calendar"
      );
    }

    for (const item of dates ?? []) {
      const [y, m, d] = item.date.split("-").map(Number);
      if (item.recurring ? m === month1to12 : y === year && m === month1to12) {
        add(dateKey(year, m, d), item.title, theme.dates, "gift-outline", "/(tabs)/dates");
      }
    }

    for (const s of subscriptions ?? []) {
      if (!s.renewal_date) continue;
      const [y, m, d] = s.renewal_date.split("-").map(Number);
      add(
        dateKey(y, m, d),
        `${s.name} · renouvellement`,
        theme.subs,
        "card-outline",
        "/(tabs)/subs"
      );
    }

    for (const item of foodItems ?? []) {
      if (!item.expiry_date) continue;
      const [y, m, d] = item.expiry_date.split("-").map(Number);
      add(
        dateKey(y, m, d),
        `${item.name} · expire`,
        theme.antiwaste,
        "leaf-outline",
        "/(tabs)/anti-waste"
      );
    }

    const activePeriod = periods?.find((p) => !p.end_date);
    const prediction = !activePeriod ? predictNextCycle(periods ?? []) : null;
    if (prediction) {
      add(
        prediction.nextPeriodStart,
        "Règles estimées",
        theme.menstruation,
        "heart-outline",
        "/(tabs)/menstruation"
      );
      for (const day of eachDayKey(prediction.fertileWindowStart, prediction.fertileWindowEnd)) {
        add(day, "Fenêtre fertile", "#A78BFA", "heart-outline", "/(tabs)/menstruation");
      }
    }
    for (const p of periods ?? []) {
      const end = p.end_date ?? localDateKey(new Date());
      for (const day of eachDayKey(p.start_date, end)) {
        add(day, "Règles", theme.menstruation, "heart-outline", "/(tabs)/menstruation");
      }
    }

    return { markersByDate: markers, eventsByDate: events };
  }, [appointments, dates, subscriptions, foodItems, periods, calendarMonth, theme]);

  const todayKeyForAgenda = localDateKey(new Date());
  const agendaDate = calendarSelectedDate ?? todayKeyForAgenda;
  const agendaEvents = eventsByDate[agendaDate] ?? [];

  const currentLevel = COUPLE_LEVELS.find((l) => l.level === coupleXP?.level) ?? COUPLE_LEVELS[0];
  const totalXP = coupleXP?.total_xp ?? 0;
  const xpInLevel = totalXP - currentLevel.min;
  const levelSpan =
    currentLevel.max === Infinity
      ? xpInLevel + (coupleXP?.xp_to_next ?? 500)
      : currentLevel.max - currentLevel.min;
  const progress = levelSpan > 0 ? Math.min(xpInLevel / levelSpan, 1) : 0;

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  // Narration
  const parts: string[] = [];
  if (done > 0) parts.push(`complété ${done} tâche${done > 1 ? "s" : ""}`);
  if (treatmentsDone > 0)
    parts.push(`${partner?.full_name?.split(" ")[0] ?? "votre partenaire"} a pris son traitement`);
  const narration =
    parts.length > 0
      ? `Vous avez ${parts.join(" et ")} aujourd'hui.${pending > 0 ? ` Il reste ${pending} tâche${pending > 1 ? "s" : ""} en attente.` : " Tout est à jour !"}`
      : "Commencez votre journée — utilisez les accès rapides ci-dessous.";

  const todayCards = [
    {
      icon: "checkmark-circle-outline",
      label: "Tâches",
      value: String(pending),
      sub: `${done} complétées`,
      color: theme.tasks,
      bg: "#FFF5F8",
      route: "/(tabs)/tasks",
      alert: pending > 0,
    },
    {
      icon: "cart-outline",
      label: "Courses",
      value: String(shopping),
      sub: "à acheter",
      color: theme.shopping,
      bg: "#ECFDF5",
      route: "/(tabs)/shopping",
      alert: shopping > 0,
    },
    {
      icon: "medical-outline",
      label: "Soins",
      value: `${treatmentsDone}/${treatmentsTotal}`,
      sub: "pris aujourd'hui",
      color: theme.treatments,
      bg: "#ECFEFF",
      route: "/(tabs)/treatments",
      alert: treatmentsDone < treatmentsTotal && treatmentsTotal > 0,
    },
    {
      icon: "calendar-outline",
      label: "RDV",
      value: nextAppt ? nextAppt.title.slice(0, 8) : "—",
      sub: nextAppt
        ? new Date(nextAppt.start_time).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })
        : "Aucun",
      color: theme.calendar,
      bg: "#EFF6FF",
      route: "/(tabs)/calendar",
      alert: false,
    },
  ];

  const quickActions = [
    { icon: "checkmark-outline", label: "Tâche", color: theme.tasks, route: "/(tabs)/tasks" },
    { icon: "cart-outline", label: "Courses", color: theme.shopping, route: "/(tabs)/shopping" },
    { icon: "heart-outline", label: "Émotion", color: theme.emotions, route: "/(tabs)/emotions" },
    { icon: "barbell-outline", label: "Sport", color: theme.fitness, route: "/(tabs)/fitness" },
    {
      icon: "restaurant-outline",
      label: "Repas",
      color: theme.nutrition,
      route: "/(tabs)/nutrition",
    },
    { icon: "calendar-outline", label: "RDV", color: theme.calendar, route: "/(tabs)/calendar" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientMiddle, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 32,
            overflow: "hidden",
          }}
        >
          {/* Blobs décoratifs */}
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: "rgba(255,142,83,0.35)",
              top: -80,
              right: -60,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "rgba(255,255,255,0.08)",
              bottom: -30,
              left: -20,
            }}
          />

          {/* Top row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 18,
              zIndex: 1,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 10,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                {new Date().toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
              <Text style={{ color: "white", fontSize: 26, fontWeight: "500", lineHeight: 30 }}>
                {getGreeting(profile?.full_name?.split(" ")[0] ?? "")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Ionicons name="person-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Score */}
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" }}>
                {profile?.full_name ?? "..."} & {partner?.full_name ?? "..."}
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>
                  ✦ Niv.{coupleXP?.level ?? 1} — {coupleXP?.level_name ?? "Novices"}
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 6,
                height: 5,
                overflow: "hidden",
                marginBottom: 5,
              }}
            >
              <View
                style={{
                  height: "100%",
                  backgroundColor: "white",
                  borderRadius: 6,
                  width: `${progress * 100}%`,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{totalXP} XP</Text>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>
                +{coupleXP?.xp_to_next ?? 500} → prochain niveau
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
              {(coupleXP?.streak_days ?? 0) > 0 && (
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons name="flame-outline" size={11} color="white" />
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "500" }}>
                    {coupleXP?.streak_days}j
                  </Text>
                </View>
              )}
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="flash-outline" size={11} color="white" />
                <Text style={{ color: "white", fontSize: 10, fontWeight: "500" }}>
                  {coupleXP?.weekly_xp ?? 0} XP cette semaine
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 14 }}>
          {/* ── Story card ── */}
          <View
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 20,
              padding: 16,
              marginTop: -14,
              marginBottom: 18,
              shadowColor: "#FF6B9D",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 4,
              borderWidth: 0.5,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: theme.textMuted,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              Votre journée
            </Text>
            <Text style={{ fontSize: 14, color: theme.text, lineHeight: 22, marginBottom: 12 }}>
              {narration}
            </Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {[
                { icon: "checkmark-outline", label: `${pending} tâches`, color: theme.tasks },
                { icon: "cart-outline", label: `${shopping} articles`, color: theme.shopping },
                {
                  icon: "medical-outline",
                  label: `${treatmentsDone}/${treatmentsTotal} soins`,
                  color: theme.treatments,
                },
              ].map((p) => (
                <View
                  key={p.label}
                  style={{
                    backgroundColor: theme.brandLight,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    borderWidth: 0.5,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <Ionicons name={p.icon as any} size={12} color={p.color} />
                  <Text style={{ fontSize: 11, color: theme.brand, fontWeight: "500" }}>
                    {p.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Today cards ── */}
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
            Aujourd&apos;hui
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            {todayCards.map((c) => (
              <TouchableOpacity
                key={c.label}
                onPress={() => router.push(c.route as any)}
                activeOpacity={0.7}
                style={{
                  width: "47%",
                  backgroundColor: theme.bgCard,
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 0.5,
                  borderColor: c.alert ? `${c.color}30` : theme.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      backgroundColor: c.bg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={c.icon as any} size={18} color={c.color} />
                  </View>
                  {c.alert && (
                    <View
                      style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.color }}
                    />
                  )}
                </View>
                <Text
                  style={{ fontSize: 26, fontWeight: "700", color: theme.text, lineHeight: 28 }}
                  numberOfLines={1}
                >
                  {c.value}
                </Text>
                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 3 }}>
                  {c.sub}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: c.color, marginTop: 10 }}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Calendrier ── */}
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
            Calendrier
          </Text>
          <View style={{ marginBottom: 12 }}>
            <MonthCalendar
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              markersByDate={markersByDate}
              selectedDate={calendarSelectedDate}
              onSelectDate={(d) => setCalendarSelectedDate(d === calendarSelectedDate ? null : d)}
            />
          </View>
          <View
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 16,
              padding: 14,
              marginBottom: 18,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: theme.text, marginBottom: 8 }}>
              {calendarSelectedDate
                ? new Date(agendaDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "Aujourd'hui"}
            </Text>
            {agendaEvents.length === 0 ? (
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>Rien de prévu</Text>
            ) : (
              agendaEvents.map((e, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => router.push(e.route as any)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 6,
                  }}
                >
                  <Ionicons name={e.icon as any} size={14} color={e.color} />
                  <Text style={{ fontSize: 13, color: theme.text, flex: 1 }} numberOfLines={1}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── Semaine ── */}
          <View
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                Activité cette semaine
              </Text>
              <View
                style={{
                  backgroundColor: theme.brandLight,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.brand }}>
                  +{coupleXP?.weekly_xp ?? 0} XP
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {days.map((day, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 9, color: theme.textMuted, fontWeight: "500" }}>
                    {day}
                  </Text>
                  <View
                    style={{
                      width: "100%",
                      height: 34,
                      borderRadius: 9,
                      backgroundColor:
                        i === todayIndex
                          ? theme.brand
                          : i < todayIndex
                            ? theme.brandLight
                            : theme.bgSecondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i <= todayIndex && (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: i === todayIndex ? "white" : theme.brand,
                        }}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Objectif hebdo ── */}
          <View
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                Objectif de la semaine
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <TouchableOpacity
                  onPress={() => couple?.id && adjustWeeklyGoal(couple.id, -WEEKLY_GOAL_STEP)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove-circle-outline" size={20} color={theme.textMuted} />
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: "500" }}>
                  {weeklyGoal} XP
                </Text>
                <TouchableOpacity
                  onPress={() => couple?.id && adjustWeeklyGoal(couple.id, WEEKLY_GOAL_STEP)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.bgSecondary,
                overflow: "hidden",
                marginBottom: 6,
              }}
            >
              <View
                style={{
                  height: "100%",
                  borderRadius: 4,
                  backgroundColor:
                    (coupleXP?.weekly_xp ?? 0) >= weeklyGoal ? "#22C55E" : theme.brand,
                  width: `${Math.min(((coupleXP?.weekly_xp ?? 0) / weeklyGoal) * 100, 100)}%`,
                }}
              />
            </View>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {(coupleXP?.weekly_xp ?? 0) >= weeklyGoal
                ? "Objectif atteint cette semaine 🎉"
                : `${coupleXP?.weekly_xp ?? 0} / ${weeklyGoal} XP à deux`}
            </Text>
          </View>

          {/* ── Partenaire ── */}
          {partnerActivity.length > 0 && (
            <View
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: theme.brand,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>
                    {partner?.full_name?.[0] ?? "?"}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, flex: 1 }}>
                  {partner?.full_name ?? "Votre partenaire"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34C759" }}
                  />
                  <Text style={{ fontSize: 10, color: "#34C759", fontWeight: "500" }}>Active</Text>
                </View>
              </View>
              {partnerActivity.slice(0, 4).map((a: any) => {
                const mod = getModuleEmoji(a.module);
                return (
                  <View
                    key={a.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 9,
                      paddingVertical: 8,
                      borderBottomWidth: 0.5,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        backgroundColor: mod.bg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={`${mod.icon}-outline` as any} size={16} color={mod.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "500", color: theme.text }}>
                        {getModuleLabel(a.module)}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>
                        {timeAgo(a.created_at)}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: theme.brandLight,
                        borderRadius: 6,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "600", color: theme.brand }}>
                        +{a.xp_earned} XP
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Dates ── */}
          {upcomingDates.length > 0 && (
            <View
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 12 }}
              >
                Dates à venir
              </Text>
              {upcomingDates.map((d) => {
                const day = daysUntil(d.date, d.recurring);
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => router.push("/(tabs)/dates" as any)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingVertical: 8,
                      borderBottomWidth: 0.5,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        backgroundColor: "#FFF7ED",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={day === 0 ? "gift-outline" : "calendar-outline"}
                        size={18}
                        color="#F97316"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "500", color: theme.text }}>
                        {d.title}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                        {new Date(d.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: day <= 3 ? "#FEF2F2" : "#FFF7ED",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: day <= 3 ? "#EF4444" : "#F97316",
                        }}
                      >
                        {day === 0 ? "Auj. !" : `${day}j`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Accès rapide ── */}
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
            Accès rapide
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
            {quickActions.map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: 13,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  borderWidth: 0.5,
                  borderColor: theme.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <Ionicons name={a.icon as any} size={16} color={a.color} />
                <Text style={{ fontSize: 12, fontWeight: "500", color: theme.text }}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
