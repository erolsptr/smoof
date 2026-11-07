import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { Smoof, type SmoofMood } from '@/components/smoof/Smoof';
import {
  DEFAULT_AVATAR, EYE_COLORS, GLASSES, HAIR_COLORS, HAIR_STYLES, MUSTACHES, SKINS,
} from '@/components/smoof/palette';
import type { SmoofAvatar, SmoofSkin } from '@/types';

const PREVIEW_MOODS: { mood: SmoofMood; label: string }[] = [
  { mood: 'happy', label: '😊' },
  { mood: 'proud', label: '💪' },
  { mood: 'wink', label: '😉' },
  { mood: 'shocked', label: '😮' },
];

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useColorScheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.options}>{children}</View>
    </View>
  );
}

function Swatch({ color, selected, onPress, label }: { color: string; selected: boolean; onPress: () => void; label: string }) {
  const { colors } = useColorScheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.swatchRing, { borderColor: selected ? colors.primary : 'transparent' }]}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <View style={[styles.swatch, { backgroundColor: color }]}>
        {selected && <Ionicons name="checkmark" size={18} color="#FFF" />}
      </View>
    </TouchableOpacity>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useColorScheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.cardBorder },
      ]}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/**
 * "Create your Smoof" — colour, eyes, hair, mustache, glasses.
 */
export default function AvatarScreen() {
  const { colors } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useUserStore((s) => s.profile?.avatar);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [look, setLook] = useState<SmoofAvatar>(saved ?? DEFAULT_AVATAR);
  const [previewMood, setPreviewMood] = useState<SmoofMood>('happy');
  const set = <K extends keyof SmoofAvatar>(key: K, value: SmoofAvatar[K]) => setLook((l) => ({ ...l, [key]: value }));

  const randomize = () => {
    setLook({
      skin: pick(Object.keys(SKINS) as SmoofSkin[]),
      eyeColor: pick(EYE_COLORS).value,
      hair: pick(HAIR_STYLES).value,
      hairColor: pick(HAIR_COLORS).value,
      mustache: Math.random() < 0.6 ? 'none' : pick(MUSTACHES).value,
      glasses: Math.random() < 0.5 ? 'none' : pick(GLASSES).value,
    });
  };

  const save = async () => {
    await updateProfile({ avatar: look });
    router.back();
  };

  const showsHairColor = look.hair !== 'none' || look.mustache !== 'none';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityLabel="Kapat">
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Smoof’unu oluştur</Text>
        <TouchableOpacity onPress={randomize} hitSlop={12} accessibilityLabel="Rastgele">
          <Ionicons name="dice" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View style={[styles.preview, { backgroundColor: SKINS[look.skin].belly }]}>
        <Smoof mood={previewMood} size={190} avatar={look} animation="bob" />
        <View style={styles.moodRow}>
          {PREVIEW_MOODS.map((m) => (
            <TouchableOpacity
              key={m.mood}
              onPress={() => setPreviewMood(m.mood)}
              style={[styles.moodButton, { backgroundColor: previewMood === m.mood ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }]}
            >
              <Text style={styles.moodEmoji}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <Section title="Renk">
          {(Object.keys(SKINS) as SmoofSkin[]).map((key) => (
            <Swatch key={key} color={SKINS[key].base} label={SKINS[key].label} selected={look.skin === key} onPress={() => set('skin', key)} />
          ))}
        </Section>

        <Section title="Göz rengi">
          {EYE_COLORS.map((c) => (
            <Swatch key={c.value} color={c.value} label={c.label} selected={look.eyeColor === c.value} onPress={() => set('eyeColor', c.value)} />
          ))}
        </Section>

        <Section title="Saç">
          {HAIR_STYLES.map((h) => (
            <Chip key={h.value} label={h.label} selected={look.hair === h.value} onPress={() => set('hair', h.value)} />
          ))}
        </Section>

        <Section title="Bıyık">
          {MUSTACHES.map((m) => (
            <Chip key={m.value} label={m.label} selected={look.mustache === m.value} onPress={() => set('mustache', m.value)} />
          ))}
        </Section>

        {showsHairColor && (
          <Section title="Saç ve bıyık rengi">
            {HAIR_COLORS.map((c) => (
              <Swatch key={c.value} color={c.value} label={c.label} selected={look.hairColor === c.value} onPress={() => set('hairColor', c.value)} />
            ))}
          </Section>
        )}

        <Section title="Gözlük">
          {GLASSES.map((g) => (
            <Chip key={g.value} label={g.label} selected={look.glasses === g.value} onPress={() => set('glasses', g.value)} />
          ))}
        </Section>

        <TouchableOpacity onPress={() => setLook(DEFAULT_AVATAR)} style={styles.resetLink}>
          <Text style={[styles.resetText, { color: colors.textSecondary }]}>Klasik Smoof’a dön</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={save}>
          <Text style={styles.saveText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  preview: {
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  moodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchRing: {
    borderWidth: 3,
    borderRadius: 26,
    padding: 2,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetLink: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
