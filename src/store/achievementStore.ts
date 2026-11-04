import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { Achievement } from '@/types';
import { ACHIEVEMENTS } from '@/constants/achievements';
import * as NotificationService from '@/services/notificationService';

/**
 * Achievement Store
 * Tracks unlocked achievements and progress
 */
interface AchievementState {
  unlockedAchievements: string[]; // Array of achievement IDs
  lastCheckedStreak: number;
  lastCheckedSavings: number;
  lastCheckedCrises: number;
  
  // Actions
  checkAndUnlockAchievements: (streak: number, savings: number, crises: number, hasSlipped: boolean) => Promise<Achievement[]>;
  checkTimedHealthAchievements: (quitDate: string) => Promise<Achievement[]>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  isUnlocked: (achievementId: string) => boolean;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getProgressForAchievement: (achievement: Achievement, currentValue: number) => number;
  loadAchievements: () => Promise<void>;
  resetAchievements: () => Promise<void>;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedAchievements: [],
  lastCheckedStreak: 0,
  lastCheckedSavings: 0,
  lastCheckedCrises: 0,
  
  checkAndUnlockAchievements: async (streak: number, savings: number, crises: number, hasSlipped: boolean) => {
    const newlyUnlocked: Achievement[] = [];
    const { unlockedAchievements } = get();
    
    // Check streak achievements
    const streakAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'streak' && a.requirement <= streak && !unlockedAchievements.includes(a.id)
    );
    
    // Check savings achievements
    const savingsAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'savings' && a.requirement <= savings && !unlockedAchievements.includes(a.id)
    );
    
    // Check health achievements (streak-based)
    const healthAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'health' && 
      a.requirement > 0 && 
      a.requirement <= streak && 
      !unlockedAchievements.includes(a.id)
    );
    
    // Check resistance achievements (crises)
    const crisisAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'resistance' && 
      a.id.startsWith('crisis_') && 
      a.requirement <= crises && 
      !unlockedAchievements.includes(a.id)
    );
    
    // Check no-slip achievements
    const noSlipAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'resistance' && 
      a.id.startsWith('no_slip_') && 
      a.requirement <= streak && 
      !hasSlipped &&
      !unlockedAchievements.includes(a.id)
    );
    
    const allNewAchievements = [
      ...streakAchievements,
      ...savingsAchievements,
      ...healthAchievements,
      ...crisisAchievements,
      ...noSlipAchievements,
    ];
    
    // Unlock each new achievement
    for (const achievement of allNewAchievements) {
      await get().unlockAchievement(achievement.id);
      newlyUnlocked.push(achievement);
      
      // Send notification for new achievement (only for streak/health achievements)
      // Crisis and savings achievements don't need milestone celebration notifications
      if (achievement.category === 'streak' || (achievement.category === 'health' && achievement.requirement > 0)) {
        await NotificationService.scheduleMilestoneCelebration(achievement.requirement, 2);
      }
    }
    
    // Update last checked values
    set({
      lastCheckedStreak: streak,
      lastCheckedSavings: savings,
      lastCheckedCrises: crises,
    });
    
    return newlyUnlocked;
  },

  checkTimedHealthAchievements: async (quitDate: string) => {
    const newlyUnlocked: Achievement[] = [];
    const { unlockedAchievements } = get();
    
    const quitDateTime = new Date(quitDate).getTime();
    const now = Date.now();
    const minutesPassed = (now - quitDateTime) / (1000 * 60);
    const hoursPassed = minutesPassed / 60;
    
    // 20 minutes achievement
    if (minutesPassed >= 20 && !unlockedAchievements.includes('health_20min')) {
      await get().unlockAchievement('health_20min');
      const achievement = ACHIEVEMENTS.find(a => a.id === 'health_20min');
      if (achievement) {
        newlyUnlocked.push(achievement);
        // No notification for time-based health achievements (silent unlock)
      }
    }
    
    // 12 hours achievement
    if (hoursPassed >= 12 && !unlockedAchievements.includes('health_12hours')) {
      await get().unlockAchievement('health_12hours');
      const achievement = ACHIEVEMENTS.find(a => a.id === 'health_12hours');
      if (achievement) {
        newlyUnlocked.push(achievement);
        // No notification for time-based health achievements (silent unlock)
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
    return ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id))
      .map(a => ({ ...a, unlockedAt: new Date().toISOString() }));
  },
  
  getLockedAchievements: () => {
    const { unlockedAchievements } = get();
    return ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a.id));
  },
  
  getProgressForAchievement: (achievement: Achievement, currentValue: number) => {
    if (get().isUnlocked(achievement.id)) return 100;
    if (achievement.requirement === 0) return 0;
    // Safety check: if currentValue is invalid, return 0
    if (currentValue === undefined || currentValue === null || isNaN(currentValue) || currentValue === 0) {
      return 0;
    }
    return Math.min(100, Math.floor((currentValue / achievement.requirement) * 100));
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
    set({ 
      unlockedAchievements: [],
      lastCheckedStreak: 0,
      lastCheckedSavings: 0,
      lastCheckedCrises: 0,
    });
    await storage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
  },
}));
