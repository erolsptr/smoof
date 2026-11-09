import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProgress } from '@/hooks/useProgress';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { addDays, daysBetween, getTodayString, parseDateKey, toDateKey } from '@/utils/dateHelpers';
import { getTrackingStartDate } from '@/utils/gradualHelpers';
import { PLAN_NAMES, describeWeeklyPace } from '@/utils/gradualPlan';
import { getSmokeFreeRunStart, switchToGradual, switchToImmediate, type ImmediateStart } from '@/utils/methodSwitch';

const PLAN_OPTIONS = [
  { weeks: 4, icon: '🚀' },
  { weeks: 6, icon: '⭐' },
  { weeks: 8, icon: '🎯' },
  { weeks: 12, icon: '🌱' },
] as const;

function formatDay(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const { colors } = useColorScheme();
  const button = (delta: number, icon: 'remove' | 'add') => {
    const disabled = value + delta < min || value + delta > max;
    return (
      <TouchableOpacity
        style={[styles.stepButton, { backgroundColor: disabled ? colors.cardBorder : colors.primary }]}
        onPress={() => onChange(value + delta)}
        disabled={disabled}
        hitSlop={6}
      >
        <Ionicons name={icon} size={22} color="#FFF" />
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.stepper}>
      {button(-1, 'remove')}
      <Text style={[styles.stepValue, { color: colors.text }]}>{value}</Text>
      {button(1, 'add')}
    </View>
  );
}

/**
 * Switch quit method: gradual -> immediate, or immediate -> gradual.
 * Past entries and earned badges are kept; only "from now on" changes.
 */
