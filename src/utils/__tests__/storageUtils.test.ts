/**
 * Tests for storage utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  saveSortPreference,
  loadSortPreference,
  saveSyncEnabled,
  loadSyncEnabled,
  clearAllPreferences,
  isStorageAvailable,
  STORAGE_KEYS,
} from '../storageUtils'
import { DEFAULT_SORT_OPTION } from '../sortUtils'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}))

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

describe('storageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveSortPreference', () => {
    it('should save sort preference to AsyncStorage', async () => {
      mockAsyncStorage.setItem.mockResolvedValue()

      await saveSortPreference('name-desc')

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SORT_PREFERENCE,
        'name-desc'
      )
    })

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(saveSortPreference('name-desc')).resolves.not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save sort preference:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('loadSortPreference', () => {
    it('should load valid sort preference from AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('name-desc')

      const result = await loadSortPreference()

      expect(result).toBe('name-desc')
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SORT_PREFERENCE
      )
    })

    it('should return default when no preference is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null)

      const result = await loadSortPreference()

      expect(result).toBe(DEFAULT_SORT_OPTION)
    })

    it('should return default when invalid preference is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-option')

      const result = await loadSortPreference()

      expect(result).toBe(DEFAULT_SORT_OPTION)
    })

    it('should handle storage errors and return default', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await loadSortPreference()

      expect(result).toBe(DEFAULT_SORT_OPTION)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load sort preference:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('clearAllPreferences', () => {
    it('should clear all stored preferences', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue()

      await clearAllPreferences()

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.SORT_PREFERENCE,
        STORAGE_KEYS.SYNC_ENABLED,
      ])
    })

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.multiRemove.mockRejectedValue(new Error('Storage error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(clearAllPreferences()).resolves.not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear preferences:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('isStorageAvailable', () => {
    it('should return true when storage is available', async () => {
      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.getItem.mockResolvedValue('test')
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await isStorageAvailable()

      expect(result).toBe(true)
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@muzimemo:storage_test',
        'test'
      )
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        '@muzimemo:storage_test'
      )
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        '@muzimemo:storage_test'
      )
    })

    it('should return false when storage is not available', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await isStorageAvailable()

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Storage availability check failed:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should return false when retrieved value does not match', async () => {
      mockAsyncStorage.setItem.mockResolvedValue()
      mockAsyncStorage.getItem.mockResolvedValue('different-value')
      mockAsyncStorage.removeItem.mockResolvedValue()

      const result = await isStorageAvailable()

      expect(result).toBe(false)
    })
  })

  describe('sync preferences', () => {
    describe('saveSyncEnabled', () => {
      it('should save sync enabled preference', async () => {
        await saveSyncEnabled(true)
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.SYNC_ENABLED, 'true')
      })

      it('should save sync disabled preference', async () => {
        await saveSyncEnabled(false)
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.SYNC_ENABLED, 'false')
      })

      it('should handle storage errors gracefully', async () => {
        mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'))

        // Should not throw
        await expect(saveSyncEnabled(true)).resolves.toBeUndefined()
      })
    })

    describe('loadSyncEnabled', () => {
      it('should load sync enabled preference', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('true')

        const result = await loadSyncEnabled()
        expect(result).toBe(true)
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.SYNC_ENABLED)
      })

      it('should load sync disabled preference', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce('false')

        const result = await loadSyncEnabled()
        expect(result).toBe(false)
      })

      it('should return false when no preference is stored', async () => {
        mockAsyncStorage.getItem.mockResolvedValueOnce(null)

        const result = await loadSyncEnabled()
        expect(result).toBe(false)
      })

      it('should return false on storage errors', async () => {
        mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'))

        const result = await loadSyncEnabled()
        expect(result).toBe(false)
      })
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have correct storage keys', () => {
      expect(STORAGE_KEYS.SORT_PREFERENCE).toBe('@muzimemo:sort_preference')
      expect(STORAGE_KEYS.SYNC_ENABLED).toBe('@muzimemo:sync_enabled')
    })
  })
})
