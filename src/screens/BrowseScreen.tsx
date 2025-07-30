import React from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'

import { Screen } from '../components/Layout'
import { FileSystemComponent } from '../components/FileSystem'
import { BottomMediaPlayer } from '../components/BottomMediaPlayer'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'

/**
 * BrowseScreen Component
 * Main screen for browsing and managing recorded audio files
 * Uses FileManagerContext and AudioPlayerContext for state management
 */
export default function BrowseScreen() {
  const audioPlayer = useAudioPlayerContext()

  const handleRecordPress = () => {
    router.push('/record')
  }

  return (
    <Screen>
      <View style={styles.container}>
        <FileSystemComponent onRecordPress={handleRecordPress} />
        
        {/* Show media player if audio is playing */}
        {audioPlayer.currentClip && (
          <BottomMediaPlayer />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
