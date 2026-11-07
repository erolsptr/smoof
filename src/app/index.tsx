import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { Smoof } from '@/components/smoof/Smoof';

// Loading screen colors (fixed, so it looks the same in light and dark mode)
const BRAND = '#10B981';
const BRAND_DARK = '#059669';
// Keep the loading screen up long enough to be seen (no flash)
const MIN_SPLASH_MS = 1200;

/**
 * Loading screen + router.
 * Shows the classic Smoof while user data loads, then decides where to go.
 */
export default function IndexScreen() {
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const isLoading = useUserStore((state) => state.isLoading);
  const loadUserData = useUserStore((state) => state.loadUserData);
  const loadStatsData = useStatsStore((state) => state.loadStatsData);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      await Promise.all([
        loadUserData(),
        loadStatsData(),
        new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS)),
      ]);

      // After loading, sync streaks for the profile's quit method
      const profile = useUserStore.getState().profile;
      if (profile) {
        useStatsStore.getState().syncStreaks(profile);
      }

      setIsInitialized(true);
    }

    initializeApp();
  }, [loadUserData, loadStatsData]);

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

function LoadingScreen() {
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 160 + 200),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.container}>
      {/* Soft background circles */}
      <View style={[styles.bubble, styles.bubbleTop]} />
      <View style={[styles.bubble, styles.bubbleBottom]} />

      <View style={styles.halo}>
        <Smoof mood="happy" size={190} animation="bounce" classic />
      </View>
      <Text style={styles.title}>smoof</Text>
      <Text style={styles.tagline}>Sigarasız hayata birlikte</Text>

      <View style={styles.dots}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: BRAND_DARK,
    opacity: 0.35,
  },
  bubbleTop: {
    width: 320,
    height: 320,
    top: -120,
    right: -110,
  },
  bubbleBottom: {
    width: 380,
    height: 380,
    bottom: -170,
    left: -140,
  },
  halo: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: 8,
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 36,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});
