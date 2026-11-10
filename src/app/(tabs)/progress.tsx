import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProgress } from '@/hooks/useProgress';
import { useAchievementStore } from '@/store/achievementStore';
import { useCheckInStore } from '@/store/checkInStore';
import { useStatsStore } from '@/store/statsStore';
import { moodEmoji, triggerLabel } from '@/constants/checkIn';
import { topTrigger } from '@/utils/checkInAdvice';
import { DISCOVERY_MIN_CHECKINS, getDiscoveries } from '@/utils/insights';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { isAchievementVisible, MINUTES_PER_CIGARETTE } from '@/utils/progressMetrics';
import { formatDuration } from '@/utils/milestones';
import { addDays, daysBetween, getQuitTimestamp, getTodayString, parseDateKey, toDateKey } from '@/utils/dateHelpers';
import { HealthTimeline } from '@/components/stats/HealthTimeline';
import { WeekBarChart } from '@/components/stats/WeekBarChart';

const TRIGGER_LABELS: Record<string, string> = {
  stress: 'Stres',
  social: 'Sosyal ortam',
  coffee: 'Kahve',
  boredom: 'Can sıkıntısı',
  habit: 'Alışkanlık',
  other: 'Diğer',
};

// Approximate per-cigarette yields (EU limits: 10 mg tar, 1 mg nicotine)
const TAR_MG_PER_CIGARETTE = 10;
const NICOTINE_MG_PER_CIGARETTE = 1;

const formatMoney = (value: number) => `₺${Math.floor(value).toLocaleString('tr-TR')}`;
const formatCount = (value: number) => Math.floor(value).toLocaleString('tr-TR');
const formatDate = (key: string, withYear = false) =>
  parseDateKey(key).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });

// ── Building blocks (module level so they keep state across re-renders) ──
function Tile({ icon, color, value, label, sub }: {
  icon: keyof typeof Ionicons.glyphMap; color: string; value: string; label: string; sub?: string;
}) {
  const { colors } = useColorScheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.tileIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub ? <Text style={[styles.tileSub, { color: colors.textTertiary }]}>{sub}</Text> : null}
    </View>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { colors } = useColorScheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const { colors } = useColorScheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: strong ? colors.primary : colors.text }]}>{value}</Text>
    </View>
  );
}

/**
 * Statistics - different content for immediate quitters and gradual reducers,
 * all numbers from the shared progress metrics.
 */
