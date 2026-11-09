import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProgress } from '@/hooks/useProgress';
import { useUserStore } from '@/store/userStore';
import { addDays, daysBetween, getTodayString, parseDateKey } from '@/utils/dateHelpers';
import { getActivePlan, getCurrentGradualTarget, getGradualPlanInputs, getGradualZeroDate } from '@/utils/gradualHelpers';
import { PLAN_NAMES, describeWeeklyPace } from '@/utils/gradualPlan';

const OPTIONS = [
  { weeks: 4, icon: '🚀' },
  { weeks: 6, icon: '⭐' },
  { weeks: 8, icon: '🎯' },
  { weeks: 12, icon: '🌱' },
] as const;

function formatDay(dateKey: string, withWeekday = false): string {
  return parseDateKey(dateKey).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    ...(withWeekday ? { weekday: 'long' } : {}),
  });
}

/**
 * Change the gradual plan's pace.
 * The new plan starts today from today's limit and reaches 0 in the chosen
 * number of weeks. Past days (limits and entries) stay as they were.
 */
export default function ChangePlanScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isGradual } = useProgress();
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [selected, setSelected] = useState<number | null>(null);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Planı değiştir</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (!profile || !isGradual) {
    return <View style={[styles.container, { backgroundColor: colors.background }]}>{header}</View>;
  }

  const today = getTodayString();
  const { startDate } = getGradualPlanInputs(profile);
  const notStarted = today < startDate;
  // Before the start, a change simply replaces the plan; afterwards it starts today
  const planDay = notStarted ? startDate : today;
  const activePlan = getActivePlan(profile, planDay);
  const currentTarget = notStarted ? getGradualPlanInputs(profile).initialTarget : getCurrentGradualTarget(profile);
  const currentZero = getGradualZeroDate(profile) ?? planDay;
  const weekday = parseDateKey(planDay).toLocaleDateString('tr-TR', { weekday: 'long' });

  if (currentTarget === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Günlük limitin zaten 0. Planın tamamlandı, değiştirilecek bir şey kalmadı 🎉
        </Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!selected) return;
    const newZero = addDays(planDay, selected * 7);
    Alert.alert(
      'Planı değiştir',
      `${PLAN_NAMES[selected]} plana geçiyorsun. ${notStarted ? 'Plan' : 'Bugünden itibaren'} limitin ${currentTarget} sigaradan başlayıp ${formatDay(newZero)} tarihinde 0'a inecek.\n\nGeçmiş günlerin limitleri ve girişlerin değişmez.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Değiştir',
          onPress: async () => {
            if (notStarted) {
              // Nothing logged yet: just swap the plan duration
              await updateProfile({ gradualTargetWeeks: selected, gradualTargetChanges: [] });
            } else {
              // Same-day entries are replaced: today's limit is already in currentTarget
              const changes = (profile.gradualTargetChanges ?? []).filter((c) => c.from !== today);
              await updateProfile({
                gradualTargetChanges: [...changes, { from: today, target: currentTarget, weeks: selected }],
              });
            }
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
        {/* Current plan */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>ŞU ANKİ PLANIN</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {PLAN_NAMES[activePlan.weeks] ? `${PLAN_NAMES[activePlan.weeks]} · ` : ''}{activePlan.weeks} hafta
          </Text>
          <View style={styles.currentRow}>
            <View style={styles.currentItem}>
              <Text style={[styles.currentValue, { color: colors.primary }]}>{currentTarget}</Text>
              <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
                {notStarted ? 'İlk limit' : 'Bugünkü limit'}
              </Text>
            </View>
            <View style={[styles.currentDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.currentItem}>
              <Text style={[styles.currentValue, { color: colors.text }]}>{formatDay(currentZero)}</Text>
              <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>Sıfır günü</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.question, { color: colors.text }]}>
          {notStarted ? 'Kaç haftada 0’a inmek istersin?' : 'Bugünden itibaren kaç haftada 0’a inmek istersin?'}
        </Text>

        {OPTIONS.map((option) => {
          const zero = addDays(planDay, option.weeks * 7);
          const diff = daysBetween(currentZero, zero) * (zero >= currentZero ? 1 : -1);
          const isSelected = selected === option.weeks;
          return (
            <TouchableOpacity
              key={option.weeks}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? colors.primary + '14' : colors.card,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => setSelected(option.weeks)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {option.weeks} hafta · {PLAN_NAMES[option.weeks]}
                </Text>
                <Text style={[styles.optionText, { color: colors.textSecondary }]}>
                  {describeWeeklyPace(currentTarget, option.weeks)}
                </Text>
                <Text style={[styles.optionText, { color: colors.textSecondary }]}>
                  Sıfır günü: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatDay(zero)}</Text>
                  {diff === 0 ? ' · aynı' : diff < 0 ? ` · ${-diff} gün erken` : ` · ${diff} gün geç`}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={isSelected ? colors.primary : colors.textTertiary}
              />
            </TouchableOpacity>
          );
        })}

        <View style={[styles.note, { backgroundColor: colors.primary + '12' }]}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.text }]}>
            {notStarted
              ? 'Henüz başlamadığın için plan baştan bu süreyle kurulur.'
              : `Yeni plan bugün başlar: limitin bugün ${currentTarget} sigara olarak kalır ve her ${weekday} düşer. Geçmiş günlerin limitleri ve girdiğin sigara sayıları değişmez.`}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: selected ? colors.primary : colors.cardBorder, bottom: insets.bottom + 16 },
        ]}
        onPress={handleSave}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Planı değiştir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, paddingHorizontal: 32, fontSize: 15, lineHeight: 22 },
  content: { padding: 16, gap: 12 },

  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  currentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  currentItem: { flex: 1, alignItems: 'center' },
  currentValue: { fontSize: 20, fontWeight: '800' },
  currentLabel: { fontSize: 12, marginTop: 2 },
  currentDivider: { width: 1, height: 36 },

  question: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionIcon: { fontSize: 28 },
  optionTitle: { fontSize: 16, fontWeight: '700' },
  optionText: { fontSize: 13, marginTop: 2 },

  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },

  saveButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
