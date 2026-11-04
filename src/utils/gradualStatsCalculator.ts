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
  
  for (const stat of dailyStats) {
    const target = stat.targetCigarettes || getCurrentGradualTarget(profile);
    const actual = stat.cigarettesSmoked || 0;
    
    // Hedeften ne kadar az içti?
    // Örnek: Hedef 14, içilen 10 → 4 sigara azalttı
    // Hedef 14, içilen 18 → 0 (aştı, sayılmaz)
    const avoided = Math.max(0, target - actual);
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
