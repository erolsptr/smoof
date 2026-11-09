/**
 * Single source of truth for progress numbers.
 * Home, Statistics, Profile, Achievements and badge unlocking all read from here,
 * so the same number is never computed two different ways.
 */
import type { Achievement, CrisisLog, DailyStats, UserProfile } from '@/types';
import { addDays, daysBetween, getQuitTimestamp, getTodayString, toDateKey } from '@/utils/dateHelpers';
import { getGradualTargetForDate, getGradualZeroDate, getTrackingStartDate } from '@/utils/gradualHelpers';

const MINUTES_PER_DAY = 24 * 60;
/** Average time one cigarette takes (break included) */
export const MINUTES_PER_CIGARETTE = 5;

// ─────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────

export function getPackCost(profile: UserProfile, cigarettes: number): number {
  const perPack = profile.cigarettesPerPack || 20;
  return (cigarettes / perPack) * profile.packPrice;
}

export interface CravingMetrics {
  resisted: number;
  slips: number;
  breathingUsed: number;
  topTrigger: string | null;
  lastSlipKey: string | null;
}

export function getCravingMetrics(crisisLogs: CrisisLog[]): CravingMetrics {
  const resisted = crisisLogs.filter((l) => l.handled);
  const slips = crisisLogs.filter((l) => !l.handled);

  const triggerCounts = new Map<string, number>();
  crisisLogs.forEach((l) => {
    if (l.trigger) triggerCounts.set(l.trigger, (triggerCounts.get(l.trigger) || 0) + 1);
  });
  let topTrigger: string | null = null;
  let topCount = 0;
  triggerCounts.forEach((count, trigger) => {
    if (count > topCount) {
      topTrigger = trigger;
      topCount = count;
    }
  });

  const lastSlip = slips.reduce<string | null>((latest, l) => {
    const key = toDateKey(l.timestamp);
    return latest === null || key > latest ? key : latest;
  }, null);

  return {
    resisted: resisted.length,
    slips: slips.length,
    breathingUsed: resisted.filter((l) => l.method === 'breathing').length,
    topTrigger,
    lastSlipKey: lastSlip,
  };
}

// ─────────────────────────────────────────────
// Immediate quit
// ─────────────────────────────────────────────

export interface ImmediateMetrics {
  minutesSmokeFree: number;
  cigarettesAvoided: number;
  moneySaved: number;
  timeSavedMinutes: number;
  dailyCost: number;
  /** Calendar days without any slip (freeze-protected slips included) */
  flawlessDays: number;
}

export function getImmediateMetrics(
  profile: UserProfile,
  now: number,
  cravings: CravingMetrics,
): ImmediateMetrics {
  const minutesSmokeFree = Math.max(0, (now - getQuitTimestamp(profile.quitDate)) / 60000);
  // Counted continuously, so day 0 already shows progress
  const cigarettesAvoided = Math.floor((minutesSmokeFree / MINUTES_PER_DAY) * profile.dailyCigaretteCount);

  const today = getTodayString();
  const quitKey = toDateKey(profile.quitDate);
  const flawlessFrom = cravings.lastSlipKey && cravings.lastSlipKey > quitKey ? cravings.lastSlipKey : quitKey;
  const flawlessDays = flawlessFrom > today ? 0 : daysBetween(flawlessFrom, today);

  return {
    minutesSmokeFree,
    cigarettesAvoided,
    moneySaved: getPackCost(profile, cigarettesAvoided),
    timeSavedMinutes: cigarettesAvoided * MINUTES_PER_CIGARETTE,
    dailyCost: getPackCost(profile, profile.dailyCigaretteCount),
    flawlessDays,
  };
}

// ─────────────────────────────────────────────
// Gradual reduction
// ─────────────────────────────────────────────

export interface GradualDay {
  date: string;
  smoked: number | null; // null = not logged
  target: number;
  metGoal: boolean | null;
}

