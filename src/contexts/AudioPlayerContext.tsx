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

  // State for tracking current position (to trigger re-renders)
  const [currentPosition, setCurrentPosition] = useState(0)

  // Ref for position polling interval
  const positionPollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start/stop position polling based on playback state
  useEffect(() => {
    const isActuallyPlaying = isPlayingOverride || audioPlayer.playing

    if (isActuallyPlaying && currentClip) {
      // Start polling for position updates every 100ms
      if (!positionPollingInterval.current) {
        console.log('🎵 AudioPlayerContext: Starting position polling')
        positionPollingInterval.current = setInterval(() => {
          const newPosition = audioPlayer.currentTime || 0
          setCurrentPosition(newPosition)
        }, 100)
      }
    } else {
      // Stop polling when not playing
      if (positionPollingInterval.current) {
        console.log('🎵 AudioPlayerContext: Stopping position polling')
        clearInterval(positionPollingInterval.current)
        positionPollingInterval.current = null
      }
    }

    // Cleanup on unmount
    return () => {
      if (positionPollingInterval.current) {
        clearInterval(positionPollingInterval.current)
        positionPollingInterval.current = null
      }
    }
  }, [isPlayingOverride, audioPlayer.playing, currentClip, audioPlayer])

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
        setCurrentPosition(0) // Reset position for new clip
        setIsPlayingOverride(true)
        console.log('🎵 AudioPlayerContext: Set currentClip and isPlayingOverride to true')

        // Replace the source with the new clip
        audioPlayer.replace(clip.uri)

        // Wait a moment for the audio to load
        await new Promise(resolve => setTimeout(resolve, 500))

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
    setCurrentPosition(0)
    setIsPlayingOverride(false)
  }, [audioPlayer])

  const seekTo = useCallback(
    (position: number) => {
      audioPlayer.seekTo(position)
      setCurrentPosition(position) // Update tracked position immediately
    },
    [audioPlayer]
  )

  const cleanup = useCallback(() => {
    console.log('🎵 AudioPlayerContext: cleanup called')
    audioPlayer.pause()
    setCurrentClip(null)
    setCurrentPosition(0)
    setIsPlayingOverride(false)
  }, [audioPlayer])

  // Sync override state with actual audio player state
  useEffect(() => {
    if (isPlayingOverride && audioPlayer.playing) {
      // Audio player has caught up, disable override
      setIsPlayingOverride(false)
    } else if (!audioPlayer.playing && !isPlayingOverride && currentClip) {
      // Audio stopped but we still have a current clip, clear it
      setCurrentClip(null)
      setCurrentPosition(0)
    }
  }, [audioPlayer.playing, isPlayingOverride, currentClip])

  const value: AudioPlayerContextType = {
    // State
    currentClip,
    isPlaying: isPlayingOverride || audioPlayer.playing,
    isLoading,
    position: currentPosition, // Use tracked position instead of audioPlayer.currentTime
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
