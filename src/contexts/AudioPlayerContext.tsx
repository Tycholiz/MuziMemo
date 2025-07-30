import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAudioPlayer } from 'expo-audio'

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

  const playClip = useCallback(
    async (clip: AudioClip) => {
      try {
        setIsLoading(true)
        setCurrentClip(clip)

        // Replace the source with the new clip
        audioPlayer.replace(clip.uri)

        audioPlayer.play()
      } catch (error) {
        console.error('Failed to play audio clip:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [audioPlayer]
  )

  const pauseClip = useCallback(() => {
    audioPlayer.pause()
  }, [audioPlayer])

  const stopClip = useCallback(() => {
    audioPlayer.pause()
    audioPlayer.seekTo(0)
  }, [audioPlayer])

  const seekTo = useCallback(
    (position: number) => {
      audioPlayer.seekTo(position)
    },
    [audioPlayer]
  )

  const cleanup = useCallback(() => {
    audioPlayer.pause()
    setCurrentClip(null)
  }, [audioPlayer])

  const value: AudioPlayerContextType = {
    // State
    currentClip,
    isPlaying: audioPlayer.playing,
    isLoading,
    position: audioPlayer.currentTime,
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
