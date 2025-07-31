/**
 * Utility functions for formatting data
 */

/**
 * Format duration in milliseconds to MM:SS format
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDurationFromSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format date with smart Today/Yesterday handling
 */
export function formatDateSmart(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const fileDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (fileDate.getTime() === today.getTime()) {
    return 'Today'
  } else if (fileDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
}

/**
 * Generate a default recording name with gap-filling logic
 * Scans existing files to find the lowest available number in the "Recording X" sequence
 *
 * @param existingFileNames Array of existing file names in the target directory
 * @returns A filename like "Recording 1.m4a", "Recording 2.m4a", etc.
 */
export function generateRecordingFilename(existingFileNames: string[]): string {
  // Extract numbers from existing "Recording X" files
  const recordingNumbers = new Set<number>()

  existingFileNames.forEach(fileName => {
    // Match pattern: "Recording X" where X is a number (with or without .m4a extension)
    const match = fileName.match(/^Recording (\d+)(?:\.m4a)?$/i)
    if (match) {
      const number = parseInt(match[1], 10)
      if (!isNaN(number) && number > 0) {
        recordingNumbers.add(number)
      }
    }
  })

  // Find the lowest available number starting from 1
  let nextNumber = 1
  while (recordingNumbers.has(nextNumber)) {
    nextNumber++
  }

  return `Recording ${nextNumber}.m4a`
}
