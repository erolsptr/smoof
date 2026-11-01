import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useStatsStore } from '@/store/statsStore';
import { useEffect, useState } from 'react';

/**
 * Splash / Router Screen
 * Loads user data and decides where to navigate
 */
export default function IndexScreen() {
  const { colors } = useColorScheme();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const isLoading = useUserStore((state) => state.isLoading);
  const loadUserData = useUserStore((state) => state.loadUserData);
  const loadStatsData = useStatsStore((state) => state.loadStatsData);
  
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      // Load all persisted data
      await Promise.all([
        loadUserData(),
        loadStatsData(),
      ]);
      
      setIsInitialized(true);
    }
    
    initializeApp();
  }, []);

  if (!isInitialized || isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <Text style={styles.logo}>🦎</Text>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Smoof</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      </View>
    );
  }

  // Route to appropriate screen
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  loader: {
    marginTop: 32,
  },
});
