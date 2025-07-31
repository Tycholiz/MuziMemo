import * as FileSystem from 'expo-file-system'
import Toast from 'react-native-toast-message'

/**
 * Recently Deleted Utilities
 * Handles operations for the recently-deleted folder functionality
 */

/**
 * Gets the recently-deleted directory path
 * @returns The full path to the recently-deleted directory
 */
export function getRecentlyDeletedDirectory(): string {
  const documentsDirectory = FileSystem.documentDirectory
  if (!documentsDirectory) return ''
  return `${documentsDirectory}recently-deleted`
}

/**
 * Ensures the recently-deleted directory exists
 * Creates it if it doesn't exist
 */
export async function ensureRecentlyDeletedDirectoryExists(): Promise<void> {
  const recentlyDeletedDir = getRecentlyDeletedDirectory()
  if (!recentlyDeletedDir) return

  const dirInfo = await FileSystem.getInfoAsync(recentlyDeletedDir)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(recentlyDeletedDir, { intermediates: true })
  }
}

/**
 * Moves a file to the recently-deleted directory instead of permanently deleting it
 * @param filePath - The current full path of the file
 * @param fileName - The name of the file
 * @returns Promise that resolves to the new path in recently-deleted
 */
export async function moveToRecentlyDeleted(filePath: string, fileName: string): Promise<string> {
  // Ensure recently-deleted directory exists
  await ensureRecentlyDeletedDirectoryExists()
  
  const recentlyDeletedDir = getRecentlyDeletedDirectory()
  const newPath = `${recentlyDeletedDir}/${fileName}`
  
  // Check if a file with the same name already exists in recently-deleted
  const existingInfo = await FileSystem.getInfoAsync(newPath)
  if (existingInfo.exists) {
    // Generate a unique name by appending a timestamp
    const timestamp = Date.now()
    const fileExtension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : ''
    const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
    const uniqueName = `${baseName}_${timestamp}${fileExtension}`
    const uniquePath = `${recentlyDeletedDir}/${uniqueName}`
    
    await FileSystem.moveAsync({
      from: filePath,
      to: uniquePath,
    })
    
    return uniquePath
  }
  
  // Move the file to recently-deleted
  await FileSystem.moveAsync({
    from: filePath,
    to: newPath,
  })
  
  return newPath
}

/**
 * Restores a file from recently-deleted to a destination folder
 * @param filePath - The current path of the file in recently-deleted
 * @param destinationPath - The destination directory path
 * @param fileName - The name of the file
 * @returns Promise that resolves to the new path if successful
 */
export async function restoreFromRecentlyDeleted(
  filePath: string, 
  destinationPath: string, 
  fileName: string
): Promise<string> {
  // Ensure destination directory exists
  const destInfo = await FileSystem.getInfoAsync(destinationPath)
  if (!destInfo.exists) {
    await FileSystem.makeDirectoryAsync(destinationPath, { intermediates: true })
  }

  // Construct the new path
  const newPath = `${destinationPath}/${fileName}`

  // Check if an item with the same name already exists at destination
  const existingInfo = await FileSystem.getInfoAsync(newPath)
  if (existingInfo.exists) {
    throw new Error(`An item named "${fileName}" already exists in the destination folder`)
  }

  // Perform the restore operation (move from recently-deleted to destination)
  await FileSystem.moveAsync({
    from: filePath,
    to: newPath,
  })

  return newPath
}

/**
 * Shows a success toast for restore operations
 * @param fileName - The name of the restored file
 * @param onGoHere - Callback function to navigate to the destination
 */
export function showRestoreSuccessToast(fileName: string, onGoHere?: () => void) {
  Toast.show({
    type: 'successWithButton',
    text1: `${fileName} restored successfully`,
    props: {
      onPress: onGoHere,
      buttonText: 'go here',
    },
    visibilityTime: 4000,
  })
}

/**
 * Shows an error toast for failed restore operations
 * @param errorMessage - The error message to display
 */
export function showRestoreErrorToast(errorMessage: string) {
  Toast.show({
    type: 'error',
    text1: 'Restore Failed',
    text2: errorMessage,
    visibilityTime: 4000,
  })
}

/**
 * Checks if a given path is within the recently-deleted directory
 * @param path - The path to check
 * @returns True if the path is in recently-deleted, false otherwise
 */
export function isInRecentlyDeleted(path: string): boolean {
  const recentlyDeletedDir = getRecentlyDeletedDirectory()
  return path.startsWith(recentlyDeletedDir)
}

/**
 * Gets the recordings directory path
 * @returns The full path to the recordings directory
 */
export function getRecordingsDirectory(): string {
  const documentsDirectory = FileSystem.documentDirectory
  if (!documentsDirectory) return ''
  return `${documentsDirectory}recordings`
}
