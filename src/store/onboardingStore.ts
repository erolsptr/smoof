import { create } from 'zustand';
import type { QuitMethod } from '@/types';

/**
 * Temporary store for onboarding flow data
 * Gets cleared after profile creation
 */
interface OnboardingData {
  dailyCigarettes: number;
  packPrice: number;
  quitMethod: QuitMethod;
  startDate: string;
}

interface OnboardingState {
  data: Partial<OnboardingData>;
  setStep1Data: (dailyCigarettes: number, packPrice: number) => void;
  setStep2Data: (quitMethod: QuitMethod) => void;
  setStep3Data: (startDate: string) => void;
  getCompleteData: () => OnboardingData | null;
  clearData: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  data: {},
  
  setStep1Data: (dailyCigarettes, packPrice) => {
    set((state) => ({
      data: { ...state.data, dailyCigarettes, packPrice },
    }));
  },
  
  setStep2Data: (quitMethod) => {
    set((state) => ({
      data: { ...state.data, quitMethod },
    }));
  },
  
  setStep3Data: (startDate) => {
    set((state) => ({
      data: { ...state.data, startDate },
    }));
  },
  
  getCompleteData: () => {
    const { data } = get();
    
    if (
      data.dailyCigarettes &&
      data.packPrice &&
      data.quitMethod &&
      data.startDate
    ) {
      return data as OnboardingData;
    }
    
    return null;
  },
  
  clearData: () => {
    set({ data: {} });
  },
}));
