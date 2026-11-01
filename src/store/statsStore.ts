import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { DailyStats, CrisisLog } from '@/types';

interface StatsState {
  dailyStats: DailyStats[];
  crisisLogs: CrisisLog[];
  currentStreak: number;
  longestStreak: number;
  
  // Actions
  logCrisis: (log: Omit<CrisisLog, 'id'>) => Promise<void>;
  updateDailyStats: (date: string, updates: Partial<DailyStats>) => Promise<void>;
  calculateStreak: () => void;
  recordSlip: (cigarettesSmoked: number) => Promise<void>;
  loadStatsData: () => Promise<void>;
  clearStatsData: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  dailyStats: [],
  crisisLogs: [],
  currentStreak: 0,
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
    
    // Recalculate streak after stats update
    get().calculateStreak();
  },
  
  calculateStreak: () => {
    const { dailyStats } = get();
    // Sort by date descending
    const sorted = [...dailyStats].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculate current streak (from today backwards)
    for (const stat of sorted) {
      if (stat.smokeFree) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    for (const stat of dailyStats) {
      if (stat.smokeFree) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    set({ currentStreak, longestStreak: Math.max(longestStreak, currentStreak) });
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
      
      // Calculate streak after loading
      get().calculateStreak();
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
      longestStreak: 0,
    });
  },
}));
