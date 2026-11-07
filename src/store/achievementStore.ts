import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { Achievement } from '@/types';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { AchievementContext, isAchievementEarned } from '@/utils/progressMetrics';
import * as NotificationService from '@/services/notificationService';

/**
 * Achievement Store
 * Tracks unlocked achievements and progress
 */
interface AchievementState {
  unlockedAchievements: string[]; // Array of achievement IDs
  
  // Actions
  checkAndUnlockAchievements: (ctx: AchievementContext) => Promise<Achievement[]>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  isUnlocked: (achievementId: string) => boolean;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  loadAchievements: () => Promise<void>;
  resetAchievements: () => Promise<void>;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedAchievements: [],
  
  checkAndUnlockAchievements: async (ctx: AchievementContext) => {
    const { unlockedAchievements } = get();
    const newlyUnlocked = ACHIEVEMENTS.filter(
      (a) => !unlockedAchievements.includes(a.id) && isAchievementEarned(a, ctx),
    );

    for (const achievement of newlyUnlocked) {
      await get().unlockAchievement(achievement.id);

      // Celebrate smoke-free day milestones only. Other categories (health shares
      // the same day counts, savings, cravings, gradual %) would double-notify or
      // send a "days" message for a non-day value.
      if (achievement.category === 'streak') {
        await NotificationService.scheduleMilestoneCelebration(achievement.requirement, 2);
      }
    }

    return newlyUnlocked;
  },

  unlockAchievement: async (achievementId: string) => {
    const { unlockedAchievements } = get();
    if (unlockedAchievements.includes(achievementId)) return;
    
    const newUnlocked = [...unlockedAchievements, achievementId];
    set({ unlockedAchievements: newUnlocked });
    await storage.setItem(STORAGE_KEYS.ACHIEVEMENTS, newUnlocked);
  },
  
  isUnlocked: (achievementId: string) => {
    return get().unlockedAchievements.includes(achievementId);
  },
  
  getUnlockedAchievements: () => {
    const { unlockedAchievements } = get();
    // Stored in unlock order
    return unlockedAchievements
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
      .filter((a): a is Achievement => a !== undefined);
  },
  
  getLockedAchievements: () => {
    const { unlockedAchievements } = get();
    return ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a.id));
  },
  
  loadAchievements: async () => {
    try {
      const saved = await storage.getItem<string[]>(STORAGE_KEYS.ACHIEVEMENTS);
      if (saved) {
        set({ unlockedAchievements: saved });
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  },
  
  resetAchievements: async () => {
    set({ unlockedAchievements: [] });
    await storage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
  },
}));
