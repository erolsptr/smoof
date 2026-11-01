/**
 * Smoof Color Palette
 * Duolingo-inspired vibrant colors with accessibility in mind
 */

export const Colors = {
  light: {
    // Primary - Success & Growth (Green)
    primary: '#10B981', // Emerald 500
    primaryDark: '#059669', // Emerald 600
    primaryLight: '#34D399', // Emerald 400

    // Secondary - Energy & Motivation (Yellow/Orange)
    secondary: '#F59E0B', // Amber 500
    secondaryDark: '#D97706', // Amber 600
    secondaryLight: '#FBBF24', // Amber 400

    // Accent - Calm & Crisis (Blue)
    accent: '#3B82F6', // Blue 500
    accentDark: '#2563EB', // Blue 600
    accentLight: '#60A5FA', // Blue 400

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB', // Gray 50
    card: '#FFFFFF',
    cardBorder: '#E5E7EB', // Gray 200

    // Text
    text: '#111827', // Gray 900
    textSecondary: '#6B7280', // Gray 500
    textTertiary: '#9CA3AF', // Gray 400

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444', // Red 500
    info: '#3B82F6',

    // Streak Fire
    streakFire: '#F97316', // Orange 500
    streakGold: '#FCD34D', // Yellow 300

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    // Primary - Success & Growth (Green)
    primary: '#34D399', // Emerald 400
    primaryDark: '#10B981', // Emerald 500
    primaryLight: '#6EE7B7', // Emerald 300

    // Secondary - Energy & Motivation (Yellow/Orange)
    secondary: '#FBBF24', // Amber 400
    secondaryDark: '#F59E0B', // Amber 500
    secondaryLight: '#FCD34D', // Amber 300

    // Accent - Calm & Crisis (Blue)
    accent: '#60A5FA', // Blue 400
    accentDark: '#3B82F6', // Blue 500
    accentLight: '#93C5FD', // Blue 300

    // Backgrounds
    background: '#111827', // Gray 900
    backgroundSecondary: '#1F2937', // Gray 800
    card: '#1F2937', // Gray 800
    cardBorder: '#374151', // Gray 700

    // Text
    text: '#F9FAFB', // Gray 50
    textSecondary: '#9CA3AF', // Gray 400
    textTertiary: '#6B7280', // Gray 500

    // Status
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171', // Red 400
    info: '#60A5FA',

    // Streak Fire
    streakFire: '#FB923C', // Orange 400
    streakGold: '#FDE047', // Yellow 300

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ColorName = keyof typeof Colors.light;
