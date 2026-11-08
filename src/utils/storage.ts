import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility for persisting data
 * Wraps AsyncStorage with type safety
 */

export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} to storage:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: '@smoof:user_profile',
  DAILY_STATS: '@smoof:daily_stats',
  CRISIS_LOGS: '@smoof:crisis_logs',
  ONBOARDING_COMPLETED: '@smoof:onboarding_completed',
  NOTIFICATION_SETTINGS: '@smoof:notification_settings',
  ACHIEVEMENTS: '@smoof:achievements',
  DEBUG_DAY_OFFSET: '@smoof:debug_day_offset',
} as const;
