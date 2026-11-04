import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { getCurrentGradualTarget } from '@/utils/gradualHelpers';
import { Spacing, Typography, BorderRadius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

/**
 * Calendar Screen - Monthly view for gradual reduction tracking
 * Shows each day's cigarette count with color coding
 */
export default function CalendarScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const dailyStats = useStatsStore((state) => state.dailyStats);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  if (!profile || profile.quitMethod !== 'gradual') {
    router.back();
    return null;
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    return { daysInMonth, startDayOfWeek, year, month };
  };

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const getDayStatus = (day: number): { status: 'perfect' | 'good' | 'over' | 'future' | 'empty', count: number, target: number } => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Create today in same format (local date)
    const todayDate = new Date();
    const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    
    // Future dates
    if (dateString > today) {
      return { status: 'future', count: 0, target: getCurrentGradualTarget(profile) };
    }
    
    const dayStats = dailyStats.find(s => s.date === dateString);
    const cigaretteCount = dayStats?.cigarettesSmoked || 0;
    const target = dayStats?.targetCigarettes || getCurrentGradualTarget(profile);
    
    // No data
    if (!dayStats) {
      return { status: 'empty', count: 0, target };
    }
    
    // Perfect day (0 cigarettes)
    if (cigaretteCount === 0) {
      return { status: 'perfect', count: cigaretteCount, target };
    }
    
    // Good day (at or under target)
    if (cigaretteCount <= target) {
      return { status: 'good', count: cigaretteCount, target };
    }
    
    // Over target
    return { status: 'over', count: cigaretteCount, target };
  };

  const handleDayPress = (day: number) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Create today in same format (local date)
    const todayDate = new Date();
    const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    
    // Only allow editing past and today
    if (dateString <= today) {
      router.push(`/daily-logger?date=${dateString}`);
    }
  };

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days in month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Takvim</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.monthText, { color: colors.text }]}>
            {monthNames[month]} {year}
          </Text>
          
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={[styles.legend, { backgroundColor: colors.card }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>0 sigara</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hedefte</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hedef aşıldı</Text>
          </View>
        </View>

        {/* Day Names Header */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((dayName) => (
            <View key={dayName} style={styles.dayNameCell}>
              <Text style={[styles.dayNameText, { color: colors.textSecondary }]}>
                {dayName}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }
            
            const { status, count, target } = getDayStatus(day);
            const isFuture = status === 'future';
            const isEmpty = status === 'empty';
            
            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={[
                  styles.dayCell,
                  styles[`dayCell_${status}`],
                  { borderColor: colors.cardBorder },
                  status === 'perfect' && { 
                    backgroundColor: colors.success + '20',
                    borderColor: colors.success,
                  },
                  status === 'good' && { 
                    backgroundColor: colors.info + '20',
                    borderColor: colors.info,
                  },
                  status === 'over' && { 
                    backgroundColor: colors.error + '20',
                    borderColor: colors.error,
                  },
                ]}
                onPress={() => handleDayPress(day)}
                disabled={isFuture}
                activeOpacity={isFuture ? 1 : 0.7}
              >
                <Text style={[
                  styles.dayNumber,
                  { color: isFuture ? colors.textTertiary : colors.text },
                  status === 'perfect' && { color: colors.success },
                  status === 'good' && { color: colors.info },
                  status === 'over' && { color: colors.error },
                ]}>
                  {day}
                </Text>
                {!isFuture && !isEmpty && (
                  <Text style={[styles.dayCount, { color: colors.textSecondary }]}>
                    {count}/{target}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Geçmiş günlere tıklayarak güncelleyebilirsin
          </Text>
        </View>
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
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
  content: {
    padding: Spacing.lg,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  monthButton: {
    padding: Spacing.sm,
  },
  monthText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: Typography.sizes.xs,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dayNameText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  dayCell: {
    width: `${(100 - (6 * 0.5)) / 7}%`,
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayCell_perfect: {
    backgroundColor: 'transparent', // Will be overridden with theme color + opacity
    borderWidth: 2,
  },
  dayCell_good: {
    backgroundColor: 'transparent', // Will be overridden with theme color + opacity
    borderWidth: 2,
  },
  dayCell_over: {
    backgroundColor: 'transparent', // Will be overridden with theme color + opacity
    borderWidth: 1,
  },
  dayCell_future: {
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  dayCell_empty: {
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  dayCount: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
});
