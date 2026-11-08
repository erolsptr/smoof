import { useEffect, useMemo, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useAchievementStore } from '@/store/achievementStore';
import {
  AchievementContext,
  computeGradualStreaks,
  getCravingMetrics,
  getGradualMetrics,
  getImmediateMetrics,
} from '@/utils/progressMetrics';
import { getTodayString, toDateKey } from '@/utils/dateHelpers';
import { now as clockNow, useClockStore } from '@/utils/clock';

const MINUTES_PER_DAY = 24 * 60;

/**
 * Live progress numbers for the current profile.
 * Re-evaluates every 30 seconds so time-based values (smoke-free time, money) stay current.
 */
export function useProgress() {
  const profile = useUserStore((s) => s.profile);
  const dailyStats = useStatsStore((s) => s.dailyStats);
  const crisisLogs = useStatsStore((s) => s.crisisLogs);
  const storeStreak = useStatsStore((s) => s.currentStreak);

  const offsetDays = useClockStore((s) => s.offsetDays);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
  // Re-read the clock on each tick and when the test mode jumps days
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => clockNow(), [tick, offsetDays]);

  return useMemo(() => {
    const isGradual = profile?.quitMethod === 'gradual';
    const cravings = getCravingMetrics(crisisLogs);
    const isPreparation = profile ? toDateKey(profile.quitDate) > getTodayString() : false;

    if (!profile) {
      return { profile, now, isGradual, isPreparation, cravings, immediate: null, gradual: null, achievementContext: null };
    }

    if (isGradual) {
      const gradual = getGradualMetrics(profile, dailyStats);
      const streaks = computeGradualStreaks(profile, dailyStats);
      const achievementContext: AchievementContext = {
        isGradual: true,
        smokeFreeDays: streaks.smokeFree,
        disciplineDays: streaks.discipline,
        flawlessDays: streaks.smokeFree,
        // Smoke-free time is only known in whole logged 0-cigarette days
        minutesSmokeFree: streaks.smokeFree * MINUTES_PER_DAY,
        moneySaved: gradual.moneySaved,
        cravingsResisted: cravings.resisted,
        bestReductionPercent: gradual.bestReductionPercent,
        hasZeroDay: gradual.hasZeroDay,
      };
      return {
        profile, now, isGradual, isPreparation, cravings,
        immediate: null,
        gradual: { ...gradual, disciplineStreak: streaks.discipline, smokeFreeStreak: streaks.smokeFree },
        achievementContext,
      };
    }

    const immediate = getImmediateMetrics(profile, now, cravings);
    const achievementContext: AchievementContext = {
      isGradual: false,
      smokeFreeDays: storeStreak,
      disciplineDays: 0,
      flawlessDays: immediate.flawlessDays,
      minutesSmokeFree: immediate.minutesSmokeFree,
      moneySaved: immediate.moneySaved,
      cravingsResisted: cravings.resisted,
      bestReductionPercent: 0,
      hasZeroDay: false,
    };
    return {
      profile, now, isGradual, isPreparation, cravings,
      immediate: { ...immediate, streakDays: storeStreak },
      gradual: null,
      achievementContext,
    };
  }, [profile, dailyStats, crisisLogs, storeStreak, now]);
}

/**
 * Keeps streaks and badges in sync with the data.
 * Mounted once in the tab layout, so it runs on every tab.
 */
export function useProgressSync() {
  const progress = useProgress();
  const { profile, achievementContext } = progress;
  const todayKey = getTodayString();
  const syncStreaks = useStatsStore((s) => s.syncStreaks);
  const dailyStats = useStatsStore((s) => s.dailyStats);

  // Streaks: on profile/data change and when the day rolls over
  useEffect(() => {
    syncStreaks(profile);
  }, [profile, dailyStats, todayKey, syncStreaks]);

  // Badges: re-check whenever a value that can unlock one changes
  const contextKey = achievementContext ? JSON.stringify({
    ...achievementContext,
    // Round so the 30s tick doesn't re-run the check needlessly
    minutesSmokeFree: Math.floor(achievementContext.minutesSmokeFree / 10),
    moneySaved: Math.floor(achievementContext.moneySaved),
  }) : null;

  useEffect(() => {
    if (!achievementContext) return;
    const store = useAchievementStore.getState();
    store.loadAchievements().then(() => store.checkAndUnlockAchievements(achievementContext));
    // achievementContext is captured via contextKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);

  return progress;
}
