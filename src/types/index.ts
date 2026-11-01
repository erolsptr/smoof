/**
 * Core Type Definitions
 */

export type QuitMethod = 'cold-turkey' | 'gradual';

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
}

export interface CrisisLog {
  id: string;
  timestamp: string;
  trigger?: string;
  handled: boolean; // Did they resist?
  method?: 'breathing' | 'minigame' | 'motivation'; // How did they cope?
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or icon name
  unlockedAt?: string;
  category: 'streak' | 'savings' | 'health' | 'resistance';
}

export interface SmoofMascot {
  level: number;
  xp: number;
  mood: 'happy' | 'proud' | 'worried' | 'encouraging' | 'celebrating';
  color: string; // Changes based on streak/progress
}
