import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { Spacing, Typography, BorderRadius } from '@/constants';

/**
 * Onboarding Step 3: When to start?
 * - Today / Custom date
 */
export default function OnboardingStep3() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const setProfile = useUserStore((state) => state.setProfile);
  
  const [selected, setSelected] = useState<'today' | 'custom' | null>(null);

  const handleFinish = () => {
    if (!selected) return;

    // TODO: Get data from previous steps (use context or store)
    // For now, create a demo profile
    const profile = {
      id: 'user_1',
      createdAt: new Date().toISOString(),
      dailyCigaretteCount: 10,
      packPrice: 45,
      cigarettesPerPack: 20,
      quitDate: new Date().toISOString(),
      quitMethod: 'cold-turkey' as const,
      triggers: [],
      motivations: [],
      streakFreezes: 2, // Weekly allowance
      streakFreezesUsed: 0,
    };

    setProfile(profile);
    completeOnboarding();
    
    // Navigate to main app
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress indicator */}
      <View style={styles.progress}>
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.mascot}>🦎</Text>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Ne zaman başlıyoruz?
        </Text>
        
        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              {
                backgroundColor: selected === 'today' ? colors.primary : colors.card,
                borderColor: selected === 'today' ? colors.primary : colors.cardBorder,
              },
            ]}
            onPress={() => setSelected('today')}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>⚡</Text>
            <Text style={[
              styles.optionTitle,
              { color: selected === 'today' ? '#FFFFFF' : colors.text },
            ]}>
              Hemen Başla
            </Text>
            <Text style={[
              styles.optionDesc,
              { color: selected === 'today' ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
            ]}>
              Bugün ilk günüm olsun!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              {
                backgroundColor: selected === 'custom' ? colors.primary : colors.card,
                borderColor: selected === 'custom' ? colors.primary : colors.cardBorder,
              },
            ]}
            onPress={() => setSelected('custom')}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>📅</Text>
            <Text style={[
              styles.optionTitle,
              { color: selected === 'custom' ? '#FFFFFF' : colors.text },
            ]}>
              Tarih Seç
            </Text>
            <Text style={[
              styles.optionDesc,
              { color: selected === 'custom' ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
            ]}>
              Hazırlık yapmak istiyorum
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.encouragement}>
          <Text style={styles.encouragementMascot}>💚</Text>
          <Text style={[styles.encouragementText, { color: colors.textSecondary }]}>
            "Sen yapabilirsin! Ben her zaman yanındayım."
          </Text>
          <Text style={[styles.encouragementAuthor, { color: colors.textTertiary }]}>
            - Smoof
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button, 
          { backgroundColor: selected ? colors.primary : colors.cardBorder }
        ]}
        onPress={handleFinish}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { opacity: selected ? 1 : 0.5 }]}>
          Başlayalım! 🚀
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
    marginBottom: Spacing.xl,
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
  encouragement: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  encouragementMascot: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  encouragementText: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  encouragementAuthor: {
    fontSize: Typography.sizes.sm,
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
