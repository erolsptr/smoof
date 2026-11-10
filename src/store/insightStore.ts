import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * What the user already saw or dismissed among Smoof's insights, so nothing
 * is shown again and again:
 * - plan suggestion: "Şimdilik böyle iyi" hides it for 7 days
 * - weekly summary: shown once per week
 */
interface InsightState {
  /** Plan suggestion hidden until this date key (exclusive) */
  planHiddenUntil: string | null;
  /** Last day (date key) the weekly summary was opened */
  weeklySeenOn: string | null;
  hidePlanUntil: (dateKey: string) => Promise<void>;
  markWeeklySeen: (dateKey: string) => Promise<void>;
  loadInsights: () => Promise<void>;
  clearInsights: () => Promise<void>;
}

type Saved = Pick<InsightState, 'planHiddenUntil' | 'weeklySeenOn'>;

export const useInsightStore = create<InsightState>((set, get) => {
  const persist = () =>
    storage.setItem<Saved>(STORAGE_KEYS.INSIGHTS, {
      planHiddenUntil: get().planHiddenUntil,
      weeklySeenOn: get().weeklySeenOn,
    });

  return {
    planHiddenUntil: null,
    weeklySeenOn: null,

    hidePlanUntil: async (dateKey) => {
      set({ planHiddenUntil: dateKey });
      await persist();
    },
    markWeeklySeen: async (dateKey) => {
      set({ weeklySeenOn: dateKey });
      await persist();
    },
    loadInsights: async () => {
      const saved = await storage.getItem<Saved>(STORAGE_KEYS.INSIGHTS);
      set({ planHiddenUntil: saved?.planHiddenUntil ?? null, weeklySeenOn: saved?.weeklySeenOn ?? null });
    },
    clearInsights: async () => {
      set({ planHiddenUntil: null, weeklySeenOn: null });
      await storage.removeItem(STORAGE_KEYS.INSIGHTS);
    },
  };
});
