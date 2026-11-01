import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { storage } from '@/utils/storage';
import { calculateStreakFromQuitDate, getTodayString } from '@/utils/dateHelpers';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const currentStreak = useStatsStore((state) => state.currentStreak);
  const clearStatsData = useStatsStore((state) => state.clearStatsData);
  const updateStreakFromQuitDate = useStatsStore((state) => state.updateStreakFromQuitDate);

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profil bulunamadı</Text>
      </View>
    );
  }

  const handleDateTest = async (daysAgo: number) => {
    const today = new Date();
    const testDate = new Date(today);
    testDate.setDate(today.getDate() - daysAgo);
    const newQuitDate = testDate.toISOString().split('T')[0];

    await updateProfile({ quitDate: newQuitDate });
    
    // Recalculate streak from new quit date
    updateStreakFromQuitDate(newQuitDate);
    
    Alert.alert(
      'Tarih Güncellendi',
      `Bırakma tarihi ${daysAgo} gün geriye alındı.\nYeni tarih: ${newQuitDate}\nBeklenen streak: ${daysAgo} gün`
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
            await storage.clear();
            router.replace('/');
          },
        },
      ]
    );
  };

  const calculatedStreak = calculateStreakFromQuitDate(profile.quitDate);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Test Modu 🧪</Text>

      {/* Profile Info */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Profil Bilgileri</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Günlük Sigara:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{profile.dailyCigaretteCount} adet</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Paket Fiyatı:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>₺{profile.packPrice}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Bırakma Tarihi:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{profile.quitDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Yöntem:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {profile.quitMethod === 'cold-turkey' ? 'Tamamen Bırak' : 'Kademeli'}
          </Text>
        </View>
      </View>

      {/* Streak Debug */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Streak Debug</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Store Streak:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{currentStreak} gün</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Hesaplanan:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{calculatedStreak} gün</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Bugün:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{getTodayString()}</Text>
        </View>
      </View>

      {/* Date Test Buttons */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Tarih Testi</Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          Bırakma tarihini geriye alarak streak'i test et
        </Text>
        
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={() => handleDateTest(1)}
          >
            <Text style={styles.testButtonText}>1 Gün</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={() => handleDateTest(7)}
          >
            <Text style={styles.testButtonText}>1 Hafta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={() => handleDateTest(30)}
          >
            <Text style={styles.testButtonText}>1 Ay</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={() => handleDateTest(90)}
          >
            <Text style={styles.testButtonText}>3 Ay</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.secondary, marginTop: Spacing.md }]}
          onPress={() => handleDateTest(365)}
        >
          <Text style={styles.testButtonText}>🎉 1 Yıl</Text>
        </TouchableOpacity>
      </View>

      {/* Freeze Info */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Streak Freeze</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Toplam Hak:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{profile.streakFreezes}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Kullanılan:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{profile.streakFreezesUsed}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Kalan:</Text>
          <Text style={[styles.infoValue, { color: colors.success }]}>
            {profile.streakFreezes - profile.streakFreezesUsed}
          </Text>
        </View>
      </View>

      {/* Reset Button */}
      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: colors.error }]}
        onPress={handleResetApp}
      >
        <Text style={styles.resetButtonText}>🔄 Uygulamayı Sıfırla</Text>
      </TouchableOpacity>

      <Text style={[styles.warning, { color: colors.textTertiary }]}>
        ⚠️ Test Modu - Geliştirme aşamasında kaldırılacak
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing['3xl'],
    gap: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    fontSize: Typography.sizes.base,
  },
  infoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  testButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  resetButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  warning: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
