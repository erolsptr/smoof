import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, type ColorScheme } from '@/constants/colors';

/**
 * Custom hook for theme management
 * Returns current color scheme and theme colors
 */
export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const colorScheme: ColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  
  return {
    colorScheme,
    colors: Colors[colorScheme],
    isDark: colorScheme === 'dark',
  };
}
