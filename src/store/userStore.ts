import { create } from 'zustand';
import type { UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  useStreakFreeze: () => boolean; // Returns true if freeze was used
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isOnboarded: false,
  
  setProfile: (profile) => set({ profile, isOnboarded: true }),
  
  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null,
  })),
  
  completeOnboarding: () => set({ isOnboarded: true }),
  
  useStreakFreeze: () => {
    const { profile } = get();
    if (!profile) return false;
    
    const freezesAvailable = profile.streakFreezes - profile.streakFreezesUsed;
    if (freezesAvailable <= 0) return false;
    
    set((state) => ({
      profile: state.profile ? {
        ...state.profile,
        streakFreezesUsed: state.profile.streakFreezesUsed + 1,
      } : null,
    }));
    
    return true;
  },
}));
