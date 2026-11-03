import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../store/onboardingStore';

const WEEK_OPTIONS = [
  { weeks: 2, label: '2 Hafta' },
  { weeks: 4, label: '1 Ay' },
  { weeks: 8, label: '2 Ay' },
  { weeks: 12, label: '3 Ay' },
];

export default function Step5Screen() {
  const { data, setStep5Data } = useOnboardingStore();
  const [selectedWeeks, setSelectedWeeks] = useState<number | null>(null);

  const dailyCigs = data.dailyCigarettes || 0;

  const handleContinue = () => {
    if (selectedWeeks) {
      setStep5Data(selectedWeeks);
      router.push('/onboarding/step6');
    }
  };

  const renderPlan = (weeks: number) => {
    const weeksPerPhase = Math.floor(weeks / 4);
    const cigsPerPhase = Math.ceil(dailyCigs / 4);

    return (
      <View style={styles.planContainer}>
        <View style={styles.planRow}>
          <View style={styles.phaseIndicator}>
            <Text style={styles.phaseNumber}>1</Text>
          </View>
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>İlk {weeksPerPhase} hafta</Text>
            <Text style={styles.phaseDetail}>{cigsPerPhase * 3} sigara/gün</Text>
          </View>
        </View>

        <View style={styles.planRow}>
          <View style={styles.phaseIndicator}>
            <Text style={styles.phaseNumber}>2</Text>
          </View>
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Sonraki {weeksPerPhase} hafta</Text>
            <Text style={styles.phaseDetail}>{cigsPerPhase * 2} sigara/gün</Text>
          </View>
        </View>

        <View style={styles.planRow}>
          <View style={styles.phaseIndicator}>
            <Text style={styles.phaseNumber}>3</Text>
          </View>
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Sonraki {weeksPerPhase} hafta</Text>
            <Text style={styles.phaseDetail}>{cigsPerPhase} sigara/gün</Text>
          </View>
        </View>

        <View style={styles.planRow}>
          <View style={[styles.phaseIndicator, styles.finalPhaseIndicator]}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Son {weeksPerPhase} hafta</Text>
            <Text style={styles.phaseDetail}>0 sigara/gün 🎉</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="trending-down" size={48} color="#fff" />
          </View>

          <Text style={styles.title}>Planını Seç</Text>
          <Text style={styles.subtitle}>
            Günde {dailyCigs} sigara içiyorsun. Kaç haftada sıfıra inmek istersin?
          </Text>

          <View style={styles.optionsContainer}>
            {WEEK_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.weeks}
                style={[
                  styles.optionCard,
                  selectedWeeks === option.weeks && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedWeeks(option.weeks)}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {selectedWeeks === option.weeks && (
                    <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                  )}
                </View>
                
                {selectedWeeks === option.weeks && renderPlan(option.weeks)}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, !selectedWeeks && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedWeeks}
          >
            <Text style={styles.continueButtonText}>Devam Et</Text>
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
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fffe',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  planContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  phaseIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalPhaseIndicator: {
    backgroundColor: '#48BB78',
  },
  phaseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  phaseContent: {
    flex: 1,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  phaseDetail: {
    fontSize: 13,
    color: '#718096',
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
});
