import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import * as NotificationService from '@/services/notificationService';

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
      
      if (token) {
        set((state) => ({
          settings: { ...state.settings, pushToken: token },
          isInitialized: true,
        }));
        
        await storage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
          ...get().settings,
          pushToken: token,
        });
        
        // Schedule initial notifications
        await get().rescheduleAll();
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
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
    
    if (settings.criticalHours && settings.criticalHoursList.length > 0) {
      await NotificationService.scheduleCriticalHourSupport(settings.criticalHoursList);
    }
    
    if (settings.waterReminders) {
      await NotificationService.scheduleWaterReminders();
    }
    
    if (settings.eveningReflection) {
      await NotificationService.scheduleEveningReflection(
        settings.eveningReflectionTime.hour
      );
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
