import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import i18n from '../i18n';

const storage = createMMKV({ id: 'kaly-settings' });

const REMINDER_CHANNEL = 'water-reminders';
const DEFAULT_INTERVAL_HOURS = 2;
const QUIET_START = 22; // 10 PM
const QUIET_END = 8;    // 8 AM

/**
 * Schedule water reminders. Only call AFTER user grants notification consent.
 * Schedules repeating notifications every N hours during waking hours.
 */
export async function scheduleWaterReminders(intervalHours: number = DEFAULT_INTERVAL_HOURS): Promise<void> {
  // Cancel existing water reminders
  await cancelWaterReminders();

  // Set up Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Water Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  // Schedule for each waking hour slot
  const now = new Date();
  for (let hour = QUIET_END; hour < QUIET_START; hour += intervalHours) {
    const trigger = new Date();
    trigger.setHours(hour, 0, 0, 0);

    // If this time already passed today, schedule for tomorrow
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧',
        body: i18n.t('notifications.water_body'),
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  }

  storage.set('waterRemindersEnabled', true);
}

export async function cancelWaterReminders(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    // Cancel only water-related notifications
    if (n.content.body === i18n.t('notifications.water_body')) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
  storage.set('waterRemindersEnabled', false);
}

export function areWaterRemindersEnabled(): boolean {
  return storage.getBoolean('waterRemindersEnabled') ?? false;
}

/**
 * Request notification permissions. Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
