import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { UserProfile } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isLoading: boolean;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  useStreakFreeze: () => boolean;
  loadUserData: () => Promise<void>;
  clearUserData: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isOnboarded: false,
  isLoading: true,
  
  setProfile: async (profile) => {
    set({ profile, isOnboarded: true });
    await storage.setItem(STORAGE_KEYS.USER_PROFILE, profile);
    await storage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
  },
  
  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    
    const updatedProfile = { ...profile, ...updates };
    set({ profile: updatedProfile });
    await storage.setItem(STORAGE_KEYS.USER_PROFILE, updatedProfile);
  },
  
  completeOnboarding: async () => {
    set({ isOnboarded: true });
    await storage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
  },
  
  useStreakFreeze: () => {
    const { profile } = get();
    if (!profile) return false;
    
    const freezesAvailable = profile.streakFreezes - profile.streakFreezesUsed;
    if (freezesAvailable <= 0) return false;
    
    const updatedProfile = {
      ...profile,
      streakFreezesUsed: profile.streakFreezesUsed + 1,
    };
    
    set({ profile: updatedProfile });
    storage.setItem(STORAGE_KEYS.USER_PROFILE, updatedProfile);
    
    return true;
  },
  
  loadUserData: async () => {
    try {
      set({ isLoading: true });
      
      const [profile, isOnboarded] = await Promise.all([
        storage.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE),
        storage.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED),
      ]);
      
      set({
        profile,
        isOnboarded: isOnboarded ?? false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      set({ isLoading: false });
    }
  },
  
  clearUserData: async () => {
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.USER_PROFILE),
      storage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
    ]);
    set({ profile: null, isOnboarded: false });
  },
}));
