import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Smoof } from '@/components/smoof/Smoof';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useUserStore } from '../../store/userStore';
import type { UserProfile } from '../../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Onboarding last step: start date (same look as the other onboarding steps)
 */
export default function Step6Screen() {
  const { colors, isDark } = useColorScheme();
  const { data, setStep6Data } = useOnboardingStore();
  const setProfile = useUserStore((state) => state.setProfile);
  
  const [selectedOption, setSelectedOption] = useState<'now' | 'date' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setSelectedOption('date');
    }
  };

  const handleContinue = () => {
    const startDate = selectedOption === 'now' ? new Date() : selectedDate;
    setStep6Data(startDate.toISOString());

    // Tüm bilgileri topla ve profil oluştur
    const profile: UserProfile = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      dailyCigaretteCount: data.dailyCigarettes || 0,
      packPrice: data.packPrice || 0,
      cigarettesPerPack: 20,
      quitDate: startDate.toISOString(),
      quitMethod: data.quitMethod || 'immediate',
      triggers: [],
      motivations: data.motivations || [],
      streakFreezes: 3,
      streakFreezesUsed: 0,
    };

    // Add gradual-specific fields if method is gradual
    if (data.quitMethod === 'gradual') {
      profile.gradualStartDate = startDate.toISOString();
      profile.gradualStartCount = data.dailyCigarettes || 0;
      profile.gradualInitialTarget = data.gradualInitialTarget || Math.max(1, Math.floor((data.dailyCigarettes || 0) * 0.7));
      profile.gradualTargetWeeks = data.gradualTargetWeeks || 6;
      profile.gradualWeeklyReduction = data.gradualWeeklyReduction;
    }

    setProfile(profile);
    router.replace('/(tabs)');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isGradual = data.quitMethod === 'gradual';
  // Whole days until the chosen date (0 = today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const picked = new Date(selectedDate);
  picked.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((picked.getTime() - today.getTime()) / DAY_MS);
  const startsLater = selectedOption === 'date' && daysUntil > 0;

  const options = [
    {
      key: 'now' as const,
      icon: '🚀',
      title: 'Hemen başla',
      desc: isGradual ? 'Planın bugün başlasın' : 'Şu andan itibaren sigarasızsın',
      onPress: () => {
        setSelectedOption('now');
        setSelectedDate(new Date());
      },
    },
    {
      key: 'date' as const,
      icon: '📅',
      title: 'Tarih seç',
      desc: selectedOption === 'date' ? formatDate(selectedDate) : 'En fazla 90 gün sonrası',
      onPress: () => setShowDatePicker(true),
    },
  ];

  const infoText = !selectedOption
    ? 'Bugün başlayabilir ya da kendini hazır hissettiğin bir gün seçebilirsin.'
    : startsLater
      ? `${daysUntil} gün sonra başlıyoruz. O zamana kadar hazırlık modunda sana yardımcı olacağım.`
      : 'Harika! Her yolculuk bir adımla başlar. Sen de bu adımı atıyorsun! 💪';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progress}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          ))}
        </View>

        {/* Mascot */}
        <Smoof mood="excited" size={80} animation="bob" style={styles.mascot} />

        {/* Question */}
        <Text style={[styles.question, { color: colors.text }]}>Ne zaman başlıyoruz? 📅</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {isGradual ? 'Kademeli azaltma planın hangi gün başlasın?' : 'Sigarasız yolculuğun hangi gün başlasın?'}
        </Text>

        {/* Options */}
        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = selectedOption === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={option.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionDesc, { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
                    {option.desc}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                ) : option.key === 'date' ? (
                  <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name={selectedOption ? 'heart' : 'information-circle'} size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{infoText}</Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: selectedOption ? colors.primary : colors.cardBorder }]}
        onPress={handleContinue}
        disabled={!selectedOption}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { opacity: selectedOption ? 1 : 0.5 }]}>Başlayalım! 🚀</Text>
      </TouchableOpacity>

      {/* Date Picker */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: colors.cardBorder }]}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>İptal</Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, { color: colors.text }]}>Başlangıç tarihi</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedOption('date');
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={[styles.doneButton, { color: colors.primary }]}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 90 * DAY_MS)}
                locale="tr-TR"
                themeVariant={isDark ? 'dark' : 'light'}
                textColor={colors.text}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
            maximumDate={new Date(Date.now() + 90 * DAY_MS)}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mascot: {
    width: 80,
    marginBottom: Spacing.xl,
  },
  question: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  options: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 36,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: Typography.sizes.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: '100%',
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  button: {
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 17,
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
  },
});
