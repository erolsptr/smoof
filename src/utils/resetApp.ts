import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useAchievementStore } from '@/store/achievementStore';
import { useCheckInStore } from '@/store/checkInStore';
import { useInsightStore } from '@/store/insightStore';
import { useThemeStore } from '@/store/themeStore';
import { useClockStore } from '@/utils/clock';
import { storage } from '@/utils/storage';
import { cancelAllNotifications } from '@/services/notificationService';

/**
 * Deletes everything the app stored on this phone and resets the in-memory
 * state, as if it was just installed. Used by "Tüm verilerimi sil" and the
 * test mode reset.
 */
export async function resetAllData() {
  await cancelAllNotifications().catch(() => {});
  await useUserStore.getState().clearUserData();
  await useStatsStore.getState().clearStatsData();
  await useAchievementStore.getState().resetAchievements();
  await useCheckInStore.getState().clearCheckIns();
  await useInsightStore.getState().clearInsights();
  await storage.clear();
  await useClockStore.getState().setOffsetDays(0);
  await useThemeStore.getState().setPreference('system');
}