export default function ProgressScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, immediate, gradual, cravings, isGradual, isPreparation } = useProgress();
  const unlockedIds = useAchievementStore((s) => s.unlockedAchievements);
  const checkIns = useCheckInStore((s) => s.checkIns);
  const dailyStats = useStatsStore((s) => s.dailyStats);
  const crisisLogs = useStatsStore((s) => s.crisisLogs);

  if (!profile) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const availableBadges = ACHIEVEMENTS.filter((a) => isAchievementVisible(a, isGradual, unlockedIds));
  const earnedBadges = availableBadges.filter((a) => unlockedIds.includes(a.id)).length;
  const todayKey = getTodayString();
  const startKey = isGradual && gradual ? gradual.startDate : toDateKey(profile.quitDate);
  const daysToStart = isPreparation ? daysBetween(todayKey, startKey) : 0;

  const cravingsSection = (
    <Section title="İsteklerle mücadele" subtitle="“Canın sigara mı çekti?” kayıtların">
      {cravings.resisted + cravings.slips === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Henüz kayıt yok. Canın sigara çektiğinde ana sayfadaki karta dokun, burada görünsün.
        </Text>
      ) : (
        <>
          <Row label="Atlatılan istek" value={`${cravings.resisted}`} strong />
          <Row label="Nefes egzersiziyle" value={`${cravings.breathingUsed}`} />
          {!isGradual && <Row label="Kayma" value={`${cravings.slips}`} />}
          {cravings.topTrigger && (
            <Row label="En sık tetikleyici" value={TRIGGER_LABELS[cravings.topTrigger] ?? cravings.topTrigger} />
          )}
        </>
      )}
    </Section>
  );

  // Daily check-ins of the last 7 days (today included)
  const week = Array.from({ length: 7 }, (_, i) => addDays(todayKey, i - 6));
  const weekCheckIns = checkIns.filter((c) => c.date >= week[0] && c.date <= todayKey);
  const weekTrigger = topTrigger(weekCheckIns, 2);
  const avgCraving = weekCheckIns.length
    ? weekCheckIns.reduce((sum, c) => sum + c.craving, 0) / weekCheckIns.length
    : null;
  const checkInSection = (
    <Section title="Son 7 gün nasıldın?" subtitle="Günlük check-in cevapların">
      {!weekCheckIns.some((c) => c.date === todayKey) && (
        <TouchableOpacity
          style={[styles.checkInButton, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '55' }]}
          onPress={() => router.push('/check-in')}
        >
          <Ionicons name="happy-outline" size={18} color={colors.primary} />
          <Text style={[styles.checkInButtonText, { color: colors.primary }]}>Bugünkü check-in&apos;i doldur</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
      {weekCheckIns.length === 0 ? (
        <TouchableOpacity onPress={() => router.push('/check-in')}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz check-in yok. Ana sayfadaki “Bugün nasılsın?” kartından 30 saniyede doldurabilirsin.
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.moodWeek}>
            {week.map((date) => {
              const c = weekCheckIns.find((x) => x.date === date);
              return (
                <View key={date} style={styles.moodDay}>
                  <Text style={[styles.moodDayEmoji, !c && { opacity: 0.25 }]}>{c ? moodEmoji(c.mood) : '○'}</Text>
                  <Text style={[styles.moodDayLabel, { color: colors.textTertiary }]}>
                    {date === todayKey ? 'Bugün' : parseDateKey(date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                  </Text>
                </View>
              );
            })}
          </View>
          {avgCraving !== null && (
            <Row
              label="Ortalama sigara isteği"
              value={avgCraving < 0.75 ? 'Çok az' : avgCraving < 1.5 ? 'Az' : avgCraving < 2.25 ? 'Orta' : 'Yüksek'}
            />
          )}
          {weekTrigger && (
            <Row label="En çok zorlayan" value={`${triggerLabel(weekTrigger.id)} · ${weekTrigger.count} gün`} />
          )}
          <TouchableOpacity style={styles.weeklyLink} onPress={() => router.push('/weekly')}>
            <Text style={[styles.weeklyLinkText, { color: colors.primary }]}>Haftalık özetini gör</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </>
      )}
    </Section>
  );

  // What Smoof learned from the check-ins (needs a couple of weeks of data)
  const discoveries = getDiscoveries(profile, checkIns, dailyStats, crisisLogs);
  const discoverySection = (
    <Section title="Keşiflerin 🔎" subtitle="Check-in'lerinden öğrendiklerim">
      {checkIns.length < DISCOVERY_MIN_CHECKINS ? (
        <>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {DISCOVERY_MIN_CHECKINS} check-in sonra seninle ilgili ilk keşiflerimi burada paylaşacağım.
          </Text>
          <View style={[styles.discoveryTrack, { backgroundColor: colors.cardBorder }]}>
            <View
              style={[
                styles.discoveryFill,
                { backgroundColor: colors.primary, width: `${Math.max(4, (checkIns.length / DISCOVERY_MIN_CHECKINS) * 100)}%` },
              ]}
            />
          </View>
          <Text style={[styles.discoveryCount, { color: colors.textTertiary }]}>
            {checkIns.length}/{DISCOVERY_MIN_CHECKINS} check-in
          </Text>
        </>
      ) : discoveries.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Henüz belirgin bir örüntü yok. Bu da iyi haber: seni zorlayan tek bir şey öne çıkmıyor.
        </Text>
      ) : (
        discoveries.map((d) => (
          <View key={d.id} style={styles.discoveryRow}>
            <Text style={styles.discoveryIcon}>{d.icon}</Text>
            <Text style={[styles.discoveryText, { color: colors.textSecondary }]}>{d.text}</Text>
          </View>
        ))
      )}
    </Section>
  );

  const badgesLink = (
    <TouchableOpacity
      style={[styles.badgesLink, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push('/achievements')}
      activeOpacity={0.7}
    >
      <View style={[styles.tileIcon, { backgroundColor: colors.secondary + '20' }]}>
        <Ionicons name="trophy" size={18} color={colors.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.badgesTitle, { color: colors.text }]}>Rozetler</Text>
        <View style={[styles.track, { backgroundColor: colors.cardBorder }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.secondary, width: `${Math.max(3, (earnedBadges / availableBadges.length) * 100)}%` },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.badgesCount, { color: colors.textSecondary }]}>
        {earnedBadges}/{availableBadges.length}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  // ── Header ─────────────────────────────────────
  const header = (
    <>
      <Text style={[styles.title, { color: colors.text }]}>İstatistikler</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isGradual ? 'Kademeli azaltma yolculuğun' : 'Sigarasız yolculuğun'}
      </Text>
    </>
  );

  // ── GRADUAL ────────────────────────────────────
  if (isGradual && gradual) {
    const weekProgress = Math.min(1, gradual.currentWeek / gradual.totalWeeks);
    const planDone = gradual.todayTarget === 0;

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      >
        {header}

        {/* Plan hero */}
        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          {isPreparation ? (
            <>
              <Text style={styles.heroLabel}>PLANIN BAŞLIYOR</Text>
              <Text style={styles.heroValue}>{daysToStart} gün sonra</Text>
              <Text style={styles.heroText}>{formatDate(startKey)} · {gradual.totalWeeks} haftalık plan</Text>
            </>
          ) : (
            <>
              <Text style={styles.heroLabel}>PLAN İLERLEMESİ</Text>
              <Text style={styles.heroValue}>
                {planDone ? 'Hedef: 0 sigara 🎉' : `${Math.min(gradual.currentWeek, gradual.totalWeeks)}. hafta / ${gradual.totalWeeks}`}
              </Text>
              <View style={styles.heroTrack}>
                <View style={[styles.heroFill, { width: `${Math.max(4, weekProgress * 100)}%` }]} />
              </View>
              <Text style={styles.heroText}>
                Bugünkü hedefin {gradual.todayTarget} sigara
                {gradual.zeroTargetDate && !planDone ? ` · Sıfır hedefi ${formatDate(gradual.zeroTargetDate)}` : ''}
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Key numbers */}
        <View style={styles.grid}>
          <Tile icon="ban" color={colors.error} value={formatCount(gradual.cigarettesAvoided)} label="İçilmeyen sigara" sub={`Başlangıç: günde ${gradual.startCount}`} />
          <Tile icon="wallet" color={colors.secondary} value={formatMoney(gradual.moneySaved)} label="Cebinde kalan" />
          <Tile
            icon="trending-down"
            color={colors.accent}
            value={gradual.recentAverage === null ? '–' : gradual.recentAverage.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
            label="Günlük ortalama"
            sub={gradual.recentAverage === null ? 'Henüz giriş yok' : `Son ${Math.min(7, gradual.loggedDays)} giriş · %${gradual.reductionPercent} azalma`}
          />
          <Tile
            icon="checkmark-done"
            color={colors.success}
            value={gradual.loggedDays ? `%${gradual.compliancePercent}` : '–'}
            label="Hedefe uyum"
            sub={gradual.loggedDays ? `${gradual.goalDays}/${gradual.loggedDays} gün hedefte` : 'Henüz giriş yok'}
          />
        </View>

        {/* Last 7 days */}
        {gradual.last7Days.length > 0 && (
          <Section title="Son 7 gün" subtitle="Günleri ana sayfadaki takvimden girebilirsin">
            <WeekBarChart days={gradual.last7Days} />
          </Section>
        )}

        {/* Streaks */}
        <View style={styles.grid}>
          <Tile icon="flame" color={colors.streakFire} value={`${gradual.disciplineStreak} gün`} label="Disiplin serisi" sub="Arka arkaya hedefte" />
          <Tile icon="leaf" color={colors.success} value={`${gradual.smokeFreeStreak} gün`} label="Sigarasız seri" sub="Arka arkaya 0 sigara" />
        </View>

        {/* Reduction benefits (replaces the generic health list for reducers) */}
        <Section title="Azaltmanın kazanımları" subtitle="Başlangıç miktarına göre vücuduna girmeyenler">
          <Row label="Daha az sigara" value={`${formatCount(gradual.cigarettesAvoided)} adet`} strong />
          <Row label="≈ Daha az katran" value={`${formatCount(gradual.cigarettesAvoided * TAR_MG_PER_CIGARETTE)} mg`} />
          <Row label="≈ Daha az nikotin" value={`${formatCount(gradual.cigarettesAvoided * NICOTINE_MG_PER_CIGARETTE)} mg`} />
          <Row label="Sigara molasından kurtulan" value={formatDuration(gradual.cigarettesAvoided * MINUTES_PER_CIGARETTE)} />
          <Text style={[styles.footnote, { color: colors.textTertiary }]}>
            Katran ve nikotin, AB sınır değerlerine (sigara başına 10 mg / 1 mg) göre yaklaşık hesaplanır.
          </Text>
        </Section>

        {/* Health timeline: real recovery starts once smoke-free */}
        <Section
          title="Vücudundaki iyileşme"
          subtitle={gradual.smokeFreeStreak > 0
            ? `${gradual.smokeFreeStreak} gündür sigarasızsın, iyileşme başladı`
            : 'Tamamen sigarasız günlerinde başlar. İlk 0 sigaralı günün bu çizelgeyi başlatır.'}
        >
          <HealthTimeline minutesSmokeFree={gradual.smokeFreeStreak * 24 * 60} />
        </Section>

        {checkInSection}
        {discoverySection}
        {cravingsSection}
        {badgesLink}
      </ScrollView>
    );
  }

  // ── IMMEDIATE ──────────────────────────────────
  if (!immediate) return null;
  const quitMoment = new Date(getQuitTimestamp(profile.quitDate));
  const sinceLabel = quitMoment.toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      {header}

      {/* Smoke-free time hero */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        {isPreparation ? (
          <>
            <Text style={styles.heroLabel}>BAŞLAMAYA KALAN</Text>
            <Text style={styles.heroValue}>{daysToStart} gün</Text>
            <Text style={styles.heroText}>{formatDate(startKey, true)} günü başlıyorsun</Text>
          </>
        ) : (
          <>
            <Text style={styles.heroLabel}>SİGARASIZ GEÇEN SÜRE</Text>
            <Text style={styles.heroValue}>{formatDuration(immediate.minutesSmokeFree)}</Text>
            <Text style={styles.heroText}>{sinceLabel} tarihinden beri</Text>
          </>
        )}
      </LinearGradient>

      {/* Key numbers */}
      <View style={styles.grid}>
        <Tile icon="ban" color={colors.error} value={formatCount(immediate.cigarettesAvoided)} label="İçilmeyen sigara" sub={`Günde ${profile.dailyCigaretteCount} sigaraya göre`} />
        <Tile icon="wallet" color={colors.secondary} value={formatMoney(immediate.moneySaved)} label="Cebinde kalan" sub={`Günde ${formatMoney(immediate.dailyCost)}`} />
        <Tile icon="time" color={colors.accent} value={formatDuration(immediate.timeSavedMinutes)} label="Kazanılan zaman" sub={`Sigara başına ${MINUTES_PER_CIGARETTE} dk`} />
        <Tile icon="shield-checkmark" color={colors.success} value={`${cravings.resisted}`} label="Atlatılan istek" sub={`${immediate.flawlessDays} gündür kaymasız`} />
      </View>

      {/* Savings projection */}
      <Section title="Tasarruf planın" subtitle="Bu tempoyla cebinde kalacak para">
        <Row label="1 hafta" value={formatMoney(immediate.dailyCost * 7)} />
        <Row label="1 ay" value={formatMoney(immediate.dailyCost * 30)} />
        <Row label="6 ay" value={formatMoney(immediate.dailyCost * 182)} />
        <Row label="1 yıl" value={formatMoney(immediate.dailyCost * 365)} strong />
      </Section>

      {/* Health timeline */}
      <Section
        title="Vücudundaki iyileşme"
        subtitle={isPreparation ? 'Başladığın andan itibaren işlemeye başlar' : 'Son sigarandan bu yana vücudunda olanlar'}
      >
        <HealthTimeline minutesSmokeFree={immediate.minutesSmokeFree} />
      </Section>

      {checkInSection}
      {discoverySection}
      {cravingsSection}
      {badgesLink}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
    marginBottom: 16,
  },
  hero: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  heroTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: 12,
  },
  heroFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  heroText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  tileSub: {
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionBody: {
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkInButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  weeklyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  weeklyLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  discoveryTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  discoveryFill: {
    height: '100%',
    borderRadius: 3,
  },
  discoveryCount: {
    fontSize: 12,
    marginTop: 4,
  },
  discoveryRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  discoveryIcon: {
    fontSize: 20,
  },
  discoveryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  moodWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moodDay: {
    alignItems: 'center',
    flex: 1,
  },
  moodDayEmoji: {
    fontSize: 24,
  },
  moodDayLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  badgesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgesTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgesCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
