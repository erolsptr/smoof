import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { HEALTH_MILESTONES, formatDuration } from '@/utils/milestones';

interface HealthTimelineProps {
  /** Smoke-free minutes the timeline is measured against */
  minutesSmokeFree: number;
  /** Rows shown when collapsed: reached-summary + current + this many upcoming */
  upcomingPreview?: number;
}

/**
 * Body recovery timeline.
 * Collapsed: one summary row for reached steps, the current step with progress,
 * and the next few. Expanded: every step.
 */
export function HealthTimeline({ minutesSmokeFree, upcomingPreview = 2 }: HealthTimelineProps) {
  const { colors } = useColorScheme();
  const [expanded, setExpanded] = useState(false);

  const currentIndex = HEALTH_MILESTONES.findIndex((m) => m.minutes > minutesSmokeFree);
  const reachedCount = currentIndex === -1 ? HEALTH_MILESTONES.length : currentIndex;

  const rows = HEALTH_MILESTONES.map((m, index) => {
    const previous = index > 0 ? HEALTH_MILESTONES[index - 1].minutes : 0;
    const state: 'done' | 'current' | 'upcoming' =
      index < reachedCount ? 'done' : index === reachedCount ? 'current' : 'upcoming';
    const progress = state === 'current'
      ? Math.max(0, Math.min(1, (minutesSmokeFree - previous) / (m.minutes - previous)))
      : state === 'done' ? 1 : 0;
    return { ...m, index, state, progress };
  });

  const visible = expanded
    ? rows
    : rows.filter((r) => r.state === 'current' || (r.state === 'upcoming' && r.index <= reachedCount + upcomingPreview));
  const hiddenCount = rows.length - visible.length - (expanded ? 0 : reachedCount);

  return (
    <View>
      {/* Reached summary (collapsed only) */}
      {!expanded && reachedCount > 0 && (
        <View style={[styles.summary, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {reachedCount} kazanım tamamlandı
          </Text>
          <Text style={[styles.summaryHint, { color: colors.textSecondary }]} numberOfLines={1}>
            Son: {HEALTH_MILESTONES[reachedCount - 1].title}
          </Text>
        </View>
      )}

      {visible.map((row, i) => {
        const isLast = i === visible.length - 1;
        const dotColor = row.state === 'upcoming' ? colors.cardBorder : colors.success;
        return (
          <View key={row.label} style={styles.row}>
            {/* Rail */}
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  { borderColor: dotColor, backgroundColor: row.state === 'done' ? dotColor : colors.card },
                ]}
              >
                {row.state === 'done' && <Ionicons name="checkmark" size={12} color="#FFF" />}
                {row.state === 'current' && <View style={[styles.dotInner, { backgroundColor: colors.success }]} />}
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: colors.cardBorder }]} />}
            </View>

            {/* Content */}
            <View style={[styles.body, row.state === 'upcoming' && styles.bodyMuted]}>
              <Text style={[styles.time, { color: row.state === 'upcoming' ? colors.textSecondary : colors.success }]}>
                {row.label}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>{row.title}</Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{row.detail}</Text>
              {row.state === 'current' && (
                <>
                  <View style={[styles.track, { backgroundColor: colors.cardBorder }]}>
                    <View style={[styles.fill, { backgroundColor: colors.success, width: `${Math.max(3, row.progress * 100)}%` }]} />
                  </View>
                  <Text style={[styles.left, { color: colors.textSecondary }]}>
                    {formatDuration(row.minutes - minutesSmokeFree)} kaldı
                  </Text>
                </>
              )}
            </View>
          </View>
        );
      })}

      {(hiddenCount > 0 || expanded) && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.toggle} hitSlop={8}>
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {expanded ? 'Daha az göster' : 'Tüm zaman çizelgesini göster'}
          </Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryHint: {
    flexBasis: '100%',
    fontSize: 12,
    marginLeft: 28,
    marginTop: -4,
  },
  row: {
    flexDirection: 'row',
  },
  rail: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 2,
  },
  body: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 18,
  },
  bodyMuted: {
    opacity: 0.6,
  },
  time: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  left: {
    fontSize: 12,
    marginTop: 4,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
