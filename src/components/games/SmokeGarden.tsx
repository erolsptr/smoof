import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  type GestureResponderEvent,
  type HostInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Smoof, type SmoofMood } from '@/components/smoof/Smoof';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * "Duman Bahçesi": a 60-second round of clearing the sky.
 *
 * - Grey smoke: tap → a flower in the garden (+1)
 * - Big cloud: needs two taps (+2)
 * - Golden cloud: rare, +5 and +3 seconds
 * - Storm cloud ⚡: don't touch! −3 and the combo breaks
 * Every 5 pops in a row raises the multiplier (up to ×5); letting grey
 * smoke escape breaks the combo. Clouds get faster and denser over time,
 * and the hazy sky turns blue as your score grows.
 */

const ROUND_SECONDS = 60;
const GOLD_BONUS_SECONDS = 3;
const GROUND_HEIGHT = 120;
const MAX_FLOWERS = 90;
const FLOWERS = ['🌸', '🌼', '🌷', '🌻', '🌺', '🍀', '💐', '🪻'];

// Sky gets cleaner as the score grows
const SKIES: { score: number; colors: [string, string] }[] = [
  { score: 0, colors: ['#9CA3AF', '#D1D5DB'] },
  { score: 25, colors: ['#94A3B8', '#E2E8F0'] },
  { score: 60, colors: ['#7DD3FC', '#E0F2FE'] },
  { score: 110, colors: ['#38BDF8', '#BAE6FD'] },
];

type PuffKind = 'smoke' | 'big' | 'gold' | 'storm';

interface Puff {
  id: number;
  kind: PuffKind;
  x: number;
  size: number;
  duration: number;
  sway: number;
}

interface Flower {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
}

interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

type Phase = 'ready' | 'playing' | 'over';

let nextId = 1;

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

function pickKind(progress: number): PuffKind {
  const r = Math.random();
  const storm = progress < 0.12 ? 0 : lerp(0.12, 0.24, progress);
  const gold = 0.06;
  const big = 0.12;
  if (r < storm) return 'storm';
  if (r < storm + gold) return 'gold';
  if (r < storm + gold + big) return 'big';
  return 'smoke';
}

const CLOUD_STYLE: Record<PuffKind, { fill: string; shade: string }> = {
  smoke: { fill: 'rgba(148,163,184,0.85)', shade: 'rgba(100,116,139,0.55)' },
  big: { fill: 'rgba(120,134,156,0.9)', shade: 'rgba(71,85,105,0.6)' },
  gold: { fill: 'rgba(252,211,77,0.95)', shade: 'rgba(245,158,11,0.7)' },
  storm: { fill: 'rgba(55,65,81,0.95)', shade: 'rgba(17,24,39,0.8)' },
};

