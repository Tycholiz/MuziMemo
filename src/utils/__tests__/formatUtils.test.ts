import { formatDuration, formatDurationFromSeconds } from '../formatUtils'

describe('formatUtils', () => {
  describe('formatDuration', () => {
    it('should format milliseconds to MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00')
      expect(formatDuration(1000)).toBe('00:01')
      expect(formatDuration(60000)).toBe('01:00')
      expect(formatDuration(90000)).toBe('01:30')
      expect(formatDuration(3661000)).toBe('61:01')
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
  })
})
