import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

/**
 * Tab navigation layout
 * Defines the bottom tab navigation structure
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tabBar.active,
        tabBarInactiveTintColor: theme.colors.tabBar.inactive,
        headerStyle: {
          backgroundColor: theme.colors.tabBar.background,
        },
        headerTintColor: theme.colors.text.primary,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar.background,
          borderTopColor: theme.colors.tabBar.border,
        },
      }}
    >
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="mic" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="folder" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
