import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'

import type { BreadcrumbItem } from '../customTypes/FileSystem'

/**
 * Path utilities for file system operations
 */

/**
 * Get the app's document directory path
 */
export function getDocumentDirectory(): string {
  if (Platform.OS === 'web') {
    return '/muzimemo/'
  }
  return FileSystem.documentDirectory || ''
}

/**
 * Get the recordings directory path
 */
export function getRecordingsDirectory(): string {
  const docDir = getDocumentDirectory()
  return `${docDir}recordings/`
}

/**
 * Join path segments with proper separators
 */
export function joinPath(...segments: string[]): string {
  const separator = Platform.OS === 'web' ? '/' : '/'
  return segments
    .filter(segment => segment && segment.length > 0)
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .join(separator)
}

/**
 * Get relative path from the recordings directory
 */
export function getRelativePath(fullPath: string): string {
  const recordingsDir = getRecordingsDirectory()
  if (fullPath.startsWith(recordingsDir)) {
    return fullPath.substring(recordingsDir.length)
  }
  return fullPath
}

/**
 * Get absolute path from relative path
 */
export function getAbsolutePath(relativePath: string): string {
  const recordingsDir = getRecordingsDirectory()
  return joinPath(recordingsDir, relativePath)
}

/**
 * Sanitize file/folder name to be safe for file system
 */
export function sanitizeFileName(name: string): string {
  // Remove or replace invalid characters
  const sanitized = name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim() // Remove leading/trailing whitespace
    .substring(0, 255) // Limit length

  // Ensure name is not empty
  if (!sanitized || sanitized.length === 0) {
    return 'Untitled'
  }

  // Avoid reserved names on Windows
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ]
  if (reservedNames.includes(sanitized.toUpperCase())) {
    return `${sanitized}_folder`
  }

  return sanitized
}

/**
 * Generate breadcrumb navigation from path
 */
export function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  const relativePath = getRelativePath(path)

  if (!relativePath || relativePath === '/') {
    return [{ name: 'Recordings', path: getRecordingsDirectory(), isLast: true }]
  }

  const segments = relativePath.split('/').filter(segment => segment.length > 0)
  const breadcrumbs: BreadcrumbItem[] = []

  // Add root
  breadcrumbs.push({
    name: 'Home',
    path: getRecordingsDirectory(),
    isLast: false,
  })

  // Add each segment
  let currentPath = getRecordingsDirectory()
  segments.forEach((segment, index) => {
    currentPath = joinPath(currentPath, segment)
    breadcrumbs.push({
      name: segment,
      path: currentPath,
      isLast: index === segments.length - 1,
    })
  })

  // Mark the last item
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].isLast = true
  }

  return breadcrumbs
}

/**
 * Get file extension from path
 */
export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf('.')
  if (lastDot === -1 || lastDot === path.length - 1) {
    return ''
  }
  return path.substring(lastDot + 1).toLowerCase()
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(path: string): string {
  const fileName = getFileName(path)
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1) {
    return fileName
  }
  return fileName.substring(0, lastDot)
}

/**
 * Get file name from path
 */
export function getFileName(path: string): string {
  const separator = Platform.OS === 'web' ? '/' : '/'
  const lastSeparator = path.lastIndexOf(separator)
  if (lastSeparator === -1) {
    return path
  }
  return path.substring(lastSeparator + 1)
}

/**
 * Get parent directory path
 */
export function getParentDirectory(path: string): string {
  const separator = Platform.OS === 'web' ? '/' : '/'
  const lastSeparator = path.lastIndexOf(separator)
  if (lastSeparator === -1) {
    return ''
  }
  return path.substring(0, lastSeparator)
}

/**
 * Check if path is within recordings directory
 */
export function isValidRecordingPath(path: string): boolean {
  const recordingsDir = getRecordingsDirectory()
  return path.startsWith(recordingsDir)
}

/**
 * Check if a folder path exists in the recordings directory
 */
export async function doesFolderPathExist(relativePath: string): Promise<boolean> {
  try {
    if (!relativePath || relativePath === '') {
      // Empty path represents root directory, which always exists
      return true
    }

    const recordingsDir = getRecordingsDirectory()
    const fullPath = joinPath(recordingsDir, relativePath)

    const pathInfo = await FileSystem.getInfoAsync(fullPath)
    return pathInfo.exists && pathInfo.isDirectory
  } catch (error) {
    console.error('Error checking folder path existence:', error)
    return false
  }
}

/**
 * Generate unique file name if file already exists
 */
export function generateUniqueFileName(baseName: string, extension: string, existingNames: string[]): string {
  let counter = 1
  let fileName = `${baseName}.${extension}`

  while (existingNames.includes(fileName)) {
    fileName = `${baseName} (${counter}).${extension}`
    counter++
  }

  return fileName
}

/**
 * Validate file/folder name
 */
export function validateFileName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name cannot be empty' }
  }

  if (name.length > 255) {
    return { isValid: false, error: 'Name is too long (max 255 characters)' }
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' }
  }

  // Check for reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL']
  if (reservedNames.includes(name.toUpperCase())) {
    return { isValid: false, error: 'Name is reserved' }
  }

  return { isValid: true }
}
