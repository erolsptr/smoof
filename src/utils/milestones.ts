/**
 * Milestones for the immediate-quit home screen.
 * Kept in sync with the streak and health badges in constants/achievements.ts.
 */

const STREAK_MILESTONES = [1, 3, 7, 14, 30, 90, 180, 365];

const MINUTE = 1;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const YEAR = 365 * DAY;

/**
 * Body recovery timeline after the last cigarette (general public-health figures).
 * The health badges use a subset of these (see HEALTH_BADGE_MINUTES in progressMetrics).
 */
export const HEALTH_MILESTONES: { minutes: number; label: string; title: string; detail: string }[] = [
  { minutes: 20 * MINUTE, label: '20 dakika', title: 'Kalp atışın normale dönüyor', detail: 'Nabzın ve tansiyonun normale yaklaşır.' },
  { minutes: 12 * HOUR, label: '12 saat', title: 'Kan oksijen seviyen artıyor', detail: 'Kandaki karbonmonoksit düşer, oksijen artar.' },
  { minutes: 2 * DAY, label: '48 saat', title: 'Tat ve koku duyuların güçleniyor', detail: 'Sinir uçları toparlanmaya başlar.' },
  { minutes: 3 * DAY, label: '72 saat', title: 'Nefes almak kolaylaşıyor', detail: 'Bronşlar gevşer, enerjin artar.' },
  { minutes: 14 * DAY, label: '2 hafta', title: 'Kan dolaşımın iyileşiyor', detail: 'Yürümek ve egzersiz yapmak kolaylaşır.' },
  { minutes: 30 * DAY, label: '1 ay', title: 'Akciğerlerin iyileşiyor', detail: 'Öksürük ve nefes darlığı azalmaya başlar.' },
  { minutes: 90 * DAY, label: '3 ay', title: 'Öksürüğün azalıyor', detail: 'Akciğer kapasiten belirgin şekilde artar.' },
  { minutes: YEAR, label: '1 yıl', title: 'Kalp krizi riskin yarıya iniyor', detail: 'Koroner kalp hastalığı riskin yarı yarıya düşer.' },
  { minutes: 5 * YEAR, label: '5 yıl', title: 'İnme riskin azalıyor', detail: 'İnme riskin belirgin şekilde düşer.' },
  { minutes: 10 * YEAR, label: '10 yıl', title: 'Akciğer kanseri riskin yarıya iniyor', detail: 'Akciğer kanseri riskin içenlere göre yarıya iner.' },
];

/**
 * Next streak milestone and progress (0..1) from the previous one.
 * After 1 year, every full year is the next milestone.
 */
export function getNextStreakMilestone(streakDays: number): {
  target: number;
  remaining: number;
  progress: number;
} {
  let previous = 0;
  let target = STREAK_MILESTONES.find((m) => m > streakDays);

  if (target === undefined) {
    previous = Math.floor(streakDays / 365) * 365;
    target = previous + 365;
  } else {
    const index = STREAK_MILESTONES.indexOf(target);
    previous = index > 0 ? STREAK_MILESTONES[index - 1] : 0;
  }

  return {
    target,
    remaining: target - streakDays,
    progress: (streakDays - previous) / (target - previous),
  };
}

/**
 * Next health milestone based on minutes since quitting.
 * Returns null when all milestones are reached.
 */
export function getNextHealthMilestone(minutesSinceQuit: number): {
  title: string;
  minutesLeft: number;
  progress: number;
  reachedCount: number;
} | null {
  const index = HEALTH_MILESTONES.findIndex((m) => m.minutes > minutesSinceQuit);
  if (index === -1) return null;

  const previous = index > 0 ? HEALTH_MILESTONES[index - 1].minutes : 0;
  const next = HEALTH_MILESTONES[index];

  return {
    title: next.title,
    minutesLeft: next.minutes - minutesSinceQuit,
    progress: (minutesSinceQuit - previous) / (next.minutes - previous),
    reachedCount: index,
  };
}

/**
 * "3 gün 4 sa", "5 sa 12 dk", "8 dk"
 */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.ceil(totalMinutes));
  const days = Math.floor(minutes / DAY);
  const hours = Math.floor((minutes % DAY) / HOUR);
  const mins = minutes % HOUR;

  if (days > 0) return hours > 0 ? `${days} gün ${hours} sa` : `${days} gün`;
  if (hours > 0) return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
  return `${mins} dk`;
}
