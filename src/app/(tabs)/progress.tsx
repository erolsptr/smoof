import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants';

export default function ProgressScreen() {
  const { colors } = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>İlerleme</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Yakında: Grafikler ve detaylı analizler 📊
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing['4xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
  },
});
