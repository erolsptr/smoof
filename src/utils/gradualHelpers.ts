import { UserProfile } from '@/types';
import { getDateString, getTodayString, parseDateKey, toDateKey } from '@/utils/dateHelpers';

/**
 * Takibin başladığı gün (yerel YYYY-MM-DD).
 * Bu tarihten önceki günlere giriş yapılamaz, rozet/freeze hesaplanmaz.
 */
export function getTrackingStartDate(profile: UserProfile): string {
  return toDateKey(profile.gradualStartDate ?? profile.quitDate);
}

/**
 * Belirli bir gün (YYYY-MM-DD, yerel) için hedef sigara sayısını hesaplar
 * Otomatik haftalık azalma mantığı ile çalışır
 */
export function getGradualTargetForDate(profile: UserProfile, dateKey: string): number {
  if (profile.quitMethod !== 'gradual' || !profile.gradualStartDate) {
    return 0;
  }

  const startDate = parseDateKey(profile.gradualStartDate);
  const date = parseDateKey(dateKey);

  const daysPassed = Math.max(0, Math.round((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksPassed = Math.floor(daysPassed / 7);

  const startCount = profile.gradualStartCount || profile.dailyCigaretteCount;
  const weeklyReduction = profile.gradualWeeklyReduction || 0;

  // Otomatik azaltma hesabı
  const currentTarget = Math.max(0, startCount - (weeksPassed * weeklyReduction));

  // Manuel değiştirildiyse ve daha düşükse onu kullan
  if (profile.gradualCurrentTarget !== undefined && profile.gradualCurrentTarget < currentTarget) {
    return profile.gradualCurrentTarget;
  }

  return Math.round(currentTarget);
}

/**
 * Kullanıcının bugünkü hedef sigara sayısını hesaplar
 */
export function getCurrentGradualTarget(profile: UserProfile): number {
  return getGradualTargetForDate(profile, getTodayString());
}

/**
 * Bu haftanın hedefini döndürür (getCurrentGradualTarget ile aynı)
 */
export function getThisWeekTarget(profile: UserProfile): number {
  return getCurrentGradualTarget(profile);
}

/**
 * Gelecek haftanın hedefini döndürür (önizleme için)
 */
export function getNextWeekTarget(profile: UserProfile): number {
  if (profile.quitMethod !== 'gradual') return 0;
  
  const currentTarget = getCurrentGradualTarget(profile);
  const weeklyReduction = profile.gradualWeeklyReduction || 0;
  
  return Math.max(0, currentTarget - weeklyReduction);
}

/**
 * Son N günün tarihlerini döndürür (yerel YYYY-MM-DD)
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
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
