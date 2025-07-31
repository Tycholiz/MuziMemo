/**
 * Tests for sort utilities
 */

import {
  sortAudioFiles,
  sortFolders,
  SORT_OPTIONS,
  DEFAULT_SORT_OPTION,
  getSortOptionData,
  isValidSortOption,
  SortableAudioFile,
} from '../sortUtils'

// Mock audio files for testing
const mockAudioFiles: SortableAudioFile[] = [
  {
    id: '1',
    name: 'Zebra Song.mp3',
    createdAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: '2', 
    name: 'Alpha Track.mp3',
    createdAt: new Date('2024-01-02T10:00:00Z'),
  },
  {
    id: '3',
    name: 'Beta Recording.mp3',
    createdAt: new Date('2024-01-03T10:00:00Z'),
  },
]

// Mock folders for testing
const mockFolders = [
  { id: '1', name: 'Zebra Folder' },
  { id: '2', name: 'Alpha Folder' },
  { id: '3', name: 'Beta Folder' },
]

describe('sortUtils', () => {
  describe('sortAudioFiles', () => {
    it('should sort files alphabetically A-Z', () => {
      const result = sortAudioFiles(mockAudioFiles, 'name-asc')
      expect(result.map(f => f.name)).toEqual([
        'Alpha Track.mp3',
        'Beta Recording.mp3', 
        'Zebra Song.mp3',
      ])
    })

    it('should sort files alphabetically Z-A', () => {
      const result = sortAudioFiles(mockAudioFiles, 'name-desc')
      expect(result.map(f => f.name)).toEqual([
        'Zebra Song.mp3',
        'Beta Recording.mp3',
        'Alpha Track.mp3',
      ])
    })

    it('should sort files by date newest first', () => {
      const result = sortAudioFiles(mockAudioFiles, 'date-newest')
      expect(result.map(f => f.name)).toEqual([
        'Beta Recording.mp3', // 2024-01-03
        'Alpha Track.mp3',    // 2024-01-02
        'Zebra Song.mp3',     // 2024-01-01
      ])
    })

    it('should sort files by date oldest first', () => {
      const result = sortAudioFiles(mockAudioFiles, 'date-oldest')
      expect(result.map(f => f.name)).toEqual([
        'Zebra Song.mp3',     // 2024-01-01
        'Alpha Track.mp3',    // 2024-01-02
        'Beta Recording.mp3', // 2024-01-03
      ])
    })

    it('should handle case-insensitive alphabetical sorting', () => {
      const files = [
        { id: '1', name: 'zebra.mp3', createdAt: new Date() },
        { id: '2', name: 'Alpha.mp3', createdAt: new Date() },
      ]
      const result = sortAudioFiles(files, 'name-asc')
      expect(result.map(f => f.name)).toEqual(['Alpha.mp3', 'zebra.mp3'])
    })

    it('should not mutate original array', () => {
      const original = [...mockAudioFiles]
      sortAudioFiles(mockAudioFiles, 'name-asc')
      expect(mockAudioFiles).toEqual(original)
    })
  })

  describe('sortFolders', () => {
    it('should sort folders alphabetically', () => {
      const result = sortFolders(mockFolders)
      expect(result.map(f => f.name)).toEqual([
        'Alpha Folder',
        'Beta Folder', 
        'Zebra Folder',
      ])
    })

    it('should not mutate original array', () => {
      const original = [...mockFolders]
      sortFolders(mockFolders)
      expect(mockFolders).toEqual(original)
    })
  })

  describe('getSortOptionData', () => {
    it('should return correct option data', () => {
      const option = getSortOptionData('name-asc')
      expect(option).toEqual({
        value: 'name-asc',
        label: 'Name (A-Z)',
        icon: 'arrow-up',
      })
    })

    it('should return undefined for invalid option', () => {
      const option = getSortOptionData('invalid' as any)
      expect(option).toBeUndefined()
    })
  })

  describe('isValidSortOption', () => {
    it('should return true for valid options', () => {
      expect(isValidSortOption('name-asc')).toBe(true)
      expect(isValidSortOption('name-desc')).toBe(true)
      expect(isValidSortOption('date-newest')).toBe(true)
      expect(isValidSortOption('date-oldest')).toBe(true)
    })

    it('should return false for invalid options', () => {
      expect(isValidSortOption('invalid')).toBe(false)
      expect(isValidSortOption('')).toBe(false)
    })
  })

  describe('constants', () => {
    it('should have correct default sort option', () => {
      expect(DEFAULT_SORT_OPTION).toBe('name-asc')
    })

    it('should have all required sort options', () => {
      expect(SORT_OPTIONS).toHaveLength(4)
      expect(SORT_OPTIONS.map(o => o.value)).toEqual([
        'name-asc',
        'name-desc', 
        'date-newest',
        'date-oldest',
      ])
    })
  })
})