// ─────────────────────────────────────────────
// One floating cloud
// ─────────────────────────────────────────────
function PuffView({
  puff,
  travel,
  onTap,
  onEscape,
  onRemove,
}: {
  puff: Puff;
  travel: number;
  /** Returns true when this tap pops the cloud */
  onTap: (puff: Puff, hits: number, e: GestureResponderEvent) => boolean;
  onEscape: (puff: Puff) => void;
  onRemove: (id: number) => void;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(0));
  const [hitScale] = useState(() => new Animated.Value(1));
  const [hits, setHits] = useState(0);
  const [popped, setPopped] = useState(false);
  const poppedRef = useRef(false);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: puff.duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished || poppedRef.current) return;
      onEscape(puff);
      onRemove(puff.id);
    });
    return () => anim.stop();
    // Runs once per cloud
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = (e: GestureResponderEvent) => {
    if (poppedRef.current) return;
    const popsNow = onTap(puff, hits, e);
    if (!popsNow) {
      // Big cloud, first hit: it shrinks and wobbles
      setHits((h) => h + 1);
      Animated.sequence([
        Animated.timing(hitScale, { toValue: 0.7, duration: 90, useNativeDriver: true }),
        Animated.spring(hitScale, { toValue: 0.8, friction: 3, useNativeDriver: true }),
      ]).start();
      return;
    }
    poppedRef.current = true;
    setPopped(true);
    Animated.timing(pop, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() =>
      onRemove(puff.id),
    );
  };

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -travel] });
  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, puff.sway, 0, -puff.sway, 0],
  });
  const s = puff.size;
  const look = CLOUD_STYLE[puff.kind];
  const badge = puff.kind === 'storm' ? '⚡' : puff.kind === 'gold' ? '✨' : puff.kind === 'big' && hits === 0 ? '×2' : null;

  return (
    <Animated.View
      style={[styles.puff, { left: puff.x, bottom: -s, width: s, height: s, transform: [{ translateX }, { translateY }] }]}
    >
      <Pressable onPress={handlePress} style={StyleSheet.absoluteFill} hitSlop={8} accessibilityLabel="Bulut">
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [
                { scale: Animated.multiply(hitScale, pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] })) },
              ],
            },
          ]}
        >
          {/* Shadow layer, then the cloud body */}
          <View style={[styles.blob, { backgroundColor: look.shade, width: s * 0.9, height: s * 0.42, borderRadius: s, left: s * 0.05, top: s * 0.5 }]} />
          <View style={[styles.blob, { backgroundColor: look.fill, width: s * 0.5, height: s * 0.5, borderRadius: s, left: s * 0.02, top: s * 0.32 }]} />
          <View style={[styles.blob, { backgroundColor: look.fill, width: s * 0.62, height: s * 0.62, borderRadius: s, left: s * 0.2, top: s * 0.08 }]} />
          <View style={[styles.blob, { backgroundColor: look.fill, width: s * 0.48, height: s * 0.48, borderRadius: s, left: s * 0.5, top: s * 0.3 }]} />
          {/* Highlight */}
          <View style={[styles.blob, { backgroundColor: 'rgba(255,255,255,0.35)', width: s * 0.22, height: s * 0.12, borderRadius: s, left: s * 0.32, top: s * 0.18 }]} />
          {badge && (
            <Text style={[styles.badge, { fontSize: s * 0.26, top: s * 0.36 }, puff.kind === 'big' && styles.badgeText]}>
              {badge}
            </Text>
          )}
        </Animated.View>
        {popped && puff.kind !== 'storm' && (
          <Animated.Text
            style={[
              styles.burst,
              {
                fontSize: s * 0.5,
                top: s * 0.2,
                opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
                transform: [{ scale: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.3, 1.3, 1] }) }],
              },
            ]}
          >
            {puff.kind === 'gold' ? '🌟' : '🌸'}
          </Animated.Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function FlowerView({ flower }: { flower: Flower }) {
  const [grow] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(grow, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }).start();
  }, [grow]);
  return (
    <Animated.Text
      style={[styles.flower, { left: flower.x - flower.size / 2, bottom: flower.y, fontSize: flower.size, transform: [{ scale: grow }] }]}
    >
      {flower.emoji}
    </Animated.Text>
  );
}

function PopupView({ popup, onDone }: { popup: Popup; onDone: (id: number) => void }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() =>
      onDone(popup.id),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.popup,
        {
          left: popup.x - 40,
          top: popup.y - 20,
          color: popup.color,
          opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
            { scale: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.2, 1] }) },
          ],
        },
      ]}
    >
      {popup.text}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────
// Game
// ─────────────────────────────────────────────
interface SmokeGardenProps {
  /** Called when the player leaves; `score` = best score of this session */
  onClose: (score: number) => void;
}

