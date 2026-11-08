import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProgress } from '@/hooks/useProgress';
import { daysBetween, getTodayString, parseDateKey } from '@/utils/dateHelpers';
import { getGradualPlanInputs, getGradualSchedule, type GradualPlanStep } from '@/utils/gradualHelpers';
import { describeWeeklyPace } from '@/utils/gradualPlan';

const PLAN_NAMES: Record<number, string> = { 4: 'Hızlı', 6: 'Dengeli', 8: 'Rahat', 12: 'Çok Rahat' };

function formatDay(dateKey: string, withWeekday = false): string {
  return parseDateKey(dateKey).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    ...(withWeekday ? { weekday: 'long' } : {}),
  });
}

function formatRange(step: GradualPlanStep): string {
  if (!step.to || step.to === step.from) return formatDay(step.from);
  const from = parseDateKey(step.from);
  const to = parseDateKey(step.to);
  if (from.getMonth() === to.getMonth()) {
    return `${from.getDate()}–${formatDay(step.to)}`;
  }
  return `${formatDay(step.from)} – ${formatDay(step.to)}`;
}

function daysLabel(n: number): string {
  if (n === 0) return 'bugün';
  if (n === 1) return 'yarın';
  return `${n} gün sonra`;
}

/**
 * Gradual plan overview ("Yol haritam"):
 * the chosen plan, the daily limit for every week, and the first smoke-free day.
 */
