import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import * as Notifications from 'expo-notifications';
import * as NotificationService from '@/services/notificationService';
import { useCheckInStore } from '@/store/checkInStore';
import { getTodayString } from '@/utils/dateHelpers';
import { useStatsStore } from '@/store/statsStore';
import { getRiskWindows } from '@/utils/insights';

/**
 * Notification settings and preferences
 */
interface NotificationSettings {
  enabled: boolean;
  dailyMotivation: boolean;
  milestones: boolean;
  criticalHours: boolean;
  waterReminders: boolean;
  eveningReflection: boolean;
  
  // Times
  dailyMotivationTime: { hour: number; minute: number };
  criticalHoursList: number[]; // Array of hours (0-23)
  eveningReflectionTime: { hour: number; minute: number };
  
  // Push token
  pushToken?: string;
}

interface NotificationState {
  settings: NotificationSettings;
  isInitialized: boolean;
  
  // Actions
  initializeNotifications: () => Promise<void>;
  updateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  rescheduleAll: () => Promise<void>;
  loadSettings: () => Promise<void>;
  /** (Re)schedule the evening check-in reminder and the weekly summary; never asks for permission */
  syncCheckInReminders: () => Promise<void>;
  /** (Re)schedule support before risky times, learned from the user's data */
  syncRiskReminders: () => Promise<void>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyMotivation: true,
  milestones: true,
  criticalHours: true,
  waterReminders: true,
  eveningReflection: true,
  
  dailyMotivationTime: { hour: 9, minute: 0 },
  criticalHoursList: [10, 13, 15, 17, 20], // Common smoking times
  eveningReflectionTime: { hour: 21, minute: 0 },
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isInitialized: false,
  
  initializeNotifications: async () => {
    try {
      // Request permissions and get token
      const token = await NotificationService.registerForPushNotificationsAsync();
      
      // Token olsa da olmasa da devam et
      set((state) => ({
        settings: token ? { ...state.settings, pushToken: token } : state.settings,
        isInitialized: true,
      }));
      
      const currentSettings = get().settings;
      await storage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, currentSettings);
      
      // Schedule initial notifications
      await get().rescheduleAll();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      // Yine de initialized olarak işaretle ki kullanıcı ayarlara girebilsin
      set({ isInitialized: true });
    }
  },
  
  updateSettings: async (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    await storage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, newSettings);
    
    // Reschedule if any scheduling-related setting changed
    if (
      updates.dailyMotivationTime ||
      updates.criticalHoursList ||
      updates.eveningReflectionTime ||
      updates.dailyMotivation !== undefined ||
      updates.criticalHours !== undefined ||
      updates.waterReminders !== undefined ||
      updates.eveningReflection !== undefined
    ) {
      await get().rescheduleAll();
    }
  },
  
  toggleNotifications: async (enabled) => {
    await get().updateSettings({ enabled });
    
    if (!enabled) {
      await NotificationService.cancelAllNotifications();
    } else {
      await get().rescheduleAll();
    }
  },
  
  rescheduleAll: async () => {
    const { settings } = get();
    
    if (!settings.enabled) return;
    
    // Cancel all existing
    await NotificationService.cancelAllNotifications();
    
    // Schedule based on settings
    if (settings.dailyMotivation) {
      await NotificationService.scheduleDailyMotivation(
        settings.dailyMotivationTime.hour,
        settings.dailyMotivationTime.minute
      );
    }
    
    await get().syncRiskReminders();
    
    if (settings.waterReminders) {
      await NotificationService.scheduleWaterReminders();
    }
    
    await get().syncCheckInReminders();
  },

  syncCheckInReminders: async () => {
    try {
      const { settings } = get();
      const { status } = await Notifications.getPermissionsAsync();
      if (!settings.enabled || !settings.eveningReflection || status !== 'granted') {
        await NotificationService.cancelCheckInReminders();
        await NotificationService.cancelWeeklySummaryReminder();
        return;
      }
      await NotificationService.scheduleWeeklySummaryReminder();
      const today = getTodayString();
      const doneToday = useCheckInStore.getState().checkIns.some((c) => c.date === today);
      await NotificationService.scheduleCheckInReminders(
        settings.eveningReflectionTime.hour,
        settings.eveningReflectionTime.minute,
        doneToday,
      );
    } catch (error) {
      console.error('Failed to schedule check-in reminders:', error);
    }
  },

  syncRiskReminders: async () => {
    try {
      const { settings } = get();
      const { status } = await Notifications.getPermissionsAsync();
      if (!settings.enabled || !settings.criticalHours || status !== 'granted') {
        await NotificationService.cancelRiskReminders();
        return;
      }
      const { hours, hardWeekday } = getRiskWindows(
        useStatsStore.getState().crisisLogs,
        useCheckInStore.getState().checkIns,
      );
      await NotificationService.scheduleRiskReminders(hours, settings.criticalHoursList, hardWeekday);
    } catch (error) {
      console.error('Failed to schedule risk reminders:', error);
    }
  },
  
  loadSettings: async () => {
    try {
      const saved = await storage.getItem<NotificationSettings>(
        STORAGE_KEYS.NOTIFICATION_SETTINGS
      );
      
      if (saved) {
        set({ settings: { ...DEFAULT_SETTINGS, ...saved } });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  },
}));
