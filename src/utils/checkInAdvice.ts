/**
 * Turns a daily check-in into Smoof's reply: a short, warm message and at most
 * two concrete suggestions. Uses today's answers, the last 7 days and the quit
 * method. Kept short on purpose: caring, not lecturing.
 */
import type { DailyCheckIn } from '@/types';
import type { SmoofMood } from '@/components/smoof/Smoof';
import { triggerLabel } from '@/constants/checkIn';

export interface Advice {
  id: string;
  icon: string;
  title: string;
  text: string;
  action?: { label: string; href: string };
}

export interface CheckInResponse {
  mood: SmoofMood;
  headline: string;
  message: string;
  advice: Advice[];
}

export interface AdviceContext {
  checkIn: DailyCheckIn;
  /** Check-ins of the last 7 days, today included */
  recent: DailyCheckIn[];
  isGradual: boolean;
  isPreparation: boolean;
  /** Immediate: smoke-free days. Gradual: discipline days */
  streakDays: number;
  moneySaved: number;
  /** Gradual only */
  todayTarget?: number;
  todaySmoked?: number | null;
  nextDrop?: { daysUntil: number; target: number } | null;
}

const BREATH = { label: 'Nefes egzersizi', href: '/crisis?open=breath' };
const GAME = { label: 'Saklambaç oyna', href: '/crisis?open=hide' };

export const TRIGGER_TIPS: Record<string, Omit<Advice, 'id' | 'title'> & { title: string }> = {
  stress: {
    icon: '🫁',
    title: 'Stres anı için mini plan',
    text: '4 saniye al, 2 tut, 6 saniyede ver. Uzun nefes vermek vücudu sakinleştirir ve istek dalgası geçer.',
    action: BREATH,
  },
  coffee: {
    icon: '☕',
    title: 'Kahveyle bağı gevşet',
    text: 'Bir süre kahveni farklı bir yerde ya da farklı bir bardakta iç, yanına bir bardak su ekle. Alışkanlık zinciri kırılır.',
  },
  meal: {
    icon: '🪥',
    title: 'Yemekten sonra hemen kalk',
    text: 'Dişlerini fırçala, sakız çiğne ya da 5 dakika yürü. Yemek sonrası sigara en çok “otomatik” olanıdır.',
  },
  social: {
    icon: '🥤',
    title: 'Sosyal ortamda elin dolu olsun',
    text: 'Elinde bir içecek tut, sigara içilen köşeden uzak dur. Bıraktığını söylemek de arkadaşlarını yanına çeker.',
  },
  alcohol: {
    icon: '💧',
    title: 'Alkol iradeyi yorar',
    text: 'Bu dönemde azaltmak ya da her içeceğin arasına bir bardak su koymak isteği belirgin şekilde düşürür.',
  },
  boredom: {
    icon: '🎮',
    title: 'Ellerini ve aklını meşgul et',
    text: 'Can sıkıntısı istek için en kolay kapı. Kısa bir oyun, yürüyüş ya da sevdiğin bir şarkı yeter.',
    action: GAME,
  },
  work: {
    icon: '⏱️',
    title: 'Sigara molasını değiştir',
    text: 'Her saat 2 dakikalık mini mola ver: su iç, esne, pencereden bak. Mola kalsın, sigara gitsin.',
  },
  tired: {
    icon: '🌙',
    title: 'Yorgunken istek güçlenir',
    text: 'Bu akşam biraz erken yatmak yarını kolaylaştırır. Uykusuzluk isteği en çok büyüten şeylerden biri.',
  },
};

function formatMoney(amount: number): string {
  return `${Math.floor(amount).toLocaleString('tr-TR')} ₺`;
}

