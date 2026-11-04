/**
 * Core Type Definitions
 */

export type QuitMethod = 'immediate' | 'gradual';

export interface UserProfile {
  id: string;
  createdAt: string;
  
  // Smoking info
  dailyCigaretteCount: number;
  packPrice: number;
  cigarettesPerPack: number; // Usually 20
  
  // Quit journey
  quitDate: string;
  quitMethod: QuitMethod;
  
  // Gradual reduction (only for quitMethod: 'gradual')
  gradualStartDate?: string; // When gradual reduction started
  gradualStartCount?: number; // Starting cigarettes/day (e.g., 20)
  gradualCurrentTarget?: number; // Current daily target (e.g., 8)
  
  // Personalization
  triggers: string[]; // e.g., ['coffee', 'stress', 'social']
  motivations: string[]; // e.g., ['health', 'money', 'family']
  
  // Streak freeze
  streakFreezes: number;
  streakFreezesUsed: number;
}

export interface DailyStats {
  date: string; // ISO date string
  smokeFree: boolean;
  cigarettesSmoked: number;
  cravingsLogged: number;
  crisesHandled: number;
  
  // Gradual reduction tracking
  targetCigarettes?: number; // Daily target for gradual reduction
  metGoal?: boolean; // Did they meet their daily goal?
}

export interface CrisisLog {
  id: string;
  timestamp: string;
  trigger?: string;
  handled: boolean; // Did they resist?
  method?: 'breathing' | 'minigame' | 'motivation'; // How did they cope?
}

export type AchievementCategory = 'streak' | 'savings' | 'health' | 'resistance' | 'gradual';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  iconColor: string;
  category: AchievementCategory;
  requirement: number; // streak days, money saved, crises handled, etc.
  unlockedAt?: string;
  progress?: number; // 0-100
}

export interface SmoofMascot {
  level: number;
  xp: number;
  mood: 'happy' | 'proud' | 'worried' | 'encouraging' | 'celebrating';
  color: string; // Changes based on streak/progress
}
