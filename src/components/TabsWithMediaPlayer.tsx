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
      {audioPlayer.currentClip && (audioPlayer.duration > 0 || audioPlayer.currentClip.duration) && (
        <View style={[styles.mediaPlayerContainer, { bottom: tabBarHeight }]}>
          <BottomMediaPlayer
            title={audioPlayer.currentClip.name}
            isPlaying={audioPlayer.isPlaying}
            isVisible={true}
            currentTimeSeconds={audioPlayer.position}
            durationSeconds={audioPlayer.duration || audioPlayer.currentClip.duration || 0}
            onPlayPause={() => {
              if (audioPlayer.isPlaying) {
                audioPlayer.pauseClip()
              } else {
                audioPlayer.playClip(audioPlayer.currentClip!)
              }
            }}
            onSeek={audioPlayer.seekTo}
            onSkipForward={() => {
              const currentPosition = audioPlayer.position || 0
              const duration = audioPlayer.duration || audioPlayer.currentClip?.duration || 0
              const newPosition = Math.min(currentPosition + 5, duration)
              audioPlayer.seekTo(newPosition)
            }}
            onSkipBackward={() => {
              const currentPosition = audioPlayer.position || 0
              const newPosition = Math.max(currentPosition - 5, 0)
              audioPlayer.seekTo(newPosition)
            }}
            style={styles.seamlessMediaPlayer}
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
    zIndex: 1000, // Ensure it appears above other content
  },
  seamlessMediaPlayer: {
    width: '100%', // Ensure full width
  },
})
