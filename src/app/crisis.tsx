import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Smoof } from '@/components/smoof/Smoof';
import { useProgress } from '@/hooks/useProgress';
import { newDate } from '@/utils/clock';
import { formatDuration } from '@/utils/milestones';
import { getPackCost } from '@/utils/progressMetrics';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useStatsStore } from '@/store/statsStore';
import { useUserStore } from '@/store/userStore';
import { Spacing, Typography, BorderRadius } from '@/constants';


// Short, practical tip per trigger, shown after a slip
const TRIGGER_TIPS: Record<string, string> = {
  stress: 'Stres anında 1 dakikalık nefes egzersizi dene. “Canın sigara mı çekti?” kartı hep ana sayfada.',
  social: 'Sosyal ortamlarda elinde bir içecek tutmak ve sigara içilen yerden uzak durmak işe yarar.',
  coffee: 'Bir süre kahveyi farklı bir yerde ya da çayla içmeyi dene, alışkanlık bağını kırar.',
  boredom: 'Canın sıkıldığında kısa bir yürüyüş, sakız ya da ellerini meşgul eden bir şey dene.',
  habit: 'Hep sigara içtiğin anları fark et ve onların yerine yeni küçük bir ritüel koy.',
  other: 'İsteği tetikleyen anı not al. Fark etmek, bir dahakine hazırlıklı olmanın ilk adımı.',
};

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
  const { immediate } = useProgress();
  const insets = useSafeAreaInsets();
  
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
      timestamp: newDate().toISOString(),
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
  const [previousStreak, setPreviousStreak] = useState(0);
  const [previousCigarettes, setPreviousCigarettes] = useState(0);
  
  const handleTriggerSelected = (trigger: string | null) => {
    setSelectedTrigger(trigger);
    setSlipStep('support');
  };
  
  const handleUseFreeze = async () => {
    const success = useUserStore.getState().useStreakFreeze();
    
    if (success) {
      await logCrisis({
        timestamp: newDate().toISOString(),
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
      timestamp: newDate().toISOString(),
      handled: false,
      trigger: selectedTrigger || undefined,
    });
    
    // Remember the streak before the reset, to show what the user keeps
    setPreviousStreak(currentStreak);
    setPreviousCigarettes(immediate?.cigarettesAvoided ?? 0);

    // Record slip (updates daily stats)
    await useStatsStore.getState().recordSlip(1);
    
    // Reset: the new smoke-free period starts now (exact time, so health timers are right)
    await useUserStore.getState().updateProfile({ quitDate: newDate().toISOString() });
    useStatsStore.getState().syncStreaks(useUserStore.getState().profile);
    
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
  
  // Breathe animation scale - stronger animation
  const breathScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });
  
  if (showResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.success }]}>
        <View style={styles.resultContent}>
          <View style={styles.proudHalo}>
            <Smoof mood="proud" size={200} animation="bounce" />
          </View>
          <Text style={styles.resultTitle}>Çok güçlüsün! 💪</Text>
          <Text style={styles.resultMessage}>
            O isteği yendin. Smoof seninle gurur duyuyor 💚
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
    // Same numbers as Home / Statistics
    const cigarettesNotSmoked = immediate?.cigarettesAvoided ?? 0;
    const moneySaved = Math.floor(immediate?.moneySaved ?? 0);
    const timeSavedLabel = formatDuration(immediate?.timeSavedMinutes ?? 0);
    
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
            <Smoof mood="shocked" size={130} animation="shake" style={styles.slipMascot} />
            <Text style={[styles.slipTitle, { color: colors.text }]}>
              Ne oldu öyle yaaa? 😮
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
            <Smoof mood="supportive" size={130} animation="bob" style={styles.slipMascot} />
            <Text style={[styles.slipTitle, { color: colors.text }]}>
              Sorun Değil
            </Text>
            <Text style={[styles.slipMessage, { color: colors.textSecondary }]}>
              Bir sigara, şimdiye kadarki emeğini silmez. Önemli olan buradan nasıl devam ettiğin.
            </Text>
            
            {/* Achievements */}
            <View style={[styles.achievementsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.achievementsTitle, { color: colors.text }]}>
                Unutma, sen şimdiye kadar:
              </Text>
              <Text style={[styles.achievementItem, { color: colors.textSecondary }]}>
                🚭 {cigarettesNotSmoked.toLocaleString('tr-TR')} sigara içmedin
              </Text>
              <Text style={[styles.achievementItem, { color: colors.textSecondary }]}>
                💰 ₺{moneySaved.toLocaleString('tr-TR')} tasarruf ettin
              </Text>
              <Text style={[styles.achievementItem, { color: colors.textSecondary }]}>
                ⏱️ {timeSavedLabel} kazandın
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
    const totalFreezes = userProfile?.streakFreezes || 0;
    const triggerTip = selectedTrigger ? TRIGGER_TIPS[selectedTrigger] : null;
    const prevCigarettes = previousCigarettes;
    const prevMoney = userProfile ? Math.floor(getPackCost(userProfile, prevCigarettes)) : 0;

    const renderTriggerTip = () =>
      triggerTip ? (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.resultCardHeader}>
            <Ionicons name="bulb" size={18} color={colors.secondary} />
            <Text style={[styles.resultCardTitle, { color: colors.text }]}>Bir dahaki sefere</Text>
          </View>
          <Text style={[styles.resultCardText, { color: colors.textSecondary }]}>{triggerTip}</Text>
        </View>
      ) : null;

    return (
      <ScrollView
        style={[styles.resultScreen, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.resultScroll,
          { paddingTop: Platform.OS === 'ios' ? Spacing.xl : insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        {/* Mascot with status chip */}
        <View style={styles.resultMascotWrap}>
          <Smoof mood={usedFreeze ? 'wink' : 'encourage'} size={140} animation={usedFreeze ? 'bob' : 'bounce'} />
          <View style={[styles.resultChip, { backgroundColor: usedFreeze ? colors.accent : colors.primary, borderColor: colors.background }]}>
            <Ionicons name={usedFreeze ? 'snow' : 'refresh'} size={20} color="#FFF" />
          </View>
        </View>

        <Text style={[styles.resultHeading, { color: colors.text }]}>
          {usedFreeze ? 'Şşş, çaktırma! 🤫' : 'Yeniden başlıyoruz 💚'}
        </Text>
        <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
          {usedFreeze
            ? 'Freeze kalkanın devreye girdi, serin korundu. Kaldığımız yerden devam ediyoruz.'
            : 'Kayma, yolculuğun sonu değil. Çoğu kişi bırakmayı birkaç denemede başarır.'}
        </Text>

        {usedFreeze ? (
          <>
            {/* Protected streak */}
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultHero}
            >
              <Text style={styles.resultHeroLabel}>SİGARASIZ</Text>
              <View style={styles.resultHeroRow}>
                <Text style={styles.resultHeroNumber}>{currentStreak}</Text>
                <Text style={styles.resultHeroUnit}>gün</Text>
              </View>
              <View style={styles.resultHeroBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#FFF" />
                <Text style={styles.resultHeroBadgeText}>Korundu</Text>
              </View>
            </LinearGradient>

            {/* Remaining freezes */}
            <View style={[styles.resultCard, styles.resultRowCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.resultCardTitle, { color: colors.text }]}>Kalan freeze</Text>
              <View style={styles.freezeIcons}>
                {Array.from({ length: totalFreezes }).map((_, i) => (
                  <Ionicons
                    key={i}
                    name="snow"
                    size={22}
                    color={i < streakFreezesRemaining ? colors.accent : colors.cardBorder}
                  />
                ))}
                <Text style={[styles.freezeIconsCount, { color: colors.textSecondary }]}>
                  {streakFreezesRemaining}/{totalFreezes}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* What they keep */}
            {(previousStreak > 0 || previousCigarettes > 0) && (
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.resultCardHeader}>
                  <Ionicons name="trophy" size={18} color={colors.streakFire} />
                  <Text style={[styles.resultCardTitle, { color: colors.text }]}>Bu emek seninle kalıyor</Text>
                </View>
                <View style={styles.keptRow}>
                  <View style={styles.keptItem}>
                    <Text style={[styles.keptValue, { color: colors.text }]}>{previousStreak}</Text>
                    <Text style={[styles.keptLabel, { color: colors.textSecondary }]}>gün{'\n'}sigarasız</Text>
                  </View>
                  <View style={styles.keptItem}>
                    <Text style={[styles.keptValue, { color: colors.text }]}>{prevCigarettes.toLocaleString('tr-TR')}</Text>
                    <Text style={[styles.keptLabel, { color: colors.textSecondary }]}>sigara{'\n'}içmedin</Text>
                  </View>
                  <View style={styles.keptItem}>
                    <Text style={[styles.keptValue, { color: colors.text }]}>₺{prevMoney.toLocaleString('tr-TR')}</Text>
                    <Text style={[styles.keptLabel, { color: colors.textSecondary }]}>cebinde{'\n'}kaldı</Text>
                  </View>
                </View>
              </View>
            )}

            {/* New start */}
            <View style={[styles.resultCard, styles.resultRowCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
              <View style={[styles.newStartIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="rocket" size={18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultCardTitle, { color: colors.text }]}>Yeni serin bugün başladı</Text>
                <Text style={[styles.resultCardText, { color: colors.textSecondary }]}>
                  Gece yarısına kadar dayan, ilk rozet senin
                </Text>
              </View>
            </View>
          </>
        )}

        {renderTriggerTip()}

        <Text style={[styles.smoofQuote, { color: colors.textSecondary }]}>
          “Her gün yeni bir şans. Ben seninleyim!” — Smoof
        </Text>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: usedFreeze ? colors.accent : colors.primary }]}
          onPress={handleClose}
        >
          <Text style={styles.continueButtonText}>
            {usedFreeze ? 'Devam Et' : 'Ana Sayfaya Dön'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  
  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? Spacing.sm : insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={handleClose} hitSlop={12} accessibilityLabel="Kapat">
          <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot - only the image scales, so the layout doesn't jump */}
        <View style={styles.mascotContainer}>
          <Animated.View style={{ transform: [{ scale: isBreathing ? breathScale : 1 }] }}>
            {/* Craving: cranky & tired. Breathing: follows the phase */}
            <Smoof
              mood={isBreathing ? breathPhase : 'craving'}
              size={140}
              animation={isBreathing ? 'none' : 'sway'}
            />
          </Animated.View>
        </View>

        {/* Breath phase indicator */}
        {isBreathing && (
          <View style={[styles.breathPhaseIndicator, { backgroundColor: colors.accent + '20' }]}>
            <Text style={styles.breathPhaseIcon}>
              {breathPhase === 'inhale' ? '⬇️' : '⬆️'}
            </Text>
            <Text style={[styles.breathPhaseText, { color: colors.accent }]}>
              {breathPhase === 'inhale' ? 'NEFES AL' : 'NEFES VER'}
            </Text>
          </View>
        )}

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
      </ScrollView>

      {/* Action Buttons - pinned to the bottom, always visible */}
      <View
        style={[
          styles.actions,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.cardBorder,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
          },
        ]}
      >
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

        {/* Helper text */}
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          İstek genelde birkaç dakikada geçer. Atlattığında “Direndim”e bas 💪
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing['4xl'],
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-end',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    fontSize: Typography.sizes['2xl'],
    padding: Spacing.sm,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200, // room for the 1.4x breathing scale
    marginBottom: Spacing.md,
  },
  mascot: {
    width: 100,
    height: 100,
  },
  breathPhaseIndicator: {
    alignSelf: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  breathPhaseIcon: {
    fontSize: 22,
  },
  breathPhaseText: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    letterSpacing: 2,
  },
  timerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
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
    marginBottom: Spacing.md,
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
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    paddingHorizontal: Spacing.sm,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  proudHalo: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  slipMascot: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
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
  // Slip result screens
  resultScreen: {
    flex: 1,
  },
  resultScroll: {
    paddingHorizontal: Spacing.lg,
  },
  resultMascotWrap: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  resultChip: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultHeading: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  resultSub: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  resultHero: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultHeroLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  resultHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  resultHeroNumber: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '800',
  },
  resultHeroUnit: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  resultHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  resultHeroBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resultCard: {
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: 8,
  },
  resultRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultCardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  freezeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freezeIconsCount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  keptRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  keptItem: {
    flex: 1,
    alignItems: 'center',
  },
  keptValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  keptLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
  },
  newStartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smoofQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
});
