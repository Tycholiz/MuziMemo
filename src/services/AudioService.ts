import { Platform } from 'react-native'

// Conditional import for expo-audio (only on native platforms)
let AudioModule: any = null
let RecordingPresets: any = null

if (Platform.OS !== 'web') {
  try {
    const expoAudio = require('expo-audio')
    console.log('expoAudio imported successfully')
    AudioModule = expoAudio.AudioModule
    RecordingPresets = expoAudio.RecordingPresets
  } catch (error) {
    console.warn('expo-audio not available:', error)
  }
}

/**
 * Audio service for handling recording and playback functionality
 * Supports both native platforms (with expo-audio) and web (with fallback)
 */
export class AudioService {
  private recording: any = null
  private player: any = null
  private mediaRecorder: MediaRecorder | null = null

  /**
   * Initialize audio service and set audio mode
   */
  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web initialization
        if (typeof window !== 'undefined' && 'MediaRecorder' in window) {
          // Web audio is available
          console.log('Web audio initialized')
        } else {
          throw new Error('Web audio not supported in this browser')
        }
      } else {
        // Native initialization - expo-audio handles this automatically
        console.log('Native audio initialized')
      }
    } catch (error) {
      console.error('Failed to initialize audio service:', error)
      throw error
    }
  }

  /**
   * Check if recording permissions are granted
   */
  async hasRecordingPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web permissions are handled by getUserMedia
        return true
      } else {
        if (!AudioModule) {
          console.warn('AudioModule not available')
          return false
        }

        const { status } = await AudioModule.getRecordingPermissionsAsync()
        return status === 'granted'
      }
    } catch (error) {
      console.error('Failed to check recording permissions:', error)
      return false
    }
  }

  /**
   * Request recording permissions
   */
  async requestRecordingPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web permissions are handled by getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          // Stop the stream immediately as we just wanted to check permissions
          stream.getTracks().forEach(track => track.stop())
          return true
        } catch (error) {
          console.error('Web audio permission denied:', error)
          return false
        }
      } else {
        if (!AudioModule) {
          console.warn('AudioModule not available')
          return false
        }

        const { status } = await AudioModule.requestRecordingPermissionsAsync()
        return status === 'granted'
      }
    } catch (error) {
      console.error('Failed to request recording permissions:', error)
      return false
    }
  }

  /**
   * Start recording audio
   * Note: This method is deprecated in favor of using useAudioRecorder hook directly
   */
  async startRecording(): Promise<any> {
    throw new Error('AudioService.startRecording is deprecated. Use useAudioRecorder hook instead.')
  }

  /**
   * Stop recording audio
   * Note: This method is deprecated in favor of using useAudioRecorder hook directly
   */
  async stopRecording(): Promise<string | null> {
    throw new Error('AudioService.stopRecording is deprecated. Use useAudioRecorder hook instead.')
  }

  /**
   * Play audio from URI
   */
  async playAudio(uri: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web implementation using HTML5 Audio
        if (this.player) {
          this.player.pause()
          this.player = null
        }

        this.player = new Audio(uri)
        await this.player.play()
      } else {
        // Native implementation using expo-audio
        if (!AudioPlayer) {
          throw new Error('AudioPlayer not available on this platform')
        }

        if (this.player) {
          this.player.remove()
        }

        this.player = new AudioPlayer({ uri }, 100)
        await this.player.play()
      }
    } catch (error) {
      console.error('Failed to play audio:', error)
      throw error
    }
  }

  /**
   * Stop audio playback
   */
  async stopPlayback(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (this.player) {
          this.player.pause()
          this.player = null
        }
      } else {
        if (this.player) {
          await this.player.pause()
          this.player.remove()
          this.player = null
        }
      }
    } catch (error) {
      console.error('Failed to stop playback:', error)
      throw error
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): boolean {
    if (Platform.OS === 'web') {
      return this.mediaRecorder?.state === 'recording' || false
    } else {
      return this.recording?.isRecording || false
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop()
        }
        this.mediaRecorder = null
        if (this.player) {
          this.player.pause()
          this.player = null
        }
      } else {
        if (this.recording) {
          await this.recording.stop()
          this.recording = null
        }
        if (this.player) {
          this.player.remove()
          this.player = null
        }
      }
    } catch (error) {
      console.error('Failed to cleanup audio service:', error)
    }
  }
}

export const audioService = new AudioService()
