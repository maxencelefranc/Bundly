import { Platform } from "react-native";
import type * as NotificationsModule from "expo-notifications";

type NotificationsApi = typeof NotificationsModule;

// `expo-notifications` throws at import time on Android in Expo Go (removed
// from Expo Go since SDK 53 — a development build is required there). A
// static top-level `import` can't be caught by a try/catch in this file,
// since Metro/Babel hoists it above everything else. Loading it lazily via
// `require`, wrapped in try/catch, lets every reminder call degrade to a
// silent no-op instead of crashing every screen that touches dates,
// treatments, or subscriptions.
let cachedModule: NotificationsApi | null | undefined;

function getNotifications(): NotificationsApi | null {
  if (cachedModule !== undefined) return cachedModule;

  if (Platform.OS === "web") {
    cachedModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-notifications") as NotificationsApi;
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    cachedModule = mod;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
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
  } catch {
    return false;
  }
}

async function schedule(
  identifier: string,
  title: string,
  body: string,
  trigger: NotificationsModule.NotificationTriggerInput
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  try {
    await cancel(identifier);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body },
      trigger: Platform.OS === "android" ? { ...trigger, channelId: "reminders" } : trigger,
    });
  } catch {
    // Best-effort: a reminder that fails to schedule shouldn't block the
    // action (adding a date/treatment/subscription) that triggered it.
  }
}

export async function cancel(identifier: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
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
    type: "date",
    date: reminderDate,
  } as NotificationsModule.NotificationTriggerInput);
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
    { type: "date", date: reminderDate } as NotificationsModule.NotificationTriggerInput
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
    type: "daily",
    hour,
    minute,
  } as NotificationsModule.NotificationTriggerInput);
}

export async function cancelTreatmentReminder(id: string): Promise<void> {
  await cancel(`treatment-${id}`);
}

export const notificationsSupported = Platform.OS !== "web";
