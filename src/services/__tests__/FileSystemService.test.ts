import { fileSystemService } from '../FileSystemService'

// Mock expo-file-system for testing
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn(),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
}))

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}))

describe('FileSystemService', () => {
  beforeEach(() => {
    // Reset the service instance
    ;(fileSystemService as any).isInitialized = false
    ;(fileSystemService as any).webStorage = new Map()

    // Mock localStorage for web platform
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('initialization', () => {
    it('should initialize and create default folders and files', async () => {
      await fileSystemService.initialize()

      // Check that default folders are created
      const contents = await fileSystemService.getFolderContents('/muzimemo/recordings/')
      const folderNames = contents.filter(item => item.type === 'folder').map(item => item.name)

      expect(folderNames).toContain('Song Ideas')
      expect(folderNames).toContain('Demos')
      expect(folderNames).toContain('Voice Memos')
      expect(folderNames).toContain('Lyrics')
      expect(folderNames).toContain('Drafts')
    })

    it('should create default audio files in appropriate folders', async () => {
      await fileSystemService.initialize()

      // Check Song Ideas folder for audio files
      const songIdeasContents = await fileSystemService.getFolderContents('/muzimemo/recordings/Song Ideas/')
      const audioFiles = songIdeasContents.filter(item => item.type === 'file')

      expect(audioFiles.length).toBeGreaterThan(0)
      expect(audioFiles.some(file => file.name.includes('Guitar Riff Idea'))).toBe(true)
      expect(audioFiles.some(file => file.name.includes('Verse Melody'))).toBe(true)
    })
  })

  describe('file operations', () => {
    beforeEach(async () => {
      await fileSystemService.initialize()
    })

    it('should create a new file', async () => {
      const file = await fileSystemService.createFile({
        name: 'test-file.mp3',
        content: 'test content',
        parentPath: '/muzimemo/recordings/',
        extension: 'mp3',
        mimeType: 'audio/mp3',
      })

      expect(file.name).toBe('test-file.mp3')
      expect(file.type).toBe('file')
      expect(file.extension).toBe('mp3')
      expect(file.mimeType).toBe('audio/mp3')
    })

    it('should rename a file', async () => {
      // First create a file
      const file = await fileSystemService.createFile({
        name: 'original-name.mp3',
        parentPath: '/muzimemo/recordings/',
      })

      // Then rename it
      const renamedFile = await fileSystemService.renameFile({
        oldPath: file.path,
        newName: 'new-name.mp3',
      })

      expect(renamedFile.name).toBe('new-name.mp3')
      expect(renamedFile.path).toContain('new-name.mp3')
    })

    it('should move a file', async () => {
      // Create a folder and file
      await fileSystemService.createFolder({
        name: 'Test Folder',
        parentPath: '/muzimemo/recordings/',
      })

      const file = await fileSystemService.createFile({
        name: 'test-file.mp3',
        parentPath: '/muzimemo/recordings/',
      })

      // Move the file
      const movedFile = await fileSystemService.moveFile({
        sourcePath: file.path,
        destinationPath: '/muzimemo/recordings/Test Folder/test-file.mp3',
      })

      expect(movedFile.path).toBe('/muzimemo/recordings/Test Folder/test-file.mp3')
    })

    it('should delete a file', async () => {
      // Create a file
      const file = await fileSystemService.createFile({
        name: 'to-delete.mp3',
        parentPath: '/muzimemo/recordings/',
      })

      // Delete it
      await fileSystemService.deleteFile(file.path)

      // Verify it's gone
      const contents = await fileSystemService.getFolderContents('/muzimemo/recordings/')
      const deletedFile = contents.find(item => item.name === 'to-delete.mp3')
      expect(deletedFile).toBeUndefined()
    })
  })

  describe('error handling', () => {
    beforeEach(async () => {
      await fileSystemService.initialize()
    })

    it('should throw error when creating file with invalid name', async () => {
      await expect(
        fileSystemService.createFile({
          name: 'invalid/name.mp3',
          parentPath: '/muzimemo/recordings/',
        })
      ).rejects.toThrow()
    })

    it('should throw error when creating duplicate file', async () => {
      await fileSystemService.createFile({
        name: 'duplicate.mp3',
        parentPath: '/muzimemo/recordings/',
      })

      await expect(
        fileSystemService.createFile({
          name: 'duplicate.mp3',
          parentPath: '/muzimemo/recordings/',
        })
      ).rejects.toThrow()
    })

    it('should throw error when trying to delete non-existent file', async () => {
      await expect(fileSystemService.deleteFile('/muzimemo/recordings/non-existent.mp3')).rejects.toThrow()
    })
  })
})
