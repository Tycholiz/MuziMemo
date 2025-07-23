/**
 * Recording type definitions
 */

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped'

export type Recording = {
  id: string
  name: string
  duration: number
  filePath: string
  createdAt: Date
  size: number
  format: string
}

export type RecordingSession = {
  id: string
  status: RecordingStatus
  startTime?: Date
  duration: number
  recording?: Recording
}
