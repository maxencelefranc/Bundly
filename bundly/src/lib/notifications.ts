import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Rappels",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  if (permissionRequested) return false;
  permissionRequested = true;

  const { status: newStatus } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return newStatus === "granted";
}

async function schedule(
  identifier: string,
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await cancel(identifier);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: Platform.OS === "android" ? { ...trigger, channelId: "reminders" } : trigger,
  });
}

export async function cancel(identifier: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

// ─── Dates importantes ──────────────────────────────────────────────────────

export async function scheduleDateReminder(
  id: string,
  title: string,
  dateStr: string,
  reminderDays: number
): Promise<void> {
  const target = new Date(dateStr);
  target.setHours(9, 0, 0, 0);
  const reminderDate = new Date(target.getTime() - reminderDays * 24 * 60 * 60 * 1000);
  if (reminderDate.getTime() <= Date.now()) return;

  await schedule(`date-${id}`, "💝 Date qui approche", `${title} — dans ${reminderDays} jours`, {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: reminderDate,
  });
}

export async function cancelDateReminder(id: string): Promise<void> {
  await cancel(`date-${id}`);
}

// ─── Abonnements ────────────────────────────────────────────────────────────

const SUBSCRIPTION_REMINDER_DAYS = 3;

export async function scheduleSubscriptionReminder(
  id: string,
  name: string,
  renewalDate: string
): Promise<void> {
  const target = new Date(renewalDate);
  target.setHours(9, 0, 0, 0);
  const reminderDate = new Date(
    target.getTime() - SUBSCRIPTION_REMINDER_DAYS * 24 * 60 * 60 * 1000
  );
  if (reminderDate.getTime() <= Date.now()) return;

  await schedule(
    `sub-${id}`,
    "💳 Renouvellement à venir",
    `${name} se renouvelle dans ${SUBSCRIPTION_REMINDER_DAYS} jours`,
    { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate }
  );
}

export async function cancelSubscriptionReminder(id: string): Promise<void> {
  await cancel(`sub-${id}`);
}

// ─── Traitements ────────────────────────────────────────────────────────────

export async function scheduleTreatmentReminder(
  id: string,
  name: string,
  reminderTime: string | null
): Promise<void> {
  const [hourStr, minuteStr] = (reminderTime ?? "09:00").split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  await schedule(`treatment-${id}`, "💊 Rappel traitement", `C'est l'heure de prendre : ${name}`, {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  });
}

export async function cancelTreatmentReminder(id: string): Promise<void> {
  await cancel(`treatment-${id}`);
}

export const notificationsSupported = Platform.OS !== "web";
