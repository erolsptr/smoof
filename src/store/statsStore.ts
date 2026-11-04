import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { calculateStreakFromQuitDate } from '@/utils/dateHelpers';
import type { DailyStats, CrisisLog } from '@/types';

interface StatsState {
  dailyStats: DailyStats[];
  crisisLogs: CrisisLog[];
  currentStreak: number; // For immediate: smoke-free days, For gradual: discipline days
  smokeFreeStreak: number; // Only counts days with 0 cigarettes (for gradual method)
  longestStreak: number;
  
  // Actions
  logCrisis: (log: Omit<CrisisLog, 'id'>) => Promise<void>;
  updateDailyStats: (date: string, updates: Partial<DailyStats>) => Promise<void>;
  updateStreakFromQuitDate: (quitDate: string) => void;
  recordSlip: (cigarettesSmoked: number) => Promise<void>;
  loadStatsData: () => Promise<void>;
  clearStatsData: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  dailyStats: [],
  crisisLogs: [],
  currentStreak: 0,
  smokeFreeStreak: 0,
  longestStreak: 0,
  
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
    
    // Recalculate streaks based on the updated data
    const calculateStreaks = () => {
      // Sort stats by date descending
      const sorted = [...updatedStats].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      let disciplineStreak = 0;
      let smokeFreeStreak = 0;
      
      // Calculate discipline streak (days meeting goal)
      for (const stat of sorted) {
        if (stat.metGoal) {
          disciplineStreak++;
        } else {
          break;
        }
      }
      
      // Calculate smoke-free streak (0 cigarettes)
      for (const stat of sorted) {
        if (stat.smokeFree && stat.cigarettesSmoked === 0) {
          smokeFreeStreak++;
        } else {
          break;
        }
      }
      
      set({ 
        currentStreak: disciplineStreak,
        smokeFreeStreak: smokeFreeStreak,
        longestStreak: Math.max(get().longestStreak, disciplineStreak, smokeFreeStreak),
      });
    };
    
    calculateStreaks();
  },
  
  updateStreakFromQuitDate: (quitDate: string) => {
    const streakDays = calculateStreakFromQuitDate(quitDate);
    set({ 
      currentStreak: streakDays,
      longestStreak: Math.max(get().longestStreak, streakDays),
    });
  },
  
  recordSlip: async (cigarettesSmoked) => {
    const today = new Date().toISOString().split('T')[0];
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
      longestStreak: 0,
    });
  },
}));
