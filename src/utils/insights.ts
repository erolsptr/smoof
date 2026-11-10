/**
 * "Smoof learns": insights from the user's own data
 * (daily check-ins, craving logs and daily cigarette entries).
 *
 * Pure functions, no UI: risk times, plan suggestions, the weekly summary,
 * personal discoveries, the craving-screen tip and check-in badge counters.
 * Everything needs a minimum amount of data, so nothing is guessed from noise.
 */
import type { CrisisLog, DailyCheckIn, DailyStats, UserProfile } from '@/types';
import { addDays, getTodayString, parseDateKey, toDateKey } from '@/utils/dateHelpers';
import { getCurrentGradualTarget, getGradualSchedule } from '@/utils/gradualHelpers';
import { TRIGGER_TIPS, topTrigger } from '@/utils/checkInAdvice';
import { triggerLabel } from '@/constants/checkIn';

export const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
/** Check-ins needed before personal discoveries are shown */
export const DISCOVERY_MIN_CHECKINS = 14;

const isHardDay = (c: DailyCheckIn) => c.mood <= 2 || c.craving >= 2;
/** 3,5 (Turkish decimal comma, at most one decimal) */
const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
const avg = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);

// ─────────────────────────────────────────────
// 1. Risky times
// ─────────────────────────────────────────────
export interface RiskWindows {
  /** Hours of day (0-23) with repeated cravings, at most 2, ascending */
  hours: number[];
  /** Weekday (0 = Sunday) that is clearly the hardest, or null */
  hardWeekday: number | null;
}

/** From the last 4 weeks: hours with ≥3 cravings, and a clearly harder weekday */
export function getRiskWindows(crisisLogs: CrisisLog[], checkIns: DailyCheckIn[], today = getTodayString()): RiskWindows {
  const from = addDays(today, -27);
  const recentLogs = crisisLogs.filter((l) => toDateKey(l.timestamp) >= from && toDateKey(l.timestamp) <= today);

  const hourCounts = new Map<number, number>();
  recentLogs.forEach((l) => {
    const h = new Date(l.timestamp).getHours();
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  });
  const hours = [...hourCounts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 2)
    .map(([h]) => h)
    .sort((a, b) => a - b);

  // Hard check-in days and craving logs per weekday
  const dayScore = new Array(7).fill(0);
  checkIns.filter((c) => c.date >= from && c.date <= today && isHardDay(c)).forEach((c) => {
    dayScore[parseDateKey(c.date).getDay()] += 1;
  });
  recentLogs.forEach((l) => {
    dayScore[parseDateKey(toDateKey(l.timestamp)).getDay()] += 1;
  });
  const max = Math.max(...dayScore);
  const hardWeekday = max >= 3 && dayScore.filter((s) => s === max).length === 1 ? dayScore.indexOf(max) : null;

  return { hours, hardWeekday };
}

// ─────────────────────────────────────────────
// 2. Plan adjustment suggestion
// ─────────────────────────────────────────────
export interface PlanSuggestion {
  kind: 'slower' | 'faster' | 'immediate' | 'gradual';
  title: string;
  text: string;
  action: { label: string; href: string };
}

