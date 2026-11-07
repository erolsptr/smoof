import { useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useUserStore } from '@/store/userStore';
import type { SmoofAvatar } from '@/types';
import { DEFAULT_AVATAR, SKINS, mix } from './palette';

/**
 * Smoof — a front-facing, friendly chameleon who looks right at you.
 * Chameleon traits: casque on top of the head, turret eyes bulging on both
 * sides, a wide smile, two-toed mitten hands/feet and a spiral tail.
 * Signature: a little leaf sprout on the casque (a fresh, smoke-free start).
 *
 * Style: flat colours + one shadow shape + one highlight (no soft gradients).
 * One drawing, many moods; customisation is layered on top.
 */

export type SmoofMood =
  | 'happy'      // default, waving
  | 'proud'      // "Direndim" → you're so strong
  | 'supportive' // target exceeded → a bit sad with you, still believes in you
  | 'wink'       // freeze used → "shh, keep going"
  | 'excited'    // onboarding / first day
  | 'craving'    // craving screen → cranky, tired, jittery
  | 'shocked'    // "İçtim" → "what happened?!"
  | 'encourage'  // starting again
  | 'inhale'
  | 'exhale'
  | 'calm';      // portrait / neutral

export type SmoofAnimation = 'none' | 'bob' | 'bounce' | 'sway' | 'shake';

interface SmoofProps {
  mood?: SmoofMood;
  size?: number;
  animation?: SmoofAnimation;
  /** 'portrait' crops to head & shoulders (ID-photo style) */
  framing?: 'full' | 'portrait';
  /** Use this look instead of the user's saved one */
  avatar?: SmoofAvatar;
  /** Ignore the user's customisation (loading screen) */
  classic?: boolean;
  style?: StyleProp<ViewStyle>;
}

type EyeType = 'open' | 'soft' | 'sparkle' | 'wide' | 'happy' | 'closed' | 'tired';
type Brows = 'none' | 'sad' | 'determined' | 'raised';
type Mouth = 'smile' | 'open' | 'grin' | 'soft' | 'smirk' | 'wobble' | 'o' | 'puffed' | 'blow';
type Arms = 'rest' | 'wave' | 'flex' | 'heart' | 'shh' | 'up' | 'droop' | 'cheeks' | 'fist';
type Extra = 'sparkles' | 'stars' | 'sweat' | 'snow' | 'heart' | 'puffs' | 'exclaim' | 'airIn' | 'blush';

interface Face {
  eyes: [EyeType, EyeType];
  brows: Brows;
  mouth: Mouth;
  arms: Arms;
  extras: Extra[];
}

const FACES: Record<SmoofMood, Face> = {
  happy: { eyes: ['open', 'open'], brows: 'none', mouth: 'smile', arms: 'wave', extras: ['blush'] },
  proud: { eyes: ['happy', 'happy'], brows: 'none', mouth: 'grin', arms: 'flex', extras: ['blush', 'sparkles'] },
  supportive: { eyes: ['soft', 'soft'], brows: 'sad', mouth: 'soft', arms: 'heart', extras: ['heart'] },
  wink: { eyes: ['open', 'happy'], brows: 'raised', mouth: 'smirk', arms: 'shh', extras: ['snow', 'blush'] },
  excited: { eyes: ['sparkle', 'sparkle'], brows: 'raised', mouth: 'open', arms: 'up', extras: ['stars', 'blush'] },
  craving: { eyes: ['tired', 'tired'], brows: 'sad', mouth: 'wobble', arms: 'droop', extras: ['sweat'] },
  shocked: { eyes: ['wide', 'wide'], brows: 'raised', mouth: 'o', arms: 'cheeks', extras: ['exclaim', 'sweat'] },
  encourage: { eyes: ['open', 'open'], brows: 'determined', mouth: 'grin', arms: 'fist', extras: ['sparkles'] },
  inhale: { eyes: ['closed', 'closed'], brows: 'none', mouth: 'puffed', arms: 'rest', extras: ['airIn'] },
  exhale: { eyes: ['closed', 'closed'], brows: 'none', mouth: 'blow', arms: 'rest', extras: ['puffs'] },
  calm: { eyes: ['open', 'open'], brows: 'none', mouth: 'smile', arms: 'rest', extras: ['blush'] },
};

