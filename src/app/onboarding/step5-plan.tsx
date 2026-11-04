import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

/**
 * Onboarding Step 5.5: Target Plan Selection
 * Shown after step5 for gradual reduction users
 * User selects how many weeks to reach 0 cigarettes
 */
export default function OnboardingStep5Plan() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const { data, setStep5PlanData } = useOnboardingStore();
  
  const [selectedWeeks, setSelectedWeeks] = useState<number | null>(null);
  
  const dailyCigs = data.dailyCigarettes || 0;
  
  const planOptions = [
    { weeks: 4, label: 'Hızlı', icon: '🚀', color: '#EF4444' },
    { weeks: 6, label: 'Dengeli', icon: '⭐', color: '#F59E0B', recommended: true },
    { weeks: 8, label: 'Rahat', icon: '🎯', color: '#3B82F6' },
    { weeks: 12, label: 'Çok Rahat', icon: '🌱', color: '#10B981' },
  ];

  const calculateWeeklyReduction = (weeks: number) => {
    return Math.ceil(dailyCigs / weeks);
  };

  const handleContinue = () => {
    if (!selectedWeeks) return;
    
    const weeklyReduction = calculateWeeklyReduction(selectedWeeks);
    setStep5PlanData(selectedWeeks, weeklyReduction);
    router.push('/onboarding/step6');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
        </View>

        {/* Mascot */}
        <Image 
          source={require('../../../assets/smoof.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        
        {/* Question */}
        <Text style={[styles.question, { color: colors.text }]}>
          Kaç haftada 0&apos;a inmek istersin? 📅
        </Text>
        
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Başlangıç: {dailyCigs} sigara/gün → Hedef: 0 sigara/gün
        </Text>

        {/* Plan Options */}
        <View style={styles.options}>
          {planOptions.map((option) => {
            const weeklyReduction = calculateWeeklyReduction(option.weeks);
            const isSelected = selectedWeeks === option.weeks;
            
            return (
              <TouchableOpacity
                key={option.weeks}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isSelected ? option.color : colors.card,
                    borderColor: isSelected ? option.color : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedWeeks(option.weeks)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planLeft}>
                    <Text style={styles.planIcon}>{option.icon}</Text>
                    <View>
                      <View style={styles.planTitleRow}>
                        <Text style={[
                          styles.planTitle,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}>
                          {option.weeks} Hafta
                        </Text>
                        {option.recommended && (
                          <View style={[
                            styles.recommendedBadge,
                            { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : option.color + '20' }
                          ]}>
                            <Text style={[
                              styles.recommendedText,
                              { color: isSelected ? '#FFFFFF' : option.color }
                            ]}>
                              Önerilen
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.planLabel,
                        { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                  </View>
                  
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                  )}
                </View>
                
                <View style={[
                  styles.planDetail,
                  { 
                    backgroundColor: isSelected ? 'rgba(0,0,0,0.1)' : colors.cardBorder + '50',
                  }
                ]}>
                  <Ionicons 
                    name="trending-down" 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.planDetailText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}>
                    Her hafta yaklaşık {weeklyReduction} sigara azalt
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Plan otomatik ilerler. İstediğin zaman hedefi düşürebilirsin.
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.button, 
          { backgroundColor: selectedWeeks ? colors.primary : colors.cardBorder }
        ]}
        onPress={handleContinue}
        disabled={!selectedWeeks}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { opacity: selectedWeeks ? 1 : 0.5 }]}>
          Devam Et
        </Text>
      </TouchableOpacity>
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
    height: 80,
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
  planCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  planIcon: {
    fontSize: 36,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  planLabel: {
    fontSize: Typography.sizes.sm,
  },
  recommendedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  recommendedText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  planDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  planDetailText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
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
});
