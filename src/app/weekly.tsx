import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useCheckInStore } from '@/store/checkInStore';
import { useInsightStore } from '@/store/insightStore';
import { Smoof, type SmoofMood } from '@/components/smoof/Smoof';
import { moodEmoji, triggerLabel } from '@/constants/checkIn';
import { getTodayString, parseDateKey } from '@/utils/dateHelpers';
import { getDiscoveries, getWeeklySummary } from '@/utils/insights';

function formatDay(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

/**
 * Weekly summary: how the last 7 days went, what was hardest,
 * what Smoof learned and one small goal for the coming week.
 */
export default function WeeklyScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const dailyStats = useStatsStore((s) => s.dailyStats);
  const crisisLogs = useStatsStore((s) => s.crisisLogs);
  const checkIns = useCheckInStore((s) => s.checkIns);
  const markWeeklySeen = useInsightStore((s) => s.markWeeklySeen);
  const today = getTodayString();

  useEffect(() => {
    markWeeklySeen(today);
  }, [markWeeklySeen, today]);

  const summary = useMemo(
    () => (profile ? getWeeklySummary(profile, checkIns, dailyStats, crisisLogs) : null),
    [profile, checkIns, dailyStats, crisisLogs],
  );
  const discoveries = useMemo(
    () => (profile ? getDiscoveries(profile, checkIns, dailyStats, crisisLogs) : []),
    [profile, checkIns, dailyStats, crisisLogs],
  );

  if (!profile || !summary) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const moodDelta =
    summary.avgMood !== null && summary.prevAvgMood !== null ? summary.avgMood - summary.prevAvgMood : null;
  const smoofMood: SmoofMood =
    summary.avgMood === null ? 'calm' : summary.avgMood >= 3.7 ? 'proud' : summary.avgMood >= 2.7 ? 'happy' : 'supportive';
  const headline =
    summary.avgMood === null
      ? 'Bu hafta seni pek duyamadım'
      : summary.avgMood >= 3.7
        ? 'Harika bir hafta geçirdin! 🎉'
        : summary.avgMood >= 2.7
          ? 'Dengeli bir haftaydı 👏'
          : 'Zorlu bir haftaydı, ama buradasın 💚';

  const stats: { icon: string; value: string; label: string }[] = [
    { icon: '📝', value: `${summary.checkInCount}/7`, label: 'check-in' },
    { icon: '🛡️', value: `${summary.cravingsResisted}`, label: 'atlatılan istek' },
    summary.gradual
      ? { icon: '🎯', value: `${summary.gradual.inTarget}/${summary.gradual.logged || 0}`, label: 'hedefte gün' }
      : { icon: '🌿', value: `${summary.smokeFree?.days ?? 0}/${summary.smokeFree?.of ?? 0}`, label: 'kaymasız gün' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Haftan nasıldı?</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {formatDay(summary.from)} – {formatDay(summary.to)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Kapat"
          style={[styles.close, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* Hero */}
        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Smoof mood={smoofMood} size={90} animation="bob" />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{headline}</Text>
            {moodDelta !== null && Math.abs(moodDelta) >= 0.3 && (
              <Text style={styles.heroText}>
                {moodDelta > 0 ? '📈 Geçen haftadan daha iyi hissettin' : '📉 Geçen haftadan biraz daha zordu'}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Mood strip */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Ruh halin</Text>
          <View style={styles.moodWeek}>
            {summary.days.map((d) => (
              <View key={d.date} style={styles.moodDay}>
                <Text style={[styles.moodEmoji, d.mood === null && { opacity: 0.25 }]}>
                  {d.mood === null ? '○' : moodEmoji(d.mood)}
                </Text>
                <Text style={[styles.moodLabel, { color: colors.textTertiary }]}>
                  {parseDateKey(d.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Numbers */}
        <View style={styles.statRow}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Hardest thing */}
        {summary.topTrigger && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>En çok zorlayan</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{triggerLabel(summary.topTrigger.id)}</Text>
              {` · bu hafta ${summary.topTrigger.count} gün`}
            </Text>
          </View>
        )}

        {/* Discoveries */}
        {discoveries.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Seninle ilgili keşfettiklerim 🔎</Text>
            {discoveries.map((d) => (
              <View key={d.id} style={styles.discovery}>
                <Text style={styles.discoveryIcon}>{d.icon}</Text>
                <Text style={[styles.discoveryText, { color: colors.textSecondary }]}>{d.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next week's goal */}
        <View style={[styles.goal, { backgroundColor: colors.secondary + '16', borderColor: colors.secondary + '55' }]}>
          <Text style={[styles.goalLabel, { color: colors.secondary }]}>GELECEK HAFTANIN HEDEFİ</Text>
          <View style={styles.goalRow}>
            <Text style={styles.goalIcon}>{summary.goal.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalTitle, { color: colors.text }]}>{summary.goal.title}</Text>
              <Text style={[styles.goalText, { color: colors.textSecondary }]}>{summary.goal.text}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },

  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 16 },
  heroTitle: { color: '#FFF', fontSize: 19, fontWeight: '800' },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 6 },

  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardText: { fontSize: 14 },

  moodWeek: { flexDirection: 'row', justifyContent: 'space-between' },
  moodDay: { flex: 1, alignItems: 'center' },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 11, marginTop: 2 },

  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingVertical: 12 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 11, textAlign: 'center' },

  discovery: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  discoveryIcon: { fontSize: 20 },
  discoveryText: { flex: 1, fontSize: 14, lineHeight: 20 },

  goal: { borderRadius: 18, borderWidth: 1.5, padding: 14, gap: 8 },
  goalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  goalRow: { flexDirection: 'row', gap: 12 },
  goalIcon: { fontSize: 28 },
  goalTitle: { fontSize: 16, fontWeight: '800' },
  goalText: { fontSize: 13, lineHeight: 19, marginTop: 3 },
});
