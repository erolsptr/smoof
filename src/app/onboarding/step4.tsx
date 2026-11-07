import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  } from 'react-native';
import { useRouter } from 'expo-router';
import { Smoof } from '@/components/smoof/Smoof';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Spacing, Typography, BorderRadius } from '@/constants';
import type { QuitMethod } from '@/types';

/**
 * Onboarding Step 4: Quit method
 */
export default function OnboardingStep4() {
  const { colors } = useColorScheme();
  const router = useRouter();
  
  const [selected, setSelected] = useState<QuitMethod | null>(null);

  const handleContinue = () => {
    if (!selected) return;

    useOnboardingStore.getState().setStep4Data(selected);
    
    // If gradual, go to gradual plan step
    // If cold-turkey, go to start date step
    if (selected === 'gradual') {
      router.push('/onboarding/step5');
    } else {
      router.push('/onboarding/step6');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
        </View>

        {/* Mascot */}
        <Smoof mood="calm" size={80} animation="bob" style={styles.mascot} />
        
        {/* Question */}
        <Text style={[styles.question, { color: colors.text }]}>
          Nasıl bırakmak istersin? 🎯
        </Text>
        
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Senin için en uygun yöntemi seç
        </Text>

        {/* Options */}
        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              {
                backgroundColor: selected === 'immediate' ? colors.primary : colors.card,
                borderColor: selected === 'immediate' ? colors.primary : colors.cardBorder,
              },
            ]}
            onPress={() => setSelected('immediate')}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>🚀</Text>
            <Text style={[
              styles.optionTitle,
              { color: selected === 'immediate' ? '#FFFFFF' : colors.text },
            ]}>
              Tamamen Bırak
            </Text>
            <Text style={[
              styles.optionDesc,
              { color: selected === 'immediate' ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
            ]}>
              Hemen dur, bir daha içme. En etkili yöntem!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              {
                backgroundColor: selected === 'gradual' ? colors.primary : colors.card,
                borderColor: selected === 'gradual' ? colors.primary : colors.cardBorder,
              },
            ]}
            onPress={() => setSelected('gradual')}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>📉</Text>
            <Text style={[
              styles.optionTitle,
              { color: selected === 'gradual' ? '#FFFFFF' : colors.text },
            ]}>
              Kademeli Azalt
            </Text>
            <Text style={[
              styles.optionDesc,
              { color: selected === 'gradual' ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
            ]}>
              Haftalık plan ile yavaş yavaş azalt
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.button, 
          { backgroundColor: selected ? colors.primary : colors.cardBorder }
        ]}
        onPress={handleContinue}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { opacity: selected ? 1 : 0.5 }]}>
          Devam Et
        </Text>
      </TouchableOpacity>
    </View>
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
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  options: {
    gap: Spacing.md,
    width: '100%',
  },
  option: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  optionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  optionDesc: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: Typography.sizes.sm * 1.5,
  },
  button: {
    margin: Spacing.lg,
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
