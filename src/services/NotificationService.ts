import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getExpiringItems } from './InventoryService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule expiry notifications for items expiring within 48h.
 * Called on every app open — cancels previous notifications and re-schedules.
 * This approach handles OEM background-kill issues (Xiaomi, Huawei).
 */
export async function scheduleExpiryNotifications(withinDays = 2): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  // Cancel all previously scheduled expiry notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const expiryIds = scheduled
    .filter((n) => n.content.data?.type === 'expiry')
    .map((n) => n.identifier);
  await Promise.all(expiryIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  // Fetch items expiring within the window
  const items = await getExpiringItems(withinDays);

  for (const item of items) {
    if (!item.expiry_date) continue;

    const expiryMs = new Date(item.expiry_date).getTime();
    const notifyMs = expiryMs - 48 * 60 * 60 * 1000; // 48h before expiry
    const now = Date.now();

    if (notifyMs <= now) continue; // already past notification time

    const trigger = new Date(notifyMs);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${item.name} expire bientôt`,
        body: `Tu as 2 jours pour l'utiliser. Ouvre l'app pour une suggestion de repas.`,
        data: { type: 'expiry', itemId: item.id },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }
}

/**
 * Set up Android notification channel.
 * Must be called once on app start (before any notifications are shown).
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('expiry-alerts', {
    name: 'Alertes expiration',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4CAF73',
  });
}
