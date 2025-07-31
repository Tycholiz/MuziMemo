import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Platform } from 'react-native'

import { RecordingStatus } from 'src/customTypes/Recording'

// Import expo-audio conditionally
let useAudioRecorder: any = null
let useAudioRecorderState: any = null
let AudioModule: any = null
let setAudioModeAsync: any = null
let RecordingPresets: any = null

if (Platform.OS !== 'web') {
  try {
    const expoAudio = require('expo-audio')
    useAudioRecorder = expoAudio.useAudioRecorder
    useAudioRecorderState = expoAudio.useAudioRecorderState
    AudioModule = expoAudio.AudioModule
    setAudioModeAsync = expoAudio.setAudioModeAsync
    RecordingPresets = expoAudio.RecordingPresets
  } catch (error) {
    console.warn('expo-audio not available:', error)
  }
}

export type AudioQuality = 'high' | 'medium' | 'low'

/**
 * Custom hook for managing audio recording state and operations
 */
export function useAudioRecording(audioQuality: AudioQuality = 'high') {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasPermissions, setHasPermissions] = useState(false)

  // Refs for tracking recording state
  const recordingStartTime = useRef<number | null>(null)
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioLevelInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * Convert decibel value to normalized 0-1 range for UI
   * Typical microphone input ranges from -60dB (very quiet) to 0dB (loud)
   */
  const convertDecibelToLevel = useCallback((decibel: number): number => {
    if (decibel === undefined || decibel === null || decibel === -Infinity) {
      return 0 // Silence
    }

    // Clamp decibel value to reasonable range (-60dB to 0dB)
    const clampedDb = Math.max(-60, Math.min(0, decibel))

    // Convert to 0-1 range (0 = -60dB, 1 = 0dB)
    const normalized = (clampedDb + 60) / 60

    // Apply slight curve to make lower levels more visible
    return Math.pow(normalized, 0.7)
  }, [])

  // Map audio quality to recording presets with metering enabled
  const recordingPreset = useMemo(() => {
    if (!RecordingPresets) return null

    let basePreset
    switch (audioQuality) {
      case 'high':
      case 'medium': // Map medium to high since MEDIUM_QUALITY doesn't exist
        basePreset = RecordingPresets.HIGH_QUALITY
        break
      case 'low':
        basePreset = RecordingPresets.LOW_QUALITY
        break
      default:
        basePreset = RecordingPresets.HIGH_QUALITY
    }

    // Enable metering for real-time audio level detection
    return {
      ...basePreset,
      isMeteringEnabled: true,
    }
  }, [audioQuality])

  // Create audio recorder instance using expo-audio hook
  const audioRecorder =
    Platform.OS !== 'web' && useAudioRecorder && recordingPreset ? useAudioRecorder(recordingPreset) : null

  // Get real-time recorder state for metering data
  const recorderState =
    Platform.OS !== 'web' && useAudioRecorderState && audioRecorder
      ? useAudioRecorderState(audioRecorder, 50) // Update every 50ms for smooth real-time feedback
      : null

  // Initialize audio service on mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Set up audio mode for recording
        if (Platform.OS !== 'web' && setAudioModeAsync) {
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: true,
            shouldPlayInBackground: false,
            // Add iOS-specific audio session category
            ...(Platform.OS === 'ios' && {
              iosCategory: 'playAndRecord',
              iosCategoryMode: 'default',
              iosCategoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
            }),
          })
        }

        setIsInitialized(true)

        // Check if we already have permissions
        if (Platform.OS !== 'web' && AudioModule) {
          const { status: permissionStatus } = await AudioModule.getRecordingPermissionsAsync()
          setHasPermissions(permissionStatus === 'granted')
        } else {
          setHasPermissions(true) // Web permissions handled differently
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize audio')
      }
    }

    initializeAudio()

    // Cleanup on unmount
    return () => {
      // Clear intervals
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current)
      }
    }
  }, [])

  // Effect to monitor real-time audio levels from recorder state
  useEffect(() => {
    if (recorderState && recorderState.isRecording && recorderState.metering !== undefined) {
      // Convert decibel metering value to 0-1 range for UI
      const normalizedLevel = convertDecibelToLevel(recorderState.metering)
      setAudioLevel(normalizedLevel)
    } else if (recorderState && !recorderState.isRecording) {
      // Reset audio level when not recording
      setAudioLevel(0)
    }
  }, [recorderState, convertDecibelToLevel])

  // Helper function to start duration tracking
  const startDurationTracking = useCallback(() => {
    recordingStartTime.current = Date.now()
    setDuration(0)

    durationInterval.current = setInterval(() => {
      if (recordingStartTime.current) {
        const elapsed = Math.floor((Date.now() - recordingStartTime.current) / 1000)
        setDuration(elapsed)
      }
    }, 1000)
  }, [])

  // Helper function to stop duration tracking
  const stopDurationTracking = useCallback(() => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }
    recordingStartTime.current = null
  }, [])

  // Helper function to start audio level monitoring
  const startAudioLevelMonitoring = useCallback(() => {
    // Note: Real-time audio level updates are now handled by the recorderState effect
    // This function is kept for compatibility but doesn't need to do anything
    // since we're using useAudioRecorderState for real-time metering data
  }, [])

  // Helper function to stop audio level monitoring
  const stopAudioLevelMonitoring = useCallback(() => {
    if (audioLevelInterval.current) {
      clearInterval(audioLevelInterval.current)
      audioLevelInterval.current = null
    }
    setAudioLevel(0)
  }, [])

  /**
   * Request recording permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      if (Platform.OS === 'web') {
        // Web permissions are handled by getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          setHasPermissions(true)
          return true
        } catch (error) {
          setHasPermissions(false)
          return false
        }
      } else if (AudioModule) {
        const { status } = await AudioModule.requestRecordingPermissionsAsync()
        const granted = status === 'granted'
        setHasPermissions(granted)
        return granted
      } else {
        setError('Audio module not available')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permissions')
      return false
    }
  }, [])

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    if (!isInitialized) {
      setError('Audio service not initialized')
      return
    }

    // Check permissions first
    if (!hasPermissions) {
      const granted = await requestPermissions()
      if (!granted) {
        setError('Recording permission is required to record audio')
        return
      }
    }

    try {
      setError(null)

      if (Platform.OS === 'web') {
        // Web implementation would go here
        setError('Web recording not yet implemented')
        return
      } else if (audioRecorder) {
        // Use expo-audio recorder

        // Set audio mode for recording before preparing
        if (setAudioModeAsync) {
          try {
            await setAudioModeAsync({
              playsInSilentMode: true,
              allowsRecording: true,
              shouldPlayInBackground: false,
              // Add iOS-specific audio session category for recording
              ...(Platform.OS === 'ios' && {
                iosCategory: 'playAndRecord',
                iosCategoryMode: 'default',
                iosCategoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
              }),
            })
          } catch (audioModeError) {
            console.warn('Failed to set audio mode for recording:', audioModeError)
          }
        }

        // Prepare and start recording
        await audioRecorder.prepareToRecordAsync()
        await audioRecorder.record()
        setStatus('recording')
        startDurationTracking()
        startAudioLevelMonitoring()
      } else {
        setError('Audio recorder not available')
      }
    } catch (err) {
      console.error('Start recording error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }, [
    isInitialized,
    hasPermissions,
    requestPermissions,
    startDurationTracking,
    startAudioLevelMonitoring,
    audioRecorder,
  ])

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    try {
      setError(null)
      stopDurationTracking()
      stopAudioLevelMonitoring()

      if (Platform.OS === 'web') {
        // Web implementation would go here
        setStatus('stopped')
        return null
      } else if (audioRecorder) {
        // Use expo-audio recorder
        await audioRecorder.stop()
        const uri = audioRecorder.uri
        setStatus('stopped')
        return uri
      } else {
        setError('Audio recorder not available')
        setStatus('stopped')
        return null
      }
    } catch (err) {
      console.error('Stop recording error:', err)
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
      return null
    }
  }, [stopDurationTracking, stopAudioLevelMonitoring, audioRecorder])

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(async () => {
    try {
      setError(null)

      if (Platform.OS === 'web') {
        // Web implementation would go here
        setStatus('paused')
        stopAudioLevelMonitoring()
        // Keep duration tracking running but pause the timer
        if (durationInterval.current) {
          clearInterval(durationInterval.current)
          durationInterval.current = null
        }
      } else if (audioRecorder) {
        audioRecorder.pause()
        setStatus('paused')
        stopAudioLevelMonitoring()
        // Keep duration tracking running but pause the timer
        if (durationInterval.current) {
          clearInterval(durationInterval.current)
          durationInterval.current = null
        }
      } else {
        setError('Audio recorder not available')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause recording')
    }
  }, [audioRecorder, stopAudioLevelMonitoring])

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(async () => {
    try {
      setError(null)

      if (Platform.OS === 'web') {
        // Web implementation would go here
        setStatus('recording')
        startAudioLevelMonitoring()
        // Resume duration tracking from where we left off
        if (recordingStartTime.current) {
          durationInterval.current = setInterval(() => {
            if (recordingStartTime.current) {
              const elapsed = Math.floor((Date.now() - recordingStartTime.current) / 1000)
              setDuration(elapsed)
            }
          }, 1000)
        }
      } else if (audioRecorder) {
        audioRecorder.record()
        setStatus('recording')
        startAudioLevelMonitoring()
        // Resume duration tracking from where we left off
        if (recordingStartTime.current) {
          durationInterval.current = setInterval(() => {
            if (recordingStartTime.current) {
              const elapsed = Math.floor((Date.now() - recordingStartTime.current) / 1000)
              setDuration(elapsed)
            }
          }, 1000)
        }
      } else {
        setError('Audio recorder not available')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume recording')
    }
  }, [audioRecorder, startAudioLevelMonitoring])

  /**
   * Reset recording state to initial values
   */
  const resetRecording = useCallback(() => {
    setStatus('idle')
    setDuration(0)
    setError(null)
    setAudioLevel(0)
    stopDurationTracking()
    stopAudioLevelMonitoring()
  }, [stopDurationTracking, stopAudioLevelMonitoring])

  return {
    status,
    duration,
    audioLevel,
    isInitialized,
    hasPermissions,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    requestPermissions,
  }
}
