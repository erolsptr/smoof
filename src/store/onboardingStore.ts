import { create } from 'zustand';
import type { QuitMethod } from '@/types';

/**
 * Temporary store for onboarding flow data
 * Gets cleared after profile creation
 */
interface OnboardingData {
  // Step 1: Basic info
  name?: string;
  
  // Step 2: Smoking history
  dailyCigarettes: number;
  packPrice: number;
  smokingYears?: number;
  
  // Step 3: Motivation
  motivations?: string[];
  
  // Step 4: Quit method
  quitMethod: QuitMethod;
  
  // Step 5: Gradual initial target (if kademeli)
  gradualInitialTarget?: number;
  
  // Step 6: Start date
  startDate: string;
}

interface OnboardingState {
  data: Partial<OnboardingData>;
  setStep1Data: (name?: string) => void;
  setStep2Data: (dailyCigarettes: number, packPrice: number, smokingYears?: number) => void;
  setStep3Data: (motivations: string[]) => void;
  setStep4Data: (quitMethod: QuitMethod) => void;
  setStep5Data: (gradualInitialTarget: number) => void;
  setStep6Data: (startDate: string) => void;
  getCompleteData: () => OnboardingData | null;
  clearData: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  data: {},
  
  setStep1Data: (name) => {
    set((state) => ({
      data: { ...state.data, name },
    }));
  },
  
  setStep2Data: (dailyCigarettes, packPrice, smokingYears) => {
    set((state) => ({
      data: { ...state.data, dailyCigarettes, packPrice, smokingYears },
    }));
  },
  
  setStep3Data: (motivations) => {
    set((state) => ({
      data: { ...state.data, motivations },
    }));
  },
  
  setStep4Data: (quitMethod) => {
    set((state) => ({
      data: { ...state.data, quitMethod },
    }));
  },
  
  setStep5Data: (gradualInitialTarget) => {
    set((state) => ({
      data: { ...state.data, gradualInitialTarget },
    }));
  },
  
  setStep6Data: (startDate) => {
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
