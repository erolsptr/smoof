import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius } from '@/constants';

interface FreezeModalProps {
  visible: boolean;
  onUseFreeze: () => void;
  onDecline: () => void;
  onCorrection: () => void;
  cigaretteCount: number;
  target: number;
  freezesRemaining: number;
}

/**
 * Custom branded modal for freeze decisions
 * Replaces native Alert with app-consistent UI
 */
export function FreezeModal({
  visible,
  onUseFreeze,
  onDecline,
  onCorrection,
  cigaretteCount,
  target,
  freezesRemaining,
}: FreezeModalProps) {
  const { colors } = useColorScheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Warning Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="warning" size={48} color={colors.warning} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Hedef Aşıldı
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Bugün hedefin {target} sigaraydı, {cigaretteCount} sigara girdin.
          </Text>

          {/* Freeze Info Card */}
          <View style={[styles.freezeCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
            <View style={styles.freezeCardContent}>
              <Ionicons name="snow" size={24} color={colors.accent} />
              <Text style={[styles.freezeCardText, { color: colors.text }]}>
                {freezesRemaining} Freeze Hakkın Kaldı
              </Text>
            </View>
          </View>

          {/* Primary Button - Use Freeze */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={onUseFreeze}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="snow" size={20} color="#FFFFFF" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.primaryButtonText}>Freeze Kullan</Text>
                <Text style={styles.buttonSubtitle}>Streak korunur</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Secondary Button - Decline */}
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.error }]}
            onPress={onDecline}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.secondaryButtonText, { color: colors.error }]}>
                  Kullanma
                </Text>
                <Text style={[styles.buttonSubtitle, { color: colors.error }]}>
                  Streak sıfırlanır
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Tertiary Button - Correction */}
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={onCorrection}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.tertiaryButtonText, { color: colors.textSecondary }]}>
                Hatalı Giriş Yaptım
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.5,
    marginBottom: Spacing.lg,
  },
  freezeCard: {
    width: '100%',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  freezeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  freezeCardText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  primaryButton: {
    width: '100%',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  tertiaryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonTextContainer: {
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  tertiaryButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  buttonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
});
