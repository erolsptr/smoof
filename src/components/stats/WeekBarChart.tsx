import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { GradualDay } from '@/utils/progressMetrics';
import { getDayName } from '@/utils/gradualHelpers';

const CHART_HEIGHT = 120;
// Validated pair (dataviz validator): passes CVD + lightness band on both light and dark surfaces
const BAR_COLOR = '#3B82F6';
const OVER_COLOR = '#EF4444';

interface WeekBarChartProps {
  days: GradualDay[];
}

/**
 * Last-7-days bars: cigarettes smoked per day, with that day's target as a thin tick.
 * Single series → no legend box; the target tick and the over-target state get a key.
 * Over-target bars use the reserved error color plus an icon (never color alone).
 * Display only: days are logged from the calendar.
 */
export function WeekBarChart({ days }: WeekBarChartProps) {
  const { colors } = useColorScheme();

  const max = Math.max(1, ...days.map((d) => Math.max(d.smoked ?? 0, d.target)));
  const toHeight = (value: number) => (value / max) * CHART_HEIGHT;

  return (
    <View>
      <View style={[styles.plot, { borderBottomColor: colors.cardBorder }]}>
        {days.map((day) => {
          const logged = day.smoked !== null;
          const over = logged && day.metGoal === false;
          const barHeight = logged ? Math.max(4, toHeight(day.smoked as number)) : 0;
          const barColor = over ? OVER_COLOR : BAR_COLOR;

          return (
            <View
              key={day.date}
              style={styles.column}
              accessible
              accessibilityLabel={`${getDayName(day.date)}: ${logged ? `${day.smoked} sigara` : 'girilmedi'}, hedef ${day.target}`}
            >
              {/* Value label */}
              <View style={styles.valueRow}>
                {over && <Ionicons name="alert-circle" size={11} color={OVER_COLOR} />}
                <Text style={[styles.value, { color: logged ? colors.text : colors.textTertiary }]}>
                  {logged ? day.smoked : '–'}
                </Text>
              </View>

              <View style={styles.barArea}>
                {logged ? (
                  <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]} />
                ) : (
                  <View style={[styles.emptyBar, { borderColor: colors.cardBorder }]} />
                )}
                {/* Target tick */}
                <View
                  style={[
                    styles.targetTick,
                    { bottom: toHeight(day.target) - 1, backgroundColor: colors.text },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Day labels */}
      <View style={styles.labels}>
        {days.map((day) => (
          <Text key={day.date} style={[styles.dayLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            {getDayName(day.date)}
          </Text>
        ))}
      </View>

      {/* Key */}
      <View style={styles.key}>
        <View style={styles.keyItem}>
          <View style={[styles.keySwatch, { backgroundColor: BAR_COLOR }]} />
          <Text style={[styles.keyText, { color: colors.textSecondary }]}>İçilen</Text>
        </View>
        <View style={styles.keyItem}>
          <View style={[styles.keyTick, { backgroundColor: colors.text }]} />
          <Text style={[styles.keyText, { color: colors.textSecondary }]}>Hedef</Text>
        </View>
        <View style={styles.keyItem}>
          <Ionicons name="alert-circle" size={12} color={OVER_COLOR} />
          <Text style={[styles.keyText, { color: colors.textSecondary }]}>Hedef aşıldı</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    gap: 2, // surface gap between adjacent bars
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 16,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
  barArea: {
    width: '100%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '62%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  emptyBar: {
    width: '62%',
    height: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  targetTick: {
    position: 'absolute',
    width: '86%',
    height: 2,
    borderRadius: 1,
    opacity: 0.55,
  },
  labels: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 6,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
  },
  key: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 4,
    marginTop: 12,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  keySwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  keyTick: {
    width: 12,
    height: 2,
    borderRadius: 1,
    opacity: 0.55,
  },
  keyText: {
    fontSize: 11,
  },
});
