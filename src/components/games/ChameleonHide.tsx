import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Smoof, type SmoofMood } from '@/components/smoof/Smoof';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * "Bukalemun Saklambaç": Smoof hides under one of the leaves, camouflaged.
 * Its leaf is a slightly different shade. Find it before time runs out!
 *
 * - Right leaf: the leaf flies off and Smoof pops out (+points, time bonus)
 * - Wrong leaf: a little critter is under it and you lose a heart
 * - Time out: you lose a heart and Smoof shows where it was
 * Difficulty grows with every level: bigger grid, closer colours, less time,
 * and later on the leaves' own shades start to vary a little.
 */

const LIVES = 3;
const HUES = [120, 150, 165, 95, 80, 45, 28, 190, 330];
const CRITTERS = ['🐞', '🐌', '🍄', '🐛', '🐜', '🌰'];
const NEXT_LEVEL_MS = 1300;
/** Clean finds in a row (no wrong leaf, no time out) that give a heart back */
const COMBO_FOR_LIFE = 3;
/** Points instead of a heart when the hearts are already full */
const COMBO_FULL_BONUS = 15;

interface Level {
  no: number;
  size: number;
  hue: number;
  sat: number;
  light: number;
  delta: number; // signed lightness difference of Smoof's leaf
  noise: number[]; // per-leaf lightness jitter (late levels)
  tilts: number[];
  smoofIndex: number;
  seconds: number;
}

function makeLevel(no: number): Level {
  const size = no <= 2 ? 3 : no <= 5 ? 4 : no <= 9 ? 5 : no <= 14 ? 6 : 7;
  const count = size * size;
  const delta = Math.max(4, 20 - (no - 1) * 1.1);
  // From level 8 the other leaves vary a little, so "find the lightest" isn't enough.
  // It ramps up slowly and only reaches its maximum (20% of the real difference)
  // at level 30. Even then two normal leaves differ at most 40% as much as Smoof's.
  const ramp = no >= 8 ? Math.min(1, (no - 7) / 23) : 0;
  const jitter = delta * 0.2 * ramp;
  return {
    no,
    size,
    hue: HUES[Math.floor(Math.random() * HUES.length)],
    sat: 40 + Math.floor(Math.random() * 20),
    light: 40 + Math.floor(Math.random() * 12),
    delta: delta * (Math.random() < 0.5 ? 1 : -1),
    noise: Array.from({ length: count }, () => (Math.random() - 0.5) * 2 * jitter),
    tilts: Array.from({ length: count }, () => Math.round((Math.random() - 0.5) * (no >= 10 ? 40 : 24))),
    smoofIndex: Math.floor(Math.random() * count),
    seconds: Math.max(8, 18 - (no - 1) * 0.5),
  };
}

