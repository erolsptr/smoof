import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useAchievementStore } from '@/store/achievementStore';
import { calculateStreakFromQuitDate } from '@/utils/dateHelpers';
import { getCurrentGradualTarget, getNextWeekTarget, getLastNDays, getDayName } from '@/utils/gradualHelpers';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

/**
 * Home Screen - Dashboard
 * Shows streak, stats carousel, and quick actions
 */
export default function HomeScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const currentStreak = useStatsStore((state) => state.currentStreak);
  const crisisLogs = useStatsStore((state) => state.crisisLogs);
  const { checkAndUnlockAchievements, checkTimedHealthAchievements, loadAchievements } = useAchievementStore();
  
  const [activeCard, setActiveCard] = useState(0);
  
  // Check if quit date is in the future or today
  const quitDate = profile?.quitDate ? new Date(profile.quitDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Quit date'i de günbaşına al
  const quitDateNormalized = quitDate ? new Date(quitDate) : null;
  if (quitDateNormalized) {
    quitDateNormalized.setHours(0, 0, 0, 0);
  }
  
  const isPreparationMode = quitDateNormalized ? quitDateNormalized > today : false;
  const isFirstDay = quitDateNormalized ? quitDateNormalized.getTime() === today.getTime() : false;
  
  // Gün farkını doğru hesapla
  const daysUntilQuit = quitDateNormalized && quitDateNormalized > today
    ? Math.ceil((quitDateNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Animation values
  const mascotScale = useRef(new Animated.Value(1)).current;
  const streakScale = useRef(new Animated.Value(0)).current;
  const streakOpacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(30)).current;
  const crisisButtonScale = useRef(new Animated.Value(1)).current;
  
  // Entrance animations
  useEffect(() => {
    // Mascot bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotScale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(mascotScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Streak entrance
    Animated.parallel([
      Animated.spring(streakScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(streakOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Cards entrance (delayed) - only in normal mode
    if (!isPreparationMode) {
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(cardsOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(cardsTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isPreparationMode]);

  // Calculate real stats from profile and keep streak synced
  useEffect(() => {
    if (profile?.quitDate) {
      const streakDays = calculateStreakFromQuitDate(profile.quitDate);
      // Always ensure store has correct streak
      if (currentStreak !== streakDays) {
        useStatsStore.getState().updateStreakFromQuitDate(profile.quitDate);
      }
    }
  }, [profile?.quitDate, currentStreak]);

  // Check and unlock achievements
  useEffect(() => {
    const checkAchievements = async () => {
      if (profile && currentStreak >= 0) {
        const cigarettesNotSmoked = currentStreak * profile.dailyCigaretteCount;
        const moneySaved = Math.floor((cigarettesNotSmoked / profile.cigarettesPerPack) * profile.packPrice);
        const crisesHandled = crisisLogs.length; // Use actual crisis count
        const hasSlipped = false; // TODO: Get from stats
        
        await loadAchievements();
        await checkAndUnlockAchievements(currentStreak, moneySaved, crisesHandled, hasSlipped, profile);
        
        // Check time-based health achievements (20min, 12hours)
        if (profile.quitDate) {
          await checkTimedHealthAchievements(profile.quitDate);
        }
      }
    };
    
    checkAchievements();
  }, [currentStreak, profile, crisisLogs.length]);

  // Calculate real stats
  const cigarettesNotSmoked = profile 
    ? currentStreak * profile.dailyCigaretteCount 
    : 0;
    
  const moneySaved = profile
    ? (cigarettesNotSmoked / profile.cigarettesPerPack) * profile.packPrice
    : 0;
    
  const timeSavedMinutes = cigarettesNotSmoked * 5; // 5 min per cigarette
  const timeSavedHours = Math.floor(timeSavedMinutes / 60);

  const stats = [
    { 
      label: 'İçilmeyen Sigara', 
      value: cigarettesNotSmoked.toLocaleString('tr-TR'), 
      iconName: 'close-circle' as const,
      iconColor: '#EF4444',
    },
    { 
      label: 'Para Tasarrufu', 
      value: `₺${moneySaved.toFixed(0)}`, 
      iconName: 'cash' as const,
      iconColor: '#F59E0B',
    },
    { 
      label: 'Kazanılan Zaman', 
      value: `${timeSavedHours} saat`, 
      iconName: 'time' as const,
      iconColor: '#3B82F6',
    },
  ];

  // Motivational message based on streak
  const getMotivationalMessage = () => {
    if (currentStreak === 0) return 'İlk günün! Başarırsın 💪';
    if (currentStreak === 1) return 'İlk gün tamamlandı! 🎉';
    if (currentStreak < 7) return 'Harika gidiyorsun! Devam et 💪';
    if (currentStreak < 30) return 'Süpersin! İlerleme harika 🌟';
    if (currentStreak < 90) return 'İnanılmaz! Gurur duymalısın 🏆';
    return 'Efsanesin! Ne kadar güçlüsün 👑';
  };

  // Preparation mode messages based on user's motivations
  const getPreparationMessage = () => {
    const motivations = profile?.motivations || [];
    const messages = [];

    if (motivations.includes('health')) {
      messages.push('Sağlığın için harika bir karar verdin! ❤️');
    }
    if (motivations.includes('money')) {
      messages.push('Tasarruf zamanı başlıyor! 💰');
    }
    if (motivations.includes('family')) {
      messages.push('Sevdiklerin için bu adımı atıyorsun 👨‍👩‍👧‍👦');
    }
    if (motivations.includes('freedom')) {
      messages.push('Bağımsızlık yakında senin olacak! 🦋');
    }
    if (motivations.includes('appearance')) {
      messages.push('Cildin ve dişlerin teşekkür edecek! ✨');
    }
    if (motivations.includes('sports')) {
      messages.push('Performansın artacak! 🏃‍♂️');
    }

    return messages.length > 0 
      ? messages[Math.floor(Math.random() * messages.length)]
      : 'Harika bir karar verdin! 🌟';
  };

  // If in preparation mode, show countdown screen
  if (isPreparationMode) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Mascot & Message */}
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.avatarPlaceholder,
              { 
                backgroundColor: 'transparent',
                transform: [{ scale: mascotScale }] 
              }
            ]}
          >
            <Image 
              source={require('../../../assets/smoof.png')}
              style={styles.smoofImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Sözünü Aldım! 🤝
          </Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
            {quitDate?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} günü sigarayı bırakıyoruz
          </Text>
        </View>

        {/* Countdown Card */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakIconContainer}>
            <Ionicons name="calendar" size={32} color="#FFF" />
          </View>
          <Text style={styles.streakLabel}>Başlamaya Kalan</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{daysUntilQuit}</Text>
            <Text style={styles.streakDays}>GÜN</Text>
          </View>
        </LinearGradient>

        {/* Motivational Messages */}
        <View style={styles.preparationSection}>
          <View style={[styles.messageCard, { 
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          }]}>
            <Ionicons name="heart" size={40} color="#FC8181" />
            <Text style={[styles.messageTitle, { color: colors.text }]}>
              O zamana kadar kafanı topla!
            </Text>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>
              {getPreparationMessage()}
            </Text>
          </View>

          {/* Tips for preparation */}
          <View style={[styles.tipsCard, { 
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          }]}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={24} color="#F59E0B" />
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Hazırlık İpuçları
              </Text>
            </View>
            
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Sigaralarını ve çakmağını şimdiden at
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Sevdiklerine söyle, destek al
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Stresli durumlar için plan yap
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Bol bol su iç, sağlıklı atıştırmalıklar al
                </Text>
              </View>
            </View>
          </View>

          {/* What will happen section */}
          <View style={[styles.benefitsCard, { 
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          }]}>
            <View style={styles.tipHeader}>
              <Ionicons name="sparkles" size={24} color="#8B5CF6" />
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Seni Neler Bekliyor
              </Text>
            </View>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: '#EF4444' + '20' }]}>
                  <Ionicons name="heart" size={20} color="#EF4444" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    20 dakika sonra
                  </Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                    Nabzın normale döner
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                  <Ionicons name="fitness" size={20} color="#3B82F6" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    2 hafta sonra
                  </Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                    Nefes almak kolaylaşır
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: '#10B981' + '20' }]}>
                  <Ionicons name="happy" size={20} color="#10B981" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    1 ay sonra
                  </Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                    Öksürük ve yorgunluk azalır
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // If it's the first day (streak = 0), show special first day screen
  if (isFirstDay && currentStreak === 0) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Mascot & Greeting */}
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.avatarPlaceholder,
              { 
                backgroundColor: 'transparent',
                transform: [{ scale: mascotScale }] 
              }
            ]}
          >
            <Image 
              source={require('../../../assets/smoof.png')}
              style={styles.smoofImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Bugün Büyük Gün! 🚀
          </Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
            İlk günün başlıyor, heyecanlı mısın?
          </Text>
        </View>

        {/* First Day Card */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakIconContainer}>
            <Ionicons name="rocket" size={32} color="#FFF" />
          </View>
          <Text style={styles.streakLabel}>İLK GÜNÜN</Text>
          <Text style={styles.firstDayMessage}>
            {profile?.quitMethod === 'gradual' 
              ? `Hedefin: ${profile.gradualCurrentTarget} sigara` 
              : 'Bugün Sigara İçmeden Tamamla'}
          </Text>
          <Text style={styles.firstDaySubMessage}>
            {profile?.quitMethod === 'gradual' 
              ? 'Hedefe uygun başla! 💪' 
              : "Streak'ini 1 yapacağız! 💪"}
          </Text>
        </LinearGradient>

        {/* Motivation Card */}
        <View style={[styles.messageCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <Ionicons name="heart" size={40} color="#FC8181" />
          <Text style={[styles.messageTitle, { color: colors.text }]}>
            Sen Yaparsın!
          </Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>
            Her büyük yolculuk ilk adımla başlar. Bugün o ilk adımı atıyorsun! İnanıyorum sana 🌟
          </Text>
        </View>

        {/* First Day Tips */}
        <View style={[styles.tipsCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              Bugün İçin İpuçları
            </Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Sigara içme isteği geldiğinde kriz modunu kullan
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Bol bol su iç, vücudun detoks oluyor
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Günün sonunda kendini ödüllendir!
              </Text>
            </View>
          </View>
        </View>

        {/* Crisis Button */}
        <TouchableOpacity
          style={[styles.crisisButton, { backgroundColor: colors.error }]}
          activeOpacity={0.8}
          onPress={() => router.push('/crisis')}
        >
          <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
          <Text style={styles.crisisText}>Sigara İçmek İstiyorum</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // GRADUAL MODE - Different UI for gradual reduction users
  if (profile?.quitMethod === 'gradual') {
    const today = new Date().toISOString().split('T')[0];
    const allDailyStats = useStatsStore.getState().dailyStats;
    const todayStats = allDailyStats.find(s => s.date === today);
    const todayCigarettes = todayStats?.cigarettesSmoked || 0;
    const target = getCurrentGradualTarget(profile);
    const smokeFreeStreak = useStatsStore.getState().smokeFreeStreak;
    const startCount = profile.gradualStartCount || profile.dailyCigaretteCount;
    const reductionPercent = startCount > 0 
      ? Math.floor(((startCount - target) / startCount) * 100)
      : 0;

    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Mascot & Greeting */}
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.avatarPlaceholder,
              { 
                backgroundColor: 'transparent',
                transform: [{ scale: mascotScale }] 
              }
            ]}
          >
            <Image 
              source={require('../../../assets/smoof.png')}
              style={styles.smoofImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Merhaba! Bugün nasılsın?
          </Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
            {currentStreak > 0 ? `${currentStreak} gün disiplinli! 💪` : 'Başlamaya hazır mısın? 🚀'}
          </Text>
        </View>

        {/* Discipline Streak Card */}
        <Animated.View 
          style={[
            { 
              opacity: streakOpacity,
              transform: [{ scale: streakScale }]
            }
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakIconContainer}>
              <Ionicons name="fitness" size={32} color="#FFF" />
            </View>
            <Text style={styles.streakLabel}>Disiplin Günü</Text>
            <View style={styles.streakRow}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakDays}>GÜN</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Today's Goal Card */}
        <View style={[styles.goalCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.goalHeader}>
            <Text style={[styles.goalTitle, { color: colors.text }]}>
              Bugün Hedef
            </Text>
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/daily-logger')}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Güncelle</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.goalContent}>
            <View style={styles.goalStat}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>
                Hedef
              </Text>
              <Text style={[styles.goalValue, { color: colors.text }]}>
                {target} sigara
              </Text>
            </View>
            
            <View style={styles.goalDivider} />
            
            <View style={styles.goalStat}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>
                İçtiğin
              </Text>
              <View style={styles.goalValueRow}>
                <Text style={[styles.goalValue, { 
                  color: todayCigarettes <= target ? colors.success : colors.error 
                }]}>
                  {todayCigarettes}
                </Text>
                <Ionicons 
                  name={todayCigarettes <= target ? 'checkmark-circle' : 'alert-circle'} 
                  size={24} 
                  color={todayCigarettes <= target ? colors.success : colors.error} 
                />
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.cardBorder }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  backgroundColor: target > 0 
                    ? (todayCigarettes / target > 1 ? colors.error : colors.primary)
                    : colors.success,
                  width: target > 0 
                    ? `${Math.min((todayCigarettes / target) * 100, 100)}%`
                    : '100%',
                }
              ]} 
            />
          </View>
        </View>

        {/* Smoke-Free Streak (if any) */}
        {smokeFreeStreak > 0 && (
          <View style={[styles.smokeFreeCard, { 
            backgroundColor: colors.success + '20',
            borderColor: colors.success,
          }]}>
            <Ionicons name="star" size={32} color={colors.success} />
            <View style={styles.smokeFreeContent}>
              <Text style={[styles.smokeFreeLabel, { color: colors.success }]}>
                Sigarasız Gün
              </Text>
              <Text style={[styles.smokeFreeValue, { color: colors.success }]}>
                {smokeFreeStreak} GÜN
              </Text>
            </View>
          </View>
        )}

        {/* Freeze Info Card */}
        <View style={[styles.freezeCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.freezeHeader}>
            <Ionicons name="snow" size={24} color={colors.accent} />
            <Text style={[styles.freezeTitle, { color: colors.text }]}>
              Streak Freeze
            </Text>
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Streak Freeze Nedir?',
                  'Hedef aşıldığında kullanılır. Disiplin günü streakini korur ve sıfırlanmasını engeller.',
                  [{ text: 'Tamam' }]
                );
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.freezeCount, { color: colors.accent }]}>
            {profile.streakFreezes - profile.streakFreezesUsed} / {profile.streakFreezes} kaldı
          </Text>
        </View>

        {/* Reduction Progress */}
        <View style={[styles.reductionCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Azaltma İlerlemeniz
          </Text>
          
          <View style={styles.reductionStats}>
            <View style={styles.reductionStat}>
              <Text style={[styles.reductionLabel, { color: colors.textSecondary }]}>
                Başlangıç
              </Text>
              <Text style={[styles.reductionValue, { color: colors.text }]}>
                {startCount}
              </Text>
            </View>
            
            <Ionicons name="arrow-forward" size={24} color={colors.textSecondary} />
            
            <View style={styles.reductionStat}>
              <Text style={[styles.reductionLabel, { color: colors.textSecondary }]}>
                Şimdi
              </Text>
              <Text style={[styles.reductionValue, { color: colors.primary }]}>
                {target}
              </Text>
            </View>
            
            <Ionicons name="arrow-forward" size={24} color={colors.textSecondary} />
            
            <View style={styles.reductionStat}>
              <Text style={[styles.reductionLabel, { color: colors.textSecondary }]}>
                Hedef
              </Text>
              <Text style={[styles.reductionValue, { color: colors.success }]}>
                0
              </Text>
            </View>
          </View>

          <View style={styles.reductionPercentBox}>
            <Text style={[styles.reductionPercent, { color: colors.primary }]}>
              %{reductionPercent} azalttın! 🎯
            </Text>
          </View>
        </View>

        {/* Weekly Calendar */}
        <View style={[styles.weeklySection, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Bu Hafta
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/calendar')}
              style={styles.detailButton}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.detailButtonText, { color: colors.primary }]}>
                Detay
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekGrid}>
            {getLastNDays(7).map((date, index) => {
              const dayStats = allDailyStats.find(s => s.date === date);
              const cigaretteCount = dayStats?.cigarettesSmoked || 0;
              const dayTarget = dayStats?.targetCigarettes || getCurrentGradualTarget(profile);
              const isToday = date === today;
              
              let status: 'perfect' | 'good' | 'over' | 'empty' = 'empty';
              if (dayStats) {
                if (cigaretteCount === 0) status = 'perfect';
                else if (cigaretteCount <= dayTarget) status = 'good';
                else status = 'over';
              }
              
              return (
                <TouchableOpacity 
                  key={date}
                  style={[
                    styles.dayCell,
                    styles[`dayCell_${status}`],
                    { borderColor: colors.cardBorder },
                    isToday && styles.dayCell_today,
                  ]}
                  onPress={() => router.push(`/daily-logger?date=${date}`)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayName, 
                    { color: colors.textSecondary },
                    status === 'perfect' && { color: '#10B981' },
                    status === 'good' && { color: '#3B82F6' },
                    status === 'over' && { color: '#EF4444' },
                  ]}>
                    {getDayName(date, index)}
                  </Text>
                  <Text style={[
                    styles.dayCigarettes, 
                    { color: colors.text },
                    status === 'perfect' && { color: '#10B981' },
                    status === 'good' && { color: '#3B82F6' },
                    status === 'over' && { color: '#EF4444' },
                  ]}>
                    {dayStats ? cigaretteCount : '-'}
                  </Text>
                  <Text style={[styles.dayTarget, { color: colors.textSecondary }]}>
                    /{dayTarget}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next week preview */}
          <View style={[styles.nextWeekPreview, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="trending-down" size={20} color={colors.primary} />
            <Text style={[styles.nextWeekText, { color: colors.primary }]}>
              Gelecek hafta hedef: {getNextWeekTarget(profile)} sigara
            </Text>
          </View>
        </View>

        {/* Crisis Button */}
        <TouchableOpacity
          style={[styles.crisisButton, { backgroundColor: colors.error }]}
          activeOpacity={0.8}
          onPress={() => router.push('/crisis')}
        >
          <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
          <Text style={styles.crisisText}>Sigara İçmek İstiyorum</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // IMMEDIATE MODE - Original UI for immediate quit users
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Mascot & Greeting */}
      <View style={styles.header}>
        <Animated.View 
          style={[
            styles.avatarPlaceholder,
            { 
              backgroundColor: 'transparent',
              transform: [{ scale: mascotScale }] 
            }
          ]}
        >
          <Image 
            source={require('../../../assets/smoof.png')}
            style={styles.smoofImage}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Merhaba! Bugün nasılsın?
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
          {getMotivationalMessage()}
        </Text>
      </View>

      {/* Streak Counter - Hero Section */}
      <Animated.View 
        style={[
          { 
            opacity: streakOpacity,
            transform: [{ scale: streakScale }]
          }
        ]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakIconContainer}>
            <Ionicons name="flame" size={32} color="#FFF" />
          </View>
          <Text style={styles.streakLabel}>Sigarasız Streak</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakDays}>GÜN</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Carousel */}
      <Animated.View 
        style={[
          styles.carouselContainer,
          {
            opacity: cardsOpacity,
            transform: [{ translateY: cardsTranslateY }]
          }
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          contentContainerStyle={styles.carousel}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / 300);
            setActiveCard(index);
          }}
        >
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[styles.statCard, { 
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              }]}
            >
              <View style={[styles.statIconCircle, { backgroundColor: stat.iconColor + '20' }]}>
                <Ionicons name={stat.iconName} size={32} color={stat.iconColor} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </ScrollView>
        
        {/* Carousel Indicators */}
        <View style={styles.indicators}>
          {stats.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === activeCard ? colors.primary : colors.cardBorder,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Crisis Button */}
      <TouchableOpacity
        style={[styles.crisisButton, { backgroundColor: colors.error }]}
        activeOpacity={0.8}
        onPress={() => router.push('/crisis')}
        onPressIn={() => {
          Animated.spring(crisisButtonScale, {
            toValue: 0.95,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(crisisButtonScale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }}
      >
        <Animated.View style={[styles.crisisButtonContent, { transform: [{ scale: crisisButtonScale }] }]}>
          <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
          <Text style={styles.crisisText}>Sigara İçmek İstiyorum</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Freeze Info Card */}
      {profile && (
        <View style={[styles.freezeCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.freezeHeader}>
            <Ionicons name="snow" size={24} color={colors.accent} />
            <Text style={[styles.freezeTitle, { color: colors.text }]}>
              Streak Freeze
            </Text>
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Streak Freeze Nedir?',
                  'Bir gün sigara içersen, streak freeze kullanarak streakini koruyabilirsin. Freeze kullanmazsan streak sıfırlanır.',
                  [{ text: 'Tamam' }]
                );
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.freezeCount, { color: colors.accent }]}>
            {profile.streakFreezes - profile.streakFreezesUsed} / {profile.streakFreezes} kaldı
          </Text>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Kazanımların
        </Text>
        <View style={[styles.quickCard, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.quickItem}>
            <View style={[styles.quickIconCircle, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="time-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.quickText, { color: colors.textSecondary }]}>
              Tasarruf edilen zaman: <Text style={[styles.quickValue, { color: colors.text }]}>
                {timeSavedHours} saat
              </Text>
            </Text>
          </View>
          <View style={styles.quickItem}>
            <View style={[styles.quickIconCircle, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="heart" size={20} color={colors.error} />
            </View>
            <Text style={[styles.quickText, { color: colors.textSecondary }]}>
              Kalp sağlığı: <Text style={[styles.quickValue, { color: colors.success }]}>
                {currentStreak > 0 ? 'İyileşiyor' : 'Başlamaya hazır'}
              </Text>
            </Text>
          </View>
        </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  smoofImage: {
    width: 110,
    height: 110,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  subGreeting: {
    fontSize: Typography.sizes.sm,
  },
  streakCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  streakIconContainer: {
    marginBottom: Spacing.sm,
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  streakNumber: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: Typography.weights.extrabold,
    lineHeight: 72,
  },
  streakDays: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  firstDayMessage: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  firstDaySubMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  carouselContainer: {
    marginBottom: Spacing.lg,
  },
  carousel: {
    gap: Spacing.md,
    paddingHorizontal: 4,
  },
  statCard: {
    width: 280,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.base,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  crisisButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  crisisButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  crisisText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  quickStats: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  quickCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    fontSize: Typography.sizes.base,
    flex: 1,
  },
  quickValue: {
    fontWeight: Typography.weights.semibold,
  },
  preparationSection: {
    gap: Spacing.lg,
  },
  messageCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  messageText: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.5,
  },
  tipsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tipsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  tipsList: {
    gap: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  tipText: {
    fontSize: Typography.sizes.base,
    flex: 1,
    lineHeight: Typography.sizes.base * 1.5,
  },
  benefitsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitsList: {
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: Typography.sizes.sm,
  },
  // Gradual mode styles
  goalCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  updateButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  goalContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  goalStat: {
    alignItems: 'center',
    flex: 1,
  },
  goalLabel: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xs,
  },
  goalValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  goalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  goalDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  smokeFreeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  smokeFreeContent: {
    flex: 1,
  },
  smokeFreeLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  smokeFreeValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  freezeCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  freezeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  freezeTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  freezeCount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginLeft: Spacing.lg + Spacing.sm,
  },
  reductionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reductionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  reductionStat: {
    alignItems: 'center',
  },
  reductionLabel: {
    fontSize: Typography.sizes.xs,
    marginBottom: Spacing.xs,
  },
  reductionValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  reductionPercentBox: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reductionPercent: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  // Weekly calendar styles
  weeklySection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.md,
  },
  dayCell: {
    flex: 1,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minHeight: 60,
    borderWidth: 1,
  },
  dayCell_perfect: {
    backgroundColor: '#10B981' + '20',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  dayCell_good: {
    backgroundColor: '#3B82F6' + '20',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  dayCell_over: {
    backgroundColor: '#EF4444' + '20',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  dayCell_empty: {
    backgroundColor: 'transparent',
  },
  dayCell_today: {
    borderWidth: 3,
  },
  dayName: {
    fontSize: Typography.sizes.xs,
    marginBottom: 4,
    fontWeight: Typography.weights.semibold,
  },
  dayCigarettes: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  dayTarget: {
    fontSize: Typography.sizes.xs,
  },
  nextWeekPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  nextWeekText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
