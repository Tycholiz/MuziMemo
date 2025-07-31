import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { Platform } from 'react-native'
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio'

export type AudioClip = {
  id: string
  name: string
  uri: string
  duration?: number
}

export type AudioPlayerState = {
  currentClip: AudioClip | null
  isPlaying: boolean
  isLoading: boolean
  position: number
  duration: number
}

export type AudioPlayerActions = {
  playClip: (clip: AudioClip) => Promise<void>
  pauseClip: () => void
  stopClip: () => void
  seekTo: (position: number) => void
  cleanup: () => void
}

export type AudioPlayerContextType = AudioPlayerState & AudioPlayerActions

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null)

type AudioPlayerProviderProps = {
  children: ReactNode
}

export function AudioPlayerProvider({ children }: AudioPlayerProviderProps) {
  const audioPlayer = useAudioPlayer()
  const [currentClip, setCurrentClip] = useState<AudioClip | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Configure audio session for playback
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          // Force audio to use main speaker for playback (not earpiece)
          ...(Platform.OS === 'ios' && {
            iosCategory: 'playback',
            iosCategoryMode: 'default',
            iosCategoryOptions: ['defaultToSpeaker'],
          }),
        })
        console.log('🎵 Audio session configured successfully for main speakers')
      } catch (error) {
        console.error('❌ Failed to configure audio session:', error)
      }
    }

    configureAudio()
  }, [])

  const playClip = useCallback(
    async (clip: AudioClip) => {
      try {
        // Ensure audio mode is set for main speakers before playing
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
            shouldPlayInBackground: false,
            // Force audio to use main speaker for playback (not earpiece)
            ...(Platform.OS === 'ios' && {
              iosCategory: 'playback',
              iosCategoryMode: 'default',
              iosCategoryOptions: ['defaultToSpeaker'],
            }),
          })
        } catch (audioModeError) {
          console.warn('⚠️ Failed to set audio mode for playback:', audioModeError)
        }

        setIsLoading(true)
        setCurrentClip(clip)

        // Replace the source with the new clip
        audioPlayer.replace(clip.uri)

        // Wait a moment for the audio to load
        await new Promise(resolve => setTimeout(resolve, 500))

        audioPlayer.play()
      } catch (error) {
        console.error('❌ Failed to play audio clip:', error)
        // Reset state on error
        setCurrentClip(null)
        setIsLoading(false)
      } finally {
        setIsLoading(false)
      }
    },
    [audioPlayer]
  )

  const pauseClip = useCallback(() => {
    audioPlayer.pause()
  }, [audioPlayer])

  const stopClip = useCallback(() => {
    audioPlayer.pause()
    audioPlayer.seekTo(0)
  }, [audioPlayer])

  const seekTo = useCallback(
    (position: number) => {
      audioPlayer.seekTo(position)
    },
    [audioPlayer]
  )

  const cleanup = useCallback(() => {
    audioPlayer.pause()
    setCurrentClip(null)
  }, [audioPlayer])

  const value: AudioPlayerContextType = {
    // State
    currentClip,
    isPlaying: audioPlayer.playing,
    isLoading,
    position: audioPlayer.currentTime,
    duration: audioPlayer.duration,

    // Actions
    playClip,
    pauseClip,
    stopClip,
    seekTo,
    cleanup,
  }

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayerContext(): AudioPlayerContextType {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within an AudioPlayerProvider')
  }
  return context
}
