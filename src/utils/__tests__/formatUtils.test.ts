/**
 * Tests for format utility functions
 */

import {
  formatDuration,
  formatDurationFromSeconds,
  formatDurationSmart,
  formatFileSize,
  formatDate,
  formatDateSmart,
  generateRecordingFilename,
} from '../formatUtils'

describe('formatUtils', () => {
  describe('formatDuration', () => {
    it('should format milliseconds to MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00')
      expect(formatDuration(1000)).toBe('00:01')
      expect(formatDuration(60000)).toBe('01:00')
      expect(formatDuration(90000)).toBe('01:30')
      expect(formatDuration(3661000)).toBe('61:01')
    })

    it('should handle fractional milliseconds', () => {
      expect(formatDuration(1500)).toBe('00:01')
      expect(formatDuration(59999)).toBe('00:59')
    })
  })

  describe('formatDurationFromSeconds', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDurationFromSeconds(0)).toBe('00:00')
      expect(formatDurationFromSeconds(1)).toBe('00:01')
      expect(formatDurationFromSeconds(60)).toBe('01:00')
      expect(formatDurationFromSeconds(90)).toBe('01:30')
      expect(formatDurationFromSeconds(3661)).toBe('61:01')
    })

    it('should handle large durations', () => {
      expect(formatDurationFromSeconds(7200)).toBe('120:00') // 2 hours
      expect(formatDurationFromSeconds(3599)).toBe('59:59')
    })
  })

  describe('formatDurationSmart', () => {
    it('should format short durations to MM:SS', () => {
      expect(formatDurationSmart(0)).toBe('00:00')
      expect(formatDurationSmart(1)).toBe('00:01')
      expect(formatDurationSmart(60)).toBe('01:00')
      expect(formatDurationSmart(90)).toBe('01:30')
      expect(formatDurationSmart(3599)).toBe('59:59') // 59:59 - just under 1 hour
    })

    it('should format long durations to HH:MM:SS', () => {
      expect(formatDurationSmart(3600)).toBe('01:00:00') // exactly 1 hour
      expect(formatDurationSmart(3661)).toBe('01:01:01') // 1 hour, 1 minute, 1 second
      expect(formatDurationSmart(7200)).toBe('02:00:00') // 2 hours
      expect(formatDurationSmart(7323)).toBe('02:02:03') // 2 hours, 2 minutes, 3 seconds
    })

    it('should handle fractional seconds', () => {
      expect(formatDurationSmart(1.7)).toBe('00:01')
      expect(formatDurationSmart(3600.9)).toBe('01:00:00')
    })

    it('should handle negative values', () => {
      expect(formatDurationSmart(-10)).toBe('00:00')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes to human readable format', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle fractional sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2621440)).toBe('2.5 MB')
    })

    it('should handle small sizes', () => {
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(1)).toBe('1 B')
    })
  })

  describe('formatDate', () => {
    it('should format date to readable string', () => {
      const testDate = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(testDate)

      // The exact format depends on locale, but should contain date components
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })
  })

  describe('formatDateSmart', () => {
    it('should return "Today" for today\'s date', () => {
      const today = new Date()
      expect(formatDateSmart(today)).toBe('Today')
    })

    it('should return "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatDateSmart(yesterday)).toBe('Yesterday')
    })

    it('should return formatted date for older dates', () => {
      const oldDate = new Date('2023-01-15')
      const result = formatDateSmart(oldDate)
      expect(result).toBe('Jan 14, 2023')
    })

    it('should handle different times on same day as today', () => {
      const todayMorning = new Date()
      todayMorning.setHours(8, 0, 0, 0)
      expect(formatDateSmart(todayMorning)).toBe('Today')

      const todayEvening = new Date()
      todayEvening.setHours(20, 0, 0, 0)
      expect(formatDateSmart(todayEvening)).toBe('Today')
    })
  })

  describe('generateRecordingFilename', () => {
    it('should generate "Recording 1.m4a" for empty directory', () => {
      const result = generateRecordingFilename([])
      expect(result).toBe('Recording 1.m4a')
    })

    it('should generate "Recording 1.m4a" when no recording files exist', () => {
      const existingFiles = ['some-other-file.txt', 'music.mp3', 'document.pdf']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 1.m4a')
    })

    it('should generate "Recording 2.m4a" when "Recording 1.m4a" exists', () => {
      const existingFiles = ['Recording 1.m4a', 'other-file.txt']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should fill gaps in sequence - missing Recording 2', () => {
      const existingFiles = ['Recording 1.m4a', 'Recording 3.m4a', 'Recording 4.m4a']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should fill gaps in sequence - missing Recording 1', () => {
      const existingFiles = ['Recording 2.m4a', 'Recording 3.m4a']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 1.m4a')
    })

    it('should continue sequence when no gaps exist', () => {
      const existingFiles = ['Recording 1.m4a', 'Recording 2.m4a', 'Recording 3.m4a']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 4.m4a')
    })

    it('should handle files without .m4a extension', () => {
      const existingFiles = ['Recording 1', 'Recording 3.m4a']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should be case insensitive', () => {
      const existingFiles = ['recording 1.m4a', 'RECORDING 3.M4A']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should ignore invalid recording names', () => {
      const existingFiles = [
        'Recording.m4a', // No number
        'Recording 0.m4a', // Zero (invalid)
        'Recording -1.m4a', // Negative (invalid)
        'Recording abc.m4a', // Non-numeric
        'Recording 1.m4a', // Valid
        'Recording 3.m4a', // Valid
        'My Recording 2.m4a', // Different pattern
      ]
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should handle large numbers correctly', () => {
      const existingFiles = ['Recording 1.m4a', 'Recording 100.m4a', 'Recording 1000.m4a']
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should handle mixed file types in directory', () => {
      const existingFiles = [
        'Recording 1.m4a',
        'folder1',
        'Recording 3.m4a',
        'image.jpg',
        'Recording 5.m4a',
        'document.pdf',
      ]
      const result = generateRecordingFilename(existingFiles)
      expect(result).toBe('Recording 2.m4a')
    })
  })
})
