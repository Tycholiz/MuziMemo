import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { BottomMediaPlayer } from './BottomMediaPlayer'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { theme } from '../utils/theme'

/**
 * TabsWithMediaPlayer Component
 * Wraps the tab navigation with a persistent bottom media player
 * The media player appears above the tab bar and persists across navigation
 */
export function TabsWithMediaPlayer() {
  const audioPlayer = useAudioPlayerContext()

  // Calculate bottom spacing to account for tab bar
  const tabBarHeight = 80 // Approximate tab bar height including safe area

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
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

      {/* Persistent Bottom Media Player */}
      {audioPlayer.currentClip && (
        <View style={[styles.mediaPlayerContainer, { bottom: tabBarHeight }]}>
          <BottomMediaPlayer
            title={audioPlayer.currentClip.name}
            isPlaying={audioPlayer.isPlaying}
            isVisible={true}
            onPlayPause={() => {
              if (audioPlayer.isPlaying) {
                audioPlayer.pauseClip()
              } else {
                audioPlayer.playClip(audioPlayer.currentClip!)
              }
            }}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mediaPlayerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
    zIndex: 1000, // Ensure it appears above other content
  },
})
