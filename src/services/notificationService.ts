import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Notification Service
 * Handles all notification setup, scheduling, and permissions
 */

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ECDC4',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (projectId && projectId !== 'your-project-id') {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
        // For development/Expo Go, get device push token
        token = (await Notifications.getDevicePushTokenAsync()).data;
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for push notifications');
  }

  return token;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule daily motivation notification
 */
export async function scheduleDailyMotivation(hour: number = 9, minute: number = 0) {
  const motivations = [
    '💪 Her gün biraz daha güçleniyorsun!',
    '🌟 Bugün de harika gidiyorsun!',
    '🎯 Hedefine bir gün daha yaklaştın!',
    '❤️ Sağlığın için attığın her adım değerli!',
    '🦋 Özgürlüğüne kavuşuyorsun!',
    '💎 Sen bir elmasın, parıldıyorsun!',
    '🔥 Streak\'in büyüyor, gurur duy!',
    '🌈 Hayatın daha renkli olacak!',
  ];

  const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Günaydın Savaşçı!',
      body: randomMotivation,
      data: { type: 'daily_motivation' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

/**
 * Schedule milestone celebration notification
 */
export async function scheduleMilestoneCelebration(days: number, delaySeconds: number = 5) {
  const milestones: { [key: number]: { title: string; body: string; emoji: string } } = {
    1: {
      title: '🎉 İlk Gün Tamamlandı!',
      body: 'Harika bir başlangıç yaptın! Devam et!',
      emoji: '🎉',
    },
    3: {
      title: '🌟 3 Gün Sigarasız!',
      body: 'Muhteşemsin! Nikotin bağımlılığı azalıyor.',
      emoji: '🌟',
    },
    7: {
      title: '🔥 1 Hafta Tamamlandı!',
      body: 'İnanılmaz! Kalp atış hızın normale döndü.',
      emoji: '🔥',
    },
    14: {
      title: '💪 2 Hafta Sigarasız!',
      body: 'Süpersin! Kan dolaşımın iyileşti.',
      emoji: '💪',
    },
    30: {
      title: '🏆 1 Ay Tamamlandı!',
      body: 'Efsanesin! Akciğerlerin iyileşmeye başladı.',
      emoji: '🏆',
    },
    90: {
      title: '👑 3 Ay Sigarasız!',
      body: 'İnanılmaz bir başarı! Akciğer fonksiyonun arttı.',
      emoji: '👑',
    },
    180: {
      title: '💎 6 Ay Tamamlandı!',
      body: 'Harika! Kalp krizi riskin yarıya indi.',
      emoji: '💎',
    },
    365: {
      title: '🎊 1 YIL SİGARASIZ!',
      body: 'Sen bir kahramansın! İnanılmaz bir başarı!',
      emoji: '🎊',
    },
  };

  const milestone = milestones[days];
  if (!milestone) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: milestone.title,
      body: milestone.body,
      data: { type: 'milestone', days },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    } as Notifications.TimeIntervalTriggerInput,
  });
}

/**
 * Schedule support notification for critical hours
 */
export async function scheduleCriticalHourSupport(hours: number[]) {
  const supportMessages = [
    '🌊 Derin bir nefes al. Bu geçecek!',
    '💧 Bir bardak su iç, kafanı dağıt.',
    '🚶‍♂️ Kısa bir yürüyüş yap, hareket et.',
    '🎯 Hedefini hatırla, neden bıraktığını düşün.',
    '📱 Birini ara, sohbet et.',
    '🎮 Kriz moduna gir, oyun oyna!',
  ];

  for (const hour of hours) {
    const message = supportMessages[Math.floor(Math.random() * supportMessages.length)];
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Güçlü Kal! 💪',
        body: message,
        data: { type: 'critical_hour' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute: 0,
        repeats: true,
      },
    });
  }
}

/**
 * Schedule water reminder
 */
export async function scheduleWaterReminders() {
  const hours = [10, 14, 16, 18]; // 10am, 2pm, 4pm, 6pm

  for (const hour of hours) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Su İçmeyi Unutma!',
        body: 'Vücudun detoks oluyor, bol su iç.',
        data: { type: 'water_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute: 0,
        repeats: true,
      },
    });
  }
}

/**
 * Schedule start day reminder (for preparation mode)
 */
export async function scheduleStartDayReminder(startDate: Date) {
  const now = new Date();
  const timeUntilStart = startDate.getTime() - now.getTime();

  if (timeUntilStart <= 0) return; // Already started

  // Notification on start day at 8am
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚀 Bugün Büyük Gün!',
      body: 'Sigarayı bırakma yolculuğun bugün başlıyor! Hazır mısın?',
      data: { type: 'start_day' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: startDate,
    },
  });

  // Day before reminder
  if (timeUntilStart > 24 * 60 * 60 * 1000) {
    const dayBefore = new Date(startDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(20, 0, 0, 0); // 8pm day before

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Yarın Başlıyorsun!',
        body: 'Hazırlıklarını tamamla. Son sigaralarını at!',
        data: { type: 'start_tomorrow' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dayBefore,
      },
    });
  }
}

/**
 * Schedule evening reflection
 */
