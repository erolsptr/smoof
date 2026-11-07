import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useStatsStore } from '@/store/statsStore';
import { useProgress } from '@/hooks/useProgress';
import { addDays, daysBetween, getQuitTimestamp, getTodayString, parseDateKey, toDateKey } from '@/utils/dateHelpers';
import { getCurrentGradualTarget, getGradualTargetForDate } from '@/utils/gradualHelpers';
import { MonthCalendar, countUnloggedDays } from '@/components/MonthCalendar';
import { CravingCard } from '@/components/CravingCard';
import { FreezeBadge } from '@/components/FreezeBadge';
import { HEALTH_MILESTONES, formatDuration, getNextHealthMilestone, getNextStreakMilestone } from '@/utils/milestones';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Typography } from '@/constants';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

/**
 * Home Screen - Dashboard
 * Preparation (future start), immediate quit (day 0 included) and gradual reduction
 */
export default function HomeScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, now, immediate, gradual: gradualMetrics } = useProgress();
  const currentStreak = useStatsStore((state) => state.currentStreak);
  const smokeFreeStreak = useStatsStore((state) => state.smokeFreeStreak);
  const dailyStats = useStatsStore((state) => state.dailyStats);
  
  // Quit / start day as local date keys
  const quitDayKey = profile?.quitDate ? toDateKey(profile.quitDate) : null;
  const todayKey = getTodayString();
  const isPreparationMode = quitDayKey ? quitDayKey > todayKey : false;
  const daysUntilQuit = isPreparationMode && quitDayKey ? daysBetween(todayKey, quitDayKey) : 0;
  
  // Calculate freezes remaining
  const freezesRemaining = (profile?.streakFreezes || 0) - (profile?.streakFreezesUsed || 0);
  
  // Animation values
  const mascotScale = useRef(new Animated.Value(1)).current;
  const streakScale = useRef(new Animated.Value(0)).current;
  const streakOpacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(30)).current;
  
  // Entrance animations
  useEffect(() => {
    // Mascot bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotScale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(mascotScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Streak entrance
    Animated.parallel([
      Animated.spring(streakScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(streakOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Cards entrance (delayed) - only in normal mode
    if (!isPreparationMode) {
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(cardsOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(cardsTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isPreparationMode]);

  // Numbers come from the shared metrics (same as Statistics / Profile / badges)
  const cigarettesNotSmoked = immediate?.cigarettesAvoided ?? gradualMetrics?.cigarettesAvoided ?? 0;
  const moneySaved = immediate?.moneySaved ?? gradualMetrics?.moneySaved ?? 0;
  const timeSavedMinutes = immediate?.timeSavedMinutes ?? 0;
  const timeSavedHours = Math.floor(timeSavedMinutes / 60);

  // Motivational message based on streak
  const getMotivationalMessage = () => {
    if (currentStreak === 0) return 'İlk günün! Başarırsın 💪';
    if (currentStreak === 1) return 'İlk gün tamamlandı! 🎉';
    if (currentStreak < 7) return 'Harika gidiyorsun! Devam et 💪';
    if (currentStreak < 30) return 'Süpersin! İlerleme harika 🌟';
    if (currentStreak < 90) return 'İnanılmaz! Gurur duymalısın 🏆';
    return 'Efsanesin! Ne kadar güçlüsün 👑';
  };

  // Preparation message based on the user's motivations (rotates daily, no randomness in render)
  const getPreparationMessage = () => {
    const motivations = profile?.motivations || [];
    const messages: string[] = [];

    if (motivations.includes('health')) messages.push('Sağlığın için harika bir karar verdin! ❤️');
    if (motivations.includes('money')) messages.push('Tasarruf zamanı başlıyor! 💰');
    if (motivations.includes('family')) messages.push('Sevdiklerin için bu adımı atıyorsun 👨‍👩‍👧‍👦');
    if (motivations.includes('freedom')) messages.push('Bağımsızlık yakında senin olacak! 🦋');
    if (motivations.includes('appearance')) messages.push('Cildin ve dişlerin teşekkür edecek! ✨');
    if (motivations.includes('sports')) messages.push('Performansın artacak! 🏃‍♂️');

    if (messages.length === 0) return 'Harika bir karar verdin! 🌟';
    return messages[new Date(now).getDate() % messages.length];
  };

  const isGradual = profile?.quitMethod === 'gradual';

  // Centered mascot + greeting; the freeze badge floats in the corner so it doesn't shift them
  const renderCenteredHeader = (title: string, subtitle: string) => (
    <View style={styles.centeredHeader}>
      <FreezeBadge
        remaining={freezesRemaining}
        total={profile?.streakFreezes || 0}
        description={isGradual
          ? 'Hedefini aştığın günlerde freeze kullanarak disiplin günü streak’ini koruyabilirsin.'
          : 'Kayma anında freeze kullanarak sigarasız günlerini koruyabilirsin.'}
        style={styles.freezeBadgeCorner}
      />
      <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
        <Image
          source={require('../../../assets/smoof.png')}
          style={styles.centeredMascot}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={[styles.greeting, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  const renderListCard = (
    icon: keyof typeof Ionicons.glyphMap,
    iconColor: string,
    title: string,
    rows: { key: string; left?: string; text: string }[],
  ) => (
    <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.listHeader}>
        <View style={[styles.listHeaderIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.listTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {rows.map((row) => (
        <View key={row.key} style={styles.listRow}>
          {row.left ? (
            <Text style={[styles.listRowLeft, { color: iconColor }]}>{row.left}</Text>
          ) : (
            <Ionicons name="checkmark-circle-outline" size={18} color={iconColor} />
          )}
          <Text style={[styles.listRowText, { color: colors.textSecondary }]}>{row.text}</Text>
        </View>
      ))}
    </View>
  );

  // ─────────────────────────────────────────────
  // PREPARATION MODE - start date is in the future (both methods)
  // ─────────────────────────────────────────────
  if (isPreparationMode && profile && quitDayKey) {
    const startLabel = parseDateKey(quitDayKey).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    });

    const planRows = isGradual
      ? Array.from({ length: Math.min(profile.gradualTargetWeeks || 6, 6) }).map((_, week) => {
          const weekTarget = getGradualTargetForDate(profile, addDays(quitDayKey, week * 7));
          return {
            key: `w${week}`,
            left: `${week + 1}. hafta`,
            text: weekTarget === 0 ? 'Sigarasız! 🎉' : `Günde en fazla ${weekTarget} sigara`,
          };
        })
      : [0, 1, 4, 5, 7].map((i) => HEALTH_MILESTONES[i]).map((m) => ({ key: m.label, left: m.label, text: m.title }));

    const tips = isGradual
      ? [
          'Gün içinde kaç sigara içtiğini fark etmeye başla',
          'En kolay vazgeçebileceğin sigarayı belirle',
          'Sevdiklerine söyle, destek al',
          'Stresli anlar için bir plan yap',
        ]
      : [
          'Sigaralarını ve çakmağını şimdiden at',
          'Sevdiklerine söyle, destek al',
          'Stresli anlar için bir plan yap',
          'Bol su iç, sağlıklı atıştırmalıklar al',
        ];

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.screenContent, { paddingTop: insets.top + 12 }]}
      >
        {renderCenteredHeader('Sözünü aldım! 🤝', getPreparationMessage())}

        <Animated.View style={{ opacity: streakOpacity, transform: [{ scale: streakScale }] }}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="calendar" size={26} color="#FFF" />
              </View>
              <View>
                <Text style={styles.heroLabel}>BAŞLAMAYA KALAN</Text>
                <View style={styles.heroValueRow}>
                  <Text style={styles.heroNumber}>{daysUntilQuit}</Text>
                  <Text style={styles.heroUnit}>gün</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroDivider} />
            <Text style={styles.heroProgressText}>
              {isGradual ? 'Kademeli azaltma' : 'Sigarasız yolculuğun'} {startLabel} başlıyor
            </Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: cardsOpacity, transform: [{ translateY: cardsTranslateY }] }}>
          {renderListCard(
            'sparkles',
            colors.secondary,
            isGradual ? `Planın · ${profile.gradualTargetWeeks || 6} hafta` : 'Seni neler bekliyor',
            planRows,
          )}
          {renderListCard(
            'bulb',
            colors.primary,
            'Hazırlık listesi',
            tips.map((t) => ({ key: t, text: t })),
          )}
        </Animated.View>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // GRADUAL MODE
  // ─────────────────────────────────────────────
  if (profile && isGradual) {
    const target = getCurrentGradualTarget(profile);
    const unloggedDays = countUnloggedDays(profile, dailyStats);

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.screenContent, { paddingTop: insets.top + 12 }]}
      >
        {/* Header: mascot + greeting + freeze badge */}
        <View style={styles.gradualHeader}>
          <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
            <Image
              source={require('../../../assets/smoof.png')}
              style={styles.gradualMascot}
              resizeMode="contain"
            />
          </Animated.View>
          <View style={styles.gradualGreeting}>
            <Text style={[styles.gradualHello, { color: colors.text }]}>Merhaba! 👋</Text>
            <Text style={[styles.gradualTarget, { color: colors.textSecondary }]}>
              Bugünkü hedefin:{' '}
              <Text style={{ color: colors.text, fontWeight: '700' }}>{target} sigara</Text>
            </Text>
          </View>
          <FreezeBadge
            remaining={freezesRemaining}
            total={profile.streakFreezes || 0}
            description="Hedefini aştığın günlerde freeze kullanarak disiplin günü streak’ini koruyabilirsin."
          />
        </View>

        {/* Streaks */}
        <View style={styles.gradualStreakRow}>
          <View style={[styles.streakTile, { backgroundColor: colors.streakFire + '18', borderColor: colors.streakFire + '40' }]}>
            <View style={[styles.streakTileIcon, { backgroundColor: colors.streakFire }]}>
              <Ionicons name="flame" size={18} color="#FFF" />
            </View>
            <View style={styles.streakTileText}>
              <Text style={[styles.streakTileValue, { color: colors.text }]}>
                {currentStreak} <Text style={styles.streakTileUnit}>gün</Text>
              </Text>
              <Text style={[styles.streakTileLabel, { color: colors.text }]}>Disiplin</Text>
            </View>
          </View>

          <View style={[styles.streakTile, { backgroundColor: colors.success + '18', borderColor: colors.success + '40' }]}>
            <View style={[styles.streakTileIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="leaf" size={18} color="#FFF" />
            </View>
            <View style={styles.streakTileText}>
              <Text style={[styles.streakTileValue, { color: colors.text }]}>
                {smokeFreeStreak} <Text style={styles.streakTileUnit}>gün</Text>
              </Text>
              <Text style={[styles.streakTileLabel, { color: colors.text }]}>Sigarasız</Text>
            </View>
          </View>
        </View>

        {/* Craving help - the place to tap when a craving hits */}
        <CravingCard />

        {/* Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <MonthCalendar
            profile={profile}
            dailyStats={dailyStats}
            onDayPress={(date) => router.push(`/daily-logger?date=${date}`)}
          />
          <Text style={[styles.calendarHint, { color: colors.textTertiary }]}>
            {unloggedDays > 0
              ? `${unloggedDays} gün henüz girilmedi · Güne dokunarak ekleyebilirsin`
              : 'Bir güne dokunarak içtiğin sigara sayısını girebilirsin'}
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // IMMEDIATE MODE (day 0 = first day, same layout)
  // ─────────────────────────────────────────────
  const isDayZero = currentStreak === 0;
  const streakMilestone = getNextStreakMilestone(currentStreak);
  const quitTimestamp = profile?.quitDate ? getQuitTimestamp(profile.quitDate) : now;
  const minutesSinceQuit = Math.max(0, (now - quitTimestamp) / 60000);
  const healthMilestone = getNextHealthMilestone(minutesSinceQuit);

  // Day 0: the first badge comes at midnight, so show progress towards it
  const midnight = parseDateKey(addDays(getTodayString(), 1)).getTime();
  const dayZeroProgress = midnight > quitTimestamp
    ? (now - quitTimestamp) / (midnight - quitTimestamp)
    : 1;
  const minutesToMidnight = (midnight - now) / 60000;

  const heroProgress = isDayZero ? dayZeroProgress : streakMilestone.progress;
  const heroProgressLabel = isDayZero
    ? `Gece yarısına kadar dayan, ilk rozet senin · ${formatDuration(minutesToMidnight)} kaldı`
    : `Sonraki rozet: ${streakMilestone.target} gün · ${streakMilestone.remaining} gün kaldı`;

  const gains = [
    {
      key: 'cigarettes',
      icon: 'ban' as const,
      color: colors.error,
      value: Math.floor(cigarettesNotSmoked).toLocaleString('tr-TR'),
      label: 'İçilmeyen\nsigara',
    },
    {
      key: 'money',
      icon: 'wallet' as const,
      color: colors.secondary,
      value: `₺${Math.floor(moneySaved).toLocaleString('tr-TR')}`,
      label: 'Cebinde\nkalan',
    },
    {
      key: 'time',
      icon: 'time' as const,
      color: colors.accent,
      value: timeSavedMinutes < 60 ? `${timeSavedMinutes} dk` : `${timeSavedHours} sa`,
      label: 'Kazanılan\nzaman',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.screenContent, { paddingTop: insets.top + 12 }]}
    >
      {isDayZero
        ? renderCenteredHeader('Bugün büyük gün! 🚀', 'İlk günün başladı, yanındayım')
        : renderCenteredHeader('Merhaba! Bugün nasılsın?', getMotivationalMessage())}

      {/* Streak hero */}
      <Animated.View style={{ opacity: streakOpacity, transform: [{ scale: streakScale }] }}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name={isDayZero ? 'rocket' : 'flame'} size={26} color="#FFF" />
            </View>
            <View>
              <Text style={styles.heroLabel}>{isDayZero ? 'İLK GÜNÜN' : 'SİGARASIZ'}</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroNumber}>{currentStreak}</Text>
                <Text style={styles.heroUnit}>gün</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroProgressTrack}>
            <View
              style={[
                styles.heroProgressFill,
                { width: `${Math.min(100, Math.max(4, heroProgress * 100))}%` },
              ]}
            />
          </View>
          <Text style={styles.heroProgressText}>{heroProgressLabel}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Craving help */}
      <CravingCard />

      <Animated.View style={{ opacity: cardsOpacity, transform: [{ translateY: cardsTranslateY }] }}>
        {/* Gains */}
        <View style={styles.gainsRow}>
          {gains.map((gain) => (
            <View
              key={gain.key}
              style={[styles.gainTile, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <View style={[styles.gainIcon, { backgroundColor: gain.color + '20' }]}>
                <Ionicons name={gain.icon} size={18} color={gain.color} />
              </View>
              <Text
                style={[styles.gainValue, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {gain.value}
              </Text>
              <Text style={[styles.gainLabel, { color: colors.textSecondary }]}>
                {gain.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Next health milestone */}
        <TouchableOpacity
          style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => router.push('/achievements')}
          activeOpacity={0.7}
        >
          <View style={[styles.healthIcon, { backgroundColor: colors.error + '18' }]}>
            <Ionicons name="heart" size={20} color={colors.error} />
          </View>
          <View style={styles.healthBody}>
            {healthMilestone ? (
              <>
                <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>
                  Sıradaki sağlık kazanımı · {healthMilestone.reachedCount}/{HEALTH_MILESTONES.length}
                </Text>
                <Text style={[styles.healthTitle, { color: colors.text }]} numberOfLines={1}>
                  {healthMilestone.title}
                </Text>
                <View style={[styles.healthTrack, { backgroundColor: colors.cardBorder }]}>
                  <View
                    style={[
                      styles.healthFill,
                      {
                        backgroundColor: colors.error,
                        width: `${Math.min(100, Math.max(3, healthMilestone.progress * 100))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.healthLeft, { color: colors.textSecondary }]}>
                  {formatDuration(healthMilestone.minutesLeft)} kaldı
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>
                  Sağlık kazanımları · {HEALTH_MILESTONES.length}/{HEALTH_MILESTONES.length}
                </Text>
                <Text style={[styles.healthTitle, { color: colors.text }]}>
                  Hepsini tamamladın! 🎉
                </Text>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* First-day tips */}
        {isDayZero && (
          <View style={styles.dayZeroTips}>
            {renderListCard('shield-checkmark', colors.primary, 'Bugün için ipuçları', [
              { key: 't1', text: 'İstek gelince “Canın sigara mı çekti?” kartına dokun' },
              { key: 't2', text: 'Bol bol su iç, vücudun toksinlerden arınıyor' },
              { key: 't3', text: 'Günün sonunda kendini küçük bir şeyle ödüllendir' },
            ])}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Shared header
  centeredHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  freezeBadgeCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  centeredMascot: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subGreeting: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },

  // Hero card (immediate + preparation)
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroNumber: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 50,
  },
  heroUnit: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  heroProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  heroProgressText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },

  // Gains row
  gainsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  gainTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  gainIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gainValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  gainLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },

  // Health milestone card
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBody: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 12,
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  healthTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  healthFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthLeft: {
    fontSize: 12,
    marginTop: 4,
  },
  dayZeroTips: {
    marginTop: 16,
  },

  // List card (tips, plan, what to expect)
  listCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  listHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listRowLeft: {
    width: 72,
    fontSize: 13,
    fontWeight: '700',
  },
  listRowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Gradual mode
  gradualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  gradualMascot: {
    width: 56,
    height: 56,
  },
  gradualGreeting: {
    flex: 1,
  },
  gradualHello: {
    fontSize: 22,
    fontWeight: '700',
  },
  gradualTarget: {
    fontSize: 14,
    marginTop: 2,
  },
  gradualStreakRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  streakTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  streakTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTileText: {
    flex: 1,
  },
  streakTileValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  streakTileUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakTileLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  calendarCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  calendarHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
