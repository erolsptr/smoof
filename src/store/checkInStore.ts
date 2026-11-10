import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { DailyCheckIn } from '@/types';

/**
 * Daily check-ins ("Bugün nasılsın?"): one optional entry per local day.
 * `dismissedDate` hides the home prompt for the day the user said "not today".
 */
interface CheckInState {
  checkIns: DailyCheckIn[];
  dismissedDate: string | null;
  saveCheckIn: (checkIn: DailyCheckIn) => Promise<void>;
  dismissForToday: (today: string) => Promise<void>;
  loadCheckIns: () => Promise<void>;
  clearCheckIns: () => Promise<void>;
}

export const useCheckInStore = create<CheckInState>((set, get) => ({
  checkIns: [],
  dismissedDate: null,

  saveCheckIn: async (checkIn) => {
    // One per day: saving again the same day replaces it
    const checkIns = [...get().checkIns.filter((c) => c.date !== checkIn.date), checkIn].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    set({ checkIns });
    await storage.setItem(STORAGE_KEYS.CHECK_INS, checkIns);
  },

  dismissForToday: async (today) => {
    set({ dismissedDate: today });
    await storage.setItem(STORAGE_KEYS.CHECK_IN_DISMISSED, today);
  },

  loadCheckIns: async () => {
    const [checkIns, dismissedDate] = await Promise.all([
      storage.getItem<DailyCheckIn[]>(STORAGE_KEYS.CHECK_INS),
      storage.getItem<string>(STORAGE_KEYS.CHECK_IN_DISMISSED),
    ]);
    set({ checkIns: checkIns ?? [], dismissedDate: dismissedDate ?? null });
  },

  clearCheckIns: async () => {
    set({ checkIns: [], dismissedDate: null });
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.CHECK_INS),
      storage.removeItem(STORAGE_KEYS.CHECK_IN_DISMISSED),
    ]);
  },
}));
