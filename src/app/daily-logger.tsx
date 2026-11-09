import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort, getGradualTargetForDate, getTrackingStartDate } from '@/utils/gradualHelpers';
import { getTodayString } from '@/utils/dateHelpers';
import { FreezeModal } from '@/components/FreezeModal';
import { getUnloggedDays } from '@/components/MonthCalendar';
import { Smoof, type SmoofMood } from '@/components/smoof/Smoof';

type Reaction = 'zero' | 'freeze' | 'restart';

const REACTIONS: Record<Reaction, { mood: SmoofMood; title: string; text: string }> = {
  zero: { mood: 'proud', title: 'İlk kez 0 sigara! 🎉', text: 'Sigarasız serin başladı. Çok güçlüsün! 🌟' },
  freeze: { mood: 'wink', title: 'Şşş, çaktırma! 🤫', text: 'Freeze kullandın, disiplin serin korundu. Devam ediyoruz.' },
  restart: { mood: 'encourage', title: 'Yeniden başlıyoruz 💪', text: 'Bugün zorlandık, olsun. Yarın yeni bir gün ve ben yanındayım.' },
};

/**
 * Daily Logger Screen - For gradual reduction users
 * Log how many cigarettes smoked today or a specific date
 */
export default function DailyLoggerScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const profile = useUserStore((state) => state.profile);
  const { updateDailyStats, dailyStats } = useStatsStore();
  
  // Get target date from params or default to today
  const today = getTodayString();
  const targetDate = (params.date as string) || today;
  const isToday = targetDate === today;
  // "Eksik günleri gir" flow: after saving, go straight to the next missing day
  const isMissingFlow = params.flow === 'missing';
  const missingDays = profile && isMissingFlow ? getUnloggedDays(profile, dailyStats) : [];
  
  const [cigaretteCount, setCigaretteCount] = useState('');
  // Smoof's short reaction after saving (auto-closes, then goes back)
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [previousDayCount, setPreviousDayCount] = useState(-1);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Limit of the selected day: a logged day keeps the limit it was logged with,
  // otherwise the plan's limit for that date (later target changes don't apply back)
  const loggedTarget = dailyStats.find((s) => s.date === targetDate)?.targetCigarettes;
  const target = loggedTarget ?? (profile ? getGradualTargetForDate(profile, targetDate) : 0);
  const countNum = parseInt(cigaretteCount, 10) || 0;
  const isValid = cigaretteCount.length > 0 && countNum >= 0 && countNum <= 50;

  // Only days from the tracking start date up to today can be logged
  const startDate = profile ? getTrackingStartDate(profile) : today;
  const isBeforeQuitDate = targetDate < startDate;
  const isFutureDate = targetDate > today;

  // Load target date's data if exists
  useEffect(() => {
    const targetStats = dailyStats.find(s => s.date === targetDate);
    if (targetStats) {
      setCigaretteCount(targetStats.cigarettesSmoked.toString());
      setPreviousDayCount(targetStats.cigarettesSmoked);
    }
  }, [dailyStats, targetDate]);

  // Leave the screen after a save: next missing day in the flow, otherwise back
  const finish = () => {
    const currentProfile = useUserStore.getState().profile;
    if (isMissingFlow && currentProfile) {
      const next = getUnloggedDays(currentProfile, useStatsStore.getState().dailyStats)[0];
      if (next) {
        router.replace(`/daily-logger?date=${next}&flow=missing`);
        return;
      }
    }
    router.back();
  };

  // Show locked screen if date is before quit date
  if ((isBeforeQuitDate || isFutureDate) && profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.lockedScreen}>
          <Ionicons name="lock-closed" size={64} color={colors.textTertiary} />
          <Text style={[styles.lockedTitle, { color: colors.text }]}>
            Bu Gün Kilitli
          </Text>
          <Text style={[styles.lockedMessage, { color: colors.textSecondary }]}>
            {isFutureDate
              ? 'Gelecekteki günler için henüz giriş yapamazsın.'
              : `${formatDateShort(startDate)} tarihinden önce sigara girişi yapamazsın.`}
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!isValid || !profile) return;

    const count = parseInt(cigaretteCount, 10);
    
    // Check if target is exceeded for gradual mode
    if (profile.quitMethod === 'gradual' && count > target) {
      const freezesRemaining = profile.streakFreezes - profile.streakFreezesUsed;
      
      if (freezesRemaining > 0) {
        // Show custom freeze modal
        setPendingCount(count);
        setFreezeModalVisible(true);
        return;
      } else {
        // No freeze available, reset streak
        await updateDailyStats(targetDate, {
          cigarettesSmoked: count,
          smokeFree: count === 0,
          targetCigarettes: target,
          metGoal: false,
        });
        finish();
        return;
      }
    }
    
    // Only the very first 0-cigarette day ever gets the celebration:
    // no other day has 0 yet and this day wasn't already saved as 0
    const isFirstZeroDay = count === 0
      && previousDayCount !== 0
      && !dailyStats.some((s) => s.date !== targetDate && s.cigarettesSmoked === 0);

    // Normal save (goal met or not exceeded)
    await updateDailyStats(targetDate, {
      cigarettesSmoked: count,
      smokeFree: count === 0,
      targetCigarettes: target,
      metGoal: count <= target,
    });

    // Celebrate the first time reaching 0
    if (isFirstZeroDay) {
      showReaction('zero');
    } else {
      finish();
    }
  };

  const showReaction = (r: Reaction) => {
    setReaction(r);
    setTimeout(() => {
      setReaction(null);
      finish();
    }, 2600);
  };

  const handleUseFreeze = async () => {
    setFreezeModalVisible(false);
    
    // Use freeze and save with goal met
    const success = useUserStore.getState().useStreakFreeze();
    if (success) {
      await updateDailyStats(targetDate, {
        cigarettesSmoked: pendingCount,
        smokeFree: pendingCount === 0,
        targetCigarettes: target,
        metGoal: true, // Treat as goal met because freeze was used
      });
      showReaction('freeze');
      return;
    }
    finish();
  };

  const handleDeclineFreeze = async () => {
    setFreezeModalVisible(false);
    
    // Don't use freeze, reset streak
    await updateDailyStats(targetDate, {
      cigarettesSmoked: pendingCount,
      smokeFree: pendingCount === 0,
      targetCigarettes: target,
      metGoal: false,
    });
    showReaction('restart');
  };

  const handleCorrection = () => {
    setFreezeModalVisible(false);
    // Clear input so user can re-enter correct value
    setCigaretteCount('');
    setPendingCount(0);
  };

  const metGoal = countNum <= target;

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header */}
            <View style={[styles.header, { top: insets.top + Spacing.sm }]}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.closeButton}
                hitSlop={12}
                accessibilityLabel="Kapat"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Question */}
            <View style={styles.questionSection}>
              {isMissingFlow && missingDays.length > 0 && (
                <View style={[styles.flowChip, { backgroundColor: colors.secondary + '20' }]}>
                  <Ionicons name="calendar-outline" size={14} color={colors.secondary} />
                  <Text style={[styles.flowChipText, { color: colors.secondary }]}>
                    Eksik gün · {missingDays.length} gün kaldı
                  </Text>
                </View>
              )}
              <Text style={[styles.question, { color: colors.text }]}>
                {isToday ? 'Bugün' : formatDateShort(targetDate)} kaç sigara içtin? 🚬
              </Text>
              
              <Text style={[styles.targetHint, { color: colors.textSecondary }]}>
                Hedefin: {target} sigara
              </Text>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: cigaretteCount ? 
                      (metGoal ? colors.success : colors.error) : 
                      colors.cardBorder,
                  }
                ]}
                value={cigaretteCount}
                onChangeText={setCigaretteCount}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                autoFocus
                maxLength={2}
              />
              <Text style={[styles.unit, { color: colors.textSecondary }]}>
                sigara
              </Text>
            </View>

            {/* Goal indicator */}
            {cigaretteCount.length > 0 && (
              <View style={[
                styles.goalIndicator,
                { 
                  backgroundColor: metGoal ? colors.success + '20' : colors.error + '20',
                  borderColor: metGoal ? colors.success : colors.error,
                }
              ]}>
                <Ionicons 
                  name={metGoal ? 'checkmark-circle' : 'alert-circle'} 
                  size={24} 
                  color={metGoal ? colors.success : colors.error} 
                />
                <Text style={[
                  styles.goalText,
                  { color: metGoal ? colors.success : colors.error }
                ]}>
                  {metGoal 
                    ? countNum === 0 
                      ? '🎉 Hiç içmedin! Mükemmel!' 
                      : '✅ Hedefe uydun!'
                    : '⚠️ Hedefi aştın'}
                </Text>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.button, 
                { backgroundColor: isValid ? colors.primary : colors.cardBorder }
              ]}
              onPress={handleSave}
              disabled={!isValid}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { opacity: isValid ? 1 : 0.5 }]}>
                Kaydet
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Smoof reaction */}
      <Modal visible={reaction !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {reaction && (
            <View style={[styles.celebrationCard, { backgroundColor: colors.card }]}>
              <Smoof mood={REACTIONS[reaction].mood} size={150} animation={reaction === 'freeze' ? 'bob' : 'bounce'} style={styles.reactionSmoof} />
              <Text style={[styles.celebrationTitle, { color: colors.text }]}>
                {REACTIONS[reaction].title}
              </Text>
              <Text style={[styles.celebrationText, { color: colors.textSecondary }]}>
                {REACTIONS[reaction].text}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Freeze Modal */}
      <FreezeModal
        visible={freezeModalVisible}
        onUseFreeze={handleUseFreeze}
        onDecline={handleDeclineFreeze}
        onCorrection={handleCorrection}
        cigaretteCount={pendingCount}
        target={target}
        freezesRemaining={(profile?.streakFreezes || 0) - (profile?.streakFreezesUsed || 0)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  flowChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  question: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  targetHint: {
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  input: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    minWidth: 120,
  },
  unit: {
    fontSize: Typography.sizes.xl,
  },
  goalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing['3xl'],
  },
  goalText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  button: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCard: {
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  reactionSmoof: {
    marginBottom: Spacing.md,
  },
  celebrationTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  celebrationText: {
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
  },
  lockedScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  lockedTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
});
