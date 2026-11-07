import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { calculateStreakFromQuitDate, getTodayString } from '@/utils/dateHelpers';
import type { DailyStats, CrisisLog, UserProfile } from '@/types';
import { computeGradualStreaks } from '@/utils/progressMetrics';
import { useUserStore } from '@/store/userStore';

interface StatsState {
  dailyStats: DailyStats[];
  crisisLogs: CrisisLog[];
  currentStreak: number; // For immediate: smoke-free days, For gradual: discipline days
  smokeFreeStreak: number; // Only counts days with 0 cigarettes (for gradual method)
  
  // Actions
  logCrisis: (log: Omit<CrisisLog, 'id'>) => Promise<void>;
  updateDailyStats: (date: string, updates: Partial<DailyStats>) => Promise<void>;
  /** Recompute streaks for the profile's quit method (single source of truth) */
  syncStreaks: (profile: UserProfile | null) => void;
  recordSlip: (cigarettesSmoked: number) => Promise<void>;
  loadStatsData: () => Promise<void>;
  clearStatsData: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  dailyStats: [],
  crisisLogs: [],
  currentStreak: 0,
  smokeFreeStreak: 0,
  
  logCrisis: async (log) => {
    const newLog: CrisisLog = {
      ...log,
      id: `crisis_${Date.now()}_${Math.random()}`,
    };
    
    const updatedLogs = [...get().crisisLogs, newLog];
    set({ crisisLogs: updatedLogs });
    await storage.setItem(STORAGE_KEYS.CRISIS_LOGS, updatedLogs);
  },
  
  updateDailyStats: async (date, updates) => {
    const { dailyStats } = get();
    const existing = dailyStats.find(s => s.date === date);
    
    let updatedStats: DailyStats[];
    
    if (existing) {
      updatedStats = dailyStats.map(s =>
        s.date === date ? { ...s, ...updates } : s
      );
    } else {
      const newStat: DailyStats = {
        date,
        smokeFree: true,
        cigarettesSmoked: 0,
        cravingsLogged: 0,
        crisesHandled: 0,
        ...updates,
      };
      updatedStats = [...dailyStats, newStat];
    }
    
    set({ dailyStats: updatedStats });
    await storage.setItem(STORAGE_KEYS.DAILY_STATS, updatedStats);
    
    // Recalculate streaks from the updated data
    get().syncStreaks(useUserStore.getState().profile);
  },
  
  syncStreaks: (profile) => {
    if (!profile) return;
    if (profile.quitMethod === 'gradual') {
      const { discipline, smokeFree } = computeGradualStreaks(profile, get().dailyStats);
      set({ currentStreak: discipline, smokeFreeStreak: smokeFree });
    } else {
      const days = calculateStreakFromQuitDate(profile.quitDate);
      set({ currentStreak: days, smokeFreeStreak: days });
    }
  },
  
  recordSlip: async (cigarettesSmoked) => {
    const today = getTodayString();
    await get().updateDailyStats(today, {
      smokeFree: cigarettesSmoked === 0,
      cigarettesSmoked,
    });
  },
  
  loadStatsData: async () => {
    try {
      const [dailyStats, crisisLogs] = await Promise.all([
        storage.getItem<DailyStats[]>(STORAGE_KEYS.DAILY_STATS),
        storage.getItem<CrisisLog[]>(STORAGE_KEYS.CRISIS_LOGS),
      ]);
      
      set({
        dailyStats: dailyStats ?? [],
        crisisLogs: crisisLogs ?? [],
      });
    } catch (error) {
      console.error('Error loading stats data:', error);
    }
  },
  
  clearStatsData: async () => {
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.DAILY_STATS),
      storage.removeItem(STORAGE_KEYS.CRISIS_LOGS),
    ]);
    set({
      dailyStats: [],
      crisisLogs: [],
      currentStreak: 0,
      smokeFreeStreak: 0,
    });
  },
}));
