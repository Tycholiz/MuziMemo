/**
 * Time formatting utilities for audio playback
 */

/**
 * Formats time in seconds to MM:SS or HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    // Format as HH:MM:SS for clips longer than 1 hour
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    // Format as MM:SS for clips under 1 hour
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

/**
 * Formats current time and duration for display
 * @param currentTime - Current playback position in seconds
 * @param duration - Total duration in seconds
 * @returns Object with formatted current time and duration
 */
export function formatPlaybackTime(currentTime: number, duration: number) {
  // If duration is over 1 hour, format both times with hours
  const shouldShowHours = duration >= 3600

  const formatTimeWithHours = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) {
      return shouldShowHours ? '00:00:00' : '00:00'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    if (shouldShowHours) {
      // Always format as HH:MM:SS when duration is over 1 hour
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      // Format as MM:SS when duration is under 1 hour
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }

  return {
    current: formatTimeWithHours(currentTime),
    total: formatTimeWithHours(duration),
    isValid: !isNaN(duration) && duration > 0,
  }
}
