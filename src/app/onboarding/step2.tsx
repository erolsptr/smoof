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
 * Onboarding Step 2: Pack price
 */
export default function Step2Screen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const { data, setStep2Data } = useOnboardingStore();
  
  const [packPrice, setPackPrice] = useState('');

  const canContinue = packPrice.length > 0 && parseFloat(packPrice) > 0;

  const handleContinue = () => {
    if (canContinue) {
      const price = parseFloat(packPrice);
      const dailyCigs = data.dailyCigarettes || 20;
      setStep2Data(dailyCigs, price, 0); // smokingYears = 0 for now
      router.push('/onboarding/step3');
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
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
          </View>

          {/* Mascot */}
          <Smoof mood="calm" size={80} animation="bob" style={styles.mascot} />
          
          {/* Question */}
          <Text style={[styles.question, { color: colors.text }]}>
            Bir paket sigara ne kadar? 💰
          </Text>
          
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Genelde aldığın paket
          </Text>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.currency, { color: colors.textSecondary }]}>
              ₺
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: packPrice ? colors.primary : colors.cardBorder,
                }
              ]}
              value={packPrice}
              onChangeText={setPackPrice}
              placeholder="125"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
              maxLength={4}
            />
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
  currency: {
    fontSize: Typography.sizes['2xl'],
  },
  input: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    minWidth: 140,
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
