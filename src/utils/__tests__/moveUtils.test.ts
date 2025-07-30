import { validateMoveOperation, getRelativePathFromRecordings, pathToNavigationArray } from '../moveUtils'

describe('moveUtils', () => {
  describe('validateMoveOperation', () => {
    it('should allow valid move operations', () => {
      const result = validateMoveOperation('/recordings/folder1/item', '/recordings/folder2', 'item')

      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeUndefined()
    })

    it('should prevent moving to the same location', () => {
      const result = validateMoveOperation('/recordings/folder1/item', '/recordings/folder1', 'item')

      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('"item" is already in this location')
    })

    it('should prevent circular moves (folder into itself)', () => {
      const result = validateMoveOperation('/recordings/folder1', '/recordings/folder1', 'folder1')

      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Cannot move "folder1" into itself or its subdirectory')
    })

    it('should prevent circular moves (folder into its subdirectory)', () => {
      const result = validateMoveOperation('/recordings/folder1', '/recordings/folder1/subfolder', 'folder1')

      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Cannot move "folder1" into itself or its subdirectory')
    })

    it('should allow moving folder to a sibling directory', () => {
      const result = validateMoveOperation('/recordings/folder1/subfolder', '/recordings/folder2', 'subfolder')

      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeUndefined()
    })

    it('should prevent moving to the same parent directory (already in this location)', () => {
      const result = validateMoveOperation('/hello/test2', '/hello', 'test2')

      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('"test2" is already in this location')
    })

    it('should allow moving folder to a different parent directory', () => {
      const result = validateMoveOperation('/hello/test2', '/Song Ideas', 'test2')

      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeUndefined()
    })
  })

  describe('getRelativePathFromRecordings', () => {
    it('should return empty string for recordings root', () => {
      const result = getRelativePathFromRecordings('/documents/recordings', '/documents/recordings')

      expect(result).toBe('')
    })

    it('should return relative path for nested folders', () => {
      const result = getRelativePathFromRecordings('/documents/recordings/folder1/subfolder', '/documents/recordings')

      expect(result).toBe('folder1/subfolder')
    })

    it('should handle single level folders', () => {
      const result = getRelativePathFromRecordings('/documents/recordings/folder1', '/documents/recordings')

      expect(result).toBe('folder1')
    })
  })

  describe('pathToNavigationArray', () => {
    it('should return empty array for empty path', () => {
      expect(pathToNavigationArray('')).toEqual([])
    })

    it('should return empty array for root path', () => {
      expect(pathToNavigationArray('')).toEqual([])
    })

    it('should split path into navigation array', () => {
      const result = pathToNavigationArray('folder1/subfolder/deepfolder')
      expect(result).toEqual(['folder1', 'subfolder', 'deepfolder'])
    })

    it('should handle single folder path', () => {
      const result = pathToNavigationArray('folder1')
      expect(result).toEqual(['folder1'])
    })
  })
})
