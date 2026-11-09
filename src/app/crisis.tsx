import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Smoof } from '@/components/smoof/Smoof';
import { ChameleonHide } from '@/components/games/ChameleonHide';
import { SmokeGarden } from '@/components/games/SmokeGarden';
import { BreathingGuide } from '@/components/crisis/BreathingGuide';
import { CravingTimer } from '@/components/crisis/CravingTimer';
import { useProgress } from '@/hooks/useProgress';
import { newDate } from '@/utils/clock';
import { formatDuration } from '@/utils/milestones';
import { getPackCost } from '@/utils/progressMetrics';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

/** A craving usually peaks and passes within ~5 minutes */
const CRAVING_SECONDS = 300;

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
  const { width, height } = useWindowDimensions();
  
  const [timeLeft, setTimeLeft] = useState(CRAVING_SECONDS);
  // Opened from a chip on the home card: start with that tool already open
  const { open } = useLocalSearchParams<{ open?: 'breath' | 'hide' | 'garden' }>();
  const [isBreathing, setIsBreathing] = useState(open === 'breath');
  const [showResult, setShowResult] = useState(false);
  const [showSlipFlow, setShowSlipFlow] = useState(false);
  const [slipStep, setSlipStep] = useState<'trigger' | 'support' | 'result'>('trigger');
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  // Mini game: opens over this screen, so the craving timer keeps running
  const [gameOpen, setGameOpen] = useState<'hide' | 'garden' | null>(null);
  // A game chip on the home card: open it once this (modal) screen has finished
  // sliding in; iOS can drop a second modal presented during that animation
  useEffect(() => {
    if (open !== 'hide' && open !== 'garden') return;
    const id = setTimeout(() => setGameOpen(open), 450);
    return () => clearTimeout(id);
  }, [open]);
  const [gameFound, setGameFound] = useState(0);
  const [gamePlanted, setGamePlanted] = useState(0);
  const playedGame = useRef(false);

  // Craving timer: counts down to 0 and stops there. It never ends the screen
  // by itself (the user may still be playing or breathing).
  useEffect(() => {
    if (showResult) return;
    const id = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [showResult]);
  
  const handleResisted = async () => {
    // Log successful resistance
    await logCrisis({
      timestamp: newDate().toISOString(),
      handled: true,
      method: isBreathing ? 'breathing' : playedGame.current ? 'minigame' : 'motivation',
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
  
  // Motivational message (static, doesn't change)
  const [motivationMessage] = useState(() => {
    const messages = [
      "İstek sadece 5 dakika sürer. Sen daha güçlüsün! 💪",
      "Düşün: Şu ana kadar ne kadar yol kat ettin! 🌟",
      "Bu anı atlatırsan, kendini çok daha iyi hissedeceksin! ✨",
      "İçindeki güce inan. Sen yapabilirsin! 🦸",
      "Her direniş seni daha güçlü yapıyor! 🔥",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
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
  
  const heroSize = Math.round(Math.min(width * 0.62, Math.max(170, height * 0.27)));

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? Spacing.md : insets.top + Spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Birlikte atlatalım 💚</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{motivationMessage}</Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={12}
          accessibilityLabel="Kapat"
          style={[styles.closeCircle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: craving timer, or the breathing guide while breathing */}
        <View style={styles.hero}>
          {isBreathing ? (
            <BreathingGuide size={heroSize} />
          ) : (
            <CravingTimer size={heroSize} timeLeft={timeLeft} total={CRAVING_SECONDS} />
          )}
        </View>

        {/* Tools */}
        <View style={styles.tools}>
          {[
            {
              key: 'breath',
              active: isBreathing,
              color: colors.accent,
              icon: <Ionicons name={isBreathing ? 'pause' : 'leaf'} size={20} color="#FFF" />,
              title: isBreathing ? 'Bitir' : 'Nefes',
              text: isBreathing ? 'Zamanlayıcıya dön' : '4 al · 2 tut · 6 ver',
              onPress: () => setIsBreathing(!isBreathing),
              label: isBreathing ? 'Nefes egzersizini bitir' : 'Nefes egzersizini başlat',
            },
            {
              key: 'hide',
              active: false,
              color: colors.primary,
              icon: <Text style={styles.toolEmoji}>🦎</Text>,
              title: 'Saklambaç',
              text: gameFound > 0 ? `${gameFound} kez buldun` : "Smoof'u bul",
              onPress: () => {
                setIsBreathing(false);
                setGameOpen('hide');
              },
              label: 'Bukalemun Saklambaç oyununu aç',
            },
            {
              key: 'garden',
              active: false,
              color: colors.secondary,
              icon: <Text style={styles.toolEmoji}>🌸</Text>,
              title: 'Bahçe',
              text: gamePlanted > 0 ? `En iyi: ${gamePlanted} puan` : 'Gökyüzünü temizle',
              onPress: () => {
                setIsBreathing(false);
                setGameOpen('garden');
              },
              label: 'Duman Bahçesi oyununu aç',
            },
          ].map((tool) => (
            <TouchableOpacity
              key={tool.key}
              style={[
                styles.tool,
                tool.active
                  ? { backgroundColor: tool.color, borderColor: tool.color }
                  : { backgroundColor: tool.color + '14', borderColor: tool.color + '55' },
              ]}
              onPress={tool.onPress}
              activeOpacity={0.8}
              accessibilityLabel={tool.label}
            >
              <View style={[styles.toolIcon, { backgroundColor: tool.active ? 'rgba(255,255,255,0.25)' : tool.color }]}>
                {tool.icon}
              </View>
              <Text style={[styles.toolTitle, { color: tool.active ? '#FFF' : colors.text }]} numberOfLines={1}>
                {tool.title}
              </Text>
              <Text
                style={[styles.toolText, { color: tool.active ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}
                numberOfLines={2}
              >
                {tool.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={gameOpen !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setGameOpen(null)}
      >
        {gameOpen === 'garden' ? (
          <SmokeGarden
            onClose={(score) => {
              playedGame.current = true;
              setGamePlanted((prev) => Math.max(prev, score));
              setGameOpen(null);
            }}
          />
        ) : (
          <ChameleonHide
            onClose={(found) => {
              playedGame.current = true;
              setGameFound((prev) => Math.max(prev, found));
              setGameOpen(null);
            }}
          />
        )}
      </Modal>

      {/* Actions - pinned to the bottom, always visible */}
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
          style={[styles.resistButton, { backgroundColor: colors.primary }]}
          onPress={handleResisted}
          activeOpacity={0.85}
        >
          <Text style={styles.resistButtonText}>💪 Direndim</Text>
        </TouchableOpacity>

        {!isGradualMode && (
          <TouchableOpacity onPress={handleGaveIn} hitSlop={8} style={styles.gaveInButton}>
            <Text style={[styles.gaveInText, { color: colors.textSecondary }]}>İçtim, ne yapmalıyım?</Text>
          </TouchableOpacity>
        )}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  headerSub: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
    lineHeight: Typography.sizes.sm * 1.4,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  tools: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tool: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm + 2,
    gap: 2,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  toolEmoji: {
    fontSize: 22,
  },
  toolTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  toolText: {
    fontSize: Typography.sizes.xs,
  },
  resistButton: {
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  resistButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  gaveInButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  gaveInText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textDecorationLine: 'underline',
  },
  scroll: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
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
