import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Progress Screen - Shows statistics, health benefits, and achievements overview
 */
export default function ProgressScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
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
      <Text style={[styles.title, { color: colors.text }]}>İstatistikler 📊</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Yolculuğun ve sağlık faydaların
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

        {/* Gradual-specific stats */}
        {profile.quitMethod === 'gradual' && (
          <>
            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="flag" size={24} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.gradualStartCount || profile.dailyCigaretteCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Başlangıç</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profile.gradualCurrentTarget || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Şimdi</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="trending-down" size={24} color={colors.accent} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                %{Math.floor(((profile.gradualStartCount || profile.dailyCigaretteCount) - (profile.gradualCurrentTarget || 0)) / (profile.gradualStartCount || profile.dailyCigaretteCount) * 100)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Azalma</Text>
            </View>
          </>
        )}
      </View>

      {/* Achievements CTA */}
      <TouchableOpacity
        style={[styles.achievementsCTA, { 
          backgroundColor: colors.card,
          borderColor: colors.primary,
        }]}
        onPress={() => router.push('/achievements')}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[colors.primary + '20', colors.accent + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.achievementsCTAGradient}
        >
          <View style={styles.achievementsCTAContent}>
            <View style={[styles.achievementsCTAIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="trophy" size={32} color="#FFF" />
            </View>
            <View style={styles.achievementsCTAText}>
              <Text style={[styles.achievementsCTATitle, { color: colors.text }]}>
                Rozetlerim 🏆
              </Text>
              <Text style={[styles.achievementsCTADesc, { color: colors.textSecondary }]}>
                Başarılarını ve kazandığın rozetleri gör
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* TODO: Future Feature - Charts & Graphs */}
      {/* 
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Grafikler 📈
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Haftalık ve aylık ilerleme trendlerin
        </Text>
        Add charts here: streak trend, money saved trend, crisis count
      </View>
      */}

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
  achievementsCTA: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  achievementsCTAGradient: {
    padding: Spacing.lg,
  },
  achievementsCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  achievementsCTAIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementsCTAText: {
    flex: 1,
  },
  achievementsCTATitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  achievementsCTADesc: {
    fontSize: Typography.sizes.sm,
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