export async function scheduleEveningReflection(hour: number = 21) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Gün Nasıl Geçti?',
      body: 'Bugünkü başarını kutla! Yarın daha güçlü olacaksın.',
      data: { type: 'evening_reflection' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute: 0,
      repeats: true,
    },
  });
}

const CHECK_IN_PREFIX = 'check-in-';
const CHECK_IN_MESSAGES = [
  { title: 'Bugün nasıl geçti? 🦎', body: 'Smoof merak ediyor. 30 saniyelik check-in, sana özel öneriler.' },
  { title: 'Bir dakikan var mı? 💚', body: 'Bugün nasıl hissettiğini anlat, yarın için birlikte plan yapalım.' },
  { title: 'Günün nasıldı? 🌙', body: 'Seni neyin zorladığını bilirsem daha iyi yardım edebilirim.' },
];

/**
 * Daily check-in reminders: one-off notifications for the next 3 evenings,
 * skipping today when the check-in is already done. Called again on every app
 * start and after each check-in, so it never asks twice the same day.
 */
export async function scheduleCheckInReminders(hour: number, minute: number, doneToday: boolean) {
  await cancelCheckInReminders();
  // Real time on purpose: notifications fire on the device clock
  const now = new Date();
  for (let day = 0; day < 3; day++) {
    if (day === 0 && doneToday) continue;
    const date = new Date(now);
    date.setDate(now.getDate() + day);
    date.setHours(hour, minute, 0, 0);
    if (date <= now) continue;
    const message = CHECK_IN_MESSAGES[date.getDate() % CHECK_IN_MESSAGES.length];
    await Notifications.scheduleNotificationAsync({
      identifier: `${CHECK_IN_PREFIX}${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      content: { ...message, data: { type: 'check_in', url: '/check-in' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}

export async function cancelCheckInReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      // Also the old repeating "evening reflection", replaced by the check-in reminder
      .filter((n) => n.identifier.startsWith(CHECK_IN_PREFIX) || n.content.data?.type === 'evening_reflection')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

const RISK_PREFIX = 'risk-';
const WEEKLY_SUMMARY_ID = 'weekly-summary';
const WEEKDAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const RISK_TIPS = [
  'Şimdiden bir bardak su al ya da kısa bir yürüyüş planla 💪',
  'Gelirse 3 uzun nefes, sonra karar ver. Geçecek 🌊',
  'Elini meşgul edecek bir şey hazırla, istek dalgası kısa sürer ✋',
];

async function cancelByFilter(match: (n: Notifications.NotificationRequest) => boolean) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter(match).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

/**
 * Support before the user's risky times.
 * - learnedHours: hours the user often had cravings → a personal note 15 min before
 * - otherwise fallbackHours: the generic critical-hour messages
 * - hardWeekday (0 = Sunday): one gentle note at 17:30 on that day each week
 */
export async function scheduleRiskReminders(learnedHours: number[], fallbackHours: number[], hardWeekday: number | null) {
  await cancelRiskReminders();

  if (learnedHours.length > 0) {
    for (const [i, hour] of learnedHours.entries()) {
      const at = hour === 0 ? { hour: 23, minute: 45 } : { hour: hour - 1, minute: 45 };
      await Notifications.scheduleNotificationAsync({
        identifier: `${RISK_PREFIX}hour-${hour}`,
        content: {
          title: `Saat ${String(hour).padStart(2, '0')}:00 yaklaşıyor 🦎`,
          body: `Genelde bu saatlerde zorlanıyorsun. ${RISK_TIPS[i % RISK_TIPS.length]}`,
          data: { type: 'risk_hour', url: '/crisis' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...at },
      });
    }
  } else if (fallbackHours.length > 0) {
    await scheduleCriticalHourSupport(fallbackHours);
  }

  if (hardWeekday !== null) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${RISK_PREFIX}weekday`,
      content: {
        title: `${WEEKDAY_NAMES[hardWeekday]} akşamı 💚`,
        body: `${WEEKDAY_NAMES[hardWeekday]} günleri senin için daha zor geçebiliyor. Bu akşam için küçük bir planın var mı?`,
        data: { type: 'risk_weekday', url: '/crisis' },
      },
      // Expo weekdays start at 1 = Sunday
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: hardWeekday + 1, hour: 17, minute: 30 },
    });
  }
}

export async function cancelRiskReminders() {
  await cancelByFilter(
    (n) => n.identifier.startsWith(RISK_PREFIX) || n.content.data?.type === 'critical_hour',
  );
}

/** Sunday 19:00: "your weekly summary is ready" */
export async function scheduleWeeklySummaryReminder() {
  await cancelWeeklySummaryReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_SUMMARY_ID,
    content: {
      title: 'Haftalık özetin hazır 📊',
      body: 'Haftan nasıl geçti, neler öğrendim ve gelecek haftanın küçük hedefi seni bekliyor.',
      data: { type: 'weekly_summary', url: '/weekly' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 19, minute: 0 },
  });
}

export async function cancelWeeklySummaryReminder() {
  await cancelByFilter((n) => n.identifier === WEEKLY_SUMMARY_ID);
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
