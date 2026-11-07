import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * "Canın sigara mı çekti?" card - the entry point to the craving (crisis) flow.
 * Shared by the immediate and gradual home screens.
 */
export function CravingCard() {
  const { colors } = useColorScheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.accent }]}
      onPress={() => router.push('/crisis')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Canın sigara mı çekti? İsteği birlikte atlatalım"
    >
      <View style={styles.icon}>
        <Ionicons name="hand-left" size={22} color={colors.accent} />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>Canın sigara mı çekti?</Text>
        <Text style={styles.subtitle}>Dokun, isteği birlikte atlatalım</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#FFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
  },
});
