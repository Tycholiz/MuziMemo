import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
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
  const [isPlayingOverride, setIsPlayingOverride] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [currentDuration, setCurrentDuration] = useState(0)

  // Timer ref for position updates
  const positionUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Set up real-time position tracking
  useEffect(() => {
    if (audioPlayer.playing || isPlayingOverride) {
      // Start position tracking when playing
      positionUpdateInterval.current = setInterval(() => {
        const position = audioPlayer.currentTime || 0
        const duration = audioPlayer.duration || 0

        setCurrentPosition(position)
        if (duration > 0) {
          setCurrentDuration(duration)
        }
      }, 50) // Update every 50ms for smooth progress
    } else {
      // Clear interval when not playing
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current)
        positionUpdateInterval.current = null
      }
    }

    // Cleanup on unmount or when playing state changes
    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current)
        positionUpdateInterval.current = null
      }
    }
  }, [audioPlayer.playing, isPlayingOverride, audioPlayer])

  const playClip = useCallback(
    async (clip: AudioClip) => {
      try {
        console.log('🎵 AudioPlayerContext: playClip called for:', clip.name)

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

        // Set state immediately for instant visual feedback
        setIsLoading(true)
        setCurrentClip(clip)
        setIsPlayingOverride(true)
        setCurrentPosition(0) // Reset position for new clip
        setCurrentDuration(0) // Reset duration for new clip
        console.log('🎵 AudioPlayerContext: Set currentClip and isPlayingOverride to true')

        // Replace the source with the new clip
        audioPlayer.replace(clip.uri)

        // Wait a moment for the audio to load
        await new Promise(resolve => setTimeout(resolve, 500))

        // Update duration after loading
        const duration = audioPlayer.duration || 0
        if (duration > 0) {
          setCurrentDuration(duration)
        }

        audioPlayer.play()
        console.log('🎵 AudioPlayerContext: Called audioPlayer.play()')
      } catch (error) {
        console.error('❌ Failed to play audio clip:', error)
        // Reset state on error
        setCurrentClip(null)
        setIsLoading(false)
        setIsPlayingOverride(false)
      } finally {
        setIsLoading(false)
      }
    },
    [audioPlayer]
  )

  const pauseClip = useCallback(() => {
    console.log('🎵 AudioPlayerContext: pauseClip called')
    audioPlayer.pause()
    setIsPlayingOverride(false)
  }, [audioPlayer])

  const stopClip = useCallback(() => {
    console.log('🎵 AudioPlayerContext: stopClip called')
    audioPlayer.pause()
    audioPlayer.seekTo(0)
    setCurrentClip(null) // Clear current clip when explicitly stopped
    setCurrentPosition(0) // Reset position
    setCurrentDuration(0) // Reset duration
    setIsPlayingOverride(false)
  }, [audioPlayer])

  const seekTo = useCallback(
    (position: number) => {
      audioPlayer.seekTo(position)
      setCurrentPosition(position) // Update reactive position immediately
    },
    [audioPlayer]
  )

  const cleanup = useCallback(() => {
    console.log('🎵 AudioPlayerContext: cleanup called')
    audioPlayer.pause()
    setCurrentClip(null)
    setIsPlayingOverride(false)
  }, [audioPlayer])

  // Sync override state with actual audio player state
  useEffect(() => {
    if (isPlayingOverride && audioPlayer.playing) {
      // Audio player has caught up, disable override
      setIsPlayingOverride(false)
    }
    // Note: Don't clear currentClip when audio stops playing - only clear it when explicitly stopped or new clip loaded
    // This allows the media player to remain visible when paused
  }, [audioPlayer.playing, isPlayingOverride])

  const value: AudioPlayerContextType = {
    // State
    currentClip,
    isPlaying: isPlayingOverride || audioPlayer.playing,
    isLoading,
    position: currentPosition, // Use reactive position
    duration: currentDuration, // Use reactive duration

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
