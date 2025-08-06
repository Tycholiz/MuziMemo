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

  // State to track if audio has completed (reached the end)
  const [hasCompleted, setHasCompleted] = useState(false)

  // Ref for position polling interval
  const positionPollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start/stop position polling based on playback state
  useEffect(() => {
    const isActuallyPlaying = isPlayingOverride || audioPlayer.playing

    if (isActuallyPlaying && currentClip) {
      // Start polling for position updates every 16ms for smooth 60 FPS animation
      if (!positionPollingInterval.current) {
        console.log('🎵 AudioPlayerContext: Starting high-frequency position polling (60 FPS)')
        positionPollingInterval.current = setInterval(() => {
          const newPosition = audioPlayer.currentTime || 0
          const duration = audioPlayer.duration || 0

          setCurrentPosition(newPosition)

          // Debug logging for completion detection
          if (duration > 0 && newPosition >= duration - 0.5) { // Wider tolerance for debugging
            console.log('🎵 DEBUG: Near completion - position:', newPosition, 'duration:', duration, 'hasCompleted:', hasCompleted, 'audioPlayer.playing:', audioPlayer.playing, 'isPlayingOverride:', isPlayingOverride)
          }

          // Check if audio has completed (reached the end) - only log once
          if (duration > 0 && newPosition >= duration - 0.1 && !hasCompleted) { // 0.1s tolerance for completion
            console.log('🎵 AudioPlayerContext: Audio completed - setting hasCompleted=true, isPlayingOverride=false')
            setHasCompleted(true)
            setIsPlayingOverride(false) // Stop playing when audio completes
          }
        }, 16) // 16ms = ~60 FPS for smooth animation
      }
    } else {
      // Stop polling when not playing, but keep position if audio completed
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
  }, [isPlayingOverride, audioPlayer.playing, currentClip, audioPlayer, hasCompleted])

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

        const isSameClip = currentClip && currentClip.id === clip.id
        const shouldRestart = isSameClip && hasCompleted
        const shouldResume = isSameClip && !hasCompleted

        // Case 1: Restart completed audio from beginning
        if (shouldRestart) {
          console.log('🎵 AudioPlayerContext: Restarting completed audio from beginning')
          audioPlayer.seekTo(0)
          setCurrentPosition(0)
          setHasCompleted(false)
          setIsPlayingOverride(true)
          audioPlayer.play()
          return
        }

        // Case 2: Resume paused audio (same clip, not completed)
        if (shouldResume) {
          console.log('🎵 AudioPlayerContext: Resuming paused audio from position:', currentPosition)
          setIsPlayingOverride(true)
          audioPlayer.play()
          return
        }

        // Case 3: Play new clip (different clip or no current clip)
        console.log('🎵 AudioPlayerContext: Loading new audio clip')

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
        setHasCompleted(false) // Reset completion state
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
        setHasCompleted(false)
      } finally {
        setIsLoading(false)
      }
    },
    [audioPlayer, currentClip, hasCompleted, currentPosition]
  )

  const pauseClip = useCallback(() => {
    console.log('🎵 AudioPlayerContext: pauseClip called')
    audioPlayer.pause()
    setIsPlayingOverride(false)
    // Don't reset hasCompleted when pausing - user might want to resume
  }, [audioPlayer])

  const stopClip = useCallback(() => {
    console.log('🎵 AudioPlayerContext: stopClip called')
    audioPlayer.pause()
    audioPlayer.seekTo(0)
    setCurrentPosition(0)
    setHasCompleted(false)
    setIsPlayingOverride(false)
  }, [audioPlayer])

  const seekTo = useCallback(
    (position: number) => {
      audioPlayer.seekTo(position)
      setCurrentPosition(position) // Update tracked position immediately
      setHasCompleted(false) // Reset completion state when seeking
    },
    [audioPlayer]
  )

  const cleanup = useCallback(() => {
    console.log('🎵 AudioPlayerContext: cleanup called')
    audioPlayer.pause()
    setCurrentClip(null)
    setCurrentPosition(0)
    setHasCompleted(false)
    setIsPlayingOverride(false)
  }, [audioPlayer])

  // Sync override state with actual audio player state
  useEffect(() => {
    if (isPlayingOverride && audioPlayer.playing) {
      // Audio player has caught up, disable override
      setIsPlayingOverride(false)
    }

    // Detect audio completion when audioPlayer.playing becomes false
    // but we still have a current clip and haven't explicitly paused
    if (!audioPlayer.playing && currentClip && !hasCompleted && currentPosition > 0) {
      const duration = audioPlayer.duration || 0
      // Check if we're near the end (within 1 second) when audio stops
      if (duration > 0 && currentPosition >= duration - 1) {
        console.log('🎵 AudioPlayerContext: Audio completion detected via playing state change')
        setHasCompleted(true)
        setIsPlayingOverride(false)
      }
    }

    // Note: We no longer automatically clear currentClip when audio stops
    // This allows the media player to remain visible after audio completion
  }, [audioPlayer.playing, isPlayingOverride, currentClip, hasCompleted, currentPosition, audioPlayer.duration])

  // Debug the isPlaying calculation
  const calculatedIsPlaying = isPlayingOverride || audioPlayer.playing

  // Log when there's a state change that might affect the UI
  useEffect(() => {
    if (hasCompleted) {
      console.log('🎵 DEBUG: hasCompleted=true, isPlayingOverride:', isPlayingOverride, 'audioPlayer.playing:', audioPlayer.playing, 'calculatedIsPlaying:', calculatedIsPlaying)
    }
  }, [hasCompleted, isPlayingOverride, audioPlayer.playing, calculatedIsPlaying])

  const value: AudioPlayerContextType = {
    // State
    currentClip,
    isPlaying: calculatedIsPlaying,
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
