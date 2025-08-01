import * as FileSystem from 'expo-file-system'

import {
  searchFileSystem,
  formatFolderPath,
  formatFilePath,
  formatFolderPathForRecent,
  truncatePathSmart,
  getParentDirectoryPath,
  truncatePath,
} from '../searchUtils'

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}))

// Mock pathUtils
jest.mock('../pathUtils', () => ({
  getRecordingsDirectory: jest.fn(() => 'file:///mock/documents/recordings/'),
}))

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock

describe('searchUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchFileSystem', () => {
    it('returns empty results for empty query', async () => {
      const results = await searchFileSystem('', { audio: true, folders: true, text: false, currentDirectoryOnly: false })

      expect(results).toEqual({
        audioFiles: [],
        folders: [],
      })
    })

    it('handles search errors gracefully', async () => {
      mockGetInfoAsync.mockRejectedValue(new Error('File system error'))

      const results = await searchFileSystem('test', { audio: true, folders: true, text: false, currentDirectoryOnly: false })

      expect(results).toEqual({
        audioFiles: [],
        folders: [],
      })
    })
  })

  describe('formatFolderPath', () => {
    it('formats empty path as home placeholder', () => {
      expect(formatFolderPath('')).toBe('[HOME]')
    })

    it('formats path with home placeholder and arrow separators', () => {
      expect(formatFolderPath('Music/Song Ideas/Demos')).toBe('[HOME] > Music > Song Ideas > Demos')
    })

    it('handles single folder with home placeholder', () => {
      expect(formatFolderPath('Music')).toBe('[HOME] > Music')
    })
  })

  describe('getParentDirectoryPath', () => {
    it('returns empty array for empty path', () => {
      expect(getParentDirectoryPath('')).toEqual([])
    })

    it('returns parent path components', () => {
      expect(getParentDirectoryPath('Music/Song Ideas/demo.mp3')).toEqual(['Music', 'Song Ideas'])
    })

    it('handles single level path', () => {
      expect(getParentDirectoryPath('demo.mp3')).toEqual([])
    })
  })

  describe('truncatePath', () => {
    it('returns path unchanged if under max length', () => {
      const shortPath = 'Music/Songs'
      expect(truncatePath(shortPath, 50)).toBe(shortPath)
    })

    it('truncates long paths with ellipsis', () => {
      const longPath = 'Music/Song Ideas/Demos/Very Long Folder Name/Another Folder/Final'
      const truncated = truncatePath(longPath, 30)
      
      expect(truncated).toHaveLength(30)
      expect(truncated.startsWith('...')).toBe(true)
    })

    it('uses default max length of 50', () => {
      const longPath = 'a'.repeat(60)
      const truncated = truncatePath(longPath)

      expect(truncated).toHaveLength(50)
      expect(truncated.startsWith('...')).toBe(true)
    })
  })

  describe('formatFilePath', () => {
    it('formats file path showing only directory with home placeholder', () => {
      expect(formatFilePath('Music/Song Ideas/demo.m4a')).toBe('[HOME] > Music > Song Ideas')
    })

    it('handles root level files', () => {
      expect(formatFilePath('demo.m4a')).toBe('[HOME]')
    })

    it('handles empty path', () => {
      expect(formatFilePath('')).toBe('[HOME]')
    })
  })

  describe('formatFolderPathForRecent', () => {
    it('formats folder path showing only parent directory', () => {
      expect(formatFolderPathForRecent('Music/Song Ideas/Demos')).toBe('[HOME] > Music > Song Ideas')
    })

    it('handles root level folders', () => {
      expect(formatFolderPathForRecent('Music')).toBe('[HOME]')
    })

    it('handles empty path', () => {
      expect(formatFolderPathForRecent('')).toBe('[HOME]')
    })
  })

  describe('truncatePathSmart', () => {
    it('returns path unchanged if within limit', () => {
      expect(truncatePathSmart('[HOME] > Music', 20)).toBe('[HOME] > Music')
    })

    it('truncates long paths intelligently', () => {
      const longPath = '[HOME] > Very > Long > Path > With > Many > Folders > Here'
      const result = truncatePathSmart(longPath, 30)
      expect(result).toMatch(/^\[HOME\] > \.\.\./)
      expect(result.length).toBeLessThanOrEqual(30)
    })

    it('handles paths without home placeholder', () => {
      const longPath = 'Very/Long/Path/With/Many/Folders/Here'
      const result = truncatePathSmart(longPath, 20)
      expect(result).toMatch(/^\.\.\./)
      expect(result.length).toBeLessThanOrEqual(20)
    })
  })
})
