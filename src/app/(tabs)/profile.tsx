import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useAchievementStore } from '@/store/achievementStore';
import { storage } from '@/utils/storage';
import { calculateStreakFromQuitDate, getTodayString } from '@/utils/dateHelpers';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const currentStreak = useStatsStore((state) => state.currentStreak);
  const clearStatsData = useStatsStore((state) => state.clearStatsData);
  const updateStreakFromQuitDate = useStatsStore((state) => state.updateStreakFromQuitDate);
  const resetAchievements = useAchievementStore((state) => state.resetAchievements);

  const [testModeVisible, setTestModeVisible] = useState(false);
  const [testTapCount, setTestTapCount] = useState(0);

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil bulunamadı</Text>
      </View>
    );
  }

  // Secret test mode trigger (5 taps on Smoof)
  const handleSmoofTap = () => {
    const newCount = testTapCount + 1;
    setTestTapCount(newCount);
    
    if (newCount === 5) {
      setTestModeVisible(!testModeVisible);
      setTestTapCount(0);
      Alert.alert(
        testModeVisible ? 'Test Modu Kapatıldı' : 'Test Modu Açıldı',
        testModeVisible ? 'Geliştirici özellikleri gizlendi' : 'Geliştirici özellikleri açıldı'
      );
    }
  };

  const handleDateTest = async (daysAgo: number) => {
    const today = new Date();
    const testDate = new Date(today);
    testDate.setDate(today.getDate() - daysAgo); // negative daysAgo means future
    const newQuitDate = testDate.toISOString().split('T')[0];

    await updateProfile({ quitDate: newQuitDate });
    updateStreakFromQuitDate(newQuitDate);
    
    const isPreparation = daysAgo < 0;
    Alert.alert(
      'Tarih Güncellendi',
      isPreparation 
        ? `Hazırlık Modu: ${Math.abs(daysAgo)} gün kaldı\nTarih: ${newQuitDate}`
        : `Streak: ${daysAgo} gün\nTarih: ${newQuitDate}`
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Uygulamayı Sıfırla',
      'Tüm veriler silinecek ve onboarding\'e döneceksin. Emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await clearUserData();
            await clearStatsData();
            await resetAchievements();
            await storage.clear();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  // Calculate stats
  const cigarettesNotSmoked = currentStreak * profile.dailyCigaretteCount;
  const moneySaved = Math.floor((cigarettesNotSmoked / 20) * profile.packPrice);
  const quitDate = new Date(profile.quitDate);
  const formattedQuitDate = quitDate.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleSmoofTap}
          activeOpacity={0.8}
        >
          <View style={[styles.avatar, { backgroundColor: 'transparent' }]}>
            <Image 
              source={require('../../../assets/smoof.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Merhaba, Savaşçı! 💪
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
          {formattedQuitDate} tarihinden beri sigarasızsın
        </Text>
      </View>

      {/* Quick Stats */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={24} color="#FFF" />
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Gün Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="close-circle" size={24} color="#FFF" />
            <Text style={styles.statValue}>{cigarettesNotSmoked}</Text>
            <Text style={styles.statLabel}>İçilmeyen</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cash" size={24} color="#FFF" />
            <Text style={styles.statValue}>₺{moneySaved}</Text>
            <Text style={styles.statLabel}>Tasarruf</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/achievements')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#F59E0B' + '20' }]}>
            <Ionicons name="trophy" size={32} color="#F59E0B" />
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>
            Rozetler
          </Text>
          <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
            Başarılarını gör
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/progress')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="trending-up" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>
            İlerleme
          </Text>
          <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
            Grafikler ve stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Profil Bilgileri
        </Text>
        
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Bırakma Tarihi
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formattedQuitDate}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="bar-chart" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Günlük Sigara
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.dailyCigaretteCount} adet
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Paket Fiyatı
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                ₺{profile.packPrice}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="fitness" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Bırakma Yöntemi
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.quitMethod === 'immediate' ? 'Tamamen Bırak' : 'Kademeli'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="snow" size={20} color={colors.accent} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Streak Freeze
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {profile.streakFreezes - profile.streakFreezesUsed} / {profile.streakFreezes} kaldı
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Ayarlar
        </Text>
        
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/settings/notifications')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Bildirimler
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="color-palette" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Tema
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Hakkında
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Yardım
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Mode (Hidden by default) */}
      {testModeVisible && (
        <View style={styles.section}>
          <View style={styles.testModeHeader}>
            <Ionicons name="flask" size={20} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.secondary, marginBottom: 0 }]}>
              Test Modu 🧪
            </Text>
          </View>
          
          {/* Quick Date Tests */}
          <View style={[styles.testCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.testCardTitle, { color: colors.text }]}>
              Geçmiş Tarihler (Streak Testi)
            </Text>
            <View style={styles.testButtonGrid}>
              {[1, 3, 7, 14, 30, 60, 90, 180, 365, 730].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.testButton, { 
                    backgroundColor: days >= 365 ? colors.secondary : colors.primary 
                  }]}
                  onPress={() => handleDateTest(days)}
                >
                  <Text style={styles.testButtonText}>
                    {days === 1 ? '1 Gün' :
                     days === 3 ? '3 Gün' :
                     days === 7 ? '1 Hafta' :
                     days === 14 ? '2 Hafta' :
                     days === 30 ? '1 Ay' :
                     days === 60 ? '2 Ay' :
                     days === 90 ? '3 Ay' :
                     days === 180 ? '6 Ay' :
                     days === 365 ? '1 Yıl' :
                     '2 Yıl'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Future Dates */}
          <View style={[styles.testCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.testCardTitle, { color: colors.text }]}>
              Gelecek Tarihler (Hazırlık Modu)
            </Text>
            <View style={styles.testButtonGrid}>
              {[-1, -3, -7, -14, -30].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.testButton, { backgroundColor: '#8B5CF6' }]}
                  onPress={() => handleDateTest(days)}
                >
                  <Text style={styles.testButtonText}>
                    {days === -1 ? '+1 Gün' :
                     days === -3 ? '+3 Gün' :
                     days === -7 ? '+1 Hafta' :
                     days === -14 ? '+2 Hafta' :
                     '+1 Ay'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Debug Info */}
          <View style={[styles.testCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.testCardTitle, { color: colors.text }]}>
              Debug Bilgileri
            </Text>
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>
                Store Streak:
              </Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>
                {currentStreak} gün
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>
                Hesaplanan:
              </Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>
                {calculateStreakFromQuitDate(profile.quitDate)} gün
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>
                Bugün:
              </Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>
                {getTodayString()}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>
                Quit Date:
              </Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>
                {profile.quitDate}
              </Text>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.error }]}
            onPress={handleResetApp}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.resetButtonText}>Uygulamayı Sıfırla</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Smoof v1.0.0
        </Text>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Made with 💚 by Smoof Team
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 90,
    height: 90,
  },
  greeting: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  subGreeting: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: Spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  settingsCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  testModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  testCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  testCardTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
  },
  testButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  testButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  debugLabel: {
    fontSize: Typography.sizes.sm,
  },
  debugValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.sizes.xs,
  },
});
