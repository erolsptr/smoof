import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useUserStore } from '../../store/userStore';
import type { UserProfile } from '../../types';

export default function Step6Screen() {
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
      quitMethod: data.quitMethod === 'gradual' ? 'gradual' : 'cold-turkey',
      triggers: [],
      motivations: data.motivations || [],
      streakFreezes: 3,
      streakFreezesUsed: 0,
    };

    setProfile(profile);
    router.replace('/(tabs)');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={48} color="#fff" />
        </View>

        <Text style={styles.title}>Ne Zaman Başlıyoruz?</Text>
        <Text style={styles.subtitle}>
          Sigarayı bırakma yolculuğuna başlamak için bir tarih seç
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'now' && styles.optionCardSelected,
            ]}
            onPress={() => {
              setSelectedOption('now');
              setSelectedDate(new Date());
            }}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="flash" size={32} color="#4ECDC4" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Hemen Başla</Text>
                <Text style={styles.optionDescription}>Şimdi başlayalım!</Text>
              </View>
              {selectedOption === 'now' && (
                <Ionicons name="checkmark-circle" size={28} color="#4ECDC4" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'date' && styles.optionCardSelected,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="calendar-outline" size={32} color="#4ECDC4" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Tarih Seç</Text>
                <Text style={styles.optionDescription}>
                  {selectedOption === 'date' 
                    ? formatDate(selectedDate)
                    : 'İstediğin bir tarih seç'}
                </Text>
              </View>
              {selectedOption === 'date' && (
                <Ionicons name="checkmark-circle" size={28} color="#4ECDC4" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {selectedOption && (
          <View style={styles.motivationalBox}>
            <Ionicons name="heart" size={24} color="#FC8181" />
            <Text style={styles.motivationalText}>
              Harika! Her yolculuk bir adımla başlar. Sen de bu adımı atıyorsun! 💪
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, !selectedOption && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedOption}
        >
          <Text style={styles.continueButtonText}>Başlayalım!</Text>
          <Ionicons name="arrow-forward" size={20} color="#4ECDC4" />
        </TouchableOpacity>

        <View style={styles.progressDots}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === 4 && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* Date Picker Modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.cancelButton}>İptal</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Tarih Seç</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedOption('date');
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.doneButton}>Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // 90 gün sonrası
                locale="tr-TR"
                textColor="#2D3748"
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
            maximumDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
          />
        )
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fffe',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#718096',
  },
  motivationalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  motivationalText: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E2E8F0',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
  },
  cancelButton: {
    fontSize: 17,
    color: '#718096',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4ECDC4',
  },
});
