import { create } from 'zustand';
import type { DailyStats, CrisisLog } from '@/types';

interface StatsState {
  dailyStats: DailyStats[];
  crisisLogs: CrisisLog[];
  currentStreak: number;
  longestStreak: number;
  
  // Actions
  logCrisis: (log: Omit<CrisisLog, 'id'>) => void;
  updateDailyStats: (date: string, updates: Partial<DailyStats>) => void;
  calculateStreak: () => void;
  recordSlip: (cigarettesSmoked: number) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  dailyStats: [],
  crisisLogs: [],
  currentStreak: 0,
  longestStreak: 0,
  
  logCrisis: (log) => set((state) => ({
    crisisLogs: [...state.crisisLogs, {
      ...log,
      id: `crisis_${Date.now()}_${Math.random()}`,
    }],
  })),
  
  updateDailyStats: (date, updates) => set((state) => {
    const existing = state.dailyStats.find(s => s.date === date);
    
    if (existing) {
      return {
        dailyStats: state.dailyStats.map(s =>
          s.date === date ? { ...s, ...updates } : s
        ),
      };
    } else {
      return {
        dailyStats: [...state.dailyStats, {
          date,
          smokeFree: true,
          cigarettesSmoked: 0,
          cravingsLogged: 0,
          crisesHandled: 0,
          ...updates,
        }],
      };
    }
  }),
  
  calculateStreak: () => {
    const { dailyStats } = get();
    // Sort by date descending
    const sorted = [...dailyStats].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    for (const stat of sorted) {
      if (stat.smokeFree) {
        streak++;
      } else {
        break;
      }
    }
    
    set({ currentStreak: streak });
  },
  
  recordSlip: (cigarettesSmoked) => {
    const today = new Date().toISOString().split('T')[0];
    get().updateDailyStats(today, {
      smokeFree: cigarettesSmoked === 0,
      cigarettesSmoked,
    });
  },
}));
