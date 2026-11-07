import { View, Text, StyleSheet, TouchableOpacity, Modal, StyleProp, ViewStyle } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FreezeBadgeProps {
  remaining: number;
  total: number;
  description: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small snowflake badge showing remaining streak freezes.
 * Tapping it opens a short explanation.
 */
export function FreezeBadge({ remaining, total, description, style }: FreezeBadgeProps) {
  const { colors } = useColorScheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: colors.accent + '20' }, style]}
        onPress={() => setVisible(true)}
        hitSlop={8}
        accessibilityLabel={`Kalan freeze: ${remaining}`}
      >
        <Ionicons name="snow" size={16} color={colors.accent} />
        <Text style={[styles.count, { color: colors.accent }]}>{remaining}</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.header, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="snow" size={32} color={colors.accent} />
              <Text style={[styles.title, { color: colors.text }]}>Streak Freeze</Text>
            </View>
            <Text style={[styles.text, { color: colors.textSecondary }]}>{description}</Text>
            <View style={styles.dots}>
              {Array.from({ length: total }).map((_, i) => (
                <Ionicons
                  key={i}
                  name="snow"
                  size={22}
                  color={i < remaining ? colors.accent : colors.cardBorder}
                />
              ))}
            </View>
            <Text style={[styles.stats, { color: colors.text }]}>
              Kalan: {remaining} / {total}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  count: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stats: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
