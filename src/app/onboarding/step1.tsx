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
  } from 'react-native';
import { useRouter } from 'expo-router';
import { Smoof } from '@/components/smoof/Smoof';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Spacing, Typography, BorderRadius } from '@/constants';

/**
 * Onboarding Step 1: Daily cigarettes
 */
export default function OnboardingStep1() {
  const { colors } = useColorScheme();
  const router = useRouter();
  
  const [dailyCigarettes, setDailyCigarettes] = useState('');

  const canContinue = dailyCigarettes.length > 0 && parseInt(dailyCigarettes) > 0;

  const handleContinue = () => {
    if (canContinue) {
      const dailyCount = parseInt(dailyCigarettes, 10);
      useOnboardingStore.getState().setStep1Data(`Kullanıcı${dailyCount}`); // Temporary name
      useOnboardingStore.getState().setStep2Data(dailyCount, 0, 0); // packPrice and years will be set in step2
      router.push('/onboarding/step2');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          {/* Progress */}
          <View style={styles.progress}>
            <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
          </View>

          {/* Mascot */}
          <Smoof mood="happy" size={80} animation="bob" style={styles.mascot} />
          
          {/* Question */}
          <Text style={[styles.question, { color: colors.text }]}>
            Günde kaç sigara içiyorsun? 🚬
          </Text>
          
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Ortalama bir gün düşün
          </Text>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: dailyCigarettes ? colors.primary : colors.cardBorder,
                }
              ]}
              value={dailyCigarettes}
              onChangeText={setDailyCigarettes}
              placeholder="20"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              autoFocus
              maxLength={3}
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>
              adet
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: canContinue ? colors.primary : colors.cardBorder }
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { opacity: canContinue ? 1 : 0.5 }]}>
              Devam Et
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
    position: 'absolute',
    top: Spacing['2xl'],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mascot: {
    width: 80,
    marginBottom: Spacing.xl,
  },
  question: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  input: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    minWidth: 120,
  },
  unit: {
    fontSize: Typography.sizes.xl,
  },
  button: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
});
