import { useState, useEffect, useCallback } from 'react'

import { audioService } from '@services/AudioService'
import { RecordingStatus } from 'src/customTypes/Recording'

/**
 * Custom hook for managing audio recording state and operations
 */
export function useAudioRecording() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize audio service on mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioService.initialize()
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize audio')
      }
    }

    initializeAudio()

    // Cleanup on unmount
    return () => {
      audioService.cleanup()
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

    try {
      setError(null)
      await audioService.startRecording()
      setStatus('recording')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }, [isInitialized])

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    try {
      setError(null)
      const uri = await audioService.stopRecording()
      setStatus('stopped')
      setDuration(0)
      return uri
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording')
      return null
    }
  }, [])

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
    isInitialized,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  }
}
