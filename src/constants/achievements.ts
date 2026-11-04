import type { Achievement } from '@/types';

/**
 * All available achievements in the app
 */
export const ACHIEVEMENTS: Achievement[] = [
  // STREAK ACHIEVEMENTS
  {
    id: 'streak_1',
    title: 'İlk Adım',
    description: '1 gün sigarasız',
    icon: 'footsteps',
    iconColor: '#3B82F6',
    category: 'streak',
    requirement: 1,
  },
  {
    id: 'streak_3',
    title: 'Güçlü Başlangıç',
    description: '3 gün sigarasız',
    icon: 'trending-up',
    iconColor: '#10B981',
    category: 'streak',
    requirement: 3,
  },
  {
    id: 'streak_7',
    title: 'Bir Hafta!',
    description: '7 gün sigarasız',
    icon: 'calendar',
    iconColor: '#8B5CF6',
    category: 'streak',
    requirement: 7,
  },
  {
    id: 'streak_14',
    title: 'İki Hafta Kahramanı',
    description: '14 gün sigarasız',
    icon: 'medal',
    iconColor: '#F59E0B',
    category: 'streak',
    requirement: 14,
  },
  {
    id: 'streak_30',
    title: 'Bir Aylık Zafer',
    description: '30 gün sigarasız',
    icon: 'trophy',
    iconColor: '#EF4444',
    category: 'streak',
    requirement: 30,
  },
  {
    id: 'streak_90',
    title: '3 Ay Efsanesi',
    description: '90 gün sigarasız',
    icon: 'star',
    iconColor: '#EC4899',
    category: 'streak',
    requirement: 90,
  },
  {
    id: 'streak_180',
    title: 'Yarım Yıl Şampiyonu',
    description: '180 gün sigarasız',
    icon: 'ribbon',
    iconColor: '#6366F1',
    category: 'streak',
    requirement: 180,
  },
  {
    id: 'streak_365',
    title: 'Bir Yıllık Efsane',
    description: '365 gün sigarasız',
    icon: 'diamond',
    iconColor: '#06B6D4',
    category: 'streak',
    requirement: 365,
  },

  // SAVINGS ACHIEVEMENTS
  {
    id: 'savings_100',
    title: 'İlk Yüzlük',
    description: '₺100 tasarruf',
    icon: 'cash',
    iconColor: '#10B981',
    category: 'savings',
    requirement: 100,
  },
  {
    id: 'savings_500',
    title: 'Cüzdan Doldu',
    description: '₺500 tasarruf',
    icon: 'wallet',
    iconColor: '#3B82F6',
    category: 'savings',
    requirement: 500,
  },
  {
    id: 'savings_1000',
    title: 'Binlik Tasarruf',
    description: '₺1000 tasarruf',
    icon: 'card',
    iconColor: '#8B5CF6',
    category: 'savings',
    requirement: 1000,
  },
  {
    id: 'savings_5000',
    title: 'Para Babası',
    description: '₺5000 tasarruf',
    icon: 'trophy',
    iconColor: '#F59E0B',
    category: 'savings',
    requirement: 5000,
  },
  {
    id: 'savings_10000',
    title: 'Altın Kasa',
    description: '₺10000 tasarruf',
    icon: 'diamond',
    iconColor: '#EF4444',
    category: 'savings',
    requirement: 10000,
  },

  // HEALTH ACHIEVEMENTS
  {
    id: 'health_20min',
    title: 'Kalp Atışı Normale Döndü',
    description: '20 dakika sonra',
    icon: 'heart',
    iconColor: '#EF4444',
    category: 'health',
    requirement: 0, // 20 minutes after quit time
  },
  {
    id: 'health_12hours',
    title: 'Kan Oksijen Seviyesi Arttı',
    description: '12 saat sonra',
    icon: 'water',
    iconColor: '#3B82F6',
    category: 'health',
    requirement: 0, // 12 hours after quit time
  },
  {
    id: 'health_2weeks',
    title: 'Kan Dolaşımı İyileşti',
    description: '2 hafta sonra',
    icon: 'pulse',
    iconColor: '#10B981',
    category: 'health',
    requirement: 14,
  },
  {
    id: 'health_1month',
    title: 'Akciğerler İyileşiyor',
    description: '1 ay sonra',
    icon: 'fitness',
    iconColor: '#8B5CF6',
    category: 'health',
    requirement: 30,
  },
  {
    id: 'health_3months',
    title: 'Öksürük Azaldı',
    description: '3 ay sonra',
    icon: 'shield-checkmark',
    iconColor: '#06B6D4',
    category: 'health',
    requirement: 90,
  },
  {
    id: 'health_1year',
    title: 'Kalp Krizi Riski Yarıya İndi',
    description: '1 yıl sonra',
    icon: 'heart-half',
    iconColor: '#EC4899',
    category: 'health',
    requirement: 365,
  },

  // RESISTANCE ACHIEVEMENTS
  {
    id: 'crisis_1',
    title: 'İlk Zafer',
    description: 'İlk krizi atlatın',
    icon: 'shield',
    iconColor: '#3B82F6',
    category: 'resistance',
    requirement: 1,
  },
  {
    id: 'crisis_5',
    title: 'Güçlü İrade',
    description: '5 krizi atlatın',
    icon: 'shield-checkmark',
    iconColor: '#10B981',
    category: 'resistance',
    requirement: 5,
  },
  {
    id: 'crisis_10',
    title: 'Demir İrade',
    description: '10 krizi atlatın',
    icon: 'barbell',
    iconColor: '#8B5CF6',
    category: 'resistance',
    requirement: 10,
  },
  {
    id: 'crisis_25',
    title: 'Yenilmez',
    description: '25 krizi atlatın',
    icon: 'flame',
    iconColor: '#EF4444',
    category: 'resistance',
    requirement: 25,
  },
  {
    id: 'no_slip_30',
    title: '30 Gün Kusursuz',
    description: 'Hiç kaymadan 30 gün',
    icon: 'checkmark-circle',
    iconColor: '#10B981',
    category: 'resistance',
    requirement: 30,
  },
  {
    id: 'no_slip_90',
    title: 'Mükemmellik',
    description: 'Hiç kaymadan 90 gün',
    icon: 'star',
    iconColor: '#F59E0B',
    category: 'resistance',
    requirement: 90,
  },

  // GRADUAL REDUCTION ACHIEVEMENTS
  {
    id: 'gradual_week1',
    title: 'İlk Hafta Disiplini',
    description: '7 gün hedefe uygun',
    icon: 'checkmark-done',
    iconColor: '#10B981',
    category: 'gradual',
    requirement: 7,
  },
  {
    id: 'gradual_week2',
    title: 'İki Hafta Kararlı',
    description: '14 gün hedefe uygun',
    icon: 'flag',
    iconColor: '#3B82F6',
    category: 'gradual',
    requirement: 14,
  },
  {
    id: 'gradual_month',
    title: 'Bir Ay Disiplinli',
    description: '30 gün hedefe uygun',
    icon: 'calendar',
    iconColor: '#8B5CF6',
    category: 'gradual',
    requirement: 30,
  },
  {
    id: 'gradual_half',
    title: 'Yarıya İndim',
    description: 'Günlük %50 azalttın',
    icon: 'trending-down',
    iconColor: '#F59E0B',
    category: 'gradual',
    requirement: 50, // 50% reduction
  },
  {
    id: 'gradual_75',
    title: '¾ Azalttım',
    description: 'Günlük %75 azalttın',
    icon: 'arrow-down-circle',
    iconColor: '#EF4444',
    category: 'gradual',
    requirement: 75, // 75% reduction
  },
  {
    id: 'gradual_zero',
    title: '0\'a İndim!',
    description: 'İlk kez 0 sigara/gün',
    icon: 'stop-circle',
    iconColor: '#10B981',
    category: 'gradual',
    requirement: 0, // Special: reached 0
  },
];

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

/**
 * Get achievement by id
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