export function getPlanSuggestion(
  profile: UserProfile,
  dailyStats: DailyStats[],
  checkIns: DailyCheckIn[],
  crisisLogs: CrisisLog[],
  today = getTodayString(),
): PlanSuggestion | null {
  if (toDateKey(profile.quitDate) > today) return null; // not started
  const weekFrom = addDays(today, -7);
  const recentChecks = checkIns.filter((c) => c.date >= addDays(today, -4) && c.date <= today);
  const mood = avg(recentChecks.map((c) => c.mood));
  const craving = avg(recentChecks.map((c) => c.craving));

  if (profile.quitMethod === 'gradual') {
    // Only finished days (yesterday and before) of the last week
    const logged = dailyStats.filter((s) => s.date >= weekFrom && s.date < today);
    const over = logged.filter((s) => s.metGoal === false).length;
    const struggling = mood === null || mood <= 2.6 || (craving ?? 0) >= 2;
    if (over >= 3 && struggling) {
      return {
        kind: 'slower',
        title: 'Plan biraz hızlı mı geldi?',
        text: `Son bir haftada ${over} gün limitin üstüne çıktın ve zorlandığını görüyorum. Süreyi biraz uzatmak seni yormadan ilerletir.`,
        action: { label: 'Planı değiştir', href: '/change-plan' },
      };
    }

    const target = getCurrentGradualTarget(profile);
    const allMet = logged.length >= 5 && over === 0;
    const smokedAvg = avg(logged.map((s) => s.cigarettesSmoked));
    const targetAvg = avg(logged.map((s) => s.targetCigarettes ?? target)) ?? target;
    const feelingGood = mood === null || mood >= 3.5;
    if (allMet && smokedAvg !== null && target > 0 && smokedAvg <= targetAvg * 0.6 && feelingGood) {
      return target <= 2
        ? {
            kind: 'immediate',
            title: 'Sıfıra çok yakınsın! 🚀',
            text: `Bir haftadır limitinin çok altındasın (ortalama ${fmt(smokedAvg)} sigara). İstersen bugün tamamen bırakmaya geçebilirsin.`,
            action: { label: 'Hemen bırakmaya geç', href: '/change-method' },
          }
        : {
            kind: 'faster',
            title: 'Planın sana yavaş mı geliyor?',
            text: `Bir haftadır limitinin çok altındasın (ortalama ${fmt(smokedAvg)}, limit ${Math.round(targetAvg)}). Daha kısa bir plana geçip sıfıra daha erken inebilirsin.`,
            action: { label: 'Planı değiştir', href: '/change-plan' },
          };
    }
    return null;
  }

  // Immediate: repeated slips this week
  const slips = crisisLogs.filter((l) => !l.handled && toDateKey(l.timestamp) >= weekFrom).length;
  if (slips >= 3) {
    return {
      kind: 'gradual',
      title: 'Bir anda bırakmak zor mu geliyor?',
      text: `Bu hafta ${slips} kez kaydın. Bu bir başarısızlık değil; istersen haftalık azaltan bir plana geçip adım adım sıfıra inebiliriz.`,
      action: { label: 'Kademeli plana bak', href: '/change-method' },
    };
  }
  return null;
}

// ─────────────────────────────────────────────
// 3. Personal discoveries (needs enough check-ins)
// ─────────────────────────────────────────────
export interface Discovery {
  id: string;
  icon: string;
  text: string;
  /** Size of the effect, used for ordering */
  weight: number;
}

