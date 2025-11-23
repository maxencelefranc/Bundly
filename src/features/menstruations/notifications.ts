import * as Notifications from 'expo-notifications';
import { getMenstruationStats } from './api';

export async function setupNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    await Notifications.requestPermissionsAsync();
  }
}

function toMidday(date: Date) { date.setHours(12,0,0,0); return date; }

export async function scheduleMenstruationNotifications() {
  await setupNotificationPermissions();
  const stats = await getMenstruationStats();
  if (!stats.predicted_next_start && !stats.predicted_ovulation_day) return;
  // Cancel existing scheduled notifications of this category (optional improvement)
  // For simplicity we just schedule new ones.
  if (stats.predicted_next_start) {
    const nextPeriod = new Date(stats.predicted_next_start + 'T00:00:00');
    const warnPeriod = new Date(nextPeriod); warnPeriod.setDate(warnPeriod.getDate()-2);
    if (warnPeriod > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Règles bientôt', body: 'Vos prochaines règles devraient commencer dans ~2 jours.' },
        trigger: toMidday(warnPeriod)
      });
    }
  }
  if (stats.predicted_ovulation_day) {
    const ovu = new Date(stats.predicted_ovulation_day + 'T00:00:00');
    const fertileStart = new Date(ovu); fertileStart.setDate(fertileStart.getDate()-5);
    if (fertileStart > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Fenêtre fertile', body: 'La fenêtre fertile commence bientôt.' },
        trigger: toMidday(fertileStart)
      });
    }
    if (ovu > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Ovulation estimée', body: 'Jour probable d’ovulation aujourd’hui.' },
        trigger: toMidday(ovu)
      });
    }
  }
}