export interface GradualMetrics {
  startCount: number;
  startDate: string;
  todayTarget: number;
  currentWeek: number;
  totalWeeks: number;
  /** First day the plan target reaches 0 */
  zeroTargetDate: string | null;
  loggedDays: number;
  goalDays: number;
  overDays: number;
  /** % of logged days within target */
  compliancePercent: number;
  cigarettesAvoided: number;
  cigarettesSmoked: number;
  moneySaved: number;
  /** Average of the last 7 logged days (null if nothing logged) */
  recentAverage: number | null;
  /** Reduction of recent average vs. start (0..100) */
  reductionPercent: number;
  /** Best single in-target day reduction vs. start (for badges) */
  bestReductionPercent: number;
  hasZeroDay: boolean;
  last7Days: GradualDay[];
}

function dayMetGoal(stat: DailyStats, target: number): boolean {
  // metGoal is stored on save (true also when a freeze was used)
  return stat.metGoal ?? stat.cigarettesSmoked <= target;
}

export function getGradualMetrics(profile: UserProfile, dailyStats: DailyStats[]): GradualMetrics {
  const today = getTodayString();
  const startDate = getTrackingStartDate(profile);
  const startCount = profile.gradualStartCount || profile.dailyCigaretteCount;

  const entries = dailyStats
    .filter((s) => s.date >= startDate && s.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  let cigarettesAvoided = 0;
  let cigarettesSmoked = 0;
  let goalDays = 0;
  let bestReductionPercent = 0;

  entries.forEach((s) => {
    const target = s.targetCigarettes ?? getGradualTargetForDate(profile, s.date);
    cigarettesSmoked += s.cigarettesSmoked;
    cigarettesAvoided += Math.max(0, startCount - s.cigarettesSmoked);
    const met = dayMetGoal(s, target);
    if (met) {
      goalDays++;
      if (startCount > 0) {
        bestReductionPercent = Math.max(
          bestReductionPercent,
          ((startCount - s.cigarettesSmoked) / startCount) * 100,
        );
      }
    }
  });

  const recent = entries.slice(-7);
  const recentAverage = recent.length
    ? recent.reduce((sum, s) => sum + s.cigarettesSmoked, 0) / recent.length
    : null;
  const reductionPercent = recentAverage !== null && startCount > 0
    ? Math.max(0, Math.round(((startCount - recentAverage) / startCount) * 100))
    : 0;

  const elapsedDays = startDate > today ? 0 : daysBetween(startDate, today);
  const zeroTargetDate = getGradualZeroDate(profile);

  const byDate = new Map(entries.map((s) => [s.date, s]));
  const last7Days: GradualDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    if (date < startDate) continue;
    const stat = byDate.get(date);
    const target = stat?.targetCigarettes ?? getGradualTargetForDate(profile, date);
    last7Days.push({
      date,
      smoked: stat ? stat.cigarettesSmoked : null,
      target,
      metGoal: stat ? dayMetGoal(stat, target) : null,
    });
  }

  return {
    startCount,
    startDate,
    todayTarget: getGradualTargetForDate(profile, today),
    currentWeek: Math.floor(elapsedDays / 7) + 1,
    // Weeks from the start to the first 0 day (plan changes can make it longer or shorter)
    totalWeeks: Math.max(1, Math.ceil(daysBetween(startDate, zeroTargetDate ?? startDate) / 7)),
    zeroTargetDate,
    loggedDays: entries.length,
    goalDays,
    overDays: entries.length - goalDays,
    compliancePercent: entries.length ? Math.round((goalDays / entries.length) * 100) : 0,
    cigarettesAvoided,
    cigarettesSmoked,
    moneySaved: getPackCost(profile, cigarettesAvoided),
    recentAverage,
    reductionPercent,
    bestReductionPercent,
    hasZeroDay: entries.some((s) => s.cigarettesSmoked === 0),
    last7Days,
  };
}

/**
 * Gradual streaks, counted on logged days going back from today (unlogged days are skipped).
 * Today counts only once it's logged (the day isn't over yet); an unlogged past
 * day breaks the streak.
 */