export default function ChangeMethodScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isGradual, isPreparation } = useProgress();
  const dailyStats = useStatsStore((s) => s.dailyStats);
  const currentStreak = useStatsStore((s) => s.currentStreak);
  const updateProfile = useUserStore((s) => s.updateProfile);

  // gradual -> immediate
  const [immediateStart, setImmediateStart] = useState<ImmediateStart | null>(null);
  // immediate -> gradual
  const [count, setCount] = useState(() => Math.max(1, profile?.dailyCigaretteCount || 10));
  const [firstTarget, setFirstTarget] = useState(() => Math.max(1, Math.floor((profile?.dailyCigaretteCount || 10) * 0.7)));
  const [weeks, setWeeks] = useState<number | null>(null);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Yöntemi değiştir</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (!profile) {
    return <View style={[styles.container, { backgroundColor: colors.background }]}>{header}</View>;
  }

  const today = getTodayString();

  const methodCard = (
    <View style={styles.methodRow}>
      <View style={[styles.methodBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Ionicons name={isGradual ? 'trending-down' : 'flash'} size={22} color={colors.textSecondary} />
        <Text style={[styles.methodLabel, { color: colors.textSecondary }]}>Şu an</Text>
        <Text style={[styles.methodName, { color: colors.text }]}>{isGradual ? 'Kademeli azaltma' : 'Hemen bırakma'}</Text>
      </View>
      <Ionicons name="arrow-forward" size={22} color={colors.primary} />
      <View style={[styles.methodBox, { backgroundColor: colors.primary + '14', borderColor: colors.primary }]}>
        <Ionicons name={isGradual ? 'flash' : 'trending-down'} size={22} color={colors.primary} />
        <Text style={[styles.methodLabel, { color: colors.textSecondary }]}>Yeni</Text>
        <Text style={[styles.methodName, { color: colors.text }]}>{isGradual ? 'Hemen bırakma' : 'Kademeli azaltma'}</Text>
      </View>
    </View>
  );

  const keepNote = (text: string) => (
    <View style={[styles.note, { backgroundColor: colors.primary + '12' }]}>
      <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
      <Text style={[styles.noteText, { color: colors.text }]}>{text}</Text>
    </View>
  );

  const option = (key: string, selected: boolean, onPress: () => void, title: string, text: string, icon?: string) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.option,
        { backgroundColor: selected ? colors.primary + '14' : colors.card, borderColor: selected ? colors.primary : colors.cardBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <Text style={styles.optionIcon}>{icon}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.optionText, { color: colors.textSecondary }]}>{text}</Text>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.primary : colors.textTertiary}
      />
    </TouchableOpacity>
  );

  const saveButton = (enabled: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.saveButton, { backgroundColor: enabled ? colors.primary : colors.cardBorder, bottom: insets.bottom + 16 }]}
      onPress={onPress}
      disabled={!enabled}
      activeOpacity={0.8}
    >
      <Text style={styles.saveButtonText}>Yöntemi değiştir</Text>
    </TouchableOpacity>
  );

  const confirm = (message: string, patch: Partial<typeof profile>) => {
    Alert.alert('Yöntemi değiştir', message, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Değiştir',
        onPress: async () => {
          await updateProfile(patch);
          router.back();
        },
      },
    ]);
  };

  // ─────────────────────────────────────────────
  // Gradual -> immediate
  // ─────────────────────────────────────────────
  if (isGradual) {
    const planStart = getTrackingStartDate(profile);
    const notStarted = planStart > today;
    const runStart = getSmokeFreeRunStart(profile, dailyStats);
    const todayEntry = dailyStats.find((s) => s.date === today);
    const smokedToday = !!todayEntry && todayEntry.cigarettesSmoked > 0;
    const runDays = runStart ? daysBetween(runStart, today) + (todayEntry ? 1 : 0) : 0;

    const choice: ImmediateStart | null = notStarted ? 'today' : immediateStart;
    const handleSave = () => {
      if (!choice) return;
      const patch = switchToImmediate(profile, dailyStats, choice);
      const fromText = notStarted
        ? `${formatDay(planStart)} tarihinde sigarayı tamamen bırakıyorsun.`
        : choice === 'now'
          ? 'Sigarasız süren şu andan itibaren başlıyor.'
          : `Sigarasız süren ${formatDay(toDateKey(patch.quitDate as string))} gününden itibaren sayılıyor.`;
      confirm(
        `${fromText}\n\nKademeli plan sona erer. Geçmiş girişlerin ve kazandığın rozetler korunur.`,
        patch,
      );
    };

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
          {methodCard}
          <Text style={[styles.lead, { color: colors.textSecondary }]}>
            Sigarayı tamamen bırakmaya hazırsan, bundan sonra günlük limit yerine sigarasız sürende ilerleyeceğiz: sağlık
            kazanımları, tasarruf ve sigarasız gün serisi.
          </Text>

          {notStarted ? (
            keepNote(`Planın henüz başlamadı. ${formatDay(planStart)} tarihinde kademeli azaltma yerine tamamen bırakmış olacaksın.`)
          ) : (
            <>
              <Text style={[styles.question, { color: colors.text }]}>Son sigaranı ne zaman içtin?</Text>
              {runStart && runStart < today &&
                option(
                  'streak',
                  immediateStart === 'streak',
                  () => setImmediateStart('streak'),
                  `${runDays} gündür içmiyorum`,
                  `Girişlerine göre ${formatDay(runStart)} gününden beri 0 sigara. Serin buradan devam eder.`,
                  '🌿',
                )}
              {!smokedToday && !(runStart && runStart < today) &&
                option('today', immediateStart === 'today', () => setImmediateStart('today'), 'Bugün hiç içmedim', 'Sigarasız süren bu gece yarısından başlar.', '☀️')}
              {option('now', immediateStart === 'now', () => setImmediateStart('now'), 'Az önce içtim, bu sonuncuydu', 'Sigarasız süren şu andan başlar.', '🚭')}
            </>
          )}

          {keepNote('Geçmiş girişlerin, kriz kayıtların ve kazandığın rozetler silinmez. Disiplin günü rozetleri kazandıysan rozetlerinde görünmeye devam eder.')}
        </ScrollView>
        {saveButton(!!choice, handleSave)}
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // Immediate -> gradual
  // ─────────────────────────────────────────────
  const quitKey = toDateKey(profile.quitDate);
  const start = quitKey > today ? quitKey : today;
  const target = Math.min(firstTarget, count);

  const handleSave = () => {
    if (!weeks) return;
    const patch = switchToGradual(profile, { currentCount: count, firstTarget: target, weeks });
    confirm(
      `Kademeli plan ${start === today ? 'bugün' : formatDay(start) + ' tarihinde'} başlıyor: ilk hafta günde en fazla ${target} sigara, ${formatDay(addDays(start, weeks * 7))} tarihinde 0.\n\n${
        isPreparation ? '' : `${currentStreak} günlük sigarasız serin burada biter. `
      }Kazandığın rozetler korunur.`,
      patch,
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
        {methodCard}
        <Text style={[styles.lead, { color: colors.textSecondary }]}>
          Bir anda bırakmak zor geldiyse sorun değil. Günlük bir limitle başlayıp her hafta biraz azaltarak 0’a ineriz.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.question, { color: colors.text }]}>Şu an günde kaç sigara içiyorsun?</Text>
          <Stepper
            value={count}
            min={1}
            max={60}
            onChange={(v) => {
              setCount(v);
              if (firstTarget > v) setFirstTarget(v);
            }}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.question, { color: colors.text }]}>İlk hafta günde en fazla kaç sigara?</Text>
          <Stepper value={target} min={1} max={count} onChange={setFirstTarget} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {target < count ? `Şimdikinden ${count - target} sigara az` : 'İlk hafta şimdiki sayınla başlar'}
          </Text>
        </View>

        <Text style={[styles.question, { color: colors.text }]}>Kaç haftada 0’a inmek istersin?</Text>
        {PLAN_OPTIONS.map((o) =>
          option(
            `w${o.weeks}`,
            weeks === o.weeks,
            () => setWeeks(o.weeks),
            `${o.weeks} hafta · ${PLAN_NAMES[o.weeks]}`,
            `${describeWeeklyPace(target, o.weeks)} · 0: ${formatDay(addDays(start, o.weeks * 7))}`,
            o.icon,
          ),
        )}

        {keepNote(
          `${isPreparation ? '' : 'Sigarasız serin burada biter ve disiplin serin sıfırdan başlar. '}Geçmiş kayıtların ve kazandığın rozetler silinmez.`,
        )}
      </ScrollView>
      {saveButton(!!weeks, handleSave)}
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
  content: { padding: 16, gap: 12 },

  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodBox: { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 2 },
  methodLabel: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  methodName: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  lead: { fontSize: 14, lineHeight: 20 },

  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  question: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  hint: { fontSize: 12, textAlign: 'center' },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 32, fontWeight: '800', minWidth: 56, textAlign: 'center' },

  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5 },
  optionIcon: { fontSize: 26 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionText: { fontSize: 13, marginTop: 2, lineHeight: 18 },

  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },

  saveButton: { position: 'absolute', left: 16, right: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
