import { useState, useEffect, useCallback, useRef } from 'react'
import { Platform } from 'react-native'

import { RecordingStatus } from 'src/customTypes/Recording'

// Import expo-audio conditionally
let useAudioRecorder: any = null
let AudioModule: any = null
let RecordingPresets: any = null

if (Platform.OS !== 'web') {
  try {
    const expoAudio = require('expo-audio')
    useAudioRecorder = expoAudio.useAudioRecorder
    AudioModule = expoAudio.AudioModule
    RecordingPresets = expoAudio.RecordingPresets
  } catch (error) {
    console.warn('expo-audio not available:', error)
  }
}

/**
 * Custom hook for managing audio recording state and operations
 */
export function useAudioRecording() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasPermissions, setHasPermissions] = useState(false)

  // Refs for tracking recording state
  const recordingStartTime = useRef<number | null>(null)
  const durationInterval = useRef<number | null>(null)
  const audioLevelInterval = useRef<number | null>(null)

  // Create audio recorder instance using expo-audio hook
  const audioRecorder =
    Platform.OS !== 'web' && useAudioRecorder && RecordingPresets
      ? useAudioRecorder(RecordingPresets.HIGH_QUALITY)
      : null

  // Initialize audio service on mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
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
    audioLevelInterval.current = setInterval(() => {
      // Generate random audio level for visualization (0-1)
      // In a real implementation, this would read from the actual audio input
      const level = Math.random() * 0.8 + 0.1 // Random between 0.1 and 0.9
      setAudioLevel(level)
    }, 100) // Update every 100ms for smooth animation
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
        await audioRecorder.prepareToRecordAsync()
        audioRecorder.record()
        setStatus('recording')
        startDurationTracking()
        startAudioLevelMonitoring()
      } else {
        setError('Audio recorder not available')
      }
    } catch (err) {
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
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
      return null
    }
  }, [stopDurationTracking, stopAudioLevelMonitoring, audioRecorder])

  /**
   * Pause recording (placeholder - not yet implemented)
   */
  const pauseRecording = useCallback(() => {
    // Note: Pause/resume functionality can be implemented with expo-audio
    // This is a placeholder for future implementation
    setStatus('paused')
  }, [])

  /**
   * Resume recording (placeholder - not yet implemented)
   */
  const resumeRecording = useCallback(() => {
    // Note: Pause/resume functionality can be implemented with expo-audio
    // This is a placeholder for future implementation
    setStatus('recording')
  }, [])

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
    requestPermissions,
  }
}
