import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

/** What the craving screen can open straight away */
export type CravingTool = 'breath' | 'hide' | 'garden';

const TOOLS: { key: CravingTool; emoji: string; label: string; a11y: string }[] = [
  { key: 'breath', emoji: '🫁', label: 'Nefes', a11y: 'Nefes egzersizini aç' },
  { key: 'hide', emoji: '🦎', label: 'Saklambaç', a11y: 'Bukalemun Saklambaç oyununu aç' },
  { key: 'garden', emoji: '🌸', label: 'Duman Bahçesi', a11y: 'Duman Bahçesi oyununu aç' },
];

/**
 * "Canın sigara mı çekti?" card - the entry point to the craving (crisis) flow.
 * Shows what's inside (breathing + two mini games); each chip opens it directly.
 * Shared by the immediate and gradual home screens.
 */
export function CravingCard() {
  const { colors } = useColorScheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/crisis')}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel="Canın sigara mı çekti? Nefes egzersizi ve mini oyunlarla isteği birlikte atlatalım"
      style={styles.shadow}
    >
      <LinearGradient
        colors={[colors.accent, colors.accentDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.top}>
          <View style={styles.icon}>
            <Ionicons name="hand-left" size={22} color={colors.accent} />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.title}>Canın sigara mı çekti?</Text>
            <Text style={styles.subtitle}>Nefes al ya da bir oyunla kafanı dağıt</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#FFF" />
        </View>

        <View style={styles.chips}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.key}
              style={styles.chip}
              onPress={() => router.push(`/crisis?open=${tool.key}`)}
              activeOpacity={0.75}
              accessibilityLabel={tool.a11y}
              hitSlop={4}
            >
              <Text style={styles.chipEmoji}>{tool.emoji}</Text>
              <Text style={styles.chipText} numberOfLines={1}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
