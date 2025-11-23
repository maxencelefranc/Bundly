import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Retourne un objet simple pour savoir si les push distantes sont possibles
export async function getPushToken() {
  // Dans Expo Go => pas de push distantes
  if (Constants.appOwnership === 'expo') {
    return { supported: false, token: null, reason: 'Expo Go ne gère pas les push distantes. Crée une build dev.' };
  }
  const perms = await Notifications.getPermissionsAsync();
  let final = perms;
  if (!perms.granted) {
    final = await Notifications.requestPermissionsAsync();
  }
  if (!final.granted) {
    return { supported: true, token: null, reason: 'Permissions refusées' };
  }
  // Expo push token (pour utiliser le service Expo) :
  const expoToken = await Notifications.getExpoPushTokenAsync();
  return { supported: true, token: expoToken.data, reason: null };
}

// Notification locale (toujours possible en Expo Go)
export async function scheduleLocal(title: string, body: string, seconds: number) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false }
  });
}

// Exemple d'initialisation à appeler au démarrage
// Handler pour afficher l'alerte en foreground (sinon parfois silencieux)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function initNotifications() {
  const info = await getPushToken();
  if (!info.supported) {
    console.log('[Notifications] Pas de push distantes:', info.reason);
  } else if (info.token) {
    console.log('[Notifications] Token Expo:', info.token);
    // TODO: envoyer le token à ton backend (Supabase) si besoin
  } else {
    console.log('[Notifications] Permissions non accordées.');
  }
  return info;
}
