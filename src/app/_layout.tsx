import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const { colors, isDark } = useColorScheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="crisis" 
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
