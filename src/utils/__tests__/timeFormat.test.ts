import { formatTime, formatPlaybackTime } from '../timeFormat'

describe('timeFormat', () => {
  describe('formatTime', () => {
    it('formats seconds correctly for times under 1 minute', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(30)).toBe('00:30')
      expect(formatTime(59)).toBe('00:59')
    })

    it('formats minutes correctly for times under 1 hour', () => {
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(90)).toBe('01:30')
      expect(formatTime(3599)).toBe('59:59')
    })

    it('formats hours correctly for times over 1 hour', () => {
      expect(formatTime(3600)).toBe('01:00:00')
      expect(formatTime(3661)).toBe('01:01:01')
      expect(formatTime(7200)).toBe('02:00:00')
      expect(formatTime(7323)).toBe('02:02:03')
    })

    it('handles edge cases', () => {
      expect(formatTime(NaN)).toBe('00:00')
      expect(formatTime(-10)).toBe('00:00')
      expect(formatTime(0.5)).toBe('00:00') // Should floor decimal seconds
    })

    it('pads single digits with zeros', () => {
      expect(formatTime(65)).toBe('01:05')
      expect(formatTime(3665)).toBe('01:01:05')
    })
  })

  describe('formatPlaybackTime', () => {
    it('formats current time and duration correctly', () => {
      const result = formatPlaybackTime(30, 120)
      expect(result).toEqual({
        current: '00:30',
        total: '02:00',
        isValid: true,
      })
    })

    it('handles hour-long content', () => {
      const result = formatPlaybackTime(1800, 7200)
      expect(result).toEqual({
        current: '00:30:00',
        total: '02:00:00',
        isValid: true,
      })
    })

    it('marks invalid duration as not valid', () => {
      const result = formatPlaybackTime(30, NaN)
      expect(result).toEqual({
        current: '00:30',
        total: '00:00',
        isValid: false,
      })
    })

    it('marks zero duration as not valid', () => {
      const result = formatPlaybackTime(0, 0)
      expect(result).toEqual({
        current: '00:00',
        total: '00:00',
        isValid: false,
      })
    })

    it('marks negative duration as not valid', () => {
      const result = formatPlaybackTime(30, -10)
      expect(result).toEqual({
        current: '00:30',
        total: '00:00',
        isValid: false,
      })
    })

    it('handles current time exceeding duration', () => {
      const result = formatPlaybackTime(150, 120)
      expect(result).toEqual({
        current: '02:30',
        total: '02:00',
        isValid: true,
      })
    })
  })
})
