import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DailyStats, UserProfile } from '@/types';
import { getDateString, getTodayString, parseDateKey } from '@/utils/dateHelpers';
import { newDate } from '@/utils/clock';
import { getGradualTargetForDate, getTrackingStartDate } from '@/utils/gradualHelpers';

type DayStatus = 'perfect' | 'good' | 'over' | 'empty' | 'locked' | 'future';

const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
// Week starts on Monday (Turkish convention)
const WEEKDAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface MonthCalendarProps {
  profile: UserProfile;
  dailyStats: DailyStats[];
  onDayPress: (dateKey: string) => void;
}

/**
 * Monthly calendar for gradual reduction tracking.
 * - Days before the tracking start date and future days are disabled
 * - Logged days are tinted by result (0 / within target / over target)
 * - Loggable but unlogged days get a small hollow dot (subtle reminder)
 */
export function MonthCalendar({ profile, dailyStats, onDayPress }: MonthCalendarProps) {
  const { colors } = useColorScheme();
  const today = getTodayString();
  const startDate = getTrackingStartDate(profile);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = newDate();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  // Navigation bounds: from the start month up to the current month
  const start = parseDateKey(startDate);
  const now = newDate();
  const monthIndex = year * 12 + month;
  const canGoBack = monthIndex > start.getFullYear() * 12 + start.getMonth();
  const canGoForward = monthIndex < now.getFullYear() * 12 + now.getMonth();

  const statsByDate = useMemo(() => {
    const map = new Map<string, DailyStats>();
    dailyStats.forEach((s) => map.set(s.date, s));
    return map;
  }, [dailyStats]);

  const getStatus = (dateKey: string): { status: DayStatus; count: number } => {
    if (dateKey < startDate) return { status: 'locked', count: 0 };
    if (dateKey > today) return { status: 'future', count: 0 };

    const stats = statsByDate.get(dateKey);
    if (!stats) return { status: 'empty', count: 0 };

    const count = stats.cigarettesSmoked;
    const target = stats.targetCigarettes ?? getGradualTargetForDate(profile, dateKey);
    if (count === 0) return { status: 'perfect', count };
    if (count <= target) return { status: 'good', count };
    return { status: 'over', count };
  };

  // Build grid cells (null = padding before the 1st)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(getDateString(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const statusColor: Record<DayStatus, string> = {
    perfect: colors.success,
    good: colors.info,
    over: colors.error,
    empty: colors.text,
    locked: colors.textTertiary,
    future: colors.textTertiary,
  };

  const changeMonth = (delta: number) => {
    setVisibleMonth(new Date(year, month + delta, 1));
  };

  return (
    <View>
      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity
          onPress={() => changeMonth(-1)}
          disabled={!canGoBack}
          style={styles.monthButton}
          hitSlop={8}
          accessibilityLabel="Önceki ay"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canGoBack ? colors.text : colors.cardBorder}
          />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={() => changeMonth(1)}
          disabled={!canGoForward}
          style={styles.monthButton}
          hitSlop={8}
          accessibilityLabel="Sonraki ay"
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canGoForward ? colors.text : colors.cardBorder}
          />
        </TouchableOpacity>
      </View>

      {/* Weekday header */}
      <View style={styles.row}>
        {WEEKDAY_NAMES.map((name) => (
          <View key={name} style={styles.cellWrapper}>
            <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((dateKey, index) => {
          if (!dateKey) {
            return <View key={`blank-${index}`} style={styles.cellWrapper} />;
          }

          const { status, count } = getStatus(dateKey);
          const isToday = dateKey === today;
          const isDisabled = status === 'locked' || status === 'future';
          const isLogged = status === 'perfect' || status === 'good' || status === 'over';
          const tint = statusColor[status];
          const dayNumber = Number(dateKey.slice(8));

          return (
            <View key={dateKey} style={styles.cellWrapper}>
              <TouchableOpacity
                style={[
                  styles.cell,
                  isLogged && { backgroundColor: tint + '22' },
                  isToday && { borderColor: colors.primary, borderWidth: 2 },
                  isDisabled && styles.cellDisabled,
                ]}
                disabled={isDisabled}
                onPress={() => onDayPress(dateKey)}
                activeOpacity={0.6}
                accessibilityLabel={`${dayNumber} ${MONTH_NAMES[month]}${isLogged ? `, ${count} sigara` : ''}`}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    { color: isLogged ? tint : isDisabled ? colors.textTertiary : colors.text },
                    isToday && { fontWeight: '800' },
                  ]}
                >
                  {dayNumber}
                </Text>
                <View style={styles.cellFooter}>
                  {isLogged ? (
                    <Text style={[styles.countText, { color: tint }]}>{count}</Text>
                  ) : status === 'empty' ? (
                    <View
                      style={[
                        styles.emptyDot,
                        { borderColor: isToday ? colors.primary : colors.textTertiary },
                      ]}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={colors.success} label="0 sigara" textColor={colors.textSecondary} />
        <LegendItem color={colors.info} label="Hedefte" textColor={colors.textSecondary} />
        <LegendItem color={colors.error} label="Aşıldı" textColor={colors.textSecondary} />
        <View style={styles.legendItem}>
          <View style={[styles.emptyDot, { borderColor: colors.textTertiary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Girilmedi</Text>
        </View>
      </View>
    </View>
  );
}

function LegendItem({ color, label, textColor }: { color: string; label: string; textColor: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

/**
 * Number of loggable days (start date .. yesterday) with no entry.
 * Today is excluded because the day isn't over yet.
 */
export function countUnloggedDays(profile: UserProfile, dailyStats: DailyStats[]): number {
  const startDate = getTrackingStartDate(profile);
  const today = getTodayString();
  const logged = new Set(dailyStats.map((s) => s.date));

  let missing = 0;
  const cursor = parseDateKey(startDate);
  // Safety cap (~5 years) so a bad start date can't loop forever
  for (let i = 0; i < 2000; i++) {
    const key = getDateString(cursor);
    if (key >= today) break;
    if (!logged.has(key)) missing++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return missing;
}

const CELL_WIDTH = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrapper: {
    width: CELL_WIDTH,
    padding: 2,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cell: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDisabled: {
    opacity: 0.4,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '600',
  },
  cellFooter: {
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 14,
    rowGap: 6,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
});
