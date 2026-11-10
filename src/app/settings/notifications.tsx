import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNotificationStore } from '@/store/notificationStore';
import { useStatsStore } from '@/store/statsStore';
import { useCheckInStore } from '@/store/checkInStore';
import { getRiskWindows, WEEKDAYS } from '@/utils/insights';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';

export default function NotificationSettingsScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const { settings, updateSettings, toggleNotifications, isInitialized, initializeNotifications } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      handleInitialize();
    }
  }, [isInitialized]);

  const handleInitialize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await initializeNotifications();
    } catch (err) {
      console.error('Init error:', err);
      setError('Bildirimler başlatılamadı. Lütfen cihaz ayarlarından izinleri kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMain = async (value: boolean) => {
    try {
      setError(null);
      if (value && !isInitialized) {
        await handleInitialize();
      } else {
        await toggleNotifications(value);
      }
    } catch (err) {
      console.error('Toggle error:', err);
      setError('Bildirim ayarları güncellenemedi.');
    }
  };

  const handleToggleSetting = async (key: keyof typeof settings, value: boolean) => {
    try {
      setError(null);
      await updateSettings({ [key]: value });
    } catch (err) {
      console.error('Setting toggle error:', err);
      setError('Ayar güncellenemedi.');
    }
  };

  const handleEditTime = (type: 'motivation' | 'reflection') => {
    Alert.alert(
      'Saat Ayarla',
      type === 'motivation' ? 'Günlük motivasyon saati' : 'Check-in hatırlatma saati',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tamam',
          onPress: () => {
            // TODO: Time picker implementation
            Alert.alert('Geliştirme Aşamasında', 'Saat seçici yakında eklenecek');
          },
        },
      ]
    );
  };

  // Risky hours learned from the user's craving logs (falls back to fixed hours)
  const risk = getRiskWindows(useStatsStore.getState().crisisLogs, useCheckInStore.getState().checkIns);
  const learnedText = risk.hours.length
    ? `Öğrendim: ${risk.hours.map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')}${risk.hardWeekday !== null ? ` · ${WEEKDAYS[risk.hardWeekday]}` : ''}`
    : `Öğreniyorum · şimdilik ${settings.criticalHoursList.length} sabit saat`;

  const handleEditCriticalHours = () => {
    Alert.alert(
      'Zor anlar',
      risk.hours.length
        ? `“Canın sigara mı çekti?” kayıtlarına göre en çok ${risk.hours.map((h) => `${h}:00`).join(' ve ')} civarı zorlanıyorsun. Bu saatlerden 15 dakika önce kısa bir destek mesajı gönderiyorum.`
        : 'Canın sigara çektiğinde kriz ekranını kullandıkça hangi saatlerde zorlandığını öğrenirim ve o saatlerden hemen önce destek mesajı gönderirim. Şimdilik genel saatleri kullanıyorum.',
      [{ text: 'Tamam' }]
    );
  };

  const handleTestNotification = async (type: string) => {
    const { scheduleMilestoneCelebration, scheduleDailyMotivation, scheduleWaterReminders, scheduleEveningReflection, scheduleCriticalHourSupport } = await import('@/services/notificationService');
    
    try {
      switch (type) {
        case 'instant':
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🧪 Test Bildirimi',
              body: 'Bu bir test bildirimidir. Bildirimler çalışıyor! 🎉',
              data: { type: 'test' },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: 2,
            } as Notifications.TimeIntervalTriggerInput,
          });
          Alert.alert('✅ Başarılı', '2 saniye sonra bildirim gelecek!');
          break;
        case 'milestone':
          await scheduleMilestoneCelebration(1, 3);
          Alert.alert('✅ Başarılı', '3 saniye sonra milestone bildirimi gelecek!');
          break;
        case 'motivation':
          await scheduleDailyMotivation(new Date().getHours(), new Date().getMinutes() + 1);
          Alert.alert('✅ Başarılı', '1 dakika sonra motivasyon bildirimi gelecek!');
          break;
        default:
          break;
      }
    } catch (error) {
      Alert.alert('❌ Hata', 'Bildirim gönderilemedi: ' + error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Bildirim Ayarları
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loading State */}
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Bildirimler hazırlanıyor...
            </Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '10' }]}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Main Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="notifications" size={24} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Bildirimleri Aç
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Tüm bildirimleri etkinleştir
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleMain}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Settings List */}
        {settings.enabled && (
          <>
            {/* Daily Motivation */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="sunny" size={20} color={colors.textSecondary} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Günlük Motivasyon
                    </Text>
                    <Text style={[styles.settingTime, { color: colors.textSecondary }]}>
                      {`${settings.dailyMotivationTime.hour.toString().padStart(2, '0')}:${settings.dailyMotivationTime.minute.toString().padStart(2, '0')}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <TouchableOpacity
                    onPress={() => handleEditTime('motivation')}
                    style={styles.editButton}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Switch
                    value={settings.dailyMotivation}
                    onValueChange={(v) => handleToggleSetting('dailyMotivation', v)}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Milestones */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="trophy" size={20} color={colors.textSecondary} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Başarı Kutlamaları
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      Milestone'lara ulaştığında bildirim
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.milestones}
                  onValueChange={(v) => handleToggleSetting('milestones', v)}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Critical Hours */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="alert-circle" size={20} color={colors.textSecondary} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Zor anlarda destek
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      {learnedText}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <TouchableOpacity
                    onPress={handleEditCriticalHours}
                    style={styles.editButton}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Switch
                    value={settings.criticalHours}
                    onValueChange={(v) => handleToggleSetting('criticalHours', v)}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Water Reminders */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="water" size={20} color={colors.textSecondary} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Su Hatırlatıcıları
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      Günde 4 kez
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.waterReminders}
                  onValueChange={(v) => handleToggleSetting('waterReminders', v)}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Evening Reflection */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="moon" size={20} color={colors.textSecondary} />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Günlük check-in hatırlatıcısı
                    </Text>
                    <Text style={[styles.settingTime, { color: colors.textSecondary }]}>
                      {`${settings.eveningReflectionTime.hour.toString().padStart(2, '0')}:${settings.eveningReflectionTime.minute.toString().padStart(2, '0')} · sadece doldurmadığın günler`}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <TouchableOpacity
                    onPress={() => handleEditTime('reflection')}
                    style={styles.editButton}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Switch
                    value={settings.eveningReflection}
                    onValueChange={(v) => handleToggleSetting('eveningReflection', v)}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Info Box */}
            <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Bildirimler sigarayı bırakma yolculuğunda sana destek olmak için tasarlandı. İstediğin zaman değiştirebilirsin.
              </Text>
            </View>

            {/* Test Section */}
            <View style={[styles.testSection, { backgroundColor: colors.card }]}>
              <View style={styles.testHeader}>
                <Ionicons name="flask" size={20} color={colors.secondary} />
                <Text style={[styles.testTitle, { color: colors.text }]}>
                  Bildirimleri Test Et 🧪
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: colors.primary }]}
                onPress={() => handleTestNotification('instant')}
              >
                <Ionicons name="notifications" size={20} color="#FFF" />
                <Text style={styles.testButtonText}>Hemen Gönder (2 sn)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: colors.secondary }]}
                onPress={() => handleTestNotification('milestone')}
              >
                <Ionicons name="trophy" size={20} color="#FFF" />
                <Text style={styles.testButtonText}>Milestone (3 sn)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => handleTestNotification('motivation')}
              >
                <Ionicons name="sunny" size={20} color="#FFF" />
                <Text style={styles.testButtonText}>Motivasyon (1 dk)</Text>
              </TouchableOpacity>

              <Text style={[styles.testHint, { color: colors.textSecondary }]}>
                💡 Uygulamayı arka plana al ve bekle
              </Text>
            </View>
          </>
        )}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
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
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: Typography.sizes.sm,
  },
  settingTime: {
    fontSize: Typography.sizes.sm,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editButton: {
    padding: Spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  loadingContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sizes.base,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.5,
    fontWeight: Typography.weights.semibold,
  },
  testSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  testTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  testHint: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
