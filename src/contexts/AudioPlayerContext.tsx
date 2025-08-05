import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, useMemo } from 'react'
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
  resumeClip: () => void
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
  const [isPlayingOverride, setIsPlayingOverride] = useState<boolean | null>(null)

  // Add state for tracking position and duration with timer-based updates
  const [currentPosition, setCurrentPosition] = useState(0)
  const [currentDuration, setCurrentDuration] = useState(0)
  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Start position tracking timer
  const startPositionTracking = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current)
    }

    timeUpdateInterval.current = setInterval(() => {
      if (audioPlayer.playing) {
        const position = audioPlayer.currentTime || 0
        const duration = audioPlayer.duration || 0

        setCurrentPosition(position)
        if (duration > 0) {
          setCurrentDuration(duration)
        }

        console.log('🎵 AudioPlayerContext: Position update -', {
          position,
          duration,
          playing: audioPlayer.playing
        })
      }
    }, 100) // Update every 100ms for smooth progress
  }, [audioPlayer])

  // Stop position tracking timer
  const stopPositionTracking = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current)
      timeUpdateInterval.current = null
    }
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopPositionTracking()
    }
  }, [stopPositionTracking])

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
        console.log('🎵 AudioPlayerContext: Set currentClip and isPlayingOverride to true')

        // Replace the source with the new clip
        audioPlayer.replace(clip.uri)

        // Wait a moment for the audio to load
        await new Promise(resolve => setTimeout(resolve, 500))

        audioPlayer.play()
        console.log('🎵 AudioPlayerContext: Called audioPlayer.play()')

        // Start position tracking
        startPositionTracking()
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

  const resumeClip = useCallback(() => {
    console.log('🎵 AudioPlayerContext: resumeClip called')
    if (currentClip) {
      audioPlayer.play()
      setIsPlayingOverride(true)
      startPositionTracking()
      console.log('🎵 AudioPlayerContext: Resumed playback for:', currentClip.name)
    } else {
      console.warn('🎵 AudioPlayerContext: No current clip to resume')
    }
  }, [audioPlayer, currentClip, startPositionTracking])

  const pauseClip = useCallback(() => {
    console.log('🎵 AudioPlayerContext: pauseClip called')
    audioPlayer.pause()
    setIsPlayingOverride(false)
    stopPositionTracking()
  }, [audioPlayer, stopPositionTracking])

  const stopClip = useCallback(() => {
    console.log('🎵 AudioPlayerContext: stopClip called')
    audioPlayer.pause()
    audioPlayer.seekTo(0)
    setIsPlayingOverride(false)
    setCurrentPosition(0)
    stopPositionTracking()
  }, [audioPlayer, stopPositionTracking])

  const seekTo = useCallback(
    (position: number) => {
      console.log('🎵 AudioPlayerContext: seekTo called with position', position, 'seconds')
      audioPlayer.seekTo(position)
      // Update tracked position immediately for instant UI feedback
      setCurrentPosition(position)
    },
    [audioPlayer]
  )

  const cleanup = useCallback(() => {
    console.log('🎵 AudioPlayerContext: cleanup called')
    audioPlayer.pause()
    setCurrentClip(null)
    setIsPlayingOverride(false)
    setCurrentPosition(0)
    setCurrentDuration(0)
    stopPositionTracking()
  }, [audioPlayer, stopPositionTracking])

  // Sync override state with actual audio player state
  useEffect(() => {
    console.log('🎵 AudioPlayerContext: State sync check -', {
      isPlayingOverride,
      audioPlayerPlaying: audioPlayer.playing,
      currentClip: currentClip?.name
    })

    // When we have an override and the audio player catches up, clear the override
    if (isPlayingOverride === true && audioPlayer.playing) {
      // Audio player has caught up after starting, clear override to use native state
      console.log('🎵 AudioPlayerContext: Clearing isPlayingOverride - audio player caught up after start')
      setIsPlayingOverride(null)
    } else if (isPlayingOverride === false && !audioPlayer.playing) {
      // Audio player has caught up after pausing, clear override to use native state
      console.log('🎵 AudioPlayerContext: Clearing isPlayingOverride - audio player caught up after pause')
      setIsPlayingOverride(null)
    }
  }, [audioPlayer.playing, isPlayingOverride, currentClip])

  // Calculate the actual playing state with proper priority
  const actualIsPlaying = useMemo(() => {
    // If we have an explicit override (true for starting, false for pausing), use it
    if (isPlayingOverride !== null) {
      return isPlayingOverride
    }
    // Otherwise, fall back to the audio player's state
    return audioPlayer.playing
  }, [isPlayingOverride, audioPlayer.playing])

  // Debug logging for audio player state
  console.log('🎵 AudioPlayerContext: Current state -', {
    currentClip: currentClip?.name,
    isPlaying: actualIsPlaying,
    position: currentPosition, // Use tracked position
    duration: currentDuration, // Use tracked duration
    rawPosition: audioPlayer.currentTime,
    rawDuration: audioPlayer.duration,
    isPlayingOverride,
    audioPlayerPlaying: audioPlayer.playing
  })

  const value: AudioPlayerContextType = {
    // State
    currentClip,
    isPlaying: actualIsPlaying,
    isLoading,
    position: currentPosition, // Use tracked position instead of audioPlayer.currentTime
    duration: currentDuration, // Use tracked duration instead of audioPlayer.duration

    // Actions
    playClip,
    resumeClip,
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
