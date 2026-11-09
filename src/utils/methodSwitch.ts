/**
 * Switching between quit methods (immediate <-> gradual) after onboarding.
 *
 * Nothing in the past is rewritten: daily entries, craving logs and earned
 * badges stay as they are. Only the profile fields that drive "from now on"
 * calculations change.
 */
import type { DailyStats, UserProfile } from '@/types';
import { addDays, getTodayString, toDateKey } from '@/utils/dateHelpers';
import { getTrackingStartDate } from '@/utils/gradualHelpers';
import { newDate } from '@/utils/clock';

/**
 * First day of the current run of logged 0-cigarette days (gradual entries),
 * or null if the latest entry wasn't 0. Today may still be unlogged.
 */
export function getSmokeFreeRunStart(profile: UserProfile, dailyStats: DailyStats[]): string | null {
  const today = getTodayString();
  const startDate = getTrackingStartDate(profile);
  const byDate = new Map(dailyStats.map((s) => [s.date, s]));

  let runStart: string | null = null;
  for (let date = today; date >= startDate; date = addDays(date, -1)) {
    const stat = byDate.get(date);
    if (!stat && date === today) continue; // the day isn't over yet
    if (!stat || stat.cigarettesSmoked > 0) break;
    runStart = date;
  }
  return runStart;
}

export type ImmediateStart =
  /** Continue from the logged 0-cigarette days */
  | 'streak'
  /** Didn't smoke today: smoke-free since midnight */
  | 'today'
  /** Just had the last one */
  | 'now';

/** Gradual -> immediate: from when the smoke-free time counts */
export function switchToImmediate(
  profile: UserProfile,
  dailyStats: DailyStats[],
  start: ImmediateStart,
): Partial<UserProfile> {
  const today = getTodayString();
  const planStart = getTrackingStartDate(profile);

  // Not started yet: keep the planned date, just quit fully instead of reducing
  if (planStart > today) {
    return { quitMethod: 'immediate', quitDate: planStart };
  }

  let quitDate: string;
  if (start === 'streak') {
    quitDate = getSmokeFreeRunStart(profile, dailyStats) ?? today;
  } else if (start === 'today') {
    quitDate = today;
  } else {
    quitDate = newDate().toISOString();
  }
  // Gradual fields are kept as history; they only matter in gradual mode
  return { quitMethod: 'immediate', quitDate };
}

export interface GradualSetup {
  /** Cigarettes per day right now */
  currentCount: number;
  /** Week 1 daily limit */
  firstTarget: number;
  /** Weeks until 0 */
  weeks: number;
}

/** Immediate -> gradual: a fresh plan from today (or from the planned date if not started) */
export function switchToGradual(profile: UserProfile, setup: GradualSetup): Partial<UserProfile> {
  const today = getTodayString();
  const quitKey = toDateKey(profile.quitDate);
  const start = quitKey > today ? quitKey : today;

  return {
    quitMethod: 'gradual',
    quitDate: start,
    gradualStartDate: start,
    gradualStartCount: setup.currentCount,
    gradualInitialTarget: setup.firstTarget,
    gradualTargetWeeks: setup.weeks,
    gradualWeeklyReduction: Math.round((setup.firstTarget / setup.weeks) * 10) / 10,
    // A new plan: changes from an older gradual period must not apply to it
    gradualTargetChanges: [],
    gradualCurrentTarget: undefined,
  };
}