/** Most frequent trigger in the given check-ins, if it shows up at least `min` times */
export function topTrigger(checkIns: DailyCheckIn[], min = 1): { id: string; count: number } | null {
  const counts = new Map<string, number>();
  checkIns.forEach((c) => c.triggers.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  let best: { id: string; count: number } | null = null;
  counts.forEach((count, id) => {
    if (count >= min && (!best || count > best.count)) best = { id, count };
  });
  return best;
}

export function getCheckInResponse(ctx: AdviceContext): CheckInResponse {
  const { checkIn, recent, isGradual, isPreparation, streakDays } = ctx;
  const good = checkIn.mood >= 4;
  const hard = checkIn.mood <= 2;
  const advice: Advice[] = [];
  const add = (a: Advice) => {
    if (advice.length < 2 && !advice.some((x) => x.id === a.id)) advice.push(a);
  };

  // ── Smoof's message ─────────────────────────
  let mood: SmoofMood;
  let headline: string;
  let message: string;
  if (good) {
    mood = checkIn.craving === 0 ? 'proud' : 'happy';
    headline = checkIn.mood === 5 ? 'Bunu duymak harika! 🎉' : 'Güzel bir gün olmuş 🙂';
    message = isPreparation
      ? 'Başlamadan önce iyi hissetmen çok değerli. Bu enerjiyi koru!'
      : isGradual
        ? `${streakDays > 0 ? `${streakDays} gündür hedefindesin. ` : ''}Böyle günler planını güçlendiriyor.`
        : `${streakDays > 0 ? `${streakDays} gündür sigarasızsın. ` : ''}Her iyi gün bir sonrakini kolaylaştırıyor.`;
  } else if (hard) {
    mood = 'supportive';
    headline = 'Zor bir gün geçirmişsin, yanındayım 💚';
    message = isGradual
      ? 'Bazı günler ağır geçer, bu çok normal. Limitini aşsan bile yarın yeniden başlarız.'
      : streakDays > 0
        ? `Zorlandın ama ${streakDays} günü sen kazandın. Bu his geçecek, sen kalacaksın.`
        : 'Zorlandığını söylemen bile güçlü bir adım. Bu his geçecek.';
  } else {
    mood = 'calm';
    headline = 'İdare eden günler de yolun parçası';
    message = 'Her gün harika geçmek zorunda değil. Önemli olan devam etmek, sen de ediyorsun 👏';
  }

  // Trend: mood of the last 3 days vs. the 4 before
  const byDate = [...recent].sort((a, b) => a.date.localeCompare(b.date));
  if (byDate.length >= 5) {
    const avg = (list: DailyCheckIn[]) => list.reduce((s, c) => s + c.mood, 0) / list.length;
    const last = avg(byDate.slice(-3));
    const before = avg(byDate.slice(0, -3));
    if (last - before >= 0.8) message += ' Son günlerde kendini daha iyi hissediyorsun 📈';
  }

  // ── Suggestions, most personal first ────────
  // 1. A trigger that keeps coming back this week
  const pattern = topTrigger(recent, 3);
  if (pattern && TRIGGER_TIPS[pattern.id]) {
    const tip = TRIGGER_TIPS[pattern.id];
    add({
      id: `trigger_${pattern.id}`,
      icon: tip.icon,
      title: `Bu hafta ${pattern.count} kez ${triggerLabel(pattern.id).toLocaleLowerCase('tr-TR')} zorladı`,
      text: tip.text,
      action: tip.action,
    });
  }

  // 2. What made today hard (the first one the user picked)
  for (const id of checkIn.triggers) {
    const tip = TRIGGER_TIPS[id];
    if (tip && advice.length < 2) {
      add({ id: `trigger_${id}`, ...tip });
      break;
    }
  }

  // 3. Strong cravings: an instant tool (not the same one twice)
  if (checkIn.craving >= 2) {
    const breathOffered = advice.some((a) => a.action?.href === BREATH.href);
    add({
      id: 'craving',
      icon: '🌊',
      title: 'İstek gelince 2 dakika ver',
      text: breathOffered
        ? 'İstek dalga gibi yükselir ve birkaç dakikada geçer. Kısa bir oyun o dakikaları fark etmeden geçirir.'
        : 'İstek dalga gibi yükselir ve birkaç dakikada geçer. O anı nefes egzersizi ya da kısa bir oyunla atlat.',
      action: breathOffered ? GAME : BREATH,
    });
  }

  // 4. Gradual: today's limit and the next drop
  if (isGradual && !isPreparation && ctx.todayTarget !== undefined) {
    if (ctx.todaySmoked != null && ctx.todaySmoked > ctx.todayTarget) {
      add({
        id: 'gradual_over',
        icon: '🗓️',
        title: 'Yarın için küçük bir plan',
        text: `Bugün limitin ${ctx.todayTarget} sigaraydı. Yarın en çok zorlandığın saati önceden düşün ve o an için bir alternatif hazırla.`,
      });
    } else if (ctx.todaySmoked == null) {
      add({
        id: 'gradual_log',
        icon: '✍️',
        title: 'Bugünü takvime ekle',
        text: `Bugünkü limitin ${ctx.todayTarget} sigara. Gün bitince kaç tane içtiğini girmeyi unutma, serin buna bakıyor.`,
        action: { label: 'Bugünü gir', href: '/daily-logger' },
      });
    }
    if (ctx.nextDrop && ctx.nextDrop.daysUntil <= 3) {
      add({
        id: 'gradual_drop',
        icon: '📉',
        title: ctx.nextDrop.daysUntil <= 1 ? `Yarın limitin ${ctx.nextDrop.target}` : `${ctx.nextDrop.daysUntil} gün sonra limitin ${ctx.nextDrop.target}`,
        text: 'Hazırlık için günün en kolay vazgeçebileceğin sigarasını şimdiden seç ve onu ilk bırakacağın sigara yap.',
      });
    }
  }

  // 5. Hard day without a clear reason
  if (hard) {
    add({
      id: 'kind',
      icon: '🤗',
      title: 'Kendine nazik ol',
      text: 'Sevdiğin birine yazmak ya da 10 dakikalık bir yürüyüş çoğu zaman sandığından fazla iyi gelir.',
    });
  }

  // 6. Good day: make it count
  if (good && !isPreparation) {
    if (!isGradual && ctx.moneySaved >= 50) {
      add({
        id: 'reward',
        icon: '🎁',
        title: `${formatMoney(ctx.moneySaved)} biriktirdin`,
        text: 'Bu paranın küçük bir kısmıyla kendine bir ödül planla. Kazandığını görmek motivasyonu besler.',
      });
    }
    add({
      id: 'repeat',
      icon: '✨',
      title: 'Bu günün sırrı neydi?',
      text: 'Bugünü kolaylaştıran şeyi fark et ve yarın da tekrar etmeye çalış.',
    });
  }

  // Not started yet: prepare
  if (isPreparation) {
    add({
      id: 'prep',
      icon: '📝',
      title: 'Başlangıca küçük bir hazırlık',
      text: 'Bugün sigara içtiğin anları fark et: hangi saat, nerede, kiminle? Başladığında hangi anlara hazırlanacağını bileceksin.',
    });
  }

  // Always at least one suggestion
  if (advice.length === 0) {
    add({
      id: 'water',
      icon: '💧',
      title: 'Küçük ama etkili',
      text: 'Gün içinde bol su içmek ve kısa yürüyüşler istekleri hafifletir.',
    });
  }

  return { mood, headline, message, advice };
}
