import { Tabs, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useProgressSync } from '@/hooks/useProgress';
import { usePendingRouteStore } from '@/store/pendingRouteStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useCheckInStore } from '@/store/checkInStore';
import { useInsightStore } from '@/store/insightStore';
import { useClockStore } from '@/utils/clock';

export default function TabsLayout() {
  const { colors } = useColorScheme();
  // Keep streaks + badges in sync while the app is open
  useProgressSync();

  // The tabs only exist after onboarding, so the profile must be there. If the
  // in-memory stores were reset (e.g. Fast Refresh re-running a store module
  // during development), reload the saved data instead of showing empty tabs.
  const profile = useUserStore((s) => s.profile);
  const isLoading = useUserStore((s) => s.isLoading);
  useEffect(() => {
    if (profile || isLoading) return;
    Promise.all([
      useUserStore.getState().loadUserData(),
      useStatsStore.getState().loadStatsData(),
      useCheckInStore.getState().loadCheckIns(),
      useInsightStore.getState().loadInsights(),
      useClockStore.getState().loadClock(),
    ]).then(() => useStatsStore.getState().syncStreaks(useUserStore.getState().profile));
  }, [profile, isLoading]);

  // A screen requested by a notification tap
  const router = useRouter();
  const pendingRoute = usePendingRouteStore((s) => s.route);
  useEffect(() => {
    if (!pendingRoute) return;
    usePendingRouteStore.getState().setRoute(null);
    router.push(pendingRoute as Href);
  }, [pendingRoute, router]);

  // Evening check-in reminder for the next days (only if already allowed)
  useEffect(() => {
    const notifications = useNotificationStore.getState();
    notifications.loadSettings().then(async () => {
      await notifications.syncCheckInReminders();
      await notifications.syncRiskReminders();
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={(color || colors.textTertiary) as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'İstatistikler',
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={(color || colors.textTertiary) as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={(color || colors.textTertiary) as string} />
          ),
        }}
      />
    </Tabs>
  );
}
