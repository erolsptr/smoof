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
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

/**
 * Daily Logger Screen - For gradual reduction users
 * Log how many cigarettes smoked today
 */
export default function DailyLoggerScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const { updateDailyStats, dailyStats } = useStatsStore();
  
  const [cigaretteCount, setCigaretteCount] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousDayCount, setPreviousDayCount] = useState(-1);

  const today = new Date().toISOString().split('T')[0];
  const target = profile?.gradualCurrentTarget || 0;
  const countNum = parseInt(cigaretteCount, 10) || 0;
  const isValid = cigaretteCount.length > 0 && countNum >= 0 && countNum <= 50;

  // Load today's data if exists
  useEffect(() => {
    const todayStats = dailyStats.find(s => s.date === today);
    if (todayStats) {
      setCigaretteCount(todayStats.cigarettesSmoked.toString());
      setPreviousDayCount(todayStats.cigarettesSmoked);
    }
  }, [dailyStats, today]);

  const handleSave = async () => {
    if (!isValid || !profile) return;

    const count = parseInt(cigaretteCount, 10);
    
    // Update daily stats
    await updateDailyStats(today, {
      cigarettesSmoked: count,
      smokeFree: count === 0,
      targetCigarettes: target,
      metGoal: count <= target,
    });

    // Show celebration modal if first time reaching 0
    if (count === 0 && previousDayCount !== 0) {
      setShowCelebration(true);
      // Auto-close after 3 seconds
      setTimeout(() => {
        setShowCelebration(false);
        router.back();
      }, 3000);
    } else {
      router.back();
    }
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
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Question */}
            <View style={styles.questionSection}>
              <Text style={[styles.question, { color: colors.text }]}>
                Bugün kaç sigara içtin? 🚬
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

      {/* Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.celebrationCard, { backgroundColor: colors.card }]}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={[styles.celebrationTitle, { color: colors.text }]}>
              İlk Kez 0 Sigara!
            </Text>
            <Text style={[styles.celebrationText, { color: colors.textSecondary }]}>
              Sigarasız streak'in başladı! 🌟
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
    top: Spacing.lg,
    right: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.sm,
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
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
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
});