export function getDiscoveries(
  profile: UserProfile,
  checkIns: DailyCheckIn[],
  dailyStats: DailyStats[],
  crisisLogs: CrisisLog[],
): Discovery[] {
  if (checkIns.length < DISCOVERY_MIN_CHECKINS) return [];
  const list: Discovery[] = [];
  const statsByDate = new Map(dailyStats.map((s) => [s.date, s]));
  const allTriggers = new Set(checkIns.flatMap((c) => c.triggers));

  allTriggers.forEach((id) => {
    const withT = checkIns.filter((c) => c.triggers.includes(id));
    const without = checkIns.filter((c) => !c.triggers.includes(id));
    if (withT.length < 3 || without.length < 3) return;

    // Craving on days with vs. without this trigger
    const a = avg(withT.map((c) => c.craving))!;
    const b = avg(without.map((c) => c.craving))!;
    if (a - b >= 0.7) {
      const doubled = a >= Math.max(b, 0.5) * 1.8;
      list.push({
        id: `craving_${id}`,
        icon: TRIGGER_TIPS[id]?.icon ?? '🔎',
        text: `${triggerLabel(id)} olan günlerde sigara isteğin ${doubled ? 'neredeyse iki katına çıkıyor' : 'belirgin şekilde artıyor'}.`,
        weight: a - b,
      });
    }

    // Gradual: cigarettes on days with vs. without this trigger
    if (profile.quitMethod === 'gradual') {
      const smokedWith = withT.map((c) => statsByDate.get(c.date)?.cigarettesSmoked).filter((n): n is number => n !== undefined);
      const smokedWithout = without.map((c) => statsByDate.get(c.date)?.cigarettesSmoked).filter((n): n is number => n !== undefined);
      if (smokedWith.length >= 3 && smokedWithout.length >= 3) {
        const diff = avg(smokedWith)! - avg(smokedWithout)!;
        if (diff >= 1.5) {
          list.push({
            id: `smoked_${id}`,
            icon: '🚬',
            text: `${triggerLabel(id)} günlerinde ortalama ${fmt(diff)} sigara daha fazla içiyorsun.`,
            weight: diff / 2,
          });
        }
      }
    }
  });

  // Mood on calm-craving days vs. strong-craving days
  const calm = checkIns.filter((c) => c.craving <= 1);
  const strong = checkIns.filter((c) => c.craving >= 2);
  if (calm.length >= 3 && strong.length >= 3) {
    const diff = avg(calm.map((c) => c.mood))! - avg(strong.map((c) => c.mood))!;
    if (diff >= 1) {
      list.push({
        id: 'mood_craving',
        icon: '🌤️',
        text: 'İsteğin az olduğu günlerde kendini belirgin şekilde daha iyi hissediyorsun. Her atlattığın istek gününe de iyi geliyor.',
        weight: diff / 2,
      });
    }
  }

  // The hardest weekday
  const { hardWeekday } = getRiskWindows(crisisLogs, checkIns);
  if (hardWeekday !== null) {
    list.push({
      id: 'weekday',
      icon: '📅',
      text: `${WEEKDAYS[hardWeekday]} günleri senin için daha zor geçiyor. O gün için önceden küçük bir plan yapmak işe yarar.`,
      weight: 0.8,
    });
  }

  return list.sort((x, y) => y.weight - x.weight).slice(0, 3);
}

// ─────────────────────────────────────────────
// 4. Weekly summary (last 7 days, today included)
// ─────────────────────────────────────────────
export interface WeeklySummary {
  from: string;
  to: string;
  days: { date: string; mood: number | null }[];
  checkInCount: number;
  avgMood: number | null;
  prevAvgMood: number | null;
  cravingsResisted: number;
  slips: number;
  topTrigger: { id: string; count: number } | null;
  /** Gradual: days within the limit / days logged */
  gradual: { inTarget: number; logged: number } | null;
  /** Immediate: days this week since the quit day without a slip / days since the quit day */
  smokeFree: { days: number; of: number } | null;
  goal: { icon: string; title: string; text: string };
}

