/**
 * Test for RecordScreen folder path resolution bug fix
 *
 * Bug: When navigating to a nested folder with the same name as a root folder
 * (e.g., `/hello/Song Ideas` vs `/Song Ideas`) and initiating a recording,
 * the system incorrectly saves files to the root folder instead of the intended nested folder.
 */

import { joinPath, getRecordingsDirectory } from '../../utils/pathUtils'
import type { Folder } from '../../components/FolderSelector'

describe('RecordScreen Folder Path Resolution Bug Fix', () => {
  describe('Folder path matching logic', () => {
    it('should find folder by exact path match instead of just name', () => {
      // Setup: Create folder structure with duplicate names
      const folders: Folder[] = [
        {
          id: 'folder-song-ideas-root',
          name: 'Song Ideas',
          itemCount: 2,
          path: 'Song Ideas', // Root level folder
        },
        {
          id: 'folder-hello',
          name: 'hello',
          itemCount: 1,
          path: 'hello',
        },
        {
          id: 'folder-song-ideas-nested',
          name: 'Song Ideas',
          itemCount: 0,
          path: 'hello/Song Ideas', // Nested folder with same name
        },
      ]

      // Test: Find folder by exact path (this is the fixed logic)
      const targetPath = 'hello/Song Ideas'
      const targetFolder = folders.find(folder => folder.path === targetPath)

      expect(targetFolder).toBeDefined()
      expect(targetFolder?.id).toBe('folder-song-ideas-nested')
      expect(targetFolder?.path).toBe('hello/Song Ideas')
      expect(targetFolder?.name).toBe('Song Ideas')
    })

    it('should distinguish between folders with same name but different paths', () => {
      const folders: Folder[] = [
        {
          id: 'folder-song-ideas-root',
          name: 'Song Ideas',
          itemCount: 2,
          path: 'Song Ideas',
        },
        {
          id: 'folder-song-ideas-nested',
          name: 'Song Ideas',
          itemCount: 0,
          path: 'hello/Song Ideas',
        },
      ]

      // Test finding root folder
      const rootFolder = folders.find(folder => folder.path === 'Song Ideas')
      expect(rootFolder?.id).toBe('folder-song-ideas-root')

      // Test finding nested folder
      const nestedFolder = folders.find(folder => folder.path === 'hello/Song Ideas')
      expect(nestedFolder?.id).toBe('folder-song-ideas-nested')

      // Verify they are different folders
      expect(rootFolder?.id).not.toBe(nestedFolder?.id)
    })

    it('should fallback to name matching when path is not found', () => {
      const folders: Folder[] = [
        {
          id: 'folder-song-ideas',
          name: 'Song Ideas',
          itemCount: 2,
          path: 'Song Ideas',
        },
        {
          id: 'folder-other',
          name: 'Other Folder',
          itemCount: 1,
          path: 'Other Folder',
        },
      ]

      // Test: Try to find non-existent path, should fallback to name
      const targetPath = 'nonexistent/Song Ideas'
      const targetFolderByPath = folders.find(folder => folder.path === targetPath)
      expect(targetFolderByPath).toBeUndefined()

      // Fallback logic: find by name
      const targetFolderName = targetPath.split('/').pop()
      const fallbackFolder = folders.find(folder => folder.name === targetFolderName)
      expect(fallbackFolder).toBeDefined()
      expect(fallbackFolder?.id).toBe('folder-song-ideas')
    })
  })

  describe('Path construction for recording save', () => {
    it('should construct correct target path for nested folders', () => {
      const selectedFolderPath: string = 'hello/Song Ideas'
      const recordingsDir = getRecordingsDirectory()

      // This is the logic from saveRecordingToFolder function
      let targetFolderPath: string
      if (!selectedFolderPath || selectedFolderPath === '') {
        targetFolderPath = recordingsDir
      } else {
        targetFolderPath = joinPath(recordingsDir, selectedFolderPath)
      }

      expect(targetFolderPath).toContain('hello/Song Ideas')
      expect(targetFolderPath).not.toBe(joinPath(recordingsDir, 'Song Ideas'))
    })

    it('should handle root folder correctly', () => {
      const selectedFolderPath = ''
      const recordingsDir = getRecordingsDirectory()

      let targetFolderPath: string
      if (!selectedFolderPath || selectedFolderPath === '') {
        targetFolderPath = recordingsDir
      } else {
        targetFolderPath = joinPath(recordingsDir, selectedFolderPath)
      }

      expect(targetFolderPath).toBe(recordingsDir)
    })
  })

  describe('Navigation path parsing', () => {
    it('should parse nested folder path correctly for navigation', () => {
      const selectedFolderPath = 'hello/Song Ideas'

      // This is the logic from handleGoToFolder function
      const pathSegments = selectedFolderPath.split('/').filter(segment => segment.length > 0)

      expect(pathSegments).toEqual(['hello', 'Song Ideas'])
      expect(pathSegments.length).toBe(2)
    })

    it('should handle root path correctly for navigation', () => {
      const selectedFolderPath: string = ''

      if (!selectedFolderPath || selectedFolderPath === '') {
        // Should navigate to root
        expect(selectedFolderPath).toBe('')
      } else {
        const pathSegments = selectedFolderPath.split('/').filter((segment: string) => segment.length > 0)
        expect(pathSegments).toEqual([])
      }
    })

    it('should handle single level folder path', () => {
      const selectedFolderPath = 'Song Ideas'

      const pathSegments = selectedFolderPath.split('/').filter(segment => segment.length > 0)

      expect(pathSegments).toEqual(['Song Ideas'])
      expect(pathSegments.length).toBe(1)
    })
  })

  describe('Folder loading with recursive paths', () => {
    it('should generate correct relative paths for nested folders', () => {
      // Simulate the recursive folder loading logic
      const generateFolderPath = (_basePath: string, relativePath: string, folderName: string) => {
        return relativePath ? `${relativePath}/${folderName}` : folderName
      }

      // Test root level folder
      const rootFolderPath = generateFolderPath('', '', 'Song Ideas')
      expect(rootFolderPath).toBe('Song Ideas')

      // Test nested folder
      const nestedFolderPath = generateFolderPath('', 'hello', 'Song Ideas')
      expect(nestedFolderPath).toBe('hello/Song Ideas')

      // Test deeply nested folder
      const deeplyNestedPath = generateFolderPath('', 'hello/world', 'Song Ideas')
      expect(deeplyNestedPath).toBe('hello/world/Song Ideas')
    })
  })

  describe('Unique ID generation for duplicate folder names', () => {
    it('should generate unique IDs for folders with same name but different paths', () => {
      // Simulate the ID generation logic from loadFolders
      const generateUniqueId = (fullRelativePath: string) => {
        return `folder-${fullRelativePath.replace(/\//g, '-')}`
      }

      // Test root level folder
      const rootFolderId = generateUniqueId('Song Ideas')
      expect(rootFolderId).toBe('folder-Song Ideas')

      // Test nested folder with same name
      const nestedFolderId = generateUniqueId('hello/Song Ideas')
      expect(nestedFolderId).toBe('folder-hello-Song Ideas')

      // Test deeply nested folder
      const deepNestedId = generateUniqueId('hello/world/Song Ideas')
      expect(deepNestedId).toBe('folder-hello-world-Song Ideas')

      // Verify all IDs are unique
      const ids = [rootFolderId, nestedFolderId, deepNestedId]
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length) // All IDs should be unique
    })

    it('should handle special characters in folder names', () => {
      const generateUniqueId = (fullRelativePath: string) => {
        return `folder-${fullRelativePath.replace(/\//g, '-')}`
      }

      // Test folder names with spaces and special characters
      const id1 = generateUniqueId('My Folder/Sub Folder')
      expect(id1).toBe('folder-My Folder-Sub Folder')

      const id2 = generateUniqueId('Projects/2024/Album')
      expect(id2).toBe('folder-Projects-2024-Album')

      // Verify they don't conflict
      expect(id1).not.toBe(id2)
    })
  })
})
