import { Tabs } from 'expo-router';
import { Text, type ColorValue, useColorScheme } from 'react-native';

import { palette } from '@/src/theme/tokens';

function TabIcon({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 22 }}>{icon}</Text>;
}

export default function TabLayout() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.separator,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '闹钟',
          tabBarIcon: ({ color }) => <TabIcon icon="⏰" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '日历',
          tabBarIcon: ({ color }) => <TabIcon icon="☾" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feeds"
        options={{
          title: '资讯',
          tabBarIcon: ({ color }) => <TabIcon icon="☀︎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => <TabIcon icon="⚙︎" color={color} />,
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
