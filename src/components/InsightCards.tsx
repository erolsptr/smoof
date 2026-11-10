import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useCheckInStore } from '@/store/checkInStore';
import { useInsightStore } from '@/store/insightStore';
import { Smoof } from '@/components/smoof/Smoof';
import { addDays, getTodayString, parseDateKey, toDateKey } from '@/utils/dateHelpers';
import { getPlanSuggestion } from '@/utils/insights';

/**
 * Smoof's occasional, data-driven cards on the home screen:
 * - Plan suggestion (slower / faster / switch method), hideable for 7 days
 * - Weekly summary on Sunday and Monday, until it's opened
 * Both stay hidden when there's nothing worth saying.
 */
export function InsightCards() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const dailyStats = useStatsStore((s) => s.dailyStats);
  const crisisLogs = useStatsStore((s) => s.crisisLogs);
  const checkIns = useCheckInStore((s) => s.checkIns);
  const planHiddenUntil = useInsightStore((s) => s.planHiddenUntil);
  const weeklySeenOn = useInsightStore((s) => s.weeklySeenOn);
  const hidePlanUntil = useInsightStore((s) => s.hidePlanUntil);
  const today = getTodayString();

  const suggestion = useMemo(
    () => (profile ? getPlanSuggestion(profile, dailyStats, checkIns, crisisLogs) : null),
    [profile, dailyStats, checkIns, crisisLogs],
  );

  // Weekly summary: Sunday and Monday, if not opened since Sunday and there's something to show
  const weekday = parseDateKey(today).getDay();
  const sunday = weekday === 0 ? today : addDays(today, -1);
  const weekFrom = addDays(today, -6);
  const hasWeekData =
    checkIns.some((c) => c.date >= weekFrom) ||
    dailyStats.some((s) => s.date >= weekFrom) ||
    crisisLogs.some((l) => toDateKey(l.timestamp) >= weekFrom);
  const showWeekly = (weekday === 0 || weekday === 1) && hasWeekData && (!weeklySeenOn || weeklySeenOn < sunday);

  const showPlan = !!suggestion && (!planHiddenUntil || today >= planHiddenUntil);

  if (!showPlan && !showWeekly) return null;

  return (
    <>
      {showWeekly && (
        <TouchableOpacity
          style={[styles.weekly, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '55' }]}
          onPress={() => router.push('/weekly')}
          activeOpacity={0.75}
        >
          <Text style={styles.weeklyIcon}>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Haftalık özetin hazır</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>Haftan nasıl geçti, neler öğrendim, gelecek haftanın hedefi</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      )}

      {showPlan && suggestion && (
        <View style={[styles.plan, { backgroundColor: colors.card, borderColor: colors.secondary + '66' }]}>
          <View style={styles.planTop}>
            <Smoof mood={suggestion.kind === 'slower' || suggestion.kind === 'gradual' ? 'supportive' : 'excited'} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{suggestion.title}</Text>
              <Text style={[styles.text, { color: colors.textSecondary }]}>{suggestion.text}</Text>
            </View>
          </View>
          <View style={styles.planActions}>
            <TouchableOpacity
              style={[styles.primary, { backgroundColor: colors.secondary }]}
              onPress={() => router.push(suggestion.action.href as Href)}
            >
              <Text style={styles.primaryText}>{suggestion.action.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => hidePlanUntil(addDays(today, 7))} hitSlop={8} style={styles.secondary}>
              <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Şimdilik böyle iyi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  weekly: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5, marginBottom: 16 },
  weeklyIcon: { fontSize: 28 },
  title: { fontSize: 15, fontWeight: '800' },
  text: { fontSize: 13, lineHeight: 18, marginTop: 2 },

  plan: { borderRadius: 18, borderWidth: 1.5, padding: 14, marginBottom: 16, gap: 12 },
  planTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  planActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  primary: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  secondary: { paddingVertical: 8 },
  secondaryText: { fontSize: 13, fontWeight: '600' },
});
