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
  checkAndUnlockAchievements: (streak: number, savings: number, crises: number, hasSlipped: boolean, profile?: any, smokeFreeStreak?: number) => Promise<Achievement[]>;
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
  
  checkAndUnlockAchievements: async (streak: number, savings: number, crises: number, hasSlipped: boolean, profile?: any, smokeFreeStreak?: number) => {
    const newlyUnlocked: Achievement[] = [];
    const { unlockedAchievements } = get();
    
    // Helper function to determine the correct value for each achievement type
    const getCurrentValue = (achievement: Achievement) => {
      // Sigarasız streak rozetleri - sadece smokeFreeStreak kullan
      if (achievement.category === 'streak') {
        // Kademeli modda sigarasız gün rozetleri için smokeFreeStreak
        // Immediate modda currentStreak zaten sigarasız günler
        return profile?.quitMethod === 'gradual' ? (smokeFreeStreak || 0) : streak;
      }
      
      // Health rozetleri - sigarasız günler (smokeFreeStreak)
      if (achievement.category === 'health' && achievement.requirement > 0) {
        return profile?.quitMethod === 'gradual' ? (smokeFreeStreak || 0) : streak;
      }
      
      // Gradual rozetleri - disiplin günü (currentStreak)
      if (achievement.category === 'gradual') {
        return streak; // Disiplin günü
      }
      
      // Savings - kademeli hesaplama (zaten düzeltildi özellik 3'te)
      if (achievement.category === 'savings') {
        return savings;
      }
      
      // Resistance
      if (achievement.category === 'resistance') {
        if (achievement.id.startsWith('crisis_')) {
          return crises;
        }
        // no-slip: smokeFreeStreak kullan
        return profile?.quitMethod === 'gradual' ? (smokeFreeStreak || 0) : streak;
      }
      
      return 0;
    };
    
    // Check streak achievements (smoke-free days)
    const streakAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'streak' && a.requirement <= getCurrentValue(a) && !unlockedAchievements.includes(a.id)
    );
    
    // Check savings achievements
    const savingsAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'savings' && a.requirement <= savings && !unlockedAchievements.includes(a.id)
    );
    
    // Check health achievements (smoke-free days)
    const healthAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'health' && 
      a.requirement > 0 && 
      a.requirement <= getCurrentValue(a) && 
      !unlockedAchievements.includes(a.id)
    );
    
    // Check resistance achievements (crises)
    const crisisAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'resistance' && 
      a.id.startsWith('crisis_') && 
      a.requirement <= crises && 
      !unlockedAchievements.includes(a.id)
    );
    
    // Check no-slip achievements (smoke-free days)
    const noSlipAchievements = ACHIEVEMENTS.filter(
      a => a.category === 'resistance' && 
      a.id.startsWith('no_slip_') && 
      a.requirement <= getCurrentValue(a) && 
      !hasSlipped &&
      !unlockedAchievements.includes(a.id)
    );
    
    let gradualAchievements: Achievement[] = [];
    
    // Check gradual achievements if in gradual mode
    if (profile && profile.quitMethod === 'gradual') {
      // Discipline streak achievements (based on currentStreak)
      const gradualTimeAchievements = ACHIEVEMENTS.filter(
        a => a.category === 'gradual' && 
        (a.id === 'gradual_week1' || a.id === 'gradual_week2' || a.id === 'gradual_month') &&
        a.requirement <= streak &&
        !unlockedAchievements.includes(a.id)
      );
      
      // Reduction percentage achievements
      const startCount = profile.gradualStartCount || profile.dailyCigaretteCount;
      const currentTarget = profile.gradualCurrentTarget || 0;
      const reductionPercent = startCount > 0 
        ? ((startCount - currentTarget) / startCount) * 100
        : 0;
      
      const reductionAchievements = ACHIEVEMENTS.filter(
        a => a.category === 'gradual' && 
        (a.id === 'gradual_half' || a.id === 'gradual_75') &&
        a.requirement <= reductionPercent &&
        !unlockedAchievements.includes(a.id)
      );
      
      // Zero achievement
      const zeroAchievements = currentTarget === 0
        ? ACHIEVEMENTS.filter(
            a => a.category === 'gradual' && 
            a.id === 'gradual_zero' &&
            !unlockedAchievements.includes(a.id)
          )
        : [];
      
      gradualAchievements = [
        ...gradualTimeAchievements,
        ...reductionAchievements,
        ...zeroAchievements,
      ];
    }
    
    const allNewAchievements = [
      ...streakAchievements,
      ...savingsAchievements,
      ...healthAchievements,
      ...crisisAchievements,
      ...noSlipAchievements,
      ...gradualAchievements,
    ];
    
    // Unlock each new achievement
    for (const achievement of allNewAchievements) {
      await get().unlockAchievement(achievement.id);
      newlyUnlocked.push(achievement);
      
      // Send notification for new achievement (only for streak/health achievements)
      // Crisis and savings achievements don't need milestone celebration notifications
      if (achievement.category === 'streak' || achievement.category === 'gradual' || (achievement.category === 'health' && achievement.requirement > 0)) {
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
