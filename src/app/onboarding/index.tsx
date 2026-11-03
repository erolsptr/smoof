import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants';

/**
 * Onboarding Flow - Welcome Screen
 * Introduces Smoof mascot and the app
 */
export default function OnboardingWelcome() {
  const { colors } = useColorScheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/smoof.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        
        <Text style={[styles.title, { color: colors.text }]}>
          Merhaba! Ben Smoof 👋
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Sigarayı bırakma yolculuğunda senin yanındayım. Birlikte başaracağız!
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/onboarding/step1')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Başlayalım 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascot: {
    width: 150,
    height: 150,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
    lineHeight: Typography.sizes.lg * Typography.lineHeights.relaxed,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
});
