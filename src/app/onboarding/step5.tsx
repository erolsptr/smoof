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
 * Onboarding Step 5: Gradual reduction initial target
 * Only shown if user selected gradual method
 */
export default function OnboardingStep5() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const { data, setStep5Data } = useOnboardingStore();
  
  const [targetCigarettes, setTargetCigarettes] = useState('');
  
  const dailyCigs = data.dailyCigarettes || 0;
  const targetNum = parseInt(targetCigarettes, 10);
  const isValid = targetCigarettes.length > 0 && targetNum > 0 && targetNum < dailyCigs;

  const handleContinue = () => {
    if (isValid) {
      setStep5Data(targetNum);
      router.push('/onboarding/step5-plan');
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
            <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          </View>

          {/* Mascot */}
          <Smoof mood="happy" size={80} animation="bob" style={styles.mascot} />
          
          {/* Question */}
          <Text style={[styles.question, { color: colors.text }]}>
            İlk hedef kaç sigara? 📉
          </Text>
          
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Şu an günde {dailyCigs} sigara içiyorsun
          </Text>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: isValid ? colors.primary : colors.cardBorder,
                }
              ]}
              value={targetCigarettes}
              onChangeText={setTargetCigarettes}
              placeholder={Math.floor(dailyCigs * 0.7).toString()}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              autoFocus
              maxLength={3}
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>
              sigara/gün
            </Text>
          </View>

          {/* Validation message */}
          {targetCigarettes.length > 0 && !isValid && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {targetNum >= dailyCigs 
                ? `Hedef ${dailyCigs}'den az olmalı` 
                : 'Geçerli bir sayı gir'}
            </Text>
          )}

          {/* Tip */}
          <View style={[styles.tipBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              💡 İlk hedef günlük sigaranın %20-30&apos;unu azaltmak olabilir
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: isValid ? colors.primary : colors.cardBorder }
            ]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { opacity: isValid ? 1 : 0.5 }]}>
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
    marginBottom: Spacing.sm,
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
    fontSize: Typography.sizes.base,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.md,
  },
  tipBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    maxWidth: '90%',
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: Typography.sizes.sm * 1.5,
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