const INK = '#1F3A33';
const MOUTH_DARK = '#3A1F2B';
const TONGUE = '#FF7A93';
const BLUSH = '#FF9BB5';
const LEAF = '#6FD36B';
const LEAF_DARK = '#3C9A5F';
const GOLD = '#FFC93C';

// Eye centres (whites) and turret centres
const EYE_L = { x: 122, y: 150 };
const EYE_R = { x: 278, y: 150 };
const TURRET_L = { x: 116, y: 150 };
const TURRET_R = { x: 284, y: 150 };

const HEAD = 'M200 40 C 228 40, 246 66, 254 90 C 294 98, 318 128, 318 166 C 318 212, 270 240, 200 240 C 130 240, 82 212, 82 166 C 82 128, 106 98, 146 90 C 154 66, 172 40, 200 40 Z';
const BODY = 'M200 222 C 254 222, 282 262, 280 308 C 278 348, 246 366, 200 366 C 154 366, 122 348, 120 308 C 118 262, 146 222, 200 222 Z';
const TAIL = 'M250 346 C 300 360, 344 340, 346 304 C 348 274, 316 262, 302 280 C 290 296, 306 312, 320 302';

const VIEWBOX = {
  full: { x: 14, y: 2, w: 372, h: 384 },
  portrait: { x: 60, y: 0, w: 280, h: 280 },
};

interface Palette {
  base: string;
  shade: string;
  line: string;
  hi: string;
  belly: string;
  band: string;
}

