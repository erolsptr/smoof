import { UserProfile } from '@/types';
import { addDays, getDateString, getTodayString, parseDateKey, toDateKey } from '@/utils/dateHelpers';
import { linearWeekTarget } from '@/utils/gradualPlan';
import { newDate } from '@/utils/clock';

/**
 * Takibin başladığı gün (yerel YYYY-MM-DD).
 * Bu tarihten önceki günlere giriş yapılamaz, rozet/freeze hesaplanmaz.
 */
export function getTrackingStartDate(profile: UserProfile): string {
  return toDateKey(profile.gradualStartDate ?? profile.quitDate);
}

const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_WEEKS = 6;

function dayIndex(startKey: string, dateKey: string): number {
  return Math.round((parseDateKey(dateKey).getTime() - parseDateKey(startKey).getTime()) / DAY_MS);
}

/** Plan inputs, with fallbacks for profiles created before the plan fix */
export function getGradualPlanInputs(profile: UserProfile) {
  const startCount = profile.gradualStartCount || profile.dailyCigaretteCount;
  return {
    startDate: getTrackingStartDate(profile),
    startCount,
    initialTarget: profile.gradualInitialTarget ?? profile.gradualCurrentTarget ?? startCount,
    totalWeeks: profile.gradualTargetWeeks || DEFAULT_WEEKS,
  };
}

function weekIndex(anchorKey: string, dateKey: string): number {
  return Math.floor(Math.max(0, dayIndex(anchorKey, dateKey)) / 7);
}

/**
 * One linear piece of the plan: from `fromTarget` in week `fromWeek`
 * (weeks counted from `anchor`) down to 0 after `totalWeeks` weeks.
 */
interface PlanSegment {
  anchor: string;
  fromWeek: number;
  fromTarget: number;
  totalWeeks: number;
}

/**
 * Plan segments in effect on a day. Changes are applied in date order:
 * - plan change (has `weeks`): a fresh plan from that day, from the limit of
 *   that day to 0 in `weeks` weeks (weeks counted from the change day)
 * - target change: re-plans from the new limit to the same end date
 * Changes after `dateKey` are ignored, so past days keep their limits.
 */
function getPlanSegments(profile: UserProfile, dateKey: string): PlanSegment[] {
  const { startDate, initialTarget, totalWeeks } = getGradualPlanInputs(profile);
  let segments: PlanSegment[] = [{ anchor: startDate, fromWeek: 0, fromTarget: initialTarget, totalWeeks }];

  const changes = (profile.gradualTargetChanges ?? [])
    .filter((c) => c.from <= dateKey)
    .sort((a, b) => a.from.localeCompare(b.from));

  for (const change of changes) {
    if (change.weeks) {
      segments = [{ anchor: change.from, fromWeek: 0, fromTarget: change.target, totalWeeks: change.weeks }];
    } else {
      const base = segments[0];
      segments.push({
        anchor: base.anchor,
        fromWeek: weekIndex(base.anchor, change.from),
        fromTarget: change.target,
        totalWeeks: base.totalWeeks,
      });
    }
  }
  return segments;
}

/**
 * Belirli bir gün (YYYY-MM-DD, yerel) için günlük sigara limiti.
 * Plan: 1. hafta ilk hedef, her hafta eşit azalır, seçilen hafta sayısı dolunca 0.
 * Hedef düşürülürse ya da plan süresi değiştirilirse o günden itibaren yeniden
 * planlanır; geçmiş günlerin limitleri değişmez.
 */
export function getGradualTargetForDate(profile: UserProfile, dateKey: string): number {
  if (profile.quitMethod !== 'gradual' || !profile.gradualStartDate) {
    return 0;
  }
  // Each segment only lowers the limit (a manual target change never raises it)
  return Math.min(
    ...getPlanSegments(profile, dateKey).map((seg) =>
      linearWeekTarget(seg.fromTarget, seg.fromWeek, seg.totalWeeks, weekIndex(seg.anchor, dateKey)),
    ),
  );
}

/** The plan choice in effect on a day: duration in weeks and the day it was chosen */
export function getActivePlan(profile: UserProfile, dateKey: string = getTodayString()) {
  const base = getPlanSegments(profile, dateKey)[0];
  return {
    /** Weeks chosen (4, 6, 8, 12), counted from `since` */
    weeks: base.totalWeeks,
    since: base.anchor,
    /** Limits drop on this weekday */
    anchor: base.anchor,
    isChanged: base.anchor !== getGradualPlanInputs(profile).startDate,
  };
}

/**
 * Kullanıcının bugünkü hedef sigara sayısını hesaplar
 */
export function getCurrentGradualTarget(profile: UserProfile): number {
  return getGradualTargetForDate(profile, getTodayString());
}

/** First day the daily limit is 0 (null if not gradual) */
export function getGradualZeroDate(profile: UserProfile): string | null {
  if (profile.quitMethod !== 'gradual' || !profile.gradualStartDate) return null;
  const { startDate, totalWeeks } = getGradualPlanInputs(profile);
  // Latest possible end: the original plan or any later plan change
  let end = addDays(startDate, totalWeeks * 7);
  for (const c of profile.gradualTargetChanges ?? []) {
    if (c.weeks) {
      const changeEnd = addDays(c.from, c.weeks * 7);
      if (changeEnd > end) end = changeEnd;
    }
  }
  for (let date = startDate; date < end; date = addDays(date, 1)) {
    if (getGradualTargetForDate(profile, date) === 0) return date;
  }
  return end;
}

export interface GradualPlanStep {
  /** 1-based plan week of the first day */
  week: number;
  /** 1-based plan week of the last day (same as `week` unless the limit spans weeks) */
  toWeek: number;
  from: string;
  /** Last day with this limit (null for the final 0 step: it lasts forever) */
  to: string | null;
  target: number;
}

/**
 * The whole plan as steps of consecutive days with the same daily limit,
 * from the start day up to and including the first 0 day.
 */
export function getGradualSchedule(profile: UserProfile): GradualPlanStep[] {
  const zeroDate = getGradualZeroDate(profile);
  if (!zeroDate) return [];
  const { startDate } = getGradualPlanInputs(profile);

  const steps: GradualPlanStep[] = [];
  for (let date = startDate; date < zeroDate; date = addDays(date, 1)) {
    const target = getGradualTargetForDate(profile, date);
    const last = steps[steps.length - 1];
    const week = Math.floor(dayIndex(startDate, date) / 7) + 1;
    if (last && last.target === target) {
      last.to = date;
      last.toWeek = week;
    } else {
      steps.push({ week, toWeek: week, from: date, to: date, target });
    }
  }
  const zeroWeek = Math.floor(dayIndex(startDate, zeroDate) / 7) + 1;
  steps.push({ week: zeroWeek, toWeek: zeroWeek, from: zeroDate, to: null, target: 0 });
  return steps;
}

/**
 * Son N günün tarihlerini döndürür (yerel YYYY-MM-DD)
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = newDate();
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(getDateString(date));
  }
  
  return dates;
}

/**
 * Tarih için gün adını döndürür (Pzt, Sal, vb.)
 */
export function getDayName(dateString: string, index?: number): string {
  const date = parseDateKey(dateString);
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  
  if (dateString === getTodayString()) {
    return 'Bugün';
  }
  
  return dayNames[date.getDay()];
}

/**
 * Tarihi formatla (12 Ocak gibi)
 */
export function formatDateShort(dateString: string): string {
  const date = parseDateKey(dateString);
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
