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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Spacing, Typography, BorderRadius } from '@/constants';

/**
 * Onboarding Step 1: Basic smoking info
 * - Daily cigarette count
 * - Pack price
 */
export default function OnboardingStep1() {
  const { colors } = useColorScheme();
  const router = useRouter();
  
  const [dailyCigarettes, setDailyCigarettes] = useState('');
  const [packPrice, setPackPrice] = useState('');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packPriceInputRef = useRef<any>(null);

  const canContinue = dailyCigarettes.length > 0 && packPrice.length > 0;

  const handleContinue = () => {
    Keyboard.dismiss();
    if (canContinue) {
      const dailyCount = parseInt(dailyCigarettes, 10);
      const price = parseFloat(packPrice);
      
      // Store in onboarding store
      useOnboardingStore.getState().setStep1Data(dailyCount, price);
      
      router.push('/onboarding/step2');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress indicator */}
          <View style={styles.progress}>
            <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
            <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
          </View>

          <View style={styles.content}>
            <Text style={styles.mascot}>🦎</Text>
            
            <Text style={[styles.title, { color: colors.text }]}>
              Önce birkaç şey öğrenelim
            </Text>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Günde kaç sigara içiyorsun?
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="Örn: 10"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  value={dailyCigarettes}
                  onChangeText={setDailyCigarettes}
                  maxLength={2}
                  returnKeyType="next"
                  onSubmitEditing={() => packPriceInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Bir paket sigaranın fiyatı? (₺)
                </Text>
                <TextInput
                  ref={packPriceInputRef}
                  style={[styles.input, { 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="Örn: 45"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  value={packPrice}
                  onChangeText={setPackPrice}
                  maxLength={4}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
              </View>
            </View>
          </View>

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
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  mascot: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: Typography.sizes.lg,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
});
