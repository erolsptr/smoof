import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Spacing, Typography, BorderRadius } from '@/constants';

/**
 * Calendar Screen - Full-screen monthly view for gradual reduction tracking
 * (same calendar as the home screen)
 */
export default function CalendarScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const dailyStats = useStatsStore((state) => state.dailyStats);

  if (!profile || profile.quitMethod !== 'gradual') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Takvim</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <MonthCalendar
            profile={profile}
            dailyStats={dailyStats}
            onDayPress={(date) => router.push(`/daily-logger?date=${date}`)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  content: {
    padding: 20,
  },
  card: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});
