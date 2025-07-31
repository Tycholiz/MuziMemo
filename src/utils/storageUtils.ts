/**
 * Storage utilities for persisting user preferences
 * Uses AsyncStorage for cross-platform persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { SortOption, DEFAULT_SORT_OPTION, isValidSortOption } from './sortUtils'

/**
 * Storage keys for different preferences
 */
export const STORAGE_KEYS = {
  SORT_PREFERENCE: '@muzimemo:sort_preference',
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
