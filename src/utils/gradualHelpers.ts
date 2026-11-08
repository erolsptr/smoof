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

/**
 * Belirli bir gün (YYYY-MM-DD, yerel) için günlük sigara limiti.
 * Plan: 1. hafta ilk hedef, her hafta eşit azalır, seçilen hafta sayısı dolunca 0.
 * Kullanıcı hedefi elle düşürdüyse o günden itibaren yeni hedeften aynı bitiş
 * tarihine kadar yeniden planlanır (geçmiş günler değişmez).
 */
export function getGradualTargetForDate(profile: UserProfile, dateKey: string): number {
  if (profile.quitMethod !== 'gradual' || !profile.gradualStartDate) {
    return 0;
  }

  const { startDate, initialTarget, totalWeeks } = getGradualPlanInputs(profile);
  const week = Math.floor(Math.max(0, dayIndex(startDate, dateKey)) / 7);
  let target = linearWeekTarget(initialTarget, 0, totalWeeks, week);

  // Latest manual change that is already in effect on this day
  const change = (profile.gradualTargetChanges ?? [])
    .filter((c) => c.from <= dateKey)
    .sort((a, b) => a.from.localeCompare(b.from))
    .pop();
  if (change) {
    const changeWeek = Math.floor(Math.max(0, dayIndex(startDate, change.from)) / 7);
    target = Math.min(target, linearWeekTarget(change.target, changeWeek, totalWeeks, week));
  }

  return target;
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
  // Changes can only lower the limit, so 0 is reached by the planned end at the latest
  for (let i = 0; i <= totalWeeks * 7; i++) {
    const date = addDays(startDate, i);
    if (getGradualTargetForDate(profile, date) === 0) return date;
  }
  return addDays(startDate, totalWeeks * 7);
}

export interface GradualPlanStep {
  /** 1-based plan week of the first day */
  week: number;
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
    if (last && last.target === target) {
      last.to = date;
    } else {
      steps.push({ week: Math.floor(dayIndex(startDate, date) / 7) + 1, from: date, to: date, target });
    }
  }
  steps.push({ week: Math.floor(dayIndex(startDate, zeroDate) / 7) + 1, from: zeroDate, to: null, target: 0 });
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