const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${Math.max(8, Math.min(88, l))}%)`;

type TileState = 'idle' | 'smoof' | 'wrong' | 'shown';

// ─────────────────────────────────────────────
// One leaf (with what's under it)
// ─────────────────────────────────────────────
function LeafTile({
  size,
  color,
  tilt,
  state,
  critter,
  dimmed,
  onPress,
}: {
  size: number;
  color: string;
  tilt: number;
  state: TileState;
  critter: string;
  dimmed: boolean;
  onPress: () => void;
}) {
  const [lift] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (state === 'idle') return;
    Animated.parallel([
      Animated.timing(lift, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 110, delay: 120, useNativeDriver: true }),
    ]).start();
  }, [state, lift, pop]);

  const flyAway = state === 'smoof' || state === 'shown';
  const leafTransform = flyAway
    ? [
        { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.9] }) },
        { translateX: lift.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.35] }) },
        { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: [`${tilt}deg`, `${tilt + 50}deg`] }) },
      ]
    : [
        { rotate: `${tilt}deg` },
        // Wrong leaf flips over to show the critter
        { scaleX: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={state !== 'idle'}
      activeOpacity={0.75}
      style={{ width: size, height: size }}
      accessibilityLabel="Yaprak"
    >
      {/* Under the leaf */}
      {state !== 'idle' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.under,
            { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }], opacity: pop },
          ]}
        >
          {state === 'wrong' ? (
            <Text style={{ fontSize: size * 0.5 }}>{critter}</Text>
          ) : (
            <>
              <Smoof mood={state === 'smoof' ? 'excited' : 'wink'} size={size * 1.15} />
              {state === 'smoof' && <Text style={[styles.sparkle, { fontSize: size * 0.3 }]}>✨</Text>}
            </>
          )}
        </Animated.View>
      )}

      {/* The leaf */}
      <Animated.View
        style={[
          styles.leaf,
          {
            backgroundColor: color,
            borderTopLeftRadius: size * 0.6,
            borderBottomRightRadius: size * 0.6,
            borderTopRightRadius: size * 0.12,
            borderBottomLeftRadius: size * 0.12,
            opacity: flyAway
              ? lift.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.6, 0] })
              : dimmed
                ? 0.35
                : 1,
            transform: leafTransform,
          },
        ]}
      >
        <View style={[styles.vein, { width: size * 0.9, transform: [{ rotate: '-45deg' }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// Game
// ─────────────────────────────────────────────
type Phase = 'ready' | 'playing' | 'over';

interface ChameleonHideProps {
  /** Called when the player leaves; `found` = most levels cleared in one game this session */
  onClose: (found: number) => void;
}

export function ChameleonHide({ onClose }: ChameleonHideProps) {
  const { colors } = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [phase, setPhase] = useState<Phase>('ready');
  const [level, setLevel] = useState(() => makeLevel(1));
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [critters, setCritters] = useState<string[]>([]);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [found, setFound] = useState(0);
  const [best, setBest] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  const [sessionFound, setSessionFound] = useState(0);
  const [message, setMessage] = useState('');
  const [popup, setPopup] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const [shake] = useState(() => new Animated.Value(0));
  const [timeBar] = useState(() => new Animated.Value(1));
  const [heartPulse] = useState(() => new Animated.Value(1));
  const [popupAnim] = useState(() => new Animated.Value(0));

  const livesRef = useRef(LIVES);
  const comboRef = useRef(0);
  const [combo, setCombo] = useState(0);
  const scoreRef = useRef(0);
  const foundRef = useRef(0);
  const bestRef = useRef(0);
  const resolvedRef = useRef(false);
  // Set below; the time bar's end callback calls the latest version
  const onTimeoutRef = useRef<() => void>(() => {});
  const levelRef = useRef(level);
  // New key per board, so leaves (and their animations) always start fresh
  const [boardId, setBoardId] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    storage.getItem<number>(STORAGE_KEYS.GAME_BEST_HIDE_SCORE).then((v) => {
      bestRef.current = v ?? 0;
      setBest(v ?? 0);
    });
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      timeBar.stopAnimation();
    };
  }, [timeBar]);

  const showPopup = (text: string) => {
    setPopup(text);
    popupAnim.setValue(0);
    Animated.timing(popupAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  const startLevel = useCallback(
    (no: number) => {
      const next = makeLevel(no);
      levelRef.current = next;
      setLevel(next);
      setBoardId((b) => b + 1);
      setTiles(Array(next.size * next.size).fill('idle'));
      setCritters(Array.from({ length: next.size * next.size }, () => CRITTERS[Math.floor(Math.random() * CRITTERS.length)]));
      setMessage(no === 1 ? 'Rengi biraz farklı olan yaprak benim!' : 'Hangi yaprağın altındayım?');
      resolvedRef.current = false;
      setResolved(false);
      timeBar.setValue(1);
      Animated.timing(timeBar, { toValue: 0, duration: next.seconds * 1000, easing: Easing.linear, useNativeDriver: false }).start(
        ({ finished }) => {
          if (finished && !resolvedRef.current) onTimeoutRef.current();
        },
      );
    },
    [timeBar],
  );

  const startGame = () => {
    livesRef.current = LIVES;
    comboRef.current = 0;
    setCombo(0);
    scoreRef.current = 0;
    foundRef.current = 0;
    setLives(LIVES);
    setScore(0);
    setFound(0);
    setIsRecord(false);
    setPhase('playing');
    startLevel(1);
  };

  const endGame = () => {
    timeBar.stopAnimation();
    setSessionFound((s) => Math.max(s, foundRef.current));
    if (scoreRef.current > bestRef.current) {
      bestRef.current = scoreRef.current;
      setBest(scoreRef.current);
      setIsRecord(true);
      storage.setItem(STORAGE_KEYS.GAME_BEST_HIDE_SCORE, scoreRef.current);
    }
    setPhase('over');
  };

  const loseLife = () => {
    // Any miss breaks the combo
    comboRef.current = 0;
    setCombo(0);
    livesRef.current -= 1;
    setLives(livesRef.current);
    heartPulse.setValue(1.4);
    Animated.spring(heartPulse, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    return livesRef.current;
  };

  // Shows where Smoof was, then either the next board or game over
  const revealAndContinue = (sameLevelNo: number) => {
    setTiles((t) => t.map((s, i) => (i === levelRef.current.smoofIndex ? 'shown' : s)));
    later(() => {
      if (livesRef.current <= 0) endGame();
      else startLevel(sameLevelNo);
    }, NEXT_LEVEL_MS + 300);
  };

  const handleTimeout = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setResolved(true);
    loseLife();
    setMessage('Süre bitti! Buradaydım 🙈');
    revealAndContinue(levelRef.current.no);
  };
  useEffect(() => {
    onTimeoutRef.current = handleTimeout;
  });

  const handleTap = (index: number) => {
    if (phase !== 'playing' || resolvedRef.current || tiles[index] !== 'idle') return;

    if (index === level.smoofIndex) {
      resolvedRef.current = true;
      setResolved(true);
      // Remaining share of the time bar → time bonus
      let remaining = 0;
      timeBar.stopAnimation((value) => {
        remaining = value;
      });
      const secondsLeft = Math.max(0, remaining * level.seconds);
      let gained = 10 * level.no + Math.ceil(secondsLeft) * 2;
      let reward = '';
      let rewardMessage = '';

      // Combo: every 3 clean finds in a row give a heart back (or bonus points if full)
      comboRef.current += 1;
      setCombo(comboRef.current);
      if (comboRef.current % COMBO_FOR_LIFE === 0) {
        if (livesRef.current < LIVES) {
          livesRef.current += 1;
          setLives(livesRef.current);
          heartPulse.setValue(1.5);
          Animated.spring(heartPulse, { toValue: 1, friction: 3, useNativeDriver: true }).start();
          reward = ' · +1 ❤️';
          rewardMessage = 'Kombo! Bir can geri kazandın ❤️';
        } else {
          gained += COMBO_FULL_BONUS;
          reward = ' 🔥';
          rewardMessage = `Kombo! Canların dolu, +${COMBO_FULL_BONUS} bonus 🔥`;
        }
      }

      scoreRef.current += gained;
      foundRef.current += 1;
      setScore(scoreRef.current);
      setFound(foundRef.current);
      setTiles((t) => t.map((s, i) => (i === index ? 'smoof' : s)));
      setMessage(rewardMessage || ['Buldun! 🎉', 'Yakaladın! 🦎', 'Gözünden kaçmıyor! 👀', 'Harika! ✨'][level.no % 4]);
      showPopup(`+${gained}${reward}`);
      later(() => startLevel(level.no + 1), NEXT_LEVEL_MS);
      return;
    }

    // Wrong leaf: a critter, a shake and one heart less
    setTiles((t) => t.map((s, i) => (i === index ? 'wrong' : s)));
    Animated.sequence(
      [10, -10, 6, -6, 0].map((x) =>
        Animated.timing(shake, { toValue: x, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      ),
    ).start();
    const left = loseLife();
    if (left <= 0) {
      resolvedRef.current = true;
      setResolved(true);
      timeBar.stopAnimation();
      setMessage('Canın bitti! Buradaydım 🦎');
      revealAndContinue(level.no);
    } else {
      setMessage(left === 1 ? 'Son canın! Dikkatli bak 👀' : 'Orada değilim, biraz daha bak 🙈');
    }
  };

  // Board layout: whole-pixel tiles so rows never overflow
  const gap = level.size >= 6 ? 6 : 8;
  const panelPadding = 12;
  const maxBoard = Math.min(width, 520) - 32 - panelPadding * 2;
  const tile = Math.floor((maxBoard - gap * (level.size - 1)) / level.size);
  const boardWidth = tile * level.size + gap * (level.size - 1);
  // Smoof's leaf gets the exact difference, no jitter
  const leafColor = (i: number) =>
    hsl(level.hue, level.sat, level.light + (i === level.smoofIndex ? level.delta : level.noise[i]));

  const smoofMood: SmoofMood = phase === 'over' ? (isRecord ? 'proud' : 'encourage') : lives === 1 ? 'shocked' : 'calm';
  const stars = found >= 15 ? 3 : found >= 8 ? 2 : found >= 3 ? 1 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Bukalemun Saklambaç 🦎</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Smoof yaprakların altına saklandı</Text>
        </View>
        <TouchableOpacity onPress={() => onClose(Math.max(sessionFound, found))} hitSlop={12} accessibilityLabel="Oyunu kapat">
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* HUD */}
      <View style={styles.hud}>
        <View style={[styles.hudBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.hudLabel, { color: colors.textSecondary }]}>Seviye</Text>
          <Text style={[styles.hudValue, { color: colors.text }]}>{level.no}</Text>
        </View>
        <View style={[styles.hudBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.hudLabel, { color: colors.textSecondary }]}>Puan</Text>
          <Text style={[styles.hudValue, { color: colors.primary }]}>{score}</Text>
        </View>
        <Animated.View style={[styles.hudBox, { backgroundColor: colors.card, borderColor: colors.cardBorder, transform: [{ scale: heartPulse }] }]}>
          <Text style={[styles.hudLabel, { color: colors.textSecondary }]}>Can</Text>
          <Text style={styles.hearts}>
            {Array.from({ length: LIVES }).map((_, i) => (i < lives ? '❤️' : '🤍')).join('')}
          </Text>
        </Animated.View>
      </View>

      {/* Time bar */}
      <View style={[styles.timeTrack, { backgroundColor: colors.cardBorder }]}>
        <Animated.View
          style={[
            styles.timeFill,
            {
              width: timeBar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: timeBar.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [colors.error, colors.secondary, colors.primary],
              }),
            },
          ]}
        />
      </View>

      {/* Combo progress towards a heart */}
      <View style={styles.comboRow}>
        <Text style={[styles.comboLabel, { color: colors.textSecondary }]}>Kombo</Text>
        {Array.from({ length: COMBO_FOR_LIFE }).map((_, i) => {
          // Right after a reward the row is shown full until the next board
          const filled = combo > 0 && (combo % COMBO_FOR_LIFE === 0 ? COMBO_FOR_LIFE : combo % COMBO_FOR_LIFE);
          return (
            <View
              key={i}
              style={[styles.comboDot, { backgroundColor: i < (filled || 0) ? colors.streakFire : colors.cardBorder }]}
            />
          );
        })}
        <Text style={styles.comboHeart}>❤️</Text>
      </View>

      <Text style={[styles.message, { color: resolved && tiles.includes('smoof') ? colors.primary : colors.text }]}>
        {phase === 'playing' ? message : ' '}
      </Text>

      {/* Board on a leafy panel */}
      <View style={styles.panelWrap}>
        <LinearGradient colors={['#14532D', '#166534', '#15803D']} style={[styles.panel, { padding: panelPadding }]}>
          <Animated.View style={[styles.board, { width: boardWidth, gap, transform: [{ translateX: shake }] }]}>
            {Array.from({ length: level.size * level.size }).map((_, i) => (
              <LeafTile
                key={`${boardId}-${i}`}
                size={tile}
                color={leafColor(i)}
                tilt={level.tilts[i]}
                state={tiles[i] ?? 'idle'}
                critter={critters[i] ?? '🐞'}
                dimmed={resolved && tiles[i] === 'idle'}
                onPress={() => handleTap(i)}
              />
            ))}
          </Animated.View>

          {popup && (
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.popup,
                {
                  opacity: popupAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
                  transform: [
                    { translateY: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) },
                    { scale: popupAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.3, 1] }) },
                  ],
                },
              ]}
            >
              {popup}
            </Animated.Text>
          )}
        </LinearGradient>
      </View>

      <View style={{ flex: 1 }} />
      <Text style={[styles.tip, { color: colors.textTertiary, paddingBottom: Math.max(insets.bottom, 16) }]}>
        Gözlerini yaprakların üzerinde gezdir, nefesini yavaşlat 🍃
      </Text>

      {/* Start card */}
      {phase === 'ready' && (
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardSmoof}>
              <Smoof mood="wink" size={80} animation="bob" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Beni bulabilir misin?</Text>
            {[
              ['🍃', 'Farklı yaprak', 'Rengi biraz farklı olan yaprağın altındayım'],
              ['⏱️', 'Süre', 'Süre bitmeden bul, kalan süre bonus puan'],
              ['❤️', '3 can', 'Yanlış yaprak ya da biten süre bir can götürür'],
              ['🔥', 'Kombo', 'Art arda 3 kez hatasız bul, 1 can geri gelsin'],
              ['📈', 'Seviye', 'Her seviyede yaprak çoğalır, renkler yakınlaşır'],
            ].map(([icon, name, desc]) => (
              <View key={name} style={styles.ruleRow}>
                <Text style={styles.ruleIcon}>{icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ruleName, { color: colors.text }]}>{name}</Text>
                  <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>{desc}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={startGame}>
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
            <View style={styles.cardSmoof}>
              <Smoof mood={smoofMood} size={80} />
            </View>
            <Text style={styles.stars}>{[0, 1, 2].map((i) => (i < stars ? '⭐' : '☆')).join(' ')}</Text>
            <Text style={[styles.resultScore, { color: colors.text }]}>{score}</Text>
            <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>puan</Text>
            <View style={styles.resultStats}>
              {[
                ['🦎', `${found}`, 'kez buldun'],
                ['📈', `${level.no}`, 'seviye'],
                ['🏆', `${best}`, 'rekor'],
              ].map(([icon, value, label]) => (
                <View key={label} style={styles.resultStat}>
                  <Text style={styles.resultStatIcon}>{icon}</Text>
                  <Text style={[styles.resultStatValue, { color: colors.text }]}>{value}</Text>
                  <Text style={[styles.resultStatLabel, { color: colors.textSecondary }]}>{label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={startGame}>
              <Text style={styles.primaryButtonText}>Tekrar oyna</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onClose(Math.max(sessionFound, found))} style={styles.secondaryButton}>
              <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Bitir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  hearts: { fontSize: 17, marginTop: 3, letterSpacing: 1 },

  timeTrack: { height: 10, borderRadius: 5, marginHorizontal: 20, marginTop: 10, overflow: 'hidden' },
  timeFill: { height: '100%', borderRadius: 5 },

  comboRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  comboLabel: { fontSize: 12, fontWeight: '700', marginRight: 2 },
  comboDot: { width: 18, height: 6, borderRadius: 3 },
  comboHeart: { fontSize: 12, marginLeft: 2 },
  message: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 12, textAlign: 'center', paddingHorizontal: 20 },

  panelWrap: { alignItems: 'center', paddingHorizontal: 16 },
  panel: { borderRadius: 24, alignItems: 'center' },
  board: { flexDirection: 'row', flexWrap: 'wrap' },
  leaf: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  vein: { height: 2, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 1 },
  under: { alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute', top: -4, right: -4 },
  popup: { position: 'absolute', top: '40%', alignSelf: 'center', fontSize: 34, fontWeight: '900', color: '#FDE047' },

  tip: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 20 },
  cardSmoof: { alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 19, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  ruleIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  ruleName: { fontSize: 14, fontWeight: '700' },
  ruleDesc: { fontSize: 12, marginTop: 1 },
  primaryButton: { marginTop: 14, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, fontWeight: '700' },

  recordBadge: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 8 },
  recordText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  stars: { fontSize: 28, textAlign: 'center', color: '#F59E0B' },
  resultScore: { fontSize: 50, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  resultLabel: { fontSize: 14, textAlign: 'center', marginTop: -4 },
  resultStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
  resultStat: { alignItems: 'center' },
  resultStatIcon: { fontSize: 22 },
  resultStatValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  resultStatLabel: { fontSize: 11 },
});
