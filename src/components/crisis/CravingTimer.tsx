import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Smoof } from '@/components/smoof/Smoof';

interface CravingTimerProps {
  /** Ring diameter */
  size: number;
  timeLeft: number;
  total: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Smoof inside a ring that fills up as the craving wave passes.
 * When the time is up it only changes look; it never closes the screen.
 */
export function CravingTimer({ size, timeLeft, total }: CravingTimerProps) {
  const { colors } = useColorScheme();
  const done = timeLeft <= 0;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, 1 - timeLeft / total));
  const ringColor = done ? colors.success : colors.accent;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.cardBorder} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Smoof mood={done ? 'proud' : 'craving'} size={size * 0.62} animation={done ? 'bounce' : 'sway'} />
        </View>
      </View>

      <Text style={[styles.time, { color: done ? colors.success : colors.text }]}>
        {done ? 'Dalga geçti 🌊' : formatTime(timeLeft)}
      </Text>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {done ? 'Başardın! Hazır olduğunda “Direndim”e bas' : 'İstek dalga gibidir, yükselir ve geçer'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 34, fontWeight: '800', marginTop: 10, fontVariant: ['tabular-nums'] },
  caption: { fontSize: 14, marginTop: 2, textAlign: 'center' },
});