export default function PlanScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isGradual } = useProgress();

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Yol haritam</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (!profile || !isGradual) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Yol haritası kademeli azaltma planı için gösterilir.
        </Text>
      </View>
    );
  }

  const today = getTodayString();
  const { startDate, startCount, initialTarget, totalWeeks } = getGradualPlanInputs(profile);
  const steps = getGradualSchedule(profile);
  const zeroStep = steps[steps.length - 1];
  const zeroDate = zeroStep.from;
  const changeDays = new Set((profile.gradualTargetChanges ?? []).map((c) => c.from));

  const notStarted = today < startDate;
  const done = today >= zeroDate;
  const currentIndex = steps.findIndex((s) => s.from <= today && (s.to === null || today <= s.to));
  const current = currentIndex >= 0 ? steps[currentIndex] : null;
  const next = steps[currentIndex + 1] ?? (notStarted ? steps[0] : null);

  const totalDays = Math.max(1, daysBetween(startDate, zeroDate));
  const elapsed = notStarted ? 0 : Math.min(totalDays, daysBetween(startDate, today));
  const progress = elapsed / totalDays;
  const daysToZero = done ? 0 : daysBetween(today, zeroDate);

  const planName = PLAN_NAMES[totalWeeks];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* Hero: plan + first smoke-free day */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroChip}>
            <Ionicons name="trending-down" size={14} color="#FFF" />
            <Text style={styles.heroChipText}>
              {planName ? `${planName} plan · ` : ''}{totalWeeks} hafta
            </Text>
          </View>

          <Text style={styles.heroLabel}>{done ? 'SIFIRA İNDİN' : 'İLK SİGARASIZ GÜNÜN'}</Text>
          <Text style={styles.heroDate}>{formatDay(zeroDate, true)}</Text>
          <Text style={styles.heroSub}>
            {done
              ? 'Planın tamamlandı, artık her gün sigarasız 🎉'
              : notStarted
                ? `Plan ${formatDay(startDate)} tarihinde başlıyor · sıfıra ${daysToZero} gün`
                : `${daysToZero} gün kaldı`}
          </Text>

          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${Math.max(3, progress * 100)}%` }]} />
          </View>
          <View style={styles.heroTrackLabels}>
            <Text style={styles.heroTrackText}>{formatDay(startDate)}</Text>
            <Text style={styles.heroTrackText}>%{Math.round(progress * 100)}</Text>
          </View>
        </LinearGradient>

        {/* Quick numbers */}
        <View style={styles.statRow}>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{startCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Önceden{'\n'}günde</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {current ? current.target : initialTarget}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {current ? 'Bugünkü\nlimit' : 'İlk hafta\nlimiti'}
            </Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{next ? next.target : 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {next ? `${daysLabel(daysBetween(today, next.from))}` : 'Limit'}
              {'\n'}
              {next ? 'yeni limit' : 'her gün'}
            </Text>
          </View>
        </View>

        <View style={[styles.paceBox, { backgroundColor: colors.primary + '14' }]}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={[styles.paceText, { color: colors.text }]}>
            {describeWeeklyPace(initialTarget, totalWeeks)}. Limit her hafta {parseDateKey(startDate).toLocaleDateString('tr-TR', { weekday: 'long' })} günü otomatik düşer.
          </Text>
        </View>

        {/* Timeline */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Haftalık limitler</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {steps.map((step, i) => {
            const isZero = step.to === null;
            const isPast = step.to !== null && step.to < today;
            const isCurrent = i === currentIndex;
            const prev = steps[i - 1];
            const drop = prev ? prev.target - step.target : startCount - step.target;
            const barPct = startCount > 0 ? (step.target / startCount) * 100 : 0;
            const dotColor = isZero ? colors.success : isCurrent ? colors.primary : isPast ? colors.textTertiary : colors.cardBorder;
            const changed = changeDays.has(step.from);

            return (
              <View key={step.from} style={styles.stepRow}>
                {/* Rail */}
                <View style={styles.rail}>
                  <View style={[styles.railLine, { backgroundColor: i === 0 ? 'transparent' : colors.cardBorder }]} />
                  <View style={[styles.dot, { backgroundColor: dotColor, borderColor: isCurrent ? colors.primary + '40' : 'transparent' }]}>
                    {isPast && <Ionicons name="checkmark" size={10} color="#FFF" />}
                    {isZero && <Ionicons name="leaf" size={10} color="#FFF" />}
                  </View>
                  <View style={[styles.railLine, { backgroundColor: isZero ? 'transparent' : colors.cardBorder }]} />
                </View>

                {/* Content */}
                <View
                  style={[
                    styles.stepBody,
                    isCurrent && { backgroundColor: colors.primary + '12', borderColor: colors.primary + '50' },
                    isZero && { backgroundColor: colors.success + '14', borderColor: colors.success + '50' },
                  ]}
                >
                  <View style={styles.stepTop}>
                    <Text style={[styles.stepWeek, { color: isPast ? colors.textTertiary : colors.text }]}>
                      {isZero ? 'Sigarasız 🎉' : `${step.week}. hafta`}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.tag, { backgroundColor: colors.primary }]}>
                        <Text style={styles.tagText}>{isZero ? 'Şimdi' : 'Bu hafta'}</Text>
                      </View>
                    )}
                    {changed && (
                      <View style={[styles.tag, { backgroundColor: colors.accent }]}>
                        <Text style={styles.tagText}>Hedef düşürüldü</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    {!isZero && drop > 0 && (
                      <Text style={[styles.drop, { color: isPast ? colors.textTertiary : colors.primary }]}>−{drop}</Text>
                    )}
                  </View>

                  <Text style={[styles.stepDates, { color: colors.textSecondary }]}>
                    {isZero ? `${formatDay(step.from, true)} ve sonrası` : formatRange(step)}
                  </Text>

                  {!isZero ? (
                    <View style={styles.stepBottom}>
                      <View style={[styles.bar, { backgroundColor: colors.cardBorder }]}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(4, barPct)}%`, backgroundColor: isPast ? colors.textTertiary : colors.primary },
                          ]}
                        />
                      </View>
                      <Text style={[styles.stepTarget, { color: isPast ? colors.textTertiary : colors.text }]}>
                        {step.target}
                        <Text style={styles.stepUnit}> sigara/gün</Text>
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.zeroText, { color: colors.text }]}>
                      Günlük limitin 0. Bundan sonra her gün sigarasız!
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.footnote, { color: colors.textTertiary }]}>
          Hedefini profilden istediğin zaman düşürebilirsin; plan yeni hedefinden aynı bitiş tarihine kadar yeniden hesaplanır.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, paddingHorizontal: 32, fontSize: 15 },
  content: { padding: 16, gap: 14 },

  hero: { borderRadius: 24, padding: 20 },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 16,
  },
  heroChipText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  heroDate: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 4 },
  heroTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 18, overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: 4, backgroundColor: '#FFF' },
  heroTrackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  heroTrackText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, textAlign: 'center', marginTop: 2, lineHeight: 16 },

  paceBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, alignItems: 'center' },
  paceText: { flex: 1, fontSize: 13, lineHeight: 18 },

  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  card: { borderRadius: 20, borderWidth: 1, paddingVertical: 8, paddingRight: 10 },

  stepRow: { flexDirection: 'row' },
  rail: { width: 34, alignItems: 'center' },
  railLine: { width: 2, flex: 1 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: {
    flex: 1,
    marginVertical: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepWeek: { fontSize: 15, fontWeight: '700' },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  tagText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  drop: { fontSize: 14, fontWeight: '800' },
  stepDates: { fontSize: 12, marginTop: 2 },
  stepBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  bar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  stepTarget: { fontSize: 18, fontWeight: '800', minWidth: 96, textAlign: 'right' },
  stepUnit: { fontSize: 12, fontWeight: '500' },
  zeroText: { fontSize: 13, marginTop: 6 },

  footnote: { fontSize: 12, lineHeight: 17, textAlign: 'center', paddingHorizontal: 12 },
});
