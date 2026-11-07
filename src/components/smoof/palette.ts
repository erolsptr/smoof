import type { SmoofAvatar, SmoofGlasses, SmoofHair, SmoofMustache, SmoofSkin } from '@/types';

/**
 * Skin layers for the flat + one-shadow style:
 * base (main), shade (shadow side), line (outlines/folds), hi (highlights), belly.
 */
export const SKINS: Record<SmoofSkin, { label: string; base: string; shade: string; line: string; hi: string; belly: string }> = {
  mint: { label: 'Nane', base: '#58D6A4', shade: '#3DBF8F', line: '#2FAE83', hi: '#8EEDC4', belly: '#E6FBF1' },
  sky: { label: 'Gök', base: '#62B9F2', shade: '#45A0DE', line: '#3489C7', hi: '#A5D8FA', belly: '#E6F3FD' },
  lilac: { label: 'Lila', base: '#A98EF7', shade: '#8F73E6', line: '#7A5FD1', hi: '#CDBDFC', belly: '#F0EBFF' },
  peach: { label: 'Şeftali', base: '#FFA676', shade: '#F28C5A', line: '#DE7744', hi: '#FFCBAE', belly: '#FFF0E6' },
  pink: { label: 'Pembe', base: '#F692BA', shade: '#E8779F', line: '#D4628A', hi: '#FBC0D7', belly: '#FFEAF2' },
  sun: { label: 'Güneş', base: '#F5CB4C', shade: '#E3B331', line: '#CC9C1F', hi: '#FAE08F', belly: '#FFF7DC' },
};

export const EYE_COLORS: { label: string; value: string }[] = [
  { label: 'Altın', value: '#F5A524' },
  { label: 'Kahve', value: '#8B5A2B' },
  { label: 'Mavi', value: '#3B82F6' },
  { label: 'Yeşil', value: '#22A35A' },
  { label: 'Mor', value: '#8B5CF6' },
  { label: 'Orman', value: '#0F766E' },
];

export const HAIR_COLORS: { label: string; value: string }[] = [
  { label: 'Siyah', value: '#2B2B33' },
  { label: 'Kahve', value: '#6B3F22' },
  { label: 'Sarı', value: '#E8B94A' },
  { label: 'Kızıl', value: '#C2521F' },
  { label: 'Pembe', value: '#EC6FA6' },
  { label: 'Mavi', value: '#3E7BE0' },
];

export const HAIR_STYLES: { label: string; value: SmoofHair }[] = [
  { label: 'Yok', value: 'none' },
  { label: 'Perçem', value: 'tuft' },
  { label: 'Diken', value: 'spiky' },
  { label: 'Kıvırcık', value: 'curly' },
  { label: 'Kakül', value: 'fringe' },
];

export const MUSTACHES: { label: string; value: SmoofMustache }[] = [
  { label: 'Yok', value: 'none' },
  { label: 'Klasik', value: 'classic' },
  { label: 'Kıvrık', value: 'handlebar' },
];

export const GLASSES: { label: string; value: SmoofGlasses }[] = [
  { label: 'Yok', value: 'none' },
  { label: 'Yuvarlak', value: 'round' },
  { label: 'Kare', value: 'square' },
  { label: 'Güneş', value: 'sun' },
];

export const DEFAULT_AVATAR: SmoofAvatar = {
  skin: 'mint',
  eyeColor: EYE_COLORS[0].value,
  hair: 'none',
  hairColor: HAIR_COLORS[0].value,
  mustache: 'none',
  glasses: 'none',
};

/** Linear mix of two hex colors (t = 0 → a, t = 1 → b) */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, shift: number) => (p >> shift) & 255;
  const c = (shift: number) => Math.round(ch(pa, shift) + (ch(pb, shift) - ch(pa, shift)) * t);
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
}
