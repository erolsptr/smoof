import { UserProfile, DailyStats } from '@/types';
import { getCurrentGradualTarget } from './gradualHelpers';

/**
 * Kademeli modda gerçek içilmeyen sigara sayısını hesapla
 */
export function calculateGradualCigarettesAvoided(
  profile: UserProfile,
  dailyStats: DailyStats[]
): number {
  if (profile.quitMethod !== 'gradual') return 0;
  
  let totalAvoided = 0;
  const initialDailyCount = profile.dailyCigaretteCount; // Initial amount (e.g., 20)
  
  for (const stat of dailyStats) {
    const actual = stat.cigarettesSmoked || 0;
    
    // Başlangıçtaki miktardan ne kadar az içti?
    // Örnek: Başlangıç 20, içilen 10 → 10 sigara azalttı
    // Örnek: Başlangıç 20, içilen 25 → 0 (arttı, sayılmaz)
    const avoided = Math.max(0, initialDailyCount - actual);
    totalAvoided += avoided;
  }
  
  return totalAvoided;
}

/**
 * Kademeli modda para tasarrufu
 */
export function calculateGradualMoneySaved(
  profile: UserProfile,
  cigarettesAvoided: number
): number {
  return Math.floor((cigarettesAvoided / profile.cigarettesPerPack) * profile.packPrice);
}
