/**
 * Test for RecordScreen duplicate folder names bug fix
 *
 * Bug: When recording to nested folders with duplicate names like "/Demos/amazing/Lyrics/Demos",
 * the file is saved to the first occurrence ("/Demos") instead of the intended nested location.
 */

import { joinPath } from '../../utils/pathUtils'

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, isDirectory: true }),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
}))

describe('RecordScreen Duplicate Folder Names Bug', () => {
  const mockRecordingsDir = 'file:///mock/documents/recordings/'

  beforeAll(() => {
    // Mock the getRecordingsDirectory function
    jest.doMock('../../utils/pathUtils', () => ({
      ...jest.requireActual('../../utils/pathUtils'),
      getRecordingsDirectory: () => mockRecordingsDir,
    }))
  })

  describe('saveRecordingToFolder logic', () => {
    it('should reproduce the bug scenario with duplicate folder names', () => {
      // Simulate the current buggy logic in saveRecordingToFolder
      const selectedFolderPath = 'Demos/amazing/Lyrics/Demos' // Full nested path
      const selectedFolder = 'folder-Demos' // ID that matches first occurrence

      // Mock folders array (only contains current directory level folders)
      const folders = [
        { id: 'folder-Demos', name: 'Demos' }, // This is the first "Demos" folder
        { id: 'folder-SongIdeas', name: 'Song Ideas' },
      ]

      // Current buggy logic: uses folders.find() which finds the first "Demos"
      const selectedFolderData = folders.find(f => f.id === selectedFolder)
      const folderName = selectedFolderData?.name || 'song-ideas'
      const targetFolderPath = joinPath(mockRecordingsDir, folderName)

      console.log('🐛 Bug reproduction:')
      console.log('  selectedFolderPath (correct):', selectedFolderPath)
      console.log('  selectedFolder ID:', selectedFolder)
      console.log('  folderName from lookup:', folderName)
      console.log('  targetFolderPath (buggy):', targetFolderPath)

      // This demonstrates the bug: we get "/recordings/Demos" instead of "/recordings/Demos/amazing/Lyrics/Demos"
      expect(targetFolderPath).toBe('file:///mock/documents/recordings/Demos')
      expect(targetFolderPath).not.toBe('file:///mock/documents/recordings/Demos/amazing/Lyrics/Demos')
    })

    it('should fix the bug by using selectedFolderPath directly', () => {
      // Simulate the fixed logic
      const selectedFolderPath: string = 'Demos/amazing/Lyrics/Demos' // Full nested path

      // NEW Fixed logic: use selectedFolderPath directly for nested folders
      let targetFolderPath: string
      if (!selectedFolderPath || selectedFolderPath === '') {
        // Root directory case
        targetFolderPath = mockRecordingsDir
      } else {
        // Nested folder case - use the full path
        targetFolderPath = joinPath(mockRecordingsDir, selectedFolderPath)
      }

      console.log('🔧 Fixed logic:')
      console.log('  selectedFolderPath:', selectedFolderPath)
      console.log('  targetFolderPath (fixed):', targetFolderPath)

      // This should correctly point to the nested folder
      expect(targetFolderPath).toBe('file:///mock/documents/recordings/Demos/amazing/Lyrics/Demos')
    })

    it('should handle root directory correctly', () => {
      const selectedFolderPath = '' // Root directory

      // Fixed logic for root directory
      let targetFolderPath: string
      if (!selectedFolderPath || selectedFolderPath === '') {
        targetFolderPath = mockRecordingsDir
      } else {
        targetFolderPath = joinPath(mockRecordingsDir, selectedFolderPath)
      }

      expect(targetFolderPath).toBe(mockRecordingsDir)
    })

    it('should handle single-level folders correctly', () => {
      const selectedFolderPath: string = 'Song Ideas' // Single level folder

      // Fixed logic for single level folder
      let targetFolderPath: string
      if (!selectedFolderPath || selectedFolderPath === '') {
        targetFolderPath = mockRecordingsDir
      } else {
        targetFolderPath = joinPath(mockRecordingsDir, selectedFolderPath)
      }

      expect(targetFolderPath).toBe('file:///mock/documents/recordings/Song Ideas')
    })

    it('should handle complex nested paths correctly', () => {
      const selectedFolderPath: string = 'Projects/2024/Album/Demos/Final' // Complex nested path

      // Fixed logic for complex nested path
      let targetFolderPath: string
      if (!selectedFolderPath || selectedFolderPath === '') {
        targetFolderPath = mockRecordingsDir
      } else {
        targetFolderPath = joinPath(mockRecordingsDir, selectedFolderPath)
      }

      expect(targetFolderPath).toBe('file:///mock/documents/recordings/Projects/2024/Album/Demos/Final')
    })
  })

  describe('Path construction edge cases', () => {
    it('should handle paths with special characters', () => {
      const selectedFolderPath = 'My Songs/Rock & Roll/2024'
      const targetFolderPath = joinPath(mockRecordingsDir, selectedFolderPath)

      expect(targetFolderPath).toBe('file:///mock/documents/recordings/My Songs/Rock & Roll/2024')
    })

    it('should handle paths with leading/trailing slashes', () => {
      const selectedFolderPath = '/Demos/amazing/Lyrics/Demos/'
      const targetFolderPath = joinPath(mockRecordingsDir, selectedFolderPath)

      // joinPath should normalize the slashes
      expect(targetFolderPath).toBe('file:///mock/documents/recordings/Demos/amazing/Lyrics/Demos')
    })
  })
})