export function SmokeGarden({ onClose }: SmokeGardenProps) {
  const { colors } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('ready');
  const [area, setArea] = useState({ width: 0, height: 0 });
  const areaOffset = useRef({ x: 0, y: 0 });
  const areaRef = useRef<HostInstance>(null);

  const [puffs, setPuffs] = useState<Puff[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(1);
  const [popped, setPopped] = useState(0);
  const [stormHits, setStormHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [best, setBest] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  const [sessionBest, setSessionBest] = useState(0);
  const [shocked, setShocked] = useState(false);

  const [comboPulse] = useState(() => new Animated.Value(1));
  const [flash] = useState(() => new Animated.Value(0));

  // Refs the timers read without re-subscribing
  const elapsedRef = useRef(0);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(ROUND_SECONDS);
  const bestRef = useRef(0);

  const multiplier = Math.min(5, 1 + Math.floor(streak / 5));

  useEffect(() => {
    storage.getItem<number>(STORAGE_KEYS.GAME_BEST_GARDEN).then((v) => {
      bestRef.current = v ?? 0;
      setBest(v ?? 0);
    });
  }, []);

  const startRound = () => {
    setPuffs([]);
    setFlowers([]);
    setPopups([]);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    streakRef.current = 0;
    setMaxCombo(1);
    setPopped(0);
    setStormHits(0);
    setTimeLeft(ROUND_SECONDS);
    timeLeftRef.current = ROUND_SECONDS;
    elapsedRef.current = 0;
    setIsRecord(false);
    setPhase('playing');
  };

  const endRound = useCallback(() => {
    setPhase('over');
    setPuffs([]);
    const final = scoreRef.current;
    setSessionBest((b) => Math.max(b, final));
    if (final > bestRef.current) {
      bestRef.current = final;
      setBest(final);
      setIsRecord(true);
      storage.setItem(STORAGE_KEYS.GAME_BEST_GARDEN, final);
    }
  }, []);

  // Round clock
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      elapsedRef.current += 1;
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current === 0) endRound();
    }, 1000);
    return () => clearInterval(id);
  }, [phase, endRound]);

  // Cloud spawner: faster and denser as the round goes on
  useEffect(() => {
    if (phase !== 'playing' || !area.width) return;
    let timer: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const t = elapsedRef.current / ROUND_SECONDS;
      const kind = pickKind(t);
      const size = kind === 'big' ? 96 + Math.random() * 16 : kind === 'gold' ? 62 : 62 + Math.random() * 22;
      const speedUp = kind === 'gold' ? 0.75 : 1;
      setPuffs((current) =>
        current.length >= 12
          ? current
          : [
              ...current,
              {
                id: nextId++,
                kind,
                x: 8 + Math.random() * Math.max(0, area.width - size - 16),
                size,
                duration: lerp(5800, 2900, t) * speedUp * (0.85 + Math.random() * 0.3),
                sway: 8 + Math.random() * 22,
              },
            ],
      );
      timer = setTimeout(spawn, lerp(1050, 420, t) * (0.7 + Math.random() * 0.6));
    };
    spawn();
    return () => clearTimeout(timer);
  }, [phase, area.width]);

  const addPopup = (x: number, y: number, text: string, color: string) =>
    setPopups((p) => [...p, { id: nextId++, x, y, text, color }]);

  const plant = (x: number, emoji: string) =>
    setFlowers((current) =>
      [
        ...current,
        {
          id: nextId++,
          x: Math.min(area.width - 16, Math.max(16, x + (Math.random() - 0.5) * 30)),
          y: 6 + Math.random() * (GROUND_HEIGHT - 52),
          emoji,
          size: 24 + Math.random() * 14,
        },
      ].slice(-MAX_FLOWERS),
    );

  const addScore = (delta: number) => {
    scoreRef.current = Math.max(0, scoreRef.current + delta);
    setScore(scoreRef.current);
  };

  const setStreakValue = (value: number) => {
    streakRef.current = value;
    setStreak(value);
    const mult = Math.min(5, 1 + Math.floor(value / 5));
    setMaxCombo((m) => Math.max(m, mult));
    if (value > 0 && value % 5 === 0 && mult <= 5) {
      comboPulse.setValue(1.5);
      Animated.spring(comboPulse, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }
  };

  const handleTap = (puff: Puff, hits: number, e: GestureResponderEvent): boolean => {
    if (phase !== 'playing') return false;
    const x = e.nativeEvent.pageX - areaOffset.current.x;
    const y = e.nativeEvent.pageY - areaOffset.current.y;

    if (puff.kind === 'storm') {
      addScore(-3);
      setStreakValue(0);
      setStormHits((n) => n + 1);
      addPopup(x, y, '−3 ⚡', '#EF4444');
      setShocked(true);
      setTimeout(() => setShocked(false), 900);
      flash.setValue(1);
      Animated.timing(flash, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      return true;
    }
    if (puff.kind === 'big' && hits === 0) {
      addPopup(x, y, 'Bir daha!', '#64748B');
      return false;
    }

    const newStreak = streakRef.current + 1;
    const mult = Math.min(5, 1 + Math.floor(newStreak / 5));
    const base = puff.kind === 'gold' ? 5 : puff.kind === 'big' ? 2 : 1;
    const gained = base * mult;
    addScore(gained);
    setStreakValue(newStreak);
    setPopped((n) => n + 1);

    if (puff.kind === 'gold') {
      timeLeftRef.current += GOLD_BONUS_SECONDS;
      setTimeLeft(timeLeftRef.current);
      addPopup(x, y, `+${gained} · +${GOLD_BONUS_SECONDS}sn`, '#D97706');
      plant(x, '🌻');
    } else {
      addPopup(x, y, mult > 1 ? `+${gained} ×${mult}` : `+${gained}`, mult > 1 ? '#7C3AED' : '#059669');
      plant(x, FLOWERS[Math.floor(Math.random() * FLOWERS.length)]);
      if (puff.kind === 'big') plant(x + 18, FLOWERS[Math.floor(Math.random() * FLOWERS.length)]);
    }
    return true;
  };

  const handleEscape = (puff: Puff) => {
    // Letting grey smoke through breaks the combo; storms and gold may pass
    if ((puff.kind === 'smoke' || puff.kind === 'big') && streakRef.current > 0) {
      setStreakValue(0);
    }
  };

  const removePuff = useCallback((id: number) => setPuffs((current) => current.filter((p) => p.id !== id)), []);
  const removePopup = useCallback((id: number) => setPopups((current) => current.filter((p) => p.id !== id)), []);

  const onLayout = () => {
    areaRef.current?.measureInWindow((x, y, width, height) => {
      areaOffset.current = { x, y };
      setArea({ width, height });
    });
  };

  const sky = [...SKIES].reverse().find((s) => score >= s.score) ?? SKIES[0];
  const timeRatio = Math.min(1, timeLeft / ROUND_SECONDS);
  const mood: SmoofMood = shocked ? 'shocked' : multiplier >= 3 ? 'proud' : phase === 'over' ? (isRecord ? 'proud' : 'happy') : 'calm';
  const stars = score >= 120 ? 3 : score >= 60 ? 2 : score >= 20 ? 1 : 0;
  const sortedFlowers = [...flowers].sort((a, b) => b.y - a.y);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Duman Bahçesi 🌸</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gökyüzünü temizle, bahçeni büyüt</Text>
        </View>
        <TouchableOpacity onPress={() => onClose(Math.max(sessionBest, score))} hitSlop={12} accessibilityLabel="Oyunu kapat">
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* HUD */}
      <View style={styles.hud}>
        <View style={[styles.hudBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.hudLabel, { color: colors.textSecondary }]}>Puan</Text>
          <Text style={[styles.hudValue, { color: colors.text }]}>{score}</Text>
        </View>
        <Animated.View
          style={[
            styles.hudBox,
            {
              backgroundColor: multiplier > 1 ? '#7C3AED' : colors.card,
              borderColor: multiplier > 1 ? '#7C3AED' : colors.cardBorder,
              transform: [{ scale: comboPulse }],
            },
          ]}
        >
          <Text style={[styles.hudLabel, { color: multiplier > 1 ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}>Kombo</Text>
          <Text style={[styles.hudValue, { color: multiplier > 1 ? '#FFF' : colors.text }]}>×{multiplier}</Text>
        </Animated.View>
        <View style={[styles.hudBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.hudLabel, { color: colors.textSecondary }]}>Rekor</Text>
          <Text style={[styles.hudValue, { color: colors.secondary }]}>{best}</Text>
        </View>
      </View>

      {/* Time bar */}
      <View style={[styles.timeTrack, { backgroundColor: colors.cardBorder }]}>
        <View
          style={[
            styles.timeFill,
            { width: `${timeRatio * 100}%`, backgroundColor: timeLeft <= 10 ? colors.error : colors.primary },
          ]}
        />
        <Text style={[styles.timeText, { color: colors.text }]}>{timeLeft} sn</Text>
      </View>

      {/* Play area */}
      <View ref={areaRef} style={styles.playArea} onLayout={onLayout}>
        <LinearGradient colors={sky.colors} style={StyleSheet.absoluteFill} />
        {/* Sun appears once the sky is clean */}
        {score >= 60 && <Text style={styles.sun}>☀️</Text>}

        <View style={[styles.sky, { bottom: GROUND_HEIGHT }]} pointerEvents="box-none">
          {phase === 'playing' &&
            area.height > 0 &&
            puffs.map((p) => (
              <PuffView
                key={p.id}
                puff={p}
                travel={area.height - GROUND_HEIGHT + p.size}
                onTap={handleTap}
                onEscape={handleEscape}
                onRemove={removePuff}
              />
            ))}
        </View>

        {/* Garden */}
        <View style={[styles.ground, { height: GROUND_HEIGHT }]}>
          <LinearGradient colors={['#86EFAC', '#4ADE80', '#22C55E']} style={StyleSheet.absoluteFill} />
          <View style={styles.grassRow} pointerEvents="none">
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={i} style={[styles.grass, { height: 8 + ((i * 7) % 9), transform: [{ rotate: `${(i % 3) * 8 - 8}deg` }] }]} />
            ))}
          </View>
          {sortedFlowers.map((f) => (
            <FlowerView key={f.id} flower={f} />
          ))}
          <View style={styles.smoof} pointerEvents="none">
            <Smoof mood={mood} size={74} animation={phase === 'playing' ? 'bob' : 'none'} />
          </View>
        </View>

        {/* Storm hit flash */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }) }]} />

        {popups.map((p) => (
          <PopupView key={p.id} popup={p} onDone={removePopup} />
        ))}

        {/* Start card */}
        {phase === 'ready' && (
          <View style={styles.overlay}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>60 saniyede gökyüzünü temizle!</Text>
              {[
                ['☁️', 'Gri duman', 'Dokun, çiçeğe dönüşsün · +1'],
                ['⛅', 'Büyük bulut', 'İki kez dokun · +2'],
                ['✨', 'Altın bulut', '+5 puan ve +3 saniye'],
                ['⚡', 'Kara bulut', 'Dokunma! −3 ve kombo biter'],
                ['🔥', 'Kombo', 'Arka arkaya 5 bulut → ×2, ×3… ×5'],
              ].map(([icon, name, desc]) => (
                <View key={name} style={styles.ruleRow}>
                  <Text style={styles.ruleIcon}>{icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>{desc}</Text>
                  </View>
                </View>
              ))}
              <Text style={[styles.ruleNote, { color: colors.textTertiary }]}>Gri dumanı kaçırırsan kombon sıfırlanır</Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={startRound}>
                <Text style={styles.primaryButtonText}>Başla</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Result card */}
        {phase === 'over' && (
          <View style={styles.overlay}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {isRecord && (
                <View style={[styles.recordBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.recordText}>🏆 Yeni rekor!</Text>
                </View>
              )}
              <Text style={styles.stars}>
                {[0, 1, 2].map((i) => (i < stars ? '⭐' : '☆')).join(' ')}
              </Text>
              <Text style={[styles.resultScore, { color: colors.text }]}>{score}</Text>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>puan</Text>
              <View style={styles.resultStats}>
                {[
                  ['🌸', `${popped}`, 'bulut'],
                  ['🔥', `×${maxCombo}`, 'en iyi kombo'],
                  ['⚡', `${stormHits}`, 'kara bulut'],
                ].map(([icon, value, label]) => (
                  <View key={label} style={styles.resultStat}>
                    <Text style={styles.resultStatIcon}>{icon}</Text>
                    <Text style={[styles.resultStatValue, { color: colors.text }]}>{value}</Text>
                    <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>{label}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.ruleNote, { color: colors.textSecondary }]}>
                {stars === 3 ? 'Gökyüzü pırıl pırıl! ☀️' : stars === 2 ? 'Hava açıldı, harika! 🌤️' : stars === 1 ? 'Güzel başlangıç, bir tur daha?' : 'Isınma turuydu, tekrar dene!'}
              </Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={startRound}>
                <Text style={styles.primaryButtonText}>Tekrar oyna</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onClose(Math.max(sessionBest, score))} style={styles.secondaryButton}>
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Bitir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <View style={{ height: Math.max(insets.bottom, 12) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },

  hud: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12 },
  hudBox: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 6, alignItems: 'center' },
  hudLabel: { fontSize: 11, fontWeight: '700' },
  hudValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },

  timeTrack: { height: 18, borderRadius: 9, marginHorizontal: 20, marginTop: 10, overflow: 'hidden', justifyContent: 'center' },
  timeFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 9 },
  timeText: { alignSelf: 'center', fontSize: 11, fontWeight: '800' },

  playArea: { flex: 1, marginTop: 10, marginHorizontal: 12, borderRadius: 24, overflow: 'hidden' },
  sun: { position: 'absolute', top: 10, right: 14, fontSize: 40 },
  sky: { position: 'absolute', left: 0, right: 0, top: 0 },
  puff: { position: 'absolute' },
  blob: { position: 'absolute' },
  badge: { position: 'absolute', width: '100%', textAlign: 'center' },
  badgeText: { color: '#FFF', fontWeight: '900' },
  burst: { position: 'absolute', width: '100%', textAlign: 'center' },

  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'visible' },
  grassRow: { position: 'absolute', top: -6, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around' },
  grass: { width: 4, borderRadius: 2, backgroundColor: '#16A34A' },
  flower: { position: 'absolute' },
  smoof: { position: 'absolute', right: 6, bottom: 4 },

  flash: { backgroundColor: '#111827' },
  popup: { position: 'absolute', width: 80, textAlign: 'center', fontSize: 18, fontWeight: '900' },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 20, alignItems: 'stretch' },
  cardTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  ruleIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  ruleName: { fontSize: 14, fontWeight: '700' },
  ruleDesc: { fontSize: 12, marginTop: 1 },
  ruleNote: { fontSize: 13, textAlign: 'center', marginTop: 10 },
  primaryButton: { marginTop: 14, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, fontWeight: '700' },

  recordBadge: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 8 },
  recordText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  stars: { fontSize: 30, textAlign: 'center', color: '#F59E0B' },
  resultScore: { fontSize: 52, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  resultLabel: { fontSize: 14, textAlign: 'center', marginTop: -4 },
  resultStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  resultStat: { alignItems: 'center' },
  resultStatIcon: { fontSize: 22 },
  resultStatValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  resultStatLabel: { fontSize: 11 },
});