export function Smoof({
  mood = 'happy',
  size = 160,
  animation = 'bob',
  framing = 'full',
  avatar,
  classic = false,
  style,
}: SmoofProps) {
  const savedAvatar = useUserStore((s) => s.profile?.avatar);
  const look: SmoofAvatar = classic ? DEFAULT_AVATAR : (avatar ?? savedAvatar ?? DEFAULT_AVATAR);
  const uid = useId().replace(/:/g, '');

  const blink = useBlink(animation !== 'none');
  const transform = useMotion(animation);

  const face = FACES[mood];
  const skin = SKINS[look.skin] ?? SKINS.mint;
  // Craving: Smoof looks washed out
  const dull = (c: string) => (mood === 'craving' ? mix(c, '#9AA3AF', 0.4) : c);
  const p: Palette = {
    base: dull(skin.base),
    shade: dull(skin.shade),
    line: dull(skin.line),
    hi: dull(skin.hi),
    belly: skin.belly,
    band: mix(skin.belly, skin.shade, 0.3),
  };

  const vb = VIEWBOX[framing];
  const height = (size * vb.h) / vb.w;

  const eyeTypes = face.eyes.map((t) =>
    blink && (t === 'open' || t === 'soft' || t === 'sparkle' || t === 'wide') ? 'closed' : t,
  ) as [EyeType, EyeType];
  const armsBehind = face.arms === 'rest' || face.arms === 'droop';

  const id = (name: string) => `${name}${uid}`;

  return (
    <Animated.View style={[{ width: size, height, transform }, style]}>
      <Svg width={size} height={height} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}>
        <Defs>
          <ClipPath id={id('body')}><Path d={BODY} /></ClipPath>
          <ClipPath id={id('head')}><Path d={HEAD} /></ClipPath>
          <ClipPath id={id('eyeL')}><Circle cx={TURRET_L.x} cy={TURRET_L.y} r={46} /></ClipPath>
          <ClipPath id={id('eyeR')}><Circle cx={TURRET_R.x} cy={TURRET_R.y} r={46} /></ClipPath>
        </Defs>

        {/* Ground shadow */}
        {framing === 'full' && <Ellipse cx={205} cy={374} rx={120} ry={10} fill="#000" opacity={0.07} />}

        {/* Tail (curled to the side) */}
        <Path d={TAIL} fill="none" stroke={p.line} strokeWidth={30} strokeLinecap="round" />
        <Path d={TAIL} fill="none" stroke={p.base} strokeWidth={22} strokeLinecap="round" />
        <Path d="M334 286 C 340 298, 338 314, 328 324" fill="none" stroke={p.hi} strokeWidth={5} strokeLinecap="round" />

        {/* Body (sitting) */}
        <Path d={BODY} fill={p.base} />
        <G clipPath={`url(#${id('body')})`}>
          <Ellipse cx={200} cy={396} rx={120} ry={70} fill={p.shade} />
        </G>
        <Path
          d="M200 250 C 232 250, 248 282, 246 314 C 244 342, 224 358, 200 358 C 176 358, 156 342, 154 314 C 152 282, 168 250, 200 250 Z"
          fill={p.belly}
        />
        {['M164 290 Q200 300 236 290', 'M158 316 Q200 328 242 316', 'M164 340 Q200 350 236 340'].map((d) => (
          <Path key={d} d={d} fill="none" stroke={p.band} strokeWidth={3} strokeLinecap="round" />
        ))}

        {/* Two-toed mitten feet */}
        <G fill={p.shade}>
          <Ellipse cx={156} cy={364} rx={14} ry={10} />
          <Ellipse cx={176} cy={366} rx={12} ry={9} />
          <Ellipse cx={224} cy={366} rx={12} ry={9} />
          <Ellipse cx={244} cy={364} rx={14} ry={10} />
        </G>

        {armsBehind && <ArmsLayer pose={face.arms} p={p} />}

        {/* Head with casque */}
        <Path d={HEAD} fill={p.base} />
        <G clipPath={`url(#${id('head')})`}>
          <Ellipse cx={200} cy={292} rx={150} ry={70} fill={p.shade} />
          <Path
            d="M200 50 C 220 52, 236 72, 242 96 C 226 80, 214 70, 200 66 C 186 70, 174 80, 158 96 C 164 72, 180 52, 200 50 Z"
            fill={p.hi}
          />
        </G>
        <Path d="M200 48 L 200 104" stroke={p.line} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <Circle cx={178} cy={100} r={5} fill={p.line} opacity={0.3} />
        <Circle cx={222} cy={100} r={5} fill={p.line} opacity={0.3} />
        <Circle cx={200} cy={120} r={4} fill={p.line} opacity={0.3} />

        {/* Hair sits on the casque, under the leaf */}
        <HairLayer hair={look.hair} color={look.hairColor} />

        {/* Eye turrets with skin folds */}
        <Turret t={TURRET_L} clip={id('eyeL')} p={p} shadowDx={6} />
        <Turret t={TURRET_R} clip={id('eyeR')} p={p} shadowDx={-6} />

        {/* Eyes (pupils look slightly inward → at the viewer) */}
        <Eye c={EYE_L} type={eyeTypes[0]} iris={look.eyeColor} lid={p.base} look={[4, 2]} />
        <Eye c={EYE_R} type={eyeTypes[1]} iris={look.eyeColor} lid={p.base} look={[-4, 2]} />

        <BrowsLayer brows={face.brows} line={p.line} />

        {/* Nostrils */}
        <Ellipse cx={190} cy={172} rx={2.6} ry={3.4} fill={INK} opacity={0.55} />
        <Ellipse cx={210} cy={172} rx={2.6} ry={3.4} fill={INK} opacity={0.55} />

        {face.extras.includes('blush') && (
          <G>
            <Ellipse cx={126} cy={206} rx={15} ry={8} fill={BLUSH} />
            <Ellipse cx={274} cy={206} rx={15} ry={8} fill={BLUSH} />
          </G>
        )}

        <MouthLayer mouth={face.mouth} p={p} />
        <MustacheLayer mustache={look.mustache} color={look.hairColor} />
        <GlassesLayer glasses={look.glasses} />

        {/* Leaf sprout on the casque — Smoof's signature */}
        <Path d="M200 42 C 200 30, 204 22, 211 16" fill="none" stroke={LEAF_DARK} strokeWidth={4} strokeLinecap="round" />
        <Path d="M211 16 C 223 4, 245 8, 245 18 C 235 26, 221 24, 211 16 Z" fill={LEAF} />
        <Path d="M215 17 Q 229 14 241 18" fill="none" stroke={LEAF_DARK} strokeWidth={1.6} opacity={0.6} />
        <Path d="M202 28 C 190 18, 178 22, 180 30 C 188 36, 196 34, 202 28 Z" fill={LEAF} />

        {!armsBehind && <ArmsLayer pose={face.arms} p={p} />}

        {face.extras.map((e) => <ExtraLayer key={e} extra={e} />)}
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Parts
// ─────────────────────────────────────────────

function Turret({ t, clip, p, shadowDx }: { t: { x: number; y: number }; clip: string; p: Palette; shadowDx: number }) {
  return (
    <G>
      <Circle cx={t.x} cy={t.y} r={46} fill={p.base} />
      <G clipPath={`url(#${clip})`}>
        <Circle cx={t.x + shadowDx} cy={t.y + 24} r={46} fill={p.shade} />
      </G>
      <Circle cx={t.x} cy={t.y} r={46} fill="none" stroke={p.line} strokeWidth={3} />
      <Circle cx={t.x - shadowDx / 3} cy={t.y} r={38} fill="none" stroke={p.line} strokeWidth={2.5} opacity={0.45} />
    </G>
  );
}

function Eye({ c, type, iris, lid, look }: {
  c: { x: number; y: number }; type: EyeType; iris: string; lid: string; look: [number, number];
}) {
  const { x, y } = c;
  if (type === 'happy' || type === 'closed') {
    const d = type === 'happy'
      ? `M${x - 16} ${y + 6} Q${x} ${y - 12} ${x + 16} ${y + 6}`
      : `M${x - 16} ${y} Q${x} ${y + 12} ${x + 16} ${y}`;
    return (
      <G>
        <Circle cx={x} cy={y} r={29} fill={lid} />
        <Path d={d} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </G>
    );
  }

  let [lx, ly] = look;
  if (type === 'wide') [lx, ly] = [0, 0];
  if (type === 'soft' || type === 'tired') ly = 6;
  const white = type === 'wide' ? 32 : 29;
  const irisR = type === 'wide' ? 12 : type === 'sparkle' ? 21 : 20;
  const pupilR = type === 'wide' ? 5 : 10.5;
  const rim = mix(iris, '#000000', 0.18);
  const ix = x + lx;
  const iy = y + ly;

  return (
    <G>
      <Circle cx={x} cy={y} r={white} fill="#FFFFFF" />
      <Circle cx={ix} cy={iy} r={irisR} fill={iris} />
      <Circle cx={ix} cy={iy} r={irisR} fill="none" stroke={rim} strokeWidth={2.5} />
      <Circle cx={ix + 1} cy={iy} r={pupilR} fill="#1B2430" />
      <Circle cx={ix + 7} cy={iy - 8} r={type === 'sparkle' ? 7 : 6.5} fill="#FFFFFF" />
      <Circle cx={ix - 6} cy={iy + 8} r={3} fill="#FFFFFF" />
      {type === 'sparkle' && <Star x={ix - 7} y={iy - 4} s={5} fill="#FFFFFF" />}
      {type === 'tired' && (
        <G>
          <Path d={`M${x - 30} ${y + 2} A 30 30 0 0 1 ${x + 30} ${y + 2} Z`} fill={lid} />
          <Path d={`M${x - 29} ${y + 2} L${x + 29} ${y + 2}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d={`M${x - 14} ${y + 34} Q${x} ${y + 39} ${x + 14} ${y + 34}`} fill="none" stroke={INK} strokeWidth={2} opacity={0.35} strokeLinecap="round" />
        </G>
      )}
    </G>
  );
}

function BrowsLayer({ brows, line }: { brows: Brows; line: string }) {
  const paths = {
    none: ['M94 136 C 104 116, 140 114, 150 134', 'M250 134 C 260 114, 296 116, 306 136'],
    sad: ['M96 112 Q120 106 146 96', 'M254 96 Q280 106 304 112'],
    determined: ['M96 100 Q120 104 148 116', 'M252 116 Q280 104 304 100'],
    raised: ['M94 108 Q120 88 148 104', 'M252 104 Q280 88 306 108'],
  }[brows];
  // 'none' = the upper eyelid fold in skin colour; others are dark brows
  const color = brows === 'none' ? line : INK;
  const width = brows === 'none' ? 4 : 5;
  return (
    <G>
      {paths.map((d) => <Path key={d} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />)}
    </G>
  );
}

function MouthLayer({ mouth, p }: { mouth: Mouth; p: Palette }) {
  const st = { fill: 'none', stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round' as const };
  switch (mouth) {
    case 'smile':
      return (
        <G>
          <Path d="M142 192 C 168 218, 232 218, 258 192" {...st} />
          <Path d="M142 192 Q 136 190 136 184" {...st} />
          <Path d="M258 192 Q 264 190 264 184" {...st} />
        </G>
      );
    case 'open':
      return (
        <G>
          <Path d="M150 190 C 170 232, 230 232, 250 190 C 220 200, 180 200, 150 190 Z" fill={MOUTH_DARK} />
          <Path d="M178 214 C 190 224, 210 224, 222 214 C 210 208, 190 208, 178 214 Z" fill={TONGUE} />
        </G>
      );
    case 'grin':
      return (
        <G>
          <Path d="M140 188 C 164 240, 236 240, 260 188 C 226 200, 174 200, 140 188 Z" fill={MOUTH_DARK} />
          <Path d="M150 192 C 180 202, 220 202, 250 192 L 248 198 C 220 208, 180 208, 152 198 Z" fill="#FFFFFF" />
          <Path d="M176 220 C 190 232, 210 232, 224 220 C 210 212, 190 212, 176 220 Z" fill={TONGUE} />
        </G>
      );
    case 'soft':
      return <Path d="M166 202 Q200 214 234 202" {...st} />;
    case 'smirk':
      return <Path d="M160 200 C 186 214, 226 212, 252 188" {...st} />;
    case 'wobble':
      return <Path d="M150 204 Q160 196 170 204 Q180 212 190 204 Q200 196 210 204 Q220 212 230 204 Q240 196 250 204" {...st} strokeWidth={4} />;
    case 'o':
      return <Ellipse cx={200} cy={208} rx={13} ry={17} fill={MOUTH_DARK} />;
    case 'puffed':
      return (
        <G>
          <Circle cx={128} cy={202} r={20} fill={p.hi} />
          <Circle cx={272} cy={202} r={20} fill={p.hi} />
          <Path d="M186 204 Q200 208 214 204" {...st} />
        </G>
      );
    case 'blow':
      return <Ellipse cx={214} cy={204} rx={8} ry={7} fill={MOUTH_DARK} />;
  }
}

function ArmsLayer({ pose, p }: { pose: Arms; p: Palette }) {
  const arm = (d: string) => (
    <G key={d}>
      <Path d={d} fill="none" stroke={p.line} strokeWidth={24} strokeLinecap="round" />
      <Path d={d} fill="none" stroke={p.base} strokeWidth={17} strokeLinecap="round" />
    </G>
  );
  // Two-toed mitten hand
  const hand = (x: number, y: number, flip: 1 | -1) => (
    <G key={`h${x}-${y}`}>
      <Circle cx={x} cy={y} r={10.5} fill={p.base} stroke={p.line} strokeWidth={2.5} />
      <Circle cx={x + 10 * flip} cy={y + 6} r={9} fill={p.base} stroke={p.line} strokeWidth={2.5} />
    </G>
  );
  const L_REST = 'M140 256 C 130 272, 136 292, 156 300';
  const R_REST = 'M260 256 C 270 272, 264 292, 244 300';

  switch (pose) {
    case 'rest':
      return <G>{arm(L_REST)}{arm(R_REST)}{hand(158, 300, 1)}{hand(242, 300, -1)}</G>;
    case 'wave':
      return <G>{arm(L_REST)}{hand(158, 300, 1)}{arm('M262 254 C 300 248, 330 228, 338 200')}{hand(340, 194, -1)}</G>;
    case 'flex':
      return (
        <G>
          {arm('M140 258 C 100 262, 70 246, 66 216')}{hand(64, 210, 1)}
          {arm('M260 258 C 300 262, 330 246, 334 216')}{hand(336, 210, -1)}
        </G>
      );
    case 'heart':
      return <G>{arm(L_REST)}{hand(158, 300, 1)}{arm('M260 256 C 262 272, 246 284, 222 282')}{hand(220, 280, -1)}</G>;
    case 'shh':
      return (
        <G>
          {arm(L_REST)}{hand(158, 300, 1)}
          {arm('M262 256 C 262 236, 244 220, 226 214')}{hand(222, 210, -1)}
          <Path d="M216 222 L216 196" stroke={p.line} strokeWidth={7} strokeLinecap="round" />
          <Path d="M216 222 L216 196" stroke={p.base} strokeWidth={3.5} strokeLinecap="round" />
        </G>
      );
    case 'up':
      return (
        <G>
          {arm('M140 254 C 100 246, 70 220, 62 190')}{hand(60, 184, 1)}
          {arm('M260 254 C 300 246, 330 220, 338 190')}{hand(340, 184, -1)}
        </G>
      );
    case 'droop':
      return (
        <G>
          {arm('M142 258 C 132 284, 136 310, 146 330')}{arm('M258 258 C 268 284, 264 310, 254 330')}
          {hand(148, 332, 1)}{hand(252, 332, -1)}
        </G>
      );
    case 'cheeks':
      return (
        <G>
          {arm('M140 256 C 106 250, 96 226, 112 208')}{hand(116, 204, 1)}
          {arm('M260 256 C 294 250, 304 226, 288 208')}{hand(284, 204, -1)}
        </G>
      );
    case 'fist':
      return (
        <G>
          {arm(L_REST)}{hand(158, 300, 1)}
          {arm('M262 254 C 300 248, 330 226, 336 196')}
          <Circle cx={338} cy={190} r={14} fill={p.base} stroke={p.line} strokeWidth={2.5} />
          <Path d="M356 172 L364 164 M360 190 L372 190 M356 206 L364 214" stroke={GOLD} strokeWidth={4} strokeLinecap="round" />
        </G>
      );
  }
}

function HairLayer({ hair, color }: { hair: SmoofAvatar['hair']; color: string }) {
  switch (hair) {
    case 'tuft':
      return (
        <G>
          <Path d="M188 58 C 176 40, 186 28, 192 44" stroke={color} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M212 58 C 224 40, 214 28, 208 44" stroke={color} strokeWidth={6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'spiky':
      return <Path d="M160 86 L166 56 L180 72 L190 42 L200 64 L210 42 L220 72 L234 56 L240 86 Q200 68 160 86 Z" fill={color} />;
    case 'curly':
      return (
        <G fill={color}>
          {[[168, 76, 13], [182, 58, 14], [200, 50, 14], [218, 58, 14], [232, 76, 13], [200, 70, 13]].map(([x, y, r]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </G>
      );
    case 'fringe':
      return <Path d="M150 98 C 158 54, 242 54, 250 98 C 232 84, 214 86, 200 98 C 186 86, 168 84, 150 98 Z" fill={color} />;
    default:
      return null;
  }
}

function MustacheLayer({ mustache, color }: { mustache: SmoofAvatar['mustache']; color: string }) {
  if (mustache === 'classic') {
    return <Path d="M200 180 C 190 174, 172 176, 168 186 C 180 190, 194 188, 200 184 C 206 188, 220 190, 232 186 C 228 176, 210 174, 200 180 Z" fill={color} />;
  }
  if (mustache === 'handlebar') {
    return (
      <Path
        d="M200 180 C 190 173, 172 176, 164 184 C 158 190, 152 184, 148 178 C 146 190, 158 196, 170 191 C 182 188, 194 187, 200 184 C 206 187, 218 188, 230 191 C 242 196, 254 190, 252 178 C 248 184, 242 190, 236 184 C 228 176, 210 173, 200 180 Z"
        fill={color}
      />
    );
  }
  return null;
}

function GlassesLayer({ glasses }: { glasses: SmoofAvatar['glasses'] }) {
  const frame = '#26323F';
  const temples = <Path d="M89 148 L72 142 M311 148 L328 142" stroke={frame} strokeWidth={4.5} strokeLinecap="round" />;
  switch (glasses) {
    case 'round':
      return (
        <G>
          <Circle cx={EYE_L.x} cy={EYE_L.y} r={33} stroke={frame} strokeWidth={4.5} fill="none" />
          <Circle cx={EYE_R.x} cy={EYE_R.y} r={33} stroke={frame} strokeWidth={4.5} fill="none" />
          <Path d="M155 146 Q200 128 245 146" stroke={frame} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          {temples}
        </G>
      );
    case 'square':
      return (
        <G>
          <Rect x={EYE_L.x - 34} y={EYE_L.y - 29} width={68} height={58} rx={12} stroke={frame} strokeWidth={4.5} fill="none" />
          <Rect x={EYE_R.x - 34} y={EYE_R.y - 29} width={68} height={58} rx={12} stroke={frame} strokeWidth={4.5} fill="none" />
          <Path d="M156 142 Q200 130 244 142" stroke={frame} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          {temples}
        </G>
      );
    case 'sun':
      return (
        <G>
          {[EYE_L, EYE_R].map((e) => (
            <G key={e.x}>
              <Path d={`M${e.x - 35} ${e.y - 20} L${e.x + 35} ${e.y - 20} Q${e.x + 34} ${e.y + 28} ${e.x} ${e.y + 28} Q${e.x - 34} ${e.y + 28} ${e.x - 35} ${e.y - 20} Z`} fill="#1F2937" />
              <Path d={`M${e.x - 24} ${e.y - 10} L${e.x - 8} ${e.y - 10}`} stroke="#FFFFFF" strokeWidth={3.5} opacity={0.5} strokeLinecap="round" />
            </G>
          ))}
          <Path d="M157 134 Q200 124 243 134" stroke="#1F2937" strokeWidth={5} fill="none" strokeLinecap="round" />
          {temples}
        </G>
      );
    default:
      return null;
  }
}

function ExtraLayer({ extra }: { extra: Extra }) {
  switch (extra) {
    case 'sparkles':
      return (
        <G>
          <Star x={56} y={90} s={12} fill={GOLD} />
          <Star x={346} y={74} s={9} fill={GOLD} />
          <Star x={352} y={230} s={7} fill={GOLD} />
        </G>
      );
    case 'stars':
      return (
        <G>
          <Star x={52} y={70} s={13} fill={GOLD} />
          <Star x={348} y={64} s={13} fill={GOLD} />
          <Star x={96} y={28} s={7} fill={GOLD} />
          <Star x={310} y={22} s={8} fill={GOLD} />
        </G>
      );
    case 'sweat':
      return <Path d="M318 92 C 310 106, 307 113, 313 119 C 319 125, 327 119, 324 110 C 322 104, 320 98, 318 92 Z" fill="#7CC8F5" />;
    case 'snow':
      return <Path d="M344 56 L344 92 M328 65 L360 83 M328 83 L360 65" stroke="#60A5FA" strokeWidth={4.5} strokeLinecap="round" />;
    case 'heart':
      return <Path d="M232 252 C 232 244 243 241 246 249 C 249 241 260 244 260 252 C 260 261 246 270 246 270 C 246 270 232 261 232 252 Z" fill="#FF6B8A" />;
    case 'puffs':
      return (
        <G fill="#E0F2FE" stroke="#BAE6FD" strokeWidth={2}>
          <Circle cx={236} cy={204} r={7} />
          <Circle cx={256} cy={198} r={10} />
          <Circle cx={282} cy={190} r={13} />
        </G>
      );
    case 'exclaim':
      return (
        <G fill="#EF4444">
          <Rect x={330} y={40} width={11} height={34} rx={5.5} />
          <Circle cx={335.5} cy={86} r={6} />
          <Rect x={350} y={52} width={9} height={26} rx={4.5} />
          <Circle cx={354.5} cy={88} r={5} />
        </G>
      );
    case 'airIn':
      return (
        <G stroke="#93C5FD" strokeWidth={4} strokeLinecap="round" fill="none">
          <Path d="M240 176 Q226 178 214 176" />
          <Path d="M244 188 Q230 186 216 182" />
        </G>
      );
    default:
      return null;
  }
}

function Star({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  const d = `M${x} ${y - s} Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z`;
  return <Path d={d} fill={fill} />;
}

// ─────────────────────────────────────────────
// Motion
// ─────────────────────────────────────────────

/** Blink every few seconds */
function useBlink(enabled: boolean) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let close: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setBlink(true);
      close = setTimeout(() => setBlink(false), 140);
    }, 3200 + Math.floor(Math.random() * 1500));
    return () => {
      clearInterval(id);
      clearTimeout(close);
    };
  }, [enabled]);
  return blink;
}

function useMotion(animation: SmoofAnimation) {
  const [value] = useState(() => new Animated.Value(0));
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    value.setValue(0);
    const timing = (toValue: number, duration: number) =>
      Animated.timing(value, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });

    const sequences: Record<SmoofAnimation, Animated.CompositeAnimation | null> = {
      none: null,
      bob: Animated.sequence([timing(1, 1400), timing(0, 1400)]),
      bounce: Animated.sequence([timing(1, 380), timing(0, 380), Animated.delay(250)]),
      sway: Animated.sequence([timing(1, 1600), timing(-1, 1600), timing(0, 800)]),
      shake: Animated.sequence([
        timing(1, 70), timing(-1, 70), timing(1, 70), timing(-1, 70), timing(0, 70), Animated.delay(1600),
      ]),
    };
    const seq = sequences[animation];
    if (!seq) return;
    loopRef.current = Animated.loop(seq);
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [animation, value]);

  switch (animation) {
    case 'bob':
      return [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }];
    case 'bounce':
      return [
        { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
        { scaleY: value.interpolate({ inputRange: [0, 0.15, 1], outputRange: [1, 0.94, 1.03] }) },
      ];
    case 'sway':
      return [{ rotate: value.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] }) }];
    case 'shake':
      return [{ rotate: value.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] }) }];
    default:
      return [];
  }
}
