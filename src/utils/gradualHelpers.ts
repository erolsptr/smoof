import { UserProfile } from '@/types';

/**
 * Kullanıcının şu anki hedef sigara sayısını hesaplar
 * Otomatik azalma mantığı ile çalışır
 */
export function getCurrentGradualTarget(profile: UserProfile): number {
  if (profile.quitMethod !== 'gradual' || !profile.gradualStartDate) {
    return 0;
  }
  
  const startDate = new Date(profile.gradualStartDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  
  const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
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
 * Son N günün tarihlerini döndürür (ISO string formatında)
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Tarih için gün adını döndürür (Pzt, Sal, vb.)
 */
export function getDayName(dateString: string, index?: number): string {
  const date = new Date(dateString);
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  
  // Bugünse "Bugün" yaz
  const today = new Date().toISOString().split('T')[0];
  if (dateString === today) {
    return 'Bugün';
  }
  
  return dayNames[date.getDay()];
}

/**
 * Tarihi formatla (12 Ocak gibi)
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
