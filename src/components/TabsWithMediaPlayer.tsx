import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { BottomMediaPlayer } from './BottomMediaPlayer'
import { FileNavigatorModal } from './FileNavigatorModal'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { useFileManager } from '../contexts/FileManagerContext'
import { useMediaPlayerFileOperations } from '../hooks/useMediaPlayerFileOperations'
import { theme } from '../utils/theme'

/**
 * TabsWithMediaPlayer Component
 *
 * A pure presentational component that renders the bottom tab navigation
 * and persistent bottom media player. This component focuses solely on
 * layout and rendering concerns, delegating file operations to the
 * useMediaPlayerFileOperations hook.
 *
 * The media player appears above the tab bar and persists across navigation.
 */
export function TabsWithMediaPlayer() {
  const audioPlayer = useAudioPlayerContext()
  const fileManager = useFileManager()

  // Extract file operation logic to custom hook
  const {
    handleRename,
    handleMove,
    handleDelete,
    showMoveModal,
    selectedFileForMove,
    handleMoveConfirm,
    handleMoveCancel,
  } = useMediaPlayerFileOperations()

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
            onSkipForward={() => audioPlayer.skipForward()}
            onSkipBackward={() => audioPlayer.skipBackward()}
            onRename={handleRename}
            onMove={handleMove}
            onDelete={handleDelete}
            style={styles.seamlessMediaPlayer}
          />
        </View>
      )}

      {/* File Navigator Modal for Move Operation */}
      {showMoveModal && selectedFileForMove && (
        <FileNavigatorModal
          visible={showMoveModal}
          onClose={handleMoveCancel}
          onSelectFolder={folder => {
            handleMoveConfirm(folder.path)
          }}
          title={`Move ${selectedFileForMove.name}`}
          primaryButtonText="Move"
          onPrimaryAction={handleMoveConfirm}
          initialDirectory={fileManager.getFullPath()}
        />
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
