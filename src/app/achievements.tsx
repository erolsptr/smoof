import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAchievementStore } from '@/store/achievementStore';
import { useProgress } from '@/hooks/useProgress';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { getAchievementProgress, isAchievementAvailable } from '@/utils/progressMetrics';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import type { Achievement } from '@/types';

export default function AchievementsScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const { achievementContext, isGradual } = useProgress();
  const { unlockedAchievements: unlockedIds, loadAchievements } = useAchievementStore();
  
  const [filter, setFilter] = useState<'all' | Achievement['category']>('all');
  
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Gradual-only badges are hidden for immediate quitters (they can never earn them)
  const available = ACHIEVEMENTS.filter((a) => isAchievementAvailable(a, isGradual));
  const unlockedAchievements = available.filter((a) => unlockedIds.includes(a.id));
  const lockedAchievements = available.filter((a) => !unlockedIds.includes(a.id));
  
  // Filter achievements
  const filteredUnlocked = filter === 'all' 
    ? unlockedAchievements 
    : unlockedAchievements.filter(a => a.category === filter);
    
  const filteredLocked = filter === 'all'
    ? lockedAchievements
    : lockedAchievements.filter(a => a.category === filter);

  const renderAchievement = (achievement: Achievement, unlocked: boolean) => {
    const progress = unlocked || !achievementContext ? 100 : getAchievementProgress(achievement, achievementContext);
    
    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          { 
            backgroundColor: colors.card,
            borderColor: unlocked ? achievement.iconColor + '40' : colors.cardBorder,
            opacity: unlocked ? 1 : 0.6,
          }
        ]}
      >
        <View style={[
          styles.iconContainer,
          { 
            backgroundColor: achievement.iconColor + (unlocked ? '20' : '10'),
          }
        ]}>
          <Ionicons 
            name={achievement.icon as any} 
            size={32} 
            color={unlocked ? achievement.iconColor : colors.textTertiary} 
          />
        </View>
        
        <View style={styles.achievementContent}>
          <Text style={[styles.achievementTitle, { color: colors.text }]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>
            {achievement.description}
          </Text>
          
          {!unlocked && progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: achievement.iconColor,
                      width: `${progress}%`,
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                %{progress}
              </Text>
            </View>
          )}
        </View>
        
        {unlocked && (
          <Ionicons name="checkmark-circle" size={28} color={achievement.iconColor} />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Rozetler
        </Text>
        <TouchableOpacity 
          onPress={async () => {
            // Force check achievements
            if (!achievementContext) return;
            await loadAchievements();
            await useAchievementStore.getState().checkAndUnlockAchievements(achievementContext);
          }}
          style={styles.backButton}
        >
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
          <Text style={styles.statLabel}>Kazanılan</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{lockedAchievements.length}</Text>
          <Text style={styles.statLabel}>Kilitli</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            %{available.length ? Math.floor((unlockedAchievements.length / available.length) * 100) : 0}
          </Text>
          <Text style={styles.statLabel}>Tamamlama</Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && styles.filterTabActive,
            { 
              backgroundColor: filter === 'all' ? colors.primary : colors.card,
              borderColor: colors.cardBorder,
            }
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'all' ? '#FFF' : colors.text }
          ]}>
            Tümü
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'streak' && styles.filterTabActive,
            { 
              backgroundColor: filter === 'streak' ? colors.primary : colors.card,
              borderColor: colors.cardBorder,
            }
          ]}
          onPress={() => setFilter('streak')}
        >
          <Ionicons name="flame" size={14} color={filter === 'streak' ? '#FFF' : colors.text} />
          <Text style={[
            styles.filterTabText,
            { color: filter === 'streak' ? '#FFF' : colors.text }
          ]}>
            Sigarasız
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'savings' && styles.filterTabActive,
            { 
              backgroundColor: filter === 'savings' ? colors.primary : colors.card,
              borderColor: colors.cardBorder,
            }
          ]}
          onPress={() => setFilter('savings')}
        >
          <Ionicons name="cash" size={14} color={filter === 'savings' ? '#FFF' : colors.text} />
          <Text style={[
            styles.filterTabText,
            { color: filter === 'savings' ? '#FFF' : colors.text }
          ]}>
            Tasarruf
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'health' && styles.filterTabActive,
            { 
              backgroundColor: filter === 'health' ? colors.primary : colors.card,
              borderColor: colors.cardBorder,
            }
          ]}
          onPress={() => setFilter('health')}
        >
          <Ionicons name="heart" size={14} color={filter === 'health' ? '#FFF' : colors.text} />
          <Text style={[
            styles.filterTabText,
            { color: filter === 'health' ? '#FFF' : colors.text }
          ]}>
            Sağlık
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'resistance' && styles.filterTabActive,
            { 
              backgroundColor: filter === 'resistance' ? colors.primary : colors.card,
              borderColor: colors.cardBorder,
            }
          ]}
          onPress={() => setFilter('resistance')}
        >
          <Ionicons name="shield" size={14} color={filter === 'resistance' ? '#FFF' : colors.text} />
          <Text style={[
            styles.filterTabText,
            { color: filter === 'resistance' ? '#FFF' : colors.text }
          ]}>
            Direnç
          </Text>
        </TouchableOpacity>

        {isGradual && (
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'gradual' && styles.filterTabActive,
            { 
              backgroundColor: filter === 'gradual' ? colors.primary : colors.card,
              borderColor: colors.cardBorder,
            }
          ]}
          onPress={() => setFilter('gradual')}
        >
          <Ionicons name="trending-down" size={14} color={filter === 'gradual' ? '#FFF' : colors.text} />
          <Text style={[
            styles.filterTabText,
            { color: filter === 'gradual' ? '#FFF' : colors.text }
          ]}>
            Kademeli
          </Text>
        </TouchableOpacity>
        )}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredUnlocked.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Kazanılan Rozetler 🎉
            </Text>
            {filteredUnlocked.map(achievement => renderAchievement(achievement, true))}
          </View>
        )}

        {filteredLocked.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Kilitli Rozetler 🔒
            </Text>
            {filteredLocked.map(achievement => renderAchievement(achievement, false))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterContainer: {
    marginBottom: Spacing.sm,
    maxHeight: 40,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  filterTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: Typography.weights.semibold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: Typography.sizes.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    minWidth: 35,
  },
});