export function computeGradualStreaks(
  profile: UserProfile,
  dailyStats: DailyStats[],
): { discipline: number; smokeFree: number } {
  const today = getTodayString();
  const startDate = getTrackingStartDate(profile);
  const byDate = new Map(dailyStats.map((s) => [s.date, s]));

  // A streak only grows over an unbroken run of logged days.
  // - Today not logged yet: fine, the day isn't over.
  // - A missing past day (gap): we don't know if it met the goal, so the days
  //   after it are on hold (not counted) and the streak stays where it was
  //   before the gap. Once the gap is filled they all count together.
  // - A logged day that misses the goal ends the streak.
  const count = (passes: (stat: DailyStats, date: string) => boolean) => {
    let streak = 0;
    for (let date = today; date >= startDate; date = addDays(date, -1)) {
      const stat = byDate.get(date);
      if (!stat) {
        if (date !== today) streak = 0; // gap: drop the unconfirmed days after it
        continue;
      }
      if (!passes(stat, date)) break;
      streak++;
    }
    return streak;
  };

  return {
    discipline: count((s, date) =>
      dayMetGoal(s, s.targetCigarettes ?? getGradualTargetForDate(profile, date)),
    ),
    smokeFree: count((s) => s.cigarettesSmoked === 0),
  };
}

// ─────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────

export interface AchievementContext {
  isGradual: boolean;
  /** Smoke-free days: immediate = streak, gradual = consecutive 0-cigarette days */
  smokeFreeDays: number;
  /** Gradual: consecutive days within target */
  disciplineDays: number;
  /** Days without any slip */
  flawlessDays: number;
  minutesSmokeFree: number;
  moneySaved: number;
  cravingsResisted: number;
  bestReductionPercent: number;
  hasZeroDay: boolean;
}

/** Health badges are based on real elapsed smoke-free time */
const HEALTH_BADGE_MINUTES: Record<string, number> = {
  health_20min: 20,
  health_12hours: 12 * 60,
  health_2weeks: 14 * MINUTES_PER_DAY,
  health_1month: 30 * MINUTES_PER_DAY,
  health_3months: 90 * MINUTES_PER_DAY,
  health_1year: 365 * MINUTES_PER_DAY,
};

/** Gradual-only badges are hidden for immediate quitters (they can never earn them) */
export function isAchievementAvailable(achievement: Achievement, isGradual: boolean): boolean {
  return achievement.category !== 'gradual' || isGradual;
}

/** Current value and goal, in the same unit */
function getAchievementValue(a: Achievement, ctx: AchievementContext): { value: number; goal: number } {
  switch (a.category) {
    case 'streak':
      return { value: ctx.smokeFreeDays, goal: a.requirement };
    case 'health':
      return { value: ctx.minutesSmokeFree, goal: HEALTH_BADGE_MINUTES[a.id] ?? a.requirement * MINUTES_PER_DAY };
    case 'savings':
      return { value: ctx.moneySaved, goal: a.requirement };
    case 'resistance':
      return a.id.startsWith('crisis_')
        ? { value: ctx.cravingsResisted, goal: a.requirement }
        : { value: ctx.flawlessDays, goal: a.requirement };
    case 'gradual':
      if (a.id === 'gradual_zero') return { value: ctx.hasZeroDay ? 1 : 0, goal: 1 };
      if (a.id === 'gradual_half' || a.id === 'gradual_75') {
        return { value: ctx.bestReductionPercent, goal: a.requirement };
      }
      return { value: ctx.disciplineDays, goal: a.requirement };
    default:
      return { value: 0, goal: 1 };
  }
}

export function isAchievementEarned(a: Achievement, ctx: AchievementContext): boolean {
  if (!isAchievementAvailable(a, ctx.isGradual)) return false;
  const { value, goal } = getAchievementValue(a, ctx);
  return goal > 0 && value >= goal;
}

/** 0..100 */
export function getAchievementProgress(a: Achievement, ctx: AchievementContext): number {
  const { value, goal } = getAchievementValue(a, ctx);
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((value / goal) * 100)));
}
