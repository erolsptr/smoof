import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserStore } from '@/store/userStore';
import { useEffect, useState } from 'react';

/**
 * Splash / Router Screen
 * Decides where to navigate: onboarding or main app
 */
export default function IndexScreen() {
  const { colors } = useColorScheme();
  const isOnboarded = useUserStore((state) => state.isOnboarded);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Load user data from AsyncStorage/SQLite
    // For now, simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
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
