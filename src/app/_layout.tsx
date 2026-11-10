import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { usePendingRouteStore } from '@/store/pendingRouteStore';
import { useThemeStore } from '@/store/themeStore';

/** Notification taps (also the one that launched the app) open their screen */
function useNotificationRouting() {
  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === 'string') usePendingRouteStore.getState().setRoute(url);
    };
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        handle(response);
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => {});
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, []);
}

export default function RootLayout() {
  const { colors, isDark } = useColorScheme();
  useNotificationRouting();
  // Light / dark / system choice from Settings
  useEffect(() => {
    useThemeStore.getState().loadTheme();
  }, []);

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
          name="avatar"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
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
