import * as FileSystem from 'expo-file-system'
import { getRecordingsDirectory } from './pathUtils'

/**
 * Search utilities for recursive file system operations
 */

export type SearchableAudioFile = {
  id: string
  name: string
  uri: string
  size: number
  createdAt: Date
  duration?: number
  relativePath: string // Path relative to recordings directory
  parentPath: string // Full parent directory path
}

export type SearchableFolder = {
  id: string
  name: string
  itemCount: number
  relativePath: string // Path relative to recordings directory
  fullPath: string // Full directory path
}

export type SearchResults = {
  audioFiles: SearchableAudioFile[]
  folders: SearchableFolder[]
}

export type SearchFilters = {
  audio: boolean
  folders: boolean
  text: boolean // For future text content search
}

/**
 * Recursively searches for audio files in all subdirectories
 * @param query - Search query string (case-insensitive)
 * @param filters - Search filters to apply
 * @returns Promise<SearchResults>
 */
export async function searchFileSystem(
  query: string,
  filters: SearchFilters = { audio: true, folders: true, text: false }
): Promise<SearchResults> {
  const results: SearchResults = {
    audioFiles: [],
    folders: [],
  }

  if (!query.trim()) {
    return results
  }

  const recordingsDir = getRecordingsDirectory()
  const normalizedQuery = query.toLowerCase().trim()

  try {
    await searchDirectory(recordingsDir, '', normalizedQuery, filters, results)
  } catch (error) {
    console.error('Search failed:', error)
  }

  return results
}

/**
 * Recursively searches a directory and its subdirectories
 * @param fullPath - Full path to the directory
 * @param relativePath - Path relative to recordings directory
 * @param query - Normalized search query
 * @param filters - Search filters
 * @param results - Results object to populate
 */
async function searchDirectory(
  fullPath: string,
  relativePath: string,
  query: string,
  filters: SearchFilters,
  results: SearchResults
): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(fullPath)
    if (!dirInfo.exists || !dirInfo.isDirectory) {
      return
    }

    const items = await FileSystem.readDirectoryAsync(fullPath)

    for (const item of items) {
      const itemPath = `${fullPath}/${item}`
      const itemRelativePath = relativePath ? `${relativePath}/${item}` : item
      
      try {
        const itemInfo = await FileSystem.getInfoAsync(itemPath)

        if (itemInfo.isDirectory) {
          // Check if folder name matches query
          if (filters.folders && item.toLowerCase().includes(query)) {
            // Count items in folder
            const subItems = await FileSystem.readDirectoryAsync(itemPath)
            results.folders.push({
              id: `folder-${itemRelativePath}`,
              name: item,
              itemCount: subItems.length,
              relativePath: itemRelativePath,
              fullPath: itemPath,
            })
          }

          // Recursively search subdirectory
          await searchDirectory(itemPath, itemRelativePath, query, filters, results)
        } else if (filters.audio && isAudioFile(item)) {
          // Check if audio file name matches query
          if (item.toLowerCase().includes(query)) {
            results.audioFiles.push({
              id: `audio-${itemRelativePath}`,
              name: item,
              uri: itemPath,
              size: (itemInfo as any).size || 0,
              createdAt: new Date((itemInfo as any).modificationTime || Date.now()),
              relativePath: itemRelativePath,
              parentPath: fullPath,
            })
          }
        }
      } catch (itemError) {
        console.warn(`Failed to process item ${itemPath}:`, itemError)
        // Continue with other items
      }
    }
  } catch (error) {
    console.warn(`Failed to search directory ${fullPath}:`, error)
  }
}

/**
 * Checks if a file is an audio file based on its extension
 * @param fileName - Name of the file
 * @returns boolean
 */
function isAudioFile(fileName: string): boolean {
  const audioExtensions = ['.m4a', '.mp3', '.wav', '.aac', '.flac', '.ogg']
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return audioExtensions.includes(extension)
}

/**
 * Formats a folder path for display using arrow separators
 * @param relativePath - Path relative to recordings directory
 * @returns Formatted path string
 */
export function formatFolderPath(relativePath: string): string {
  if (!relativePath) {
    return 'Home'
  }
  
  const parts = relativePath.split('/')
  return parts.join(' > ')
}

/**
 * Gets the parent directory path for navigation
 * @param relativePath - Path relative to recordings directory
 * @returns Parent directory path
 */
export function getParentDirectoryPath(relativePath: string): string[] {
  if (!relativePath) {
    return []
  }
  
  const parts = relativePath.split('/')
  return parts.slice(0, -1)
}

/**
 * Truncates long paths for display
 * @param path - Path to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated path with ellipsis
 */
export function truncatePath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) {
    return path
  }
  
  return `...${path.substring(path.length - maxLength + 3)}`
}
