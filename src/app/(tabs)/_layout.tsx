import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabsLayout() {
  const { colors } = useColorScheme();

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
          tabBarIcon: () => <TabIcon icon="🏠" />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'İlerleme',
          tabBarIcon: () => <TabIcon icon="📊" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: () => <TabIcon icon="👤" />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
}
