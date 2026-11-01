import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius } from '@/constants';
import type { QuitMethod } from '@/types';

/**
 * Onboarding Step 2: Quit method selection
 * - Cold turkey vs Gradual reduction
 */
export default function OnboardingStep2() {
  const { colors } = useColorScheme();
  const router = useRouter();
  
  const [selected, setSelected] = useState<QuitMethod | null>(null);

  const handleContinue = () => {
    if (selected) {
      router.push('/onboarding/step3');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress indicator */}
      <View style={styles.progress}>
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.mascot}>🦎</Text>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Nasıl bırakmak istiyorsun?
        </Text>
        
        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              {
                backgroundColor: selected === 'cold-turkey' ? colors.primary : colors.card,
                borderColor: selected === 'cold-turkey' ? colors.primary : colors.cardBorder,
              },
            ]}
            onPress={() => setSelected('cold-turkey')}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>🚀</Text>
            <Text style={[
              styles.optionTitle,
              { color: selected === 'cold-turkey' ? '#FFFFFF' : colors.text },
            ]}>
              Tamamen Bırak
            </Text>
            <Text style={[
              styles.optionDesc,
              { color: selected === 'cold-turkey' ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
            ]}>
              Bugünden itibaren hiç sigara içmiyorum
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
              Yavaş yavaş azaltarak bırakıyorum
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
  options: {
    gap: Spacing.md,
  },
  option: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  optionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  optionDesc: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
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
