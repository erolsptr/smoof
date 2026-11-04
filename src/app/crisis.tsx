import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useStatsStore } from '@/store/statsStore';
import { useUserStore } from '@/store/userStore';
import { Spacing, Typography, BorderRadius } from '@/constants';

const { height } = Dimensions.get('window');

/**
 * Crisis Mode Modal
 * Helps user resist cigarette cravings
 */
export default function CrisisScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const logCrisis = useStatsStore((state) => state.logCrisis);
  const currentStreak = useStatsStore((state) => state.currentStreak);
  const userProfile = useUserStore((state) => state.profile);
  
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [isBreathing, setIsBreathing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showSlipFlow, setShowSlipFlow] = useState(false);
  const [slipStep, setSlipStep] = useState<'trigger' | 'support' | 'result'>('trigger');
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  
  // Animation for breathing exercise
  const breatheAnim = useRef(new Animated.Value(0)).current;
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeLeft, showResult]);
  
  // Auto-complete if timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !showResult) {
      handleResisted();
    }
  }, [timeLeft]);
  
  // Breathing animation
  useEffect(() => {
    if (isBreathing) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 4000, // 4 sec inhale
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 0,
            duration: 4000, // 4 sec exhale
            useNativeDriver: true,
          }),
        ])
      );
      
      animation.start();
      
      // Update phase indicator
      const phaseInterval = setInterval(() => {
        setBreathPhase((prev) => prev === 'inhale' ? 'exhale' : 'inhale');
      }, 4000);
      
      return () => {
        animation.stop();
        clearInterval(phaseInterval);
      };
    } else {
      breatheAnim.setValue(0);
      setBreathPhase('inhale');
    }
  }, [isBreathing]);
  
  const handleResisted = async () => {
    // Log successful resistance
    await logCrisis({
      timestamp: new Date().toISOString(),
      handled: true,
      method: isBreathing ? 'breathing' : 'motivation',
    });
    
    setShowResult(true);
  };
  
  const handleGaveIn = () => {
    setShowSlipFlow(true);
    setSlipStep('trigger');
  };
  
  const isGradualMode = userProfile?.quitMethod === 'gradual';
  
  const [usedFreeze, setUsedFreeze] = useState(false);
  
  const handleTriggerSelected = (trigger: string | null) => {
    setSelectedTrigger(trigger);
    setSlipStep('support');
  };
  
  const handleUseFreeze = async () => {
    const success = useUserStore.getState().useStreakFreeze();
    
    if (success) {
      await logCrisis({
        timestamp: new Date().toISOString(),
        handled: false,
        trigger: selectedTrigger || undefined,
      });
      // Freeze used, streak stays, show result
      setUsedFreeze(true);
      setSlipStep('result' as any);
    } else {
      await handleContinueWithoutFreeze();
    }
  };
  
  const handleContinueWithoutFreeze = async () => {
    // Log the crisis
    await logCrisis({
      timestamp: new Date().toISOString(),
      handled: false,
      trigger: selectedTrigger || undefined,
    });
    
    // Record slip (updates daily stats)
    await useStatsStore.getState().recordSlip(1);
    
    // Reset streak by updating quit date to today
    const today = new Date().toISOString().split('T')[0];
    await useUserStore.getState().updateProfile({ quitDate: today });
    useStatsStore.getState().updateStreakFromQuitDate(today);
    
    // Show result
    setUsedFreeze(false);
    setSlipStep('result' as any);
  };
  
  const handleClose = () => {
    router.back();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Motivational message (static, doesn't change)
  const [motivationMessage] = useState(() => {
    const messages = [
      "İstek sadece 5 dakika sürer. Sen daha güçlüsün! 💪",
      "Düşün: Şu ana kadar ne kadar yol kattettin! 🌟",
      "Bu anı atlatırsan, kendini çok daha iyi hissedeceksin! ✨",
      "İçindeki güce inan. Sen yapabilirsin! 🦸",
      "Her direniş seni daha güçlü yapıyor! 🔥",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  });
  
  // Breathe animation scale
  const breathScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });
  
  if (showResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.success }]}>
        <View style={styles.resultContent}>
          <Text style={styles.resultMascot}>🎉</Text>
          <Text style={styles.resultTitle}>Harika İş Çıkardın!</Text>
          <Text style={styles.resultMessage}>
            Direndin ve kazandın! Smoof seninle gurur duyuyor 💚
          </Text>
          
          <TouchableOpacity
            style={[styles.resultButton, { backgroundColor: '#FFFFFF' }]}
            onPress={handleClose}
          >
            <Text style={[styles.resultButtonText, { color: colors.success }]}>
              Devam Et 🚀
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Slip Flow Screen
  if (showSlipFlow) {
    const streakFreezesRemaining = (userProfile?.streakFreezes || 0) - (userProfile?.streakFreezesUsed || 0);
    
    // Calculate achievements
    const cigarettesNotSmoked = currentStreak * (userProfile?.dailyCigaretteCount || 0);
    const moneySaved = Math.floor((cigarettesNotSmoked / 20) * (userProfile?.packPrice || 0));
    const timeSavedHours = Math.floor((cigarettesNotSmoked * 5) / 60);
    
    if (slipStep === 'trigger') {
      const triggers = [
        { id: 'stress', label: 'Stres', icon: '😰' },
        { id: 'social', label: 'Sosyal Ortam', icon: '👥' },
        { id: 'coffee', label: 'Kahve', icon: '☕' },
        { id: 'boredom', label: 'Can Sıkıntısı', icon: '😑' },
        { id: 'habit', label: 'Alışkanlık', icon: '🔄' },
        { id: 'other', label: 'Diğer', icon: '🤔' },
      ];
      
      return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.slipContent}>
            <Image 
              source={require('../../assets/smoof.png')}
              style={styles.slipMascotImage}
              resizeMode="contain"
            />
            <Text style={[styles.slipTitle, { color: colors.text }]}>
              Ne Oldu?
            </Text>
            <Text style={[styles.slipSubtitle, { color: colors.textSecondary }]}>
              Neyin tetiklediğini bilirsek, gelecekte daha hazırlıklı oluruz
            </Text>
            
            <View style={styles.triggerGrid}>
              {triggers.map((trigger) => (
                <TouchableOpacity
                  key={trigger.id}
                  style={[
                    styles.triggerButton,
                    {
                      backgroundColor: selectedTrigger === trigger.id ? colors.primary : colors.card,
                      borderColor: selectedTrigger === trigger.id ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedTrigger(trigger.id)}
                >
                  <Text style={styles.triggerIcon}>{trigger.icon}</Text>
                  <Text
                    style={[
                      styles.triggerLabel,
                      { color: selectedTrigger === trigger.id ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {trigger.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: colors.primary }]}
              onPress={() => handleTriggerSelected(selectedTrigger)}
            >
              <Text style={styles.continueButtonText}>Devam Et</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleTriggerSelected(null)}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Paylaşmak İstemiyorum
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }
    
    // Support Screen (slipStep === 'support')
    if (slipStep === 'support') {
      return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.slipContent}>
            <Image 
              source={require('../../assets/smoof.png')}
              style={styles.slipMascotImage}
              resizeMode="contain"
            />
            <Text style={[styles.slipTitle, { color: colors.text }]}>
              Sorun Değil
            </Text>
            <Text style={[styles.slipMessage, { color: colors.textSecondary }]}>
              Bir adım geri atmış olabilirsin, ama <Text style={{ fontWeight: 'bold' }}>streak'in korunuyor</Text>.
              Önemli olan devam etmen. Sen hala kazanıyorsun!
            </Text>
            
            {/* Achievements */}
            <View style={[styles.achievementsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.achievementsTitle, { color: colors.text }]}>
                Unutma, sen şimdiye kadar:
              </Text>
              <Text style={[styles.achievementItem, { color: colors.textSecondary }]}>
                🚭 {cigarettesNotSmoked} sigara içmedin
              </Text>
              <Text style={[styles.achievementItem, { color: colors.textSecondary }]}>
                💰 {moneySaved}₺ tasarruf ettin
              </Text>
              <Text style={[styles.achievementItem, { color: colors.textSecondary }]}>
                ⏱️ {timeSavedHours} saat kazandın
              </Text>
            </View>
            
            {/* Freeze Offer */}
            {streakFreezesRemaining > 0 ? (
              <>
                <TouchableOpacity
                  style={[styles.freezeButton, { backgroundColor: colors.accent }]}
                  onPress={handleUseFreeze}
                >
                  <Text style={styles.freezeButtonText}>
                    🧊 Streak Freeze Kullan
                  </Text>
                  <Text style={styles.freezeButtonSubtext}>
                    {streakFreezesRemaining} adet kaldı
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleContinueWithoutFreeze}>
                  <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                    Freeze Kullanmadan Devam Et
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.noFreezeCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.noFreezeText, { color: colors.textSecondary }]}>
                    Streak freeze kalmadı, ama yolculuğun devam ediyor! 💪
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: colors.primary }]}
                  onPress={handleContinueWithoutFreeze}
                >
                  <Text style={styles.continueButtonText}>Ana Sayfaya Dön</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      );
    }
    
    // Result Screen (slipStep === 'result')
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.resultContent}>
          <Image 
            source={require('../../assets/smoof.png')}
            style={styles.slipMascotImage}
            resizeMode="contain"
          />
          <Text style={[styles.slipTitle, { color: colors.text }]}>
            {usedFreeze ? 'Streak Korundu!' : 'Yeniden Başlıyoruz'}
          </Text>
          <Text style={[styles.slipMessage, { color: colors.textSecondary }]}>
            {usedFreeze 
              ? `Streak freeze kullandın! ${currentStreak} günlük streak'in korundu. Devam ediyoruz! 💚`
              : 'Bugün yeni bir başlangıç. Geçmişe takılma, ileriye bak. Sen yapabilirsin! 🚀'
            }
          </Text>
          
          <View style={[styles.motivationCard, { backgroundColor: colors.card, marginTop: Spacing.xl }]}>
            <Text style={[styles.motivationText, { color: colors.text }]}>
              "Her gün yeni bir şans. Sen her zaman tekrar başlayabilirsin. Ben seninleyim!"
            </Text>
            <Text style={[styles.encouragementAuthor, { color: colors.textTertiary, marginTop: Spacing.sm }]}>
              - Smoof 💚
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary, marginTop: Spacing.xl }]}
            onPress={handleClose}
          >
            <Text style={styles.continueButtonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>
      
      {/* Mascot */}
      <View style={styles.mascotContainer}>
        {isBreathing ? (
          <Animated.View style={{ transform: [{ scale: breathScale }] }}>
            <Image 
              source={require('../../assets/smoof.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </Animated.View>
        ) : (
          <Image 
            source={require('../../assets/smoof.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        )}
      </View>
      
      {/* Timer */}
      <View style={[styles.timerCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
          İstek geçene kadar:
        </Text>
        <Text style={[styles.timerValue, { color: colors.primary }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>
      
      {/* Motivation */}
      <View style={[styles.motivationCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.motivationText, { color: colors.text }]}>
          {motivationMessage}
        </Text>
      </View>
      
      {/* Breathing Exercise Button */}
      <TouchableOpacity
        style={[
          styles.breathButton,
          { 
            backgroundColor: isBreathing ? colors.accent : colors.card,
            borderColor: colors.accent,
          },
        ]}
        onPress={() => setIsBreathing(!isBreathing)}
      >
        <Text style={[
          styles.breathButtonText,
          { color: isBreathing ? '#FFFFFF' : colors.accent }
        ]}>
          {isBreathing ? '🫁 Nefes Alıyorum...' : '🫁 Nefes Egzersizi Başlat'}
        </Text>
      </TouchableOpacity>
      
      {isBreathing && (
        <Text style={[styles.breathInstruction, { color: colors.textSecondary }]}>
          {breathPhase === 'inhale' ? 'Nefes Al... 😤' : 'Nefes Ver... 😮‍💨'}
        </Text>
      )}
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleResisted}
        >
          <Text style={styles.actionButtonText}>💪 Direndim</Text>
        </TouchableOpacity>
        
        {!isGradualMode && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error, opacity: 0.7 }]}
            onPress={handleGaveIn}
          >
            <Text style={styles.actionButtonText}>😔 İçtim</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Helper text */}
      <Text style={[styles.helperText, { color: colors.textTertiary }]}>
        {isGradualMode 
          ? 'İsteğin geçene kadar diren. Sen yapabilirsin! 💪'
          : '"Direndim" butonuna basmak için 5 dakika beklemelisin'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing['4xl'],
  },
  header: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-end',
  },
  closeButton: {
    fontSize: Typography.sizes['2xl'],
    padding: Spacing.sm,
  },
  mascotContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  mascot: {
    width: 100,
    height: 100,
  },
  timerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: Typography.sizes.base,
    marginBottom: Spacing.sm,
  },
  timerValue: {
    fontSize: Typography.sizes['5xl'],
    fontWeight: Typography.weights.extrabold,
  },
  motivationCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  motivationText: {
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
    lineHeight: Typography.sizes.lg * Typography.lineHeights.relaxed,
  },
  breathButton: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  breathButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  breathInstruction: {
    fontSize: Typography.sizes.xl,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: Typography.weights.bold,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: 'auto',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  helperText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  resultMascot: {
    fontSize: 120,
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: Typography.sizes.lg,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.sizes.lg * Typography.lineHeights.relaxed,
  },
  resultButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.md,
  },
  resultButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  // Slip Flow Styles
  slipContent: {
    padding: Spacing.lg,
    paddingTop: Spacing['4xl'],
  },
  slipMascotImage: {
    width: 100,
    height: 100,
    alignSelf: 'center' as const,
    marginBottom: Spacing.lg,
  },
  slipTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center' as const,
    marginBottom: Spacing.sm,
  },
  slipSubtitle: {
    fontSize: Typography.sizes.base,
    textAlign: 'center' as const,
    marginBottom: Spacing.xl,
  },
  slipMessage: {
    fontSize: Typography.sizes.lg,
    textAlign: 'center' as const,
    marginBottom: Spacing.xl,
    lineHeight: Typography.sizes.lg * Typography.lineHeights.relaxed,
  },
  triggerGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  triggerButton: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  triggerIcon: {
    fontSize: 32,
  },
  triggerLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center' as const,
  },
  continueButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  skipText: {
    fontSize: Typography.sizes.base,
    textAlign: 'center' as const,
    paddingVertical: Spacing.sm,
  },
  achievementsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  achievementsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  achievementItem: {
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * 1.5,
  },
  freezeButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  freezeButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  freezeButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  noFreezeCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  noFreezeText: {
    fontSize: Typography.sizes.sm,
  },
  encouragementAuthor: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center' as const,
  },
});