export function getWeeklySummary(
  profile: UserProfile,
  checkIns: DailyCheckIn[],
  dailyStats: DailyStats[],
  crisisLogs: CrisisLog[],
  today = getTodayString(),
): WeeklySummary {
  const from = addDays(today, -6);
  const inWeek = (d: string) => d >= from && d <= today;
  const week = checkIns.filter((c) => inWeek(c.date));
  const prevWeek = checkIns.filter((c) => c.date >= addDays(from, -7) && c.date < from);
  const logs = crisisLogs.filter((l) => inWeek(toDateKey(l.timestamp)));
  const isGradual = profile.quitMethod === 'gradual';
  const logged = dailyStats.filter((s) => inWeek(s.date));
  const trigger = topTrigger(week, 2);

  let goal: WeeklySummary['goal'];
  if (trigger && TRIGGER_TIPS[trigger.id]) {
    goal = {
      icon: TRIGGER_TIPS[trigger.id].icon,
      title: `${triggerLabel(trigger.id)} anlarına hazırlan`,
      text: TRIGGER_TIPS[trigger.id].text,
    };
  } else {
    const nextDrop = isGradual ? getGradualSchedule(profile).find((s) => s.from > today && s.from <= addDays(today, 7)) : undefined;
    goal = nextDrop
      ? {
          icon: '📉',
          title: `Limitin ${nextDrop.target}'e iniyor`,
          text: 'Bu hafta günün en kolay vazgeçebileceğin sigarasını seç ve ilk onu bırak.',
        }
      : {
          icon: '✍️',
          title: 'Her gün 30 saniye',
          text: 'Her akşam kısa bir check-in yap. Ne kadar çok bilirsem o kadar iyi yardım ederim.',
        };
  }

  return {
    from,
    to: today,
    days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(from, i);
      return { date, mood: week.find((c) => c.date === date)?.mood ?? null };
    }),
    checkInCount: week.length,
    avgMood: avg(week.map((c) => c.mood)),
    prevAvgMood: prevWeek.length >= 2 ? avg(prevWeek.map((c) => c.mood)) : null,
    cravingsResisted: logs.filter((l) => l.handled).length,
    slips: logs.filter((l) => !l.handled).length,
    topTrigger: trigger,
    gradual: isGradual ? { inTarget: logged.filter((s) => s.metGoal !== false).length, logged: logged.length } : null,
    smokeFree: isGradual ? null : (() => {
      const quitKey = toDateKey(profile.quitDate);
      const slipDays = new Set(logs.filter((l) => !l.handled).map((l) => toDateKey(l.timestamp)));
      const tracked = Array.from({ length: 7 }, (_, i) => addDays(from, i)).filter((d) => d >= quitKey);
      return { days: tracked.filter((d) => !slipDays.has(d)).length, of: tracked.length };
    })(),
    goal,
  };
}

// ─────────────────────────────────────────────
// 5. Personal line for the craving screen
// ─────────────────────────────────────────────
const SHORT_TIPS: Record<string, string> = {
  stress: 'Önce 3 uzun nefes, sonra karar ver.',
  coffee: 'Kahvenin yanına bir bardak su al, elin dolu olsun.',
  meal: 'Masadan kalk, dişlerini fırçala ya da biraz yürü.',
  social: 'Sigara içilen köşeden birkaç adım uzaklaş.',
  alcohol: 'Bir sonraki içeceğin su olsun.',
  boredom: 'Bir tur oyun, istek geçene kadar yeter.',
  work: '2 dakikalık bir mola ver: su iç, esne.',
  tired: 'Yorgunken istek daha güçlü gelir, bu normal. Geçecek.',
};

/** "Kahve anları seni zorlayabiliyor…" from the last 3 weeks, or null */
export function getCrisisInsight(checkIns: DailyCheckIn[], crisisLogs: CrisisLog[], today = getTodayString()): string | null {
  const from = addDays(today, -20);
  const recent = checkIns.filter((c) => c.date >= from);
  // Craving-log triggers count too (same ids for the shared ones)
  const fromLogs: DailyCheckIn[] = crisisLogs
    .filter((l) => l.trigger && toDateKey(l.timestamp) >= from)
    .map((l) => ({ date: toDateKey(l.timestamp), mood: 3, craving: 2, triggers: [l.trigger as string], createdAt: l.timestamp }));
  const top = topTrigger([...recent, ...fromLogs], 2);
  if (!top || !SHORT_TIPS[top.id]) return null;
  return `${triggerLabel(top.id)} anları seni zorlayabiliyor. ${SHORT_TIPS[top.id]}`;
}

// ─────────────────────────────────────────────
// 6. Check-in counters (badges)
// ─────────────────────────────────────────────
export function getCheckInStats(checkIns: DailyCheckIn[], today = getTodayString()) {
  const dates = new Set(checkIns.map((c) => c.date));
  // Consecutive days ending today (or yesterday, if today isn't done yet)
  let streak = 0;
  let date = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(date)) {
    streak++;
    date = addDays(date, -1);
  }
  return {
    count: checkIns.length,
    streak,
    hasCalmDay: checkIns.some((c) => c.craving === 0),
  };
}

