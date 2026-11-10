import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProgress } from '@/hooks/useProgress';
import { useCheckInStore } from '@/store/checkInStore';
import { useStatsStore } from '@/store/statsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Smoof } from '@/components/smoof/Smoof';
import { CHECK_IN_CRAVINGS, CHECK_IN_MOODS, CHECK_IN_TRIGGERS } from '@/constants/checkIn';
import { addDays, daysBetween, getTodayString } from '@/utils/dateHelpers';
import { getCurrentGradualTarget, getGradualSchedule } from '@/utils/gradualHelpers';
import { getCheckInResponse } from '@/utils/checkInAdvice';
import { newDate } from '@/utils/clock';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import type { DailyCheckIn } from '@/types';

/**
 * "Bugün nasılsın?" daily check-in: three quick questions, then Smoof's reply
 * with up to two personal suggestions. Optional, once a day, editable.
 */
export default function CheckInScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mood?: string }>();
  const today = getTodayString();

  const { profile, isGradual, isPreparation, immediate, gradual } = useProgress();
  const checkIns = useCheckInStore((s) => s.checkIns);
  const saveCheckIn = useCheckInStore((s) => s.saveCheckIn);
  const currentStreak = useStatsStore((s) => s.currentStreak);
  const dailyStats = useStatsStore((s) => s.dailyStats);
  const notificationSettings = useNotificationStore((s) => s.settings);

  const existing = checkIns.find((c) => c.date === today);
  const preMood = Number(params.mood);
  const [mood, setMood] = useState<DailyCheckIn['mood'] | null>(
    existing?.mood ?? (preMood >= 1 && preMood <= 5 ? (preMood as DailyCheckIn['mood']) : null),
  );
  const [craving, setCraving] = useState<DailyCheckIn['craving'] | null>(existing?.craving ?? null);
  const [triggers, setTriggers] = useState<string[]>(existing?.triggers ?? []);
  // Already checked in today: open on the reply, with an edit button
  const [showResult, setShowResult] = useState(!!existing && !params.mood);
  const [reminderAsked, setReminderAsked] = useState(true);

  // Offer the evening reminder only if it isn't already on and allowed
  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then(({ status }) =>
        setReminderAsked(status === 'granted' && notificationSettings.enabled && notificationSettings.eveningReflection),
      )
      .catch(() => setReminderAsked(true));
  }, [notificationSettings.enabled, notificationSettings.eveningReflection]);

  const response = useMemo(() => {
    const checkIn = existing;
    if (!checkIn || !profile) return null;
    const weekAgo = addDays(today, -6);
    const recent = checkIns.filter((c) => c.date >= weekAgo && c.date <= today);
    let nextDrop: { daysUntil: number; target: number } | null = null;
    if (isGradual) {
      const next = getGradualSchedule(profile).find((s) => s.from > today);
      if (next) nextDrop = { daysUntil: daysBetween(today, next.from), target: next.target };
    }
    return getCheckInResponse({
      checkIn,
      recent,
      isGradual,
      isPreparation,
      streakDays: currentStreak,
      moneySaved: isGradual ? (gradual?.moneySaved ?? 0) : (immediate?.moneySaved ?? 0),
      todayTarget: isGradual ? getCurrentGradualTarget(profile) : undefined,
      todaySmoked: isGradual ? (dailyStats.find((s) => s.date === today)?.cigarettesSmoked ?? null) : undefined,
      nextDrop,
    });
  }, [existing, profile, checkIns, today, isGradual, isPreparation, currentStreak, gradual, immediate, dailyStats]);

  const canSave = mood !== null && craving !== null;

  const handleSave = async () => {
    if (mood === null || craving === null) return;
    await saveCheckIn({ date: today, mood, craving, triggers, createdAt: newDate().toISOString() });
    // Today is done: no reminder tonight
    useNotificationStore.getState().syncCheckInReminders();
    setShowResult(true);
  };

  const toggleTrigger = (id: string) =>
    setTriggers((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  // Turns on only the check-in reminder. If notifications were never set up
  // before, the other kinds stay off: the user only agreed to this one.
  const enableReminder = async () => {
    setReminderAsked(true);
    const { status: before } = await Notifications.getPermissionsAsync();
    await registerForPushNotificationsAsync(); // permission prompt + Android channel
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    const store = useNotificationStore.getState();
    await store.updateSettings(
      before === 'granted'
        ? { enabled: true, eveningReflection: true }
        : { enabled: true, eveningReflection: true, dailyMotivation: false, criticalHours: false, waterReminders: false },
    );
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bugün nasılsın?</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          {newDate().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityLabel="Kapat"
        style={[styles.close, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      >
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  // ─────────────────────────────────────────────
  // Smoof's reply
  // ─────────────────────────────────────────────
  if (showResult && response) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
          <View style={styles.replyTop}>
            <Smoof mood={response.mood} size={120} animation="bob" />
            <Text style={[styles.replyHeadline, { color: colors.text }]}>{response.headline}</Text>
            <Text style={[styles.replyMessage, { color: colors.textSecondary }]}>{response.message}</Text>
          </View>

          {response.advice.length > 0 && (
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Senin için öneriler</Text>
          )}
          {response.advice.map((a) => (
            <View key={a.id} style={[styles.advice, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={styles.adviceIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.adviceTitle, { color: colors.text }]}>{a.title}</Text>
                <Text style={[styles.adviceText, { color: colors.textSecondary }]}>{a.text}</Text>
                {a.action && (
                  <TouchableOpacity
                    style={[styles.adviceAction, { backgroundColor: colors.primary + '18' }]}
                    onPress={() => router.replace(a.action!.href as Href)}
                  >
                    <Text style={[styles.adviceActionText, { color: colors.primary }]}>{a.action.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {!reminderAsked && (
            <View style={[styles.reminder, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '40' }]}>
              <Ionicons name="notifications" size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderTitle, { color: colors.text }]}>Akşamları hatırlatayım mı?</Text>
                <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
                  Doldurmadığın günlerde akşam bir kez sorarım, o kadar.
                </Text>
              </View>
              <TouchableOpacity style={[styles.reminderButton, { backgroundColor: colors.accent }]} onPress={enableReminder}>
                <Text style={styles.reminderButtonText}>Olur</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => setShowResult(false)} style={styles.editLink}>
            <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.editLinkText, { color: colors.textSecondary }]}>Cevaplarımı düzenle</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary, bottom: insets.bottom + 16 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.saveButtonText}>Teşekkürler Smoof 💚</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // Questions
  // ─────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.intro}>
          <Smoof mood="calm" size={64} />
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            30 saniyeni alır. Cevaplarına göre sana özel öneriler hazırlarım.
          </Text>
        </View>

        {/* 1. Mood */}
        <Text style={[styles.question, { color: colors.text }]}>Bugün kendini nasıl hissediyorsun?</Text>
        <View style={styles.moodRow}>
          {CHECK_IN_MOODS.map((m) => {
            const selected = mood === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.moodItem,
                  { backgroundColor: selected ? colors.primary + '18' : colors.card, borderColor: selected ? colors.primary : colors.cardBorder },
                ]}
                onPress={() => setMood(m.value)}
                accessibilityLabel={m.label}
              >
                <Text style={[styles.moodEmoji, { opacity: mood === null || selected ? 1 : 0.45 }]}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, { color: selected ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Craving */}
        <Text style={[styles.question, { color: colors.text }]}>Bugün sigara isteğin nasıldı?</Text>
        <View style={styles.cravingGrid}>
          {CHECK_IN_CRAVINGS.map((c) => {
            const selected = craving === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.cravingItem,
                  { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.cardBorder },
                ]}
                onPress={() => setCraving(c.value)}
              >
                <Text style={[styles.cravingLabel, { color: selected ? '#FFF' : colors.text }]}>{c.label}</Text>
                <Text style={[styles.cravingHint, { color: selected ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}>{c.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Triggers */}
        <Text style={[styles.question, { color: colors.text }]}>
          Seni zorlayan bir şey oldu mu? <Text style={[styles.optional, { color: colors.textTertiary }]}>(isteğe bağlı)</Text>
        </Text>
        <View style={styles.chips}>
          {CHECK_IN_TRIGGERS.map((t) => {
            const selected = triggers.includes(t.id);
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.chip,
                  { backgroundColor: selected ? colors.secondary + '22' : colors.card, borderColor: selected ? colors.secondary : colors.cardBorder },
                ]}
                onPress={() => toggleTrigger(t.id)}
              >
                <Text style={styles.chipEmoji}>{t.emoji}</Text>
                <Text style={[styles.chipText, { color: colors.text }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: canSave ? colors.primary : colors.cardBorder, bottom: insets.bottom + 16 }]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={styles.saveButtonText}>{existing ? 'Güncelle' : 'Kaydet'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },

  intro: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  introText: { flex: 1, fontSize: 14, lineHeight: 20 },

  question: { fontSize: 16, fontWeight: '800', marginTop: 10 },
  optional: { fontSize: 13, fontWeight: '500' },

  moodRow: { flexDirection: 'row', gap: 6 },
  moodItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  moodEmoji: { fontSize: 30 },
  moodLabel: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  cravingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cravingItem: { width: '48.5%', padding: 12, borderRadius: 14, borderWidth: 1.5 },
  cravingLabel: { fontSize: 15, fontWeight: '800' },
  cravingHint: { fontSize: 12, marginTop: 2 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5 },
  chipEmoji: { fontSize: 15 },
  chipText: { fontSize: 13, fontWeight: '600' },

  replyTop: { alignItems: 'center', gap: 6, marginBottom: 6 },
  replyHeadline: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  replyMessage: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  advice: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  adviceIcon: { fontSize: 26 },
  adviceTitle: { fontSize: 15, fontWeight: '800' },
  adviceText: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  adviceAction: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 10, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 },
  adviceActionText: { fontSize: 13, fontWeight: '700' },

  reminder: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  reminderTitle: { fontSize: 14, fontWeight: '800' },
  reminderText: { fontSize: 12, marginTop: 2 },
  reminderButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  reminderButtonText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  editLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  editLinkText: { fontSize: 14, fontWeight: '600' },

  saveButton: { position: 'absolute', left: 20, right: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
