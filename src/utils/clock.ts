import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * App clock with a developer time-travel offset.
 *
 * Every "what time is it" question in the app goes through now()/newDate(),
 * so the test mode can jump whole days forward and the app behaves as if
 * the user really opened it on that day (logs stay on their own dates).
 * Offset is 0 for real users.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

interface ClockState {
  offsetDays: number;
  setOffsetDays: (days: number) => Promise<void>;
  loadClock: () => Promise<void>;
}

export const useClockStore = create<ClockState>((set) => ({
  offsetDays: 0,
  setOffsetDays: async (days) => {
    set({ offsetDays: days });
    await storage.setItem(STORAGE_KEYS.DEBUG_DAY_OFFSET, days);
  },
  loadClock: async () => {
    const days = await storage.getItem<number>(STORAGE_KEYS.DEBUG_DAY_OFFSET);
    set({ offsetDays: days ?? 0 });
  },
}));

/** Current time in ms (shifted by the test offset) */
export function now(): number {
  return Date.now() + useClockStore.getState().offsetDays * DAY_MS;
}

/** Current time as a Date (shifted by the test offset) */
export function newDate(): Date {
  return new Date(now());
}
