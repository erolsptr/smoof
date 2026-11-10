import { create } from 'zustand';
import { Appearance } from 'react-native';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Light / dark / follow the phone. Applied with Appearance.setColorScheme, so
 * every screen (useColorScheme) and native UI (alerts, pickers) follow it.
 */
interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  loadTheme: () => Promise<void>;
}

const apply = (preference: ThemePreference) =>
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: async (preference) => {
    apply(preference);
    set({ preference });
    await storage.setItem(STORAGE_KEYS.THEME, preference);
  },
  loadTheme: async () => {
    const saved = await storage.getItem<ThemePreference>(STORAGE_KEYS.THEME);
    const preference = saved ?? 'system';
    apply(preference);
    set({ preference });
  },
}));
