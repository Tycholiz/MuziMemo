/**
 * Storage utilities for persisting user preferences
 * Uses AsyncStorage for cross-platform persistence with web fallback
 */

import { Platform } from 'react-native'
import { SortOption, DEFAULT_SORT_OPTION, isValidSortOption } from './sortUtils'

// Conditionally import AsyncStorage with web fallback
let AsyncStorage: any = null

if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default
  } catch (error) {
    console.warn('@react-native-async-storage/async-storage not available:', error)
  }
} else {
  // Web fallback using localStorage
  AsyncStorage = {
    async getItem(key: string): Promise<string | null> {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      try {
        localStorage.setItem(key, value)
      } catch {
        // Ignore storage errors on web
      }
    },
    async removeItem(key: string): Promise<void> {
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore storage errors on web
      }
    },
    async multiRemove(keys: string[]): Promise<void> {
      try {
        keys.forEach(key => localStorage.removeItem(key))
      } catch {
        // Ignore storage errors on web
      }
    },
  }
}

/**
 * Storage keys for different preferences
 */
export const STORAGE_KEYS = {
  SORT_PREFERENCE: '@muzimemo:sort_preference',
  SYNC_ENABLED: '@muzimemo:sync_enabled',
} as const

/**
 * Save sort preference to storage
 */
export async function saveSortPreference(sortOption: SortOption): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SORT_PREFERENCE, sortOption)
  } catch (error) {
    console.error('Failed to save sort preference:', error)
    // Don't throw - gracefully handle storage failures
  }
}

/**
 * Load sort preference from storage
 * Returns default if not found or invalid
 */
export async function loadSortPreference(): Promise<SortOption> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SORT_PREFERENCE)
    
    if (stored && isValidSortOption(stored)) {
      return stored
    }
    
    // Return default if not found or invalid
    return DEFAULT_SORT_OPTION
  } catch (error) {
    console.error('Failed to load sort preference:', error)
    return DEFAULT_SORT_OPTION
  }
}

/**
 * Clear all stored preferences (useful for testing or reset)
 */
export async function clearAllPreferences(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS)
    await AsyncStorage.multiRemove(keys)
  } catch (error) {
    console.error('Failed to clear preferences:', error)
  }
}

/**
 * Save sync enabled preference to storage
 */
export async function saveSyncEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, enabled.toString())
  } catch (error) {
    console.error('Failed to save sync enabled preference:', error)
    // Don't throw - gracefully handle storage failures
  }
}

/**
 * Load sync enabled preference from storage
 * Returns false by default (sync disabled)
 */
export async function loadSyncEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_ENABLED)

    if (stored !== null) {
      return stored === 'true'
    }

    // Return false by default (sync disabled)
    return false
  } catch (error) {
    console.error('Failed to load sync enabled preference:', error)
    return false
  }
}

/**
 * Check if storage is available
 */
export async function isStorageAvailable(): Promise<boolean> {
  try {
    const testKey = '@muzimemo:storage_test'
    const testValue = 'test'

    await AsyncStorage.setItem(testKey, testValue)
    const retrieved = await AsyncStorage.getItem(testKey)
    await AsyncStorage.removeItem(testKey)

    return retrieved === testValue
  } catch (error) {
    console.error('Storage availability check failed:', error)
    return false
  }
}
