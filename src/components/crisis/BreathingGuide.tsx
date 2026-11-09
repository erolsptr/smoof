import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Smoof, type SmoofMood } from '@/components/smoof/Smoof';

/**
 * Guided breathing: in 4s, hold 2s, out 6s (a longer exhale calms the body).
 * Soft rings grow and shrink with the breath, Smoof breathes along,
 * and a big countdown shows how long the current step lasts.
 */
const PHASES: { label: string; hint: string; seconds: number; to: number; mood: SmoofMood }[] = [
  { label: 'Nefes al', hint: 'Burnundan yavaşça', seconds: 4, to: 1, mood: 'inhale' },
  { label: 'Tut', hint: 'Hafifçe bekle', seconds: 2, to: 1, mood: 'calm' },
  { label: 'Nefes ver', hint: 'Ağzından uzun uzun', seconds: 6, to: 0, mood: 'exhale' },
];
const CYCLE = PHASES.reduce((sum, p) => sum + p.seconds, 0);

function phaseAt(tick: number) {
  let t = tick % CYCLE;
  for (let i = 0; i < PHASES.length; i++) {
    if (t < PHASES[i].seconds) return { index: i, remaining: PHASES[i].seconds - t };
    t -= PHASES[i].seconds;
  }
  return { index: 0, remaining: PHASES[0].seconds };
}

export function BreathingGuide({ size }: { size: number }) {
  const { colors } = useColorScheme();
  const [tick, setTick] = useState(0);
  const [breath] = useState(() => new Animated.Value(0));

  const { index, remaining } = phaseAt(tick);
  const phase = PHASES[index];
  const round = Math.floor(tick / CYCLE) + 1;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Each phase eases the rings to its size over the whole phase
  useEffect(() => {
    const p = PHASES[index];
    const anim = Animated.timing(breath, {
      toValue: p.to,
      duration: p.seconds * 1000,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [index, breath]);

  const ring = (minScale: number, maxScale: number, opacity: number) => (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent,
          opacity,
          transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [minScale, maxScale] }) }],
        },
      ]}
    />
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.stage, { width: size, height: size }]}>
        {ring(0.55, 1, 0.12)}
        {ring(0.45, 0.82, 0.18)}
        {ring(0.36, 0.64, 0.28)}
        <Animated.View
          style={{ transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }}
        >
          <Smoof mood={phase.mood} size={size * 0.46} />
        </Animated.View>
      </View>

      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.accent }]}>{phase.label}</Text>
        <View style={[styles.count, { backgroundColor: colors.accent }]}>
          <Text style={styles.countText}>{remaining}</Text>
        </View>
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {phase.hint} · {round}. tur
      </Text>

      {/* Step indicator */}
      <View style={styles.steps}>
        {PHASES.map((p, i) => (
          <View
            key={p.label}
            style={[
              styles.step,
              {
                flex: p.seconds,
                backgroundColor: i === index ? colors.accent : colors.cardBorder,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  stage: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  label: { fontSize: 30, fontWeight: '800' },
  count: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { color: '#FFF', fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  hint: { fontSize: 14, marginTop: 4 },
  steps: { flexDirection: 'row', gap: 4, width: 180, marginTop: 12 },
  step: { height: 6, borderRadius: 3 },
});
