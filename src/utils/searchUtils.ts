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
  modificationTime?: number // From FileSystem.FileInfo
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
  currentDirectoryOnly: boolean // Search only in current directory
}

/**
 * Recursively searches for audio files in all subdirectories
 * @param query - Search query string (case-insensitive)
 * @param filters - Search filters to apply
 * @param currentPath - Current directory path for local search
 * @returns Promise<SearchResults>
 */
export async function searchFileSystem(
  query: string,
  filters: SearchFilters = { audio: true, folders: true, text: false, currentDirectoryOnly: false },
  currentPath: string[] = []
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
    if (filters.currentDirectoryOnly) {
      // Search only in current directory
      const currentDirPath = currentPath.length > 0 ? `${recordingsDir}${currentPath.join('/')}` : recordingsDir
      const currentRelativePath = currentPath.join('/')
      await searchDirectory(currentDirPath, currentRelativePath, normalizedQuery, filters, results, true)
    } else {
      // Search all directories
      await searchDirectory(recordingsDir, '', normalizedQuery, filters, results, false)
    }
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
 * @param localOnly - If true, search only current directory (no recursion)
 */
async function searchDirectory(
  fullPath: string,
  relativePath: string,
  query: string,
  filters: SearchFilters,
  results: SearchResults,
  localOnly: boolean = false
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

          // Recursively search subdirectory (only if not local search)
          if (!localOnly) {
            await searchDirectory(itemPath, itemRelativePath, query, filters, results, false)
          }
        } else if (filters.audio && isAudioFile(item)) {
          // Check if audio file name matches query
          if (item.toLowerCase().includes(query)) {
            results.audioFiles.push({
              id: `audio-${itemRelativePath}`,
              name: item,
              uri: itemPath,
              size: (itemInfo as any).size || 0,
              createdAt: new Date((itemInfo as any).modificationTime || Date.now()),
              modificationTime: (itemInfo as any).modificationTime,
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
 * Formats a folder path for display using arrow separators and house icon
 * @param relativePath - Path relative to recordings directory
 * @returns Formatted path string with house icon placeholder
 */
export function formatFolderPath(relativePath: string): string {
  if (!relativePath || relativePath === '/') {
    return '[HOME]'
  }

  const parts = relativePath.split('/').filter(part => part.length > 0)
  return `[HOME] > ${parts.join(' > ')}`
}

/**
 * Formats a file path for display, showing only the directory path with house icon
 * @param relativePath - Full file path relative to recordings directory
 * @returns Formatted directory path string with house icon placeholder
 */
export function formatFilePath(relativePath: string): string {
  if (!relativePath) {
    return '[HOME]'
  }

  // Get directory path by removing the filename
  const parts = relativePath.split('/').filter(part => part.length > 0)
  if (parts.length <= 1) {
    return '[HOME]'
  }

  // Remove the last part (filename) to get directory path
  const directoryParts = parts.slice(0, -1)
  return `[HOME] > ${directoryParts.join(' > ')}`
}

/**
 * Truncates a path string intelligently, preserving important information
 * @param path - Path string to truncate
 * @param maxLength - Maximum length of the truncated string
 * @returns Truncated path string
 */
export function truncatePathSmart(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) {
    return path
  }

  // If it starts with house icon placeholder, preserve that
  const hasHouseIcon = path.startsWith('[HOME]')
  const prefix = hasHouseIcon ? '[HOME] > ' : ''
  const pathWithoutPrefix = hasHouseIcon ? path.substring(9) : path

  if (pathWithoutPrefix.length <= maxLength - prefix.length) {
    return path
  }

  // Truncate from the beginning, keeping the end visible
  const availableLength = maxLength - prefix.length - 3 // 3 for "..."
  const truncatedPath = '...' + pathWithoutPrefix.slice(-availableLength)

  return prefix + truncatedPath
}

/**
 * Formats a folder path for Recent Searches, excluding the folder itself from the path
 * @param relativePath - Path relative to recordings directory
 * @returns Formatted parent directory path string
 */
export function formatFolderPathForRecent(relativePath: string): string {
  if (!relativePath || relativePath === '/') {
    return '[HOME]'
  }

  // Get parent directory path by removing the last folder
  const parts = relativePath.split('/').filter(part => part.length > 0)
  if (parts.length <= 1) {
    return '[HOME]'
  }

  // Remove the last part (the folder itself) to get parent directory path
  const parentParts = parts.slice(0, -1)
  return `[HOME] > ${parentParts.join(' > ')}`
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
