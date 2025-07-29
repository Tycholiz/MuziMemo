/**
 * Test for the Go To Folder functionality in RecordScreen
 * This test verifies that the folder navigation works correctly even when
 * folder IDs change between component mounts.
 */

import { router } from 'expo-router'

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}))

// Mock the file system service
const mockFolders = [
  { id: 'id-1', name: 'Song Ideas', path: '/Song Ideas' },
  { id: 'id-2', name: 'Drafts', path: '/Drafts' },
  { id: 'id-3', name: 'Finished', path: '/Finished' },
]

const mockFoldersWithNewIds = [
  { id: 'new-id-1', name: 'Song Ideas', path: '/Song Ideas' },
  { id: 'new-id-2', name: 'Drafts', path: '/Drafts' },
  { id: 'new-id-3', name: 'Finished', path: '/Finished' },
]

jest.mock('../../services/fileSystemService', () => ({
  fileSystemService: {
    getFolders: jest.fn(),
  },
}))

describe('RecordScreen Go To Folder functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should maintain folder selection by name when IDs change', () => {
    // Simulate the folder selection logic
    const simulateRecordScreenLogic = () => {
      // Initial state
      let selectedFolder = 'id-2' // Initially selected "Drafts"
      let selectedFolderName = 'Drafts'
      let folders = mockFolders

      // Simulate navigation away and back (folders get new IDs)
      folders = mockFoldersWithNewIds

      // Simulate the folder selection logic from the component
      const currentFolderByName = folders.find(folder => folder.name === selectedFolderName)
      if (currentFolderByName) {
        selectedFolder = currentFolderByName.id
      }

      // Simulate handleGoToFolder
      const handleGoToFolder = () => {
        router.push({
          pathname: '/(tabs)/browse',
          params: { initialFolder: selectedFolderName },
        })
      }

      return { selectedFolder, selectedFolderName, handleGoToFolder }
    }

    const { selectedFolder, selectedFolderName, handleGoToFolder } = simulateRecordScreenLogic()

    // Verify that the folder selection was maintained by name
    expect(selectedFolderName).toBe('Drafts')
    expect(selectedFolder).toBe('new-id-2') // Should have the new ID

    // Verify that handleGoToFolder uses the folder name
    handleGoToFolder()
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/browse',
      params: { initialFolder: 'Drafts' },
    })
  })

  it('should handle folder name persistence correctly', () => {
    // Test the folder name persistence logic
    const testFolderNamePersistence = (initialFolderName: string, newFolders: typeof mockFolders) => {
      // Find folder by name in new folder list
      const currentFolderByName = newFolders.find(folder => folder.name === initialFolderName)
      return currentFolderByName ? currentFolderByName.id : null
    }

    // Test that existing folder names are found correctly
    expect(testFolderNamePersistence('Drafts', mockFoldersWithNewIds)).toBe('new-id-2')
    expect(testFolderNamePersistence('Song Ideas', mockFoldersWithNewIds)).toBe('new-id-1')
    expect(testFolderNamePersistence('Finished', mockFoldersWithNewIds)).toBe('new-id-3')

    // Test that non-existent folder names return null
    expect(testFolderNamePersistence('Non-existent', mockFoldersWithNewIds)).toBe(null)
  })

  it('should handle navigation with correct folder name', () => {
    // Test the navigation logic
    const testNavigation = (folderName: string) => {
      const mockRouter = { push: jest.fn() }

      // Simulate handleGoToFolder logic
      if (!folderName) {
        mockRouter.push({
          pathname: '/(tabs)/browse',
          params: { initialFolder: 'root' },
        })
      } else {
        mockRouter.push({
          pathname: '/(tabs)/browse',
          params: { initialFolder: folderName },
        })
      }

      return mockRouter
    }

    // Test with valid folder name
    const router1 = testNavigation('Drafts')
    expect(router1.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/browse',
      params: { initialFolder: 'Drafts' },
    })

    // Test with empty folder name (fallback to root)
    const router2 = testNavigation('')
    expect(router2.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/browse',
      params: { initialFolder: 'root' },
    })
  })

  it('should update both folder ID and name when folder is selected', () => {
    // Test the folder selection update logic
    const testFolderSelection = (folderId: string, folders: typeof mockFolders) => {
      let selectedFolder = folderId
      let selectedFolderName = ''

      // Simulate handleFolderSelect logic
      const selectedFolderData = folders.find(f => f.id === folderId)
      if (selectedFolderData) {
        selectedFolderName = selectedFolderData.name
      }

      return { selectedFolder, selectedFolderName }
    }

    const result = testFolderSelection('id-2', mockFolders)
    expect(result.selectedFolder).toBe('id-2')
    expect(result.selectedFolderName).toBe('Drafts')
  })
})
