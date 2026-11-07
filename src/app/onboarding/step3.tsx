import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  } from 'react-native';
import { useRouter } from 'expo-router';
import { Smoof } from '@/components/smoof/Smoof';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

/**
 * Onboarding Step 3: Motivation
 */
export default function OnboardingStep3() {
  const { colors } = useColorScheme();
  const router = useRouter();
  
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);

  const motivations = [
    { id: 'health', label: 'Sağlığım', icon: 'heart' as const },
    { id: 'money', label: 'Para Tasarrufu', icon: 'cash' as const },
    { id: 'family', label: 'Ailem', icon: 'people' as const },
    { id: 'sports', label: 'Spor/Kondisyon', icon: 'fitness' as const },
    { id: 'smell', label: 'Koku/Görünüm', icon: 'sparkles' as const },
    { id: 'freedom', label: 'Özgürlük', icon: 'rocket' as const },
  ];

  const toggleMotivation = (id: string) => {
    if (selectedMotivations.includes(id)) {
      setSelectedMotivations(selectedMotivations.filter(m => m !== id));
    } else {
      setSelectedMotivations([...selectedMotivations, id]);
    }
  };

  const canContinue = selectedMotivations.length > 0;

  const handleContinue = () => {
    if (canContinue) {
      useOnboardingStore.getState().setStep3Data(selectedMotivations);
      router.push('/onboarding/step4');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.cardBorder }]} />
        </View>

        {/* Mascot */}
        <Smoof mood="happy" size={80} animation="bob" style={styles.mascot} />
        
        {/* Question */}
        <Text style={[styles.question, { color: colors.text }]}>
          Neden bırakmak istiyorsun? 🎯
        </Text>
        
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Birden fazla seçebilirsin
        </Text>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {motivations.map((motivation) => {
            const isSelected = selectedMotivations.includes(motivation.id);
            return (
              <TouchableOpacity
                key={motivation.id}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  }
                ]}
                onPress={() => toggleMotivation(motivation.id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={motivation.icon} 
                  size={32} 
                  color={isSelected ? '#FFF' : colors.text} 
                />
                <Text style={[
                  styles.optionLabel,
                  { color: isSelected ? '#FFF' : colors.text }
                ]}>
                  {motivation.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
    paddingBottom: 100,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    width: '100%',
  },
  option: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
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
