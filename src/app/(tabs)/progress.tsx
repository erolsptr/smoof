import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Progress Screen - Shows user's journey and achievements
 */
export default function ProgressScreen() {
  const { colors } = useColorScheme();
  const profile = useUserStore((state) => state.profile);
  const currentStreak = useStatsStore((state) => state.currentStreak);

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Veri yükleniyor...</Text>
      </View>
    );
  }

  // Calculate stats
  const cigarettesNotSmoked = currentStreak * profile.dailyCigaretteCount;
  const moneySaved = Math.floor((cigarettesNotSmoked / 20) * profile.packPrice);
  const timeSavedHours = Math.floor((cigarettesNotSmoked * 5) / 60);
  const lifeSavedDays = Math.floor((cigarettesNotSmoked * 11) / (60 * 24)); // 11 min per cigarette

  // Milestones
  const milestones = [
    { 
      id: 1, 
      title: 'İlk 24 Saat', 
      days: 1, 
      icon: 'rocket',
      color: colors.secondary,
      description: 'Karbonmonoksit seviyesi normale döndü',
      completed: currentStreak >= 1,
    },
    { 
      id: 2, 
      title: '3 Gün Güçlü', 
      days: 3, 
      icon: 'fitness',
      color: colors.accent,
      description: 'Nikotin vücuttan atıldı',
      completed: currentStreak >= 3,
    },
    { 
      id: 3, 
      title: 'Bir Haftalık Savaşçı', 
      days: 7, 
      icon: 'medal',
      color: colors.primary,
      description: 'Tat ve koku alma iyileşti',
      completed: currentStreak >= 7,
    },
    { 
      id: 4, 
      title: '2 Hafta Zafer', 
      days: 14, 
      icon: 'trophy',
      color: colors.success,
      description: 'Dolaşım ve akciğer fonksiyonu arttı',
      completed: currentStreak >= 14,
    },
    { 
      id: 5, 
      title: 'Bir Aylık Kahraman', 
      days: 30, 
      icon: 'star',
      color: colors.secondary,
      description: 'Öksürük ve nefes darlığı azaldı',
      completed: currentStreak >= 30,
    },
    { 
      id: 6, 
      title: '3 Aylık Şampiyon', 
      days: 90, 
      icon: 'flame',
      color: colors.error,
      description: 'Kalp krizi riski %50 azaldı',
      completed: currentStreak >= 90,
    },
    { 
      id: 7, 
      title: '6 Aylık Efsane', 
      days: 180, 
      icon: 'flash',
      color: colors.accent,
      description: 'Akciğer kapasitesi arttı',
      completed: currentStreak >= 180,
    },
    { 
      id: 8, 
      title: '1 Yıllık Usta', 
      days: 365, 
      icon: 'ribbon',
      color: '#FFD700',
      description: 'Kalp hastalığı riski %50 azaldı',
      completed: currentStreak >= 365,
    },
  ];

  // Health benefits timeline
  const healthBenefits = [
    { time: '20 dakika', benefit: 'Kalp atışı ve kan basıncı normale döner' },
    { time: '12 saat', benefit: 'Kandaki karbonmonoksit seviyesi normale döner' },
    { time: '2 hafta', benefit: 'Dolaşım iyileşir, akciğer fonksiyonu artar' },
    { time: '1-9 ay', benefit: 'Öksürük ve nefes darlığı azalır' },
    { time: '1 yıl', benefit: 'Kalp hastalığı riski yarıya iner' },
    { time: '5 yıl', benefit: 'İnme riski sigara içmeyenlerle eşit olur' },
    { time: '10 yıl', benefit: 'Akciğer kanseri riski yarıya iner' },
    { time: '15 yıl', benefit: 'Kalp hastalığı riski sigara içmeyenlerle eşit olur' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.title, { color: colors.text }]}>İlerleme 📊</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Yolculuğun ve başarıların
      </Text>

      {/* Stats Summary */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{currentStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gün</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{cigarettesNotSmoked}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sigara</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="cash" size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>₺{moneySaved}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasarruf</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="heart" size={24} color={colors.error} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{lifeSavedDays}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gün Hayat</Text>
        </View>
      </View>

      {/* Milestones */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Başarılar 🏆
        </Text>
        <View style={styles.milestones}>
          {milestones.map((milestone) => (
            <View
              key={milestone.id}
              style={[
                styles.milestoneCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: milestone.completed ? milestone.color : colors.cardBorder,
                  borderWidth: milestone.completed ? 2 : 1,
                  opacity: milestone.completed ? 1 : 0.6,
                },
              ]}
            >
              <View style={[
                styles.milestoneIcon,
                { backgroundColor: milestone.completed ? milestone.color : colors.cardBorder }
              ]}>
                <Ionicons 
                  name={milestone.icon as any} 
                  size={28} 
                  color={milestone.completed ? '#FFF' : colors.textTertiary} 
                />
              </View>
              <View style={styles.milestoneContent}>
                <Text style={[
                  styles.milestoneTitle,
                  { color: milestone.completed ? colors.text : colors.textTertiary }
                ]}>
                  {milestone.title}
                </Text>
                <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>
                  {milestone.description}
                </Text>
                <Text style={[styles.milestoneDays, { color: colors.textTertiary }]}>
                  {milestone.days} gün
                </Text>
              </View>
              {milestone.completed && (
                <Ionicons name="checkmark-circle" size={24} color={milestone.color} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Health Benefits */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Sağlık Faydaları 💚
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Vücudunun iyileşme süreci
        </Text>
        <View style={styles.timeline}>
          {healthBenefits.map((benefit, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                {index < healthBenefits.length - 1 && (
                  <View style={[styles.line, { backgroundColor: colors.cardBorder }]} />
                )}
              </View>
              <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.timelineTime, { color: colors.primary }]}>
                  {benefit.time}
                </Text>
                <Text style={[styles.timelineBenefit, { color: colors.text }]}>
                  {benefit.benefit}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Motivational Quote */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quoteCard}
      >
        <Ionicons name="sparkles" size={32} color="#FFF" style={styles.quoteIcon} />
        <Text style={styles.quoteText}>
          "Her gün sigarasız geçen bir gündür. Sen inanılmaz güçlüsün!"
        </Text>
        <Text style={styles.quoteAuthor}>- Smoof 💚</Text>
      </LinearGradient>
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
    paddingBottom: Spacing['4xl'],
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.lg,
  },
  milestones: {
    gap: Spacing.md,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  milestoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  milestoneDesc: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xs,
  },
  milestoneDays: {
    fontSize: Typography.sizes.xs,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timelineDot: {
    alignItems: 'center',
    width: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: Spacing.xs,
  },
  timelineCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  timelineTime: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  timelineBenefit: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  quoteCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  quoteIcon: {
    marginBottom: Spacing.md,
  },
  quoteText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.md,
    lineHeight: Typography.sizes.lg * 1.5,
  },
  quoteAuthor: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
