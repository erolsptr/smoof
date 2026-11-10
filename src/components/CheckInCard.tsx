import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCheckInStore } from '@/store/checkInStore';
import { CHECK_IN_MOODS } from '@/constants/checkIn';
import { getTodayString } from '@/utils/dateHelpers';

/**
 * Home card for the daily check-in.
 * - Not done: "Bugün nasılsın?" with the five faces; one tap starts it
 * - Done: a small summary line that reopens Smoof's suggestions
 * - "Bugün değil": hidden for the rest of the day (never nags)
 */
export function CheckInCard() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const today = getTodayString();
  const todayCheckIn = useCheckInStore((s) => s.checkIns.find((c) => c.date === today));
  const dismissed = useCheckInStore((s) => s.dismissedDate === today);
  const dismissForToday = useCheckInStore((s) => s.dismissForToday);

  if (todayCheckIn) {
    const mood = CHECK_IN_MOODS.find((m) => m.value === todayCheckIn.mood);
    return (
      <TouchableOpacity
        style={[styles.done, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push('/check-in')}
        activeOpacity={0.7}
        accessibilityLabel="Bugünkü check-in ve önerilerin"
      >
        <Text style={styles.doneEmoji}>{mood?.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.doneTitle, { color: colors.text }]}>Bugün: {mood?.label}</Text>
          <Text style={[styles.doneText, { color: colors.textSecondary }]}>Smoof’un önerilerini gör</Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }

  if (dismissed) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Bugün nasılsın?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>30 saniyelik check-in, sana özel öneriler</Text>
        </View>
        <TouchableOpacity onPress={() => dismissForToday(today)} hitSlop={10} accessibilityLabel="Bugün değil">
          <Text style={[styles.skip, { color: colors.textTertiary }]}>Bugün değil</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.moods}>
        {CHECK_IN_MOODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.mood, { backgroundColor: colors.background }]}
            onPress={() => router.push(`/check-in?mood=${m.value}`)}
            accessibilityLabel={m.label}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 16, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  skip: { fontSize: 12, fontWeight: '600', paddingTop: 2 },
  moods: { flexDirection: 'row', gap: 8 },
  mood: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  moodEmoji: { fontSize: 28 },

  done: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  doneEmoji: { fontSize: 26 },
  doneTitle: { fontSize: 14, fontWeight: '800' },
  doneText: { fontSize: 12, marginTop: 1 },
});
