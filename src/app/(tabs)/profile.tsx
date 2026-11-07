import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProgress } from '@/hooks/useProgress';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useAchievementStore } from '@/store/achievementStore';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { storage } from '@/utils/storage';
import { getDateString, getQuitTimestamp, getTodayString, toDateKey } from '@/utils/dateHelpers';
import { getCurrentGradualTarget, getTrackingStartDate } from '@/utils/gradualHelpers';
import { getAchievementProgress, isAchievementAvailable } from '@/utils/progressMetrics';
import { EditValueModal } from '@/components/EditValueModal';

type EditField = 'packPrice' | 'perPack' | 'target' | null;

function InfoRow({ icon, iconColor, label, value, onPress, right }: {
  icon: keyof typeof Ionicons.glyphMap; iconColor?: string; label: string; value: string;
  onPress?: () => void; right?: ReactNode;
}) {
  const { colors } = useColorScheme();
  const tint = iconColor ?? colors.textSecondary;
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
      <View style={[styles.infoIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
      {right}
      {onPress && !right && <Ionicons name="create-outline" size={18} color={colors.primary} />}
    </TouchableOpacity>
  );
}

function Divider() {
  const { colors } = useColorScheme();
  return <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />;
}

export default function ProfileScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, gradual, isGradual, isPreparation, achievementContext } = useProgress();
  const updateProfile = useUserStore((s) => s.updateProfile);
  const clearUserData = useUserStore((s) => s.clearUserData);
  const currentStreak = useStatsStore((s) => s.currentStreak);
  const smokeFreeStreak = useStatsStore((s) => s.smokeFreeStreak);
  const clearStatsData = useStatsStore((s) => s.clearStatsData);
  const syncStreaks = useStatsStore((s) => s.syncStreaks);
  const unlockedIds = useAchievementStore((s) => s.unlockedAchievements);
  const resetAchievements = useAchievementStore((s) => s.resetAchievements);

  const [testModeVisible, setTestModeVisible] = useState(false);
  const [testTapCount, setTestTapCount] = useState(0);
  const [editing, setEditing] = useState<EditField>(null);

  if (!profile) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  // ── Badges summary ──────────────────────────────
  const available = ACHIEVEMENTS.filter((a) => isAchievementAvailable(a, isGradual));
  const earned = unlockedIds
    .map((id) => available.find((a) => a.id === id))
    .filter((a): a is (typeof available)[number] => a !== undefined);
  const recentEarned = earned.slice(-4).reverse();
  const nextBadge = achievementContext
    ? available
        .filter((a) => !unlockedIds.includes(a.id))
        .map((a) => ({ badge: a, progress: getAchievementProgress(a, achievementContext) }))
        .sort((x, y) => y.progress - x.progress)[0]
    : undefined;

  // ── Plan info ───────────────────────────────────
  const startKey = isGradual ? getTrackingStartDate(profile) : toDateKey(profile.quitDate);
  const startLabel = new Date(getQuitTimestamp(isGradual ? startKey : profile.quitDate)).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const freezesLeft = profile.streakFreezes - profile.streakFreezesUsed;
  const currentTarget = isGradual ? getCurrentGradualTarget(profile) : 0;

  const subtitle = isPreparation
    ? `${startLabel} tarihinde başlıyorsun`
    : isGradual
      ? `${gradual ? Math.min(gradual.currentWeek, gradual.totalWeeks) : 1}. hafta · ${currentStreak} gün disiplin`
      : `${currentStreak} gündür sigarasızsın`;

  // ── Handlers ────────────────────────────────────
  // Secret test mode trigger (5 taps on Smoof)
  const handleSmoofTap = () => {
    const newCount = testTapCount + 1;
    setTestTapCount(newCount);
    if (newCount === 5) {
      setTestModeVisible(!testModeVisible);
      setTestTapCount(0);
      Alert.alert(
        testModeVisible ? 'Test Modu Kapatıldı' : 'Test Modu Açıldı',
        testModeVisible ? 'Geliştirici özellikleri gizlendi' : 'Geliştirici özellikleri açıldı',
      );
    }
  };

  const handleDateTest = async (daysAgo: number) => {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() - daysAgo); // negative = future
    const newQuitDate = getDateString(testDate);

    // Gradual: calendar and weekly targets use gradualStartDate, so move it too
    await updateProfile(isGradual ? { quitDate: newQuitDate, gradualStartDate: newQuitDate } : { quitDate: newQuitDate });
    syncStreaks(useUserStore.getState().profile);

    const planInfo = isGradual
      ? `\nPlan: ${profile.gradualTargetWeeks ?? '-'} hafta, haftada -${profile.gradualWeeklyReduction ?? 0} sigara\nTakvimde ${newQuitDate} tarihinden itibaren giriş yapabilirsin`
      : '';
    Alert.alert(
      'Tarih Güncellendi',
      daysAgo < 0
        ? `Hazırlık Modu: ${Math.abs(daysAgo)} gün kaldı\nTarih: ${newQuitDate}${planInfo}`
        : `Başlangıç: ${daysAgo} gün önce\nTarih: ${newQuitDate}${planInfo}`,
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Uygulamayı Sıfırla',
      'Tüm veriler silinecek ve başa döneceksin. Emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await clearUserData();
            await clearStatsData();
            await resetAchievements();
            await storage.clear();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  const showFreezeInfo = () => {
    Alert.alert(
      'Streak Freeze',
      isGradual
        ? 'Hedefini aştığın bir günde kullanırsan disiplin serin bozulmaz.'
        : 'Bir kayma yaşarsan freeze kullanarak sigarasız serini koruyabilirsin. Kullanmazsan seri sıfırdan başlar.',
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSmoofTap} activeOpacity={0.8}>
          <Image source={require('../../../assets/smoof.png')} style={styles.avatar} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.text }]}>Profilim</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        <View style={[styles.methodChip, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name={isGradual ? 'trending-down' : 'flash'} size={14} color={colors.primary} />
          <Text style={[styles.methodChipText, { color: colors.primary }]}>
            {isGradual ? `Kademeli azaltma · ${profile.gradualTargetWeeks ?? 6} hafta` : 'Hemen bırakma'}
          </Text>
        </View>
      </View>

      {/* Badges */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/achievements')}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Rozetlerim</Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
            {earned.length}/{available.length}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
        <View style={[styles.track, { backgroundColor: colors.cardBorder }]}>
          <View style={[styles.fill, { backgroundColor: colors.secondary, width: `${Math.max(3, (earned.length / available.length) * 100)}%` }]} />
        </View>

        {recentEarned.length > 0 ? (
          <View style={styles.badgeRow}>
            {recentEarned.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.iconColor + '20' }]}>
                  <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={22} color={badge.iconColor} />
                </View>
                <Text style={[styles.badgeName, { color: colors.textSecondary }]} numberOfLines={2}>
                  {badge.title}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>İlk rozetin yolda 🌱</Text>
        )}

        {nextBadge && (
          <View style={[styles.nextBadge, { backgroundColor: colors.background }]}>
            <Ionicons name={nextBadge.badge.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.textTertiary} />
            <Text style={[styles.nextBadgeText, { color: colors.textSecondary }]} numberOfLines={1}>
              Sıradaki: <Text style={{ color: colors.text, fontWeight: '700' }}>{nextBadge.badge.title}</Text>
            </Text>
            <Text style={[styles.nextBadgePct, { color: colors.textSecondary }]}>%{nextBadge.progress}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Plan */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bırakma planım</Text>
      <View style={[styles.card, styles.listCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <InfoRow icon="calendar" iconColor={colors.primary} label={isGradual ? 'Başlangıç tarihi' : 'Bırakma tarihi'} value={startLabel} />
        <Divider />
        <InfoRow
          icon="bar-chart"
          iconColor={colors.secondary}
          label="Başlamadan önce günde"
          value={`${isGradual ? (profile.gradualStartCount || profile.dailyCigaretteCount) : profile.dailyCigaretteCount} sigara`}
        />
        {isGradual && (
          <>
            <Divider />
            <InfoRow
              icon="flag"
              iconColor={colors.accent}
              label="Bugünkü hedef (sadece azaltılabilir)"
              value={`${currentTarget} sigara · haftada -${profile.gradualWeeklyReduction ?? 0}`}
              onPress={() => setEditing('target')}
            />
          </>
        )}
        <Divider />
        <InfoRow
          icon="snow"
          iconColor={colors.accent}
          label="Streak freeze"
          value={`${freezesLeft} / ${profile.streakFreezes} kaldı`}
          onPress={showFreezeInfo}
          right={
            <View style={styles.snowRow}>
              {Array.from({ length: profile.streakFreezes }).map((_, i) => (
                <Ionicons key={i} name="snow" size={16} color={i < freezesLeft ? colors.accent : colors.cardBorder} />
              ))}
            </View>
          }
        />
      </View>

      {/* Costs */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasarruf hesabı</Text>
      <View style={[styles.card, styles.listCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <InfoRow icon="cash-outline" iconColor={colors.success} label="Paket fiyatı" value={`₺${profile.packPrice}`} onPress={() => setEditing('packPrice')} />
        <Divider />
        <InfoRow icon="albums-outline" iconColor={colors.success} label="Paketteki sigara" value={`${profile.cigarettesPerPack || 20} adet`} onPress={() => setEditing('perPack')} />
      </View>
      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        İstatistiklerdeki tasarruf bu değerlerle hesaplanır.
      </Text>

      {/* Settings */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Ayarlar</Text>
      <View style={[styles.card, styles.listCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.infoRow} onPress={() => router.push('/settings/notifications')}>
          <View style={[styles.infoIcon, { backgroundColor: colors.textSecondary + '18' }]}>
            <Ionicons name="notifications" size={18} color={colors.textSecondary} />
          </View>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Bildirimler</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Test Mode (hidden; 5 taps on Smoof) */}
      {testModeVisible && (
        <View style={styles.testSection}>
          <View style={styles.testHeader}>
            <Ionicons name="flask" size={18} color={colors.secondary} />
            <Text style={[styles.sectionTitle, styles.testTitle, { color: colors.secondary }]}>Test Modu 🧪</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.testCardTitle, { color: colors.text }]}>Geçmiş başlangıç</Text>
            <View style={styles.testGrid}>
              {([
                [1, '1 Gün'], [3, '3 Gün'], [7, '1 Hafta'], [14, '2 Hafta'], [30, '1 Ay'],
                [60, '2 Ay'], [90, '3 Ay'], [180, '6 Ay'], [365, '1 Yıl'], [730, '2 Yıl'],
              ] as const).map(([days, label]) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.testButton, { backgroundColor: days >= 365 ? colors.secondary : colors.primary }]}
                  onPress={() => handleDateTest(days)}
                >
                  <Text style={styles.testButtonText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.testCardTitle, { color: colors.text }]}>Gelecek başlangıç (hazırlık)</Text>
            <View style={styles.testGrid}>
              {([[-1, '+1 Gün'], [-3, '+3 Gün'], [-7, '+1 Hafta'], [-14, '+2 Hafta'], [-30, '+1 Ay']] as const).map(([days, label]) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.testButton, { backgroundColor: '#8B5CF6' }]}
                  onPress={() => handleDateTest(days)}
                >
                  <Text style={styles.testButtonText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.testCardTitle, { color: colors.text }]}>Debug</Text>
            {[
              ['Bugün', getTodayString()],
              ['quitDate', profile.quitDate],
              ...(isGradual ? [['gradualStartDate', profile.gradualStartDate ?? '-']] : []),
              [isGradual ? 'Disiplin serisi' : 'Seri', `${currentStreak} gün`],
              ['Sigarasız seri', `${smokeFreeStreak} gün`],
              ['Rozet', `${earned.length}/${available.length}`],
            ].map(([label, value]) => (
              <View key={label} style={styles.debugRow}>
                <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.debugValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.error }]} onPress={handleResetApp}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.resetButtonText}>Uygulamayı Sıfırla</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.footer, { color: colors.textTertiary }]}>Smoof v1.0.0 · Made with 💚</Text>

      {/* Editors */}
      <EditValueModal
        visible={editing === 'packPrice'}
        icon="cash-outline"
        title="Paket fiyatı"
        message="Tasarruf hesapları bu fiyata göre yapılır."
        initialValue={profile.packPrice}
        suffix="₺"
        decimal
        validate={(v) => (v <= 0 ? 'Fiyat 0’dan büyük olmalı.' : null)}
        onSubmit={async (v) => { await updateProfile({ packPrice: v }); setEditing(null); }}
        onClose={() => setEditing(null)}
      />
      <EditValueModal
        visible={editing === 'perPack'}
        icon="albums-outline"
        title="Paketteki sigara"
        initialValue={profile.cigarettesPerPack || 20}
        suffix="adet"
        validate={(v) => (v < 1 || v > 50 ? '1 ile 50 arasında bir sayı gir.' : null)}
        onSubmit={async (v) => { await updateProfile({ cigarettesPerPack: v }); setEditing(null); }}
        onClose={() => setEditing(null)}
      />
      {isGradual && (
        <EditValueModal
          visible={editing === 'target'}
          icon="flag"
          title="Günlük hedef"
          message={`Şu anki hedefin ${currentTarget} sigara. Hedefi sadece azaltabilirsin; plan haftalık azalmaya devam eder.`}
          initialValue={currentTarget}
          suffix="sigara"
          validate={(v) => (v > currentTarget ? `Hedef ${currentTarget} sigaradan yüksek olamaz.` : null)}
          onSubmit={async (v) => {
            await updateProfile({ gradualCurrentTarget: v });
            setEditing(null);
            if (v === 0) Alert.alert('🎉 Hedef 0!', 'Artık hedefin tamamen sigarasız günler.');
          }}
          onClose={() => setEditing(null)}
        />
      )}
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
  },
  methodChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  listCard: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: 14,
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
  badgeRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  badgeItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  nextBadgeText: {
    flex: 1,
    fontSize: 13,
  },
  nextBadgePct: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  snowRow: {
    flexDirection: 'row',
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
  },
  hint: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  testSection: {
    marginTop: 16,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  testTitle: {
    marginTop: 0,
    marginBottom: 0,
  },
  testCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  testGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  debugLabel: {
    fontSize: 13,
  },
  debugValue: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
