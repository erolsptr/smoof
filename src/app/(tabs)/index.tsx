import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { calculateStreakFromQuitDate } from '@/utils/dateHelpers';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { useState, useEffect } from 'react';

/**
 * Home Screen - Dashboard
 * Shows streak, stats carousel, and quick actions
 */
export default function HomeScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const currentStreak = useStatsStore((state) => state.currentStreak);
  
  const [activeCard, setActiveCard] = useState(0);

  // Calculate real stats from profile and keep streak synced
  useEffect(() => {
    if (profile?.quitDate) {
      const streakDays = calculateStreakFromQuitDate(profile.quitDate);
      // Always ensure store has correct streak
      if (currentStreak !== streakDays) {
        useStatsStore.getState().updateStreakFromQuitDate(profile.quitDate);
      }
    }
  }, [profile?.quitDate, currentStreak]);

  // Calculate real stats
  const cigarettesNotSmoked = profile 
    ? currentStreak * profile.dailyCigaretteCount 
    : 0;
    
  const moneySaved = profile
    ? (cigarettesNotSmoked / profile.cigarettesPerPack) * profile.packPrice
    : 0;
    
  const timeSavedMinutes = cigarettesNotSmoked * 5; // 5 min per cigarette
  const timeSavedHours = Math.floor(timeSavedMinutes / 60);

  const stats = [
    { 
      label: 'İçilmeyen Sigara', 
      value: cigarettesNotSmoked.toLocaleString('tr-TR'), 
      icon: '🚭' 
    },
    { 
      label: 'Para Tasarrufu', 
      value: `₺${moneySaved.toFixed(0)}`, 
      icon: '💰' 
    },
    { 
      label: 'Kazanılan Zaman', 
      value: `${timeSavedHours} saat`, 
      icon: '⏱️' 
    },
  ];

  // Motivational message based on streak
  const getMotivationalMessage = () => {
    if (currentStreak === 0) return 'İlk günün! Başarırsın 💪';
    if (currentStreak === 1) return 'İlk gün tamamlandı! 🎉';
    if (currentStreak < 7) return 'Harika gidiyorsun! Devam et 💪';
    if (currentStreak < 30) return 'Süpersin! İlerleme harika 🌟';
    if (currentStreak < 90) return 'İnanılmaz! Gurur duymalısın 🏆';
    return 'Efsanesin! Ne kadar güçlüsün 👑';
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Mascot & Greeting */}
      <View style={styles.header}>
        <Text style={styles.mascot}>🦎</Text>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          Merhaba! Bugün nasılsın?
        </Text>
      </View>

      {/* Streak Counter - Hero Section */}
      <View style={[styles.streakCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.streakLabel}>Sigarasız Günler</Text>
        <View style={styles.streakRow}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakFire}>🔥</Text>
        </View>
        <Text style={styles.streakSubtext}>
          {getMotivationalMessage()}
        </Text>
      </View>

      {/* Stats Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          contentContainerStyle={styles.carousel}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / 300);
            setActiveCard(index);
          }}
        >
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[styles.statCard, { 
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              }]}
            >
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </ScrollView>
        
        {/* Carousel Indicators */}
        <View style={styles.indicators}>
          {stats.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === activeCard ? colors.primary : colors.cardBorder,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Crisis Button */}
      <TouchableOpacity
        style={[styles.crisisButton, { backgroundColor: colors.error }]}
        activeOpacity={0.8}
        onPress={() => router.push('/crisis')}
      >
        <Text style={styles.crisisText}>🆘 Sigara İçmek İstiyorum</Text>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Kazanımların
        </Text>
        <View style={[styles.quickCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.quickItem}>
            <Text style={styles.quickIcon}>⏱️</Text>
            <Text style={[styles.quickText, { color: colors.textSecondary }]}>
              Tasarruf edilen zaman: <Text style={[styles.quickValue, { color: colors.text }]}>
                {timeSavedHours} saat
              </Text>
            </Text>
          </View>
          <View style={styles.quickItem}>
            <Text style={styles.quickIcon}>❤️</Text>
            <Text style={[styles.quickText, { color: colors.textSecondary }]}>
              Kalp sağlığı: <Text style={[styles.quickValue, { color: colors.success }]}>
                {currentStreak > 0 ? 'İyileşiyor' : 'Başlamaya hazır'}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mascot: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.sizes.base,
  },
  streakCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  streakNumber: {
    color: '#FFFFFF',
    fontSize: Typography.sizes['5xl'],
    fontWeight: Typography.weights.extrabold,
  },
  streakFire: {
    fontSize: 40,
  },
  streakSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.sizes.sm,
  },
  carouselContainer: {
    marginBottom: Spacing.lg,
  },
  carousel: {
    gap: Spacing.md,
    paddingHorizontal: 4,
  },
  statCard: {
    width: 280,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.base,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  crisisButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  crisisText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  quickStats: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  quickCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickIcon: {
    fontSize: 24,
  },
  quickText: {
    fontSize: Typography.sizes.base,
    flex: 1,
  },
  quickValue: {
    fontWeight: Typography.weights.semibold,
  },
});
