/**
 * Gradual reduction plan math (pure, no app imports, so it is easy to test).
 *
 * The plan works in weeks counted from the start day:
 * - Week 1 (index 0) the limit is the user's first target.
 * - The limit goes down evenly every week.
 * - After `totalWeeks` full weeks it is 0, so the first smoke-free day is
 *   start + totalWeeks * 7 days. "6 weeks" really means 6 weeks.
 *
 * Limits are rounded up, so every week before the last stays at least 1
 * and the limit never goes up.
 */

/** Plan choices (weeks until 0) and their names */
export const PLAN_NAMES: Record<number, string> = { 4: 'Hızlı', 6: 'Dengeli', 8: 'Rahat', 12: 'Çok Rahat' };

/** Daily limit for a week, linear from `fromTarget` (at `fromWeek`) to 0 at `totalWeeks` */
export function linearWeekTarget(
  fromTarget: number,
  fromWeek: number,
  totalWeeks: number,
  weekIndex: number,
): number {
  if (weekIndex >= totalWeeks || fromWeek >= totalWeeks || fromTarget <= 0) return 0;
  if (weekIndex <= fromWeek) return fromTarget;
  return Math.ceil((fromTarget * (totalWeeks - weekIndex)) / (totalWeeks - fromWeek));
}

/** Daily limit per week for a fresh plan (index 0 = week 1). Last entry is 0. */
export function planWeekTargets(initialTarget: number, totalWeeks: number): number[] {
  return Array.from({ length: totalWeeks + 1 }, (_, week) =>
    linearWeekTarget(initialTarget, 0, totalWeeks, week),
  );
}

/** Short Turkish description of the weekly pace, e.g. "Her hafta ~2 sigara azalt" */
export function describeWeeklyPace(initialTarget: number, totalWeeks: number): string {
  if (initialTarget <= 0) return 'Hemen sigarasız';
  if (initialTarget >= totalWeeks) {
    return `Her hafta ~${Math.round(initialTarget / totalWeeks)} sigara azalt`;
  }
  const every = Math.round(totalWeeks / initialTarget);
  return every <= 1 ? 'Her hafta 1 sigara azalt' : `${every} haftada bir 1 sigara azalt`;
}
