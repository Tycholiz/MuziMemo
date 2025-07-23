import { Audio } from 'expo-av'

import type { Recording, RecordingSession } from '@types/Recording'

/**
 * Audio service for handling recording and playback functionality
 */
export class AudioService {
  private recording: Audio.Recording | null = null
  private sound: Audio.Sound | null = null

  /**
   * Initialize audio service and set audio mode
   */
  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })
    } catch (error) {
      console.error('Failed to initialize audio service:', error)
      throw error
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<Audio.Recording> {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted')
      }

      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY)
      await recording.startAsync()

      this.recording = recording
      return recording
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  /**
   * Stop recording audio
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null
      }

      await this.recording.stopAndUnloadAsync()
      const uri = this.recording.getURI()
      this.recording = null

      return uri
    } catch (error) {
      console.error('Failed to stop recording:', error)
      throw error
    }
  }

  /**
   * Play audio from URI
   */
  async playAudio(uri: string): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync()
      }

      const { sound } = await Audio.Sound.createAsync({ uri })
      this.sound = sound
      await sound.playAsync()
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
      if (this.sound) {
        await this.sound.stopAsync()
        await this.sound.unloadAsync()
        this.sound = null
      }
    } catch (error) {
      console.error('Failed to stop playback:', error)
      throw error
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): Audio.RecordingStatus | null {
    return this.recording?.getStatusAsync() || null
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync()
        this.recording = null
      }
      if (this.sound) {
        await this.sound.unloadAsync()
        this.sound = null
      }
    } catch (error) {
      console.error('Failed to cleanup audio service:', error)
    }
  }
}

export const audioService = new AudioService()
