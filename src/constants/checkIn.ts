import type { DailyCheckIn } from '@/types';

/** Daily check-in answer options (labels are shown to the user) */

export const CHECK_IN_MOODS: { value: DailyCheckIn['mood']; emoji: string; label: string }[] = [
  { value: 1, emoji: '😣', label: 'Çok zor' },
  { value: 2, emoji: '😕', label: 'Zor' },
  { value: 3, emoji: '😐', label: 'İdare eder' },
  { value: 4, emoji: '🙂', label: 'İyi' },
  { value: 5, emoji: '😄', label: 'Harika' },
];

export const CHECK_IN_CRAVINGS: { value: DailyCheckIn['craving']; label: string; hint: string }[] = [
  { value: 0, label: 'Hiç', hint: 'Aklıma bile gelmedi' },
  { value: 1, label: 'Biraz', hint: 'Geldi, geçti' },
  { value: 2, label: 'Orta', hint: 'Birkaç kez zorladı' },
  { value: 3, label: 'Çok', hint: 'Bütün gün peşimdeydi' },
];

export const CHECK_IN_TRIGGERS: { id: string; emoji: string; label: string }[] = [
  { id: 'stress', emoji: '😰', label: 'Stres' },
  { id: 'coffee', emoji: '☕', label: 'Kahve / çay' },
  { id: 'meal', emoji: '🍽️', label: 'Yemek sonrası' },
  { id: 'social', emoji: '👥', label: 'Sosyal ortam' },
  { id: 'alcohol', emoji: '🍺', label: 'Alkol' },
  { id: 'boredom', emoji: '😑', label: 'Can sıkıntısı' },
  { id: 'work', emoji: '💼', label: 'İş / ders' },
  { id: 'tired', emoji: '😴', label: 'Yorgunluk' },
];

export const triggerLabel = (id: string) => CHECK_IN_TRIGGERS.find((t) => t.id === id)?.label ?? id;
export const moodEmoji = (mood: number) => CHECK_IN_MOODS.find((m) => m.value === mood)?.emoji ?? '🙂';
