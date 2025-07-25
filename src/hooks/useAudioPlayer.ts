import { useState, useEffect, useCallback, useRef } from 'react'
import { Platform } from 'react-native'

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error'

export type AudioPlayerState = {
  status: PlaybackStatus
  currentTime: number
  duration: number
  isLoaded: boolean
  error: string | null
  currentTrack: string | null
}

// Import expo-audio conditionally
let useAudioPlayer: any = null
let createAudioPlayer: any = null
let setAudioModeAsync: any = null

if (Platform.OS !== 'web') {
  try {
    const expoAudio = require('expo-audio')
    useAudioPlayer = expoAudio.useAudioPlayer
    createAudioPlayer = expoAudio.createAudioPlayer
    setAudioModeAsync = expoAudio.setAudioModeAsync
    console.log('expo-audio imported successfully for playback')
  } catch (error) {
    console.warn('expo-audio not available:', error)
  }
}

/**
 * Custom hook for managing audio playback state and operations
 */
export function useAudioPlayerHook() {
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)

  // Refs for tracking state
  const timeUpdateInterval = useRef<number | null>(null)
  const webAudioRef = useRef<HTMLAudioElement | null>(null)

  // Create audio player instance using expo-audio hook (for native)
  const audioPlayer = Platform.OS !== 'web' && useAudioPlayer ? useAudioPlayer() : null

  // Initialize audio mode for playback
  useEffect(() => {
    const initializeAudioMode = async () => {
      if (Platform.OS !== 'web' && setAudioModeAsync) {
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
            shouldPlayInBackground: false,
            // Force audio to use main speaker for playback
            ...(Platform.OS === 'ios' && {
              iosCategory: 'playback',
              iosCategoryMode: 'default',
              iosCategoryOptions: ['defaultToSpeaker'],
            }),
          })
          console.log('Audio mode set for playback - using main speaker')
        } catch (error) {
          console.warn('Failed to set audio mode:', error)
        }
      }
    }

    initializeAudioMode()
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current)
      timeUpdateInterval.current = null
    }

    if (Platform.OS === 'web' && webAudioRef.current) {
      webAudioRef.current.pause()
      webAudioRef.current = null
    }

    setStatus('idle')
    setCurrentTime(0)
    setDuration(0)
    setIsLoaded(false)
    setError(null)
  }, [])

  // Load audio file
  const loadAudio = useCallback(
    async (uri: string) => {
      try {
        console.log('=== AUDIO PLAYER DEBUG ===')
        console.log('Loading audio from URI:', uri)
        console.log('Platform:', Platform.OS)

        // Set audio mode for playback before loading
        if (Platform.OS !== 'web' && setAudioModeAsync) {
          try {
            await setAudioModeAsync({
              playsInSilentMode: true,
              allowsRecording: false,
              shouldPlayInBackground: false,
              // Force audio to use main speaker for playback
              ...(Platform.OS === 'ios' && {
                iosCategory: 'playback',
                iosCategoryMode: 'default',
                iosCategoryOptions: ['defaultToSpeaker'],
              }),
            })
            console.log('Audio mode set for playback before loading')
          } catch (audioModeError) {
            console.warn('Failed to set audio mode for playback:', audioModeError)
          }
        }

        setError(null)
        setStatus('loading')

        // Clean up previous audio
        cleanup()

        if (Platform.OS === 'web') {
          // Web implementation using HTML5 Audio
          const audio = new Audio(uri)
          webAudioRef.current = audio

          audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration)
            setIsLoaded(true)
            setStatus('stopped')
          })

          audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime)
          })

          audio.addEventListener('ended', () => {
            setStatus('stopped')
            setCurrentTime(0)
          })

          audio.addEventListener('error', () => {
            setError('Failed to load audio file')
            setStatus('error')
          })

          // Load the audio
          audio.load()
        } else if (audioPlayer) {
          // Native implementation using expo-audio
          console.log('Using expo-audio for playback')
          console.log('AudioPlayer available:', !!audioPlayer)

          // Check if file exists first
          const FileSystem = require('expo-file-system')
          const fileInfo = await FileSystem.getInfoAsync(uri)
          console.log('File exists:', fileInfo.exists)
          console.log('File info:', JSON.stringify(fileInfo, null, 2))

          if (!fileInfo.exists) {
            throw new Error(`Audio file does not exist: ${uri}`)
          }

          audioPlayer.replace({ uri })
          console.log('Audio replaced with URI:', uri)

          // Wait for the audio to load
          // Note: expo-audio handles loading automatically
          setIsLoaded(true)
          setStatus('stopped')
          setDuration(audioPlayer.duration || 0)
          console.log('Audio duration:', audioPlayer.duration)

          // Set up time tracking
          timeUpdateInterval.current = setInterval(() => {
            if (audioPlayer.playing) {
              setCurrentTime(audioPlayer.currentTime || 0)
              setDuration(audioPlayer.duration || 0)
            }
          }, 100)
        } else {
          throw new Error('Audio player not available')
        }

        setCurrentTrack(uri)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audio')
        setStatus('error')
      }
    },
    [audioPlayer, cleanup]
  )

  // Play audio
  const play = useCallback(async () => {
    try {
      console.log('=== PLAY AUDIO DEBUG ===')
      console.log('Attempting to play audio')
      console.log('Current status:', status)
      console.log('Is loaded:', isLoaded)
      console.log('Current track:', currentTrack)

      setError(null)

      if (Platform.OS === 'web' && webAudioRef.current) {
        console.log('Playing via web audio')
        await webAudioRef.current.play()
        setStatus('playing')
      } else if (audioPlayer) {
        console.log('Playing via expo-audio')
        console.log('AudioPlayer playing before:', audioPlayer.playing)
        console.log('AudioPlayer paused before:', audioPlayer.paused)

        audioPlayer.play()

        console.log('AudioPlayer playing after:', audioPlayer.playing)
        console.log('AudioPlayer paused after:', audioPlayer.paused)
        setStatus('playing')
      } else {
        throw new Error('No audio loaded')
      }
    } catch (err) {
      console.error('Play error:', err)
      setError(err instanceof Error ? err.message : 'Failed to play audio')
      setStatus('error')
    }
  }, [audioPlayer, status, isLoaded, currentTrack])

  // Pause audio
  const pause = useCallback(async () => {
    try {
      setError(null)

      if (Platform.OS === 'web' && webAudioRef.current) {
        webAudioRef.current.pause()
        setStatus('paused')
      } else if (audioPlayer) {
        audioPlayer.pause()
        setStatus('paused')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause audio')
    }
  }, [audioPlayer])

  // Stop audio
  const stop = useCallback(async () => {
    try {
      setError(null)

      if (Platform.OS === 'web' && webAudioRef.current) {
        webAudioRef.current.pause()
        webAudioRef.current.currentTime = 0
        setCurrentTime(0)
        setStatus('stopped')
      } else if (audioPlayer) {
        audioPlayer.pause()
        audioPlayer.seekTo(0)
        setCurrentTime(0)
        setStatus('stopped')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop audio')
    }
  }, [audioPlayer])

  // Seek to position
  const seekTo = useCallback(
    async (seconds: number) => {
      try {
        setError(null)

        if (Platform.OS === 'web' && webAudioRef.current) {
          webAudioRef.current.currentTime = seconds
          setCurrentTime(seconds)
        } else if (audioPlayer) {
          audioPlayer.seekTo(seconds)
          setCurrentTime(seconds)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to seek audio')
      }
    },
    [audioPlayer]
  )

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (status === 'playing') {
      await pause()
    } else if (status === 'paused' || status === 'stopped') {
      await play()
    }
  }, [status, play, pause])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    // State
    status,
    currentTime,
    duration,
    isLoaded,
    error,
    currentTrack,

    // Actions
    loadAudio,
    play,
    pause,
    stop,
    seekTo,
    togglePlayPause,
    cleanup,
  }
}
