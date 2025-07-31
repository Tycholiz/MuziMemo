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
 * Generates a letter-based suffix for duplicate file names
 * @param index - The index to convert to letters (0 = 'a', 1 = 'b', 25 = 'z', 26 = 'aa', etc.)
 * @returns The letter suffix string
 */
function generateLetterSuffix(index: number): string {
  let result = ''
  let num = index + 1 // Convert to 1-based indexing for proper letter sequence

  while (num > 0) {
    num-- // Convert back to 0-based for modulo operation
    result = String.fromCharCode(97 + (num % 26)) + result // 97 is 'a'
    num = Math.floor(num / 26)
  }

  return result
}

/**
 * Finds a unique filename by appending letter suffixes
 * @param recentlyDeletedDir - The recently-deleted directory path
 * @param baseName - The base name without extension
 * @param fileExtension - The file extension (including the dot)
 * @returns Promise that resolves to a unique filename
 */
async function findUniqueFileName(recentlyDeletedDir: string, baseName: string, fileExtension: string): Promise<string> {
  let index = 0
  let uniqueName: string
  let uniquePath: string

  do {
    const suffix = generateLetterSuffix(index)
    uniqueName = `${baseName}${suffix}${fileExtension}`
    uniquePath = `${recentlyDeletedDir}/${uniqueName}`

    const existingInfo = await FileSystem.getInfoAsync(uniquePath)
    if (!existingInfo.exists) {
      return uniqueName
    }

    index++
  } while (index < 1000) // Safety limit to prevent infinite loops

  // Fallback to timestamp if we somehow exhaust letter combinations
  const timestamp = Date.now()
  return `${baseName}_${timestamp}${fileExtension}`
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
    // Generate a unique name by appending letter suffixes
    const fileExtension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : ''
    const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
    const uniqueName = await findUniqueFileName(recentlyDeletedDir, baseName, fileExtension)
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

/**
 * Recursively finds all audio files in a directory and its subdirectories
 * @param directoryPath - The directory path to search
 * @returns Array of audio file paths with their names
 */
async function findAllAudioFilesInDirectory(directoryPath: string): Promise<Array<{ path: string; name: string }>> {
  const audioFiles: Array<{ path: string; name: string }> = []

  try {
    const items = await FileSystem.readDirectoryAsync(directoryPath)

    for (const item of items) {
      const itemPath = `${directoryPath}/${item}`
      const itemInfo = await FileSystem.getInfoAsync(itemPath)

      if (itemInfo.isDirectory) {
        // Recursively search subdirectories
        const subAudioFiles = await findAllAudioFilesInDirectory(itemPath)
        audioFiles.push(...subAudioFiles)
      } else {
        // Check if it's an audio file (common audio extensions)
        const audioExtensions = ['.m4a', '.mp3', '.wav', '.aac', '.mp4', '.caf']
        const isAudioFile = audioExtensions.some(ext =>
          item.toLowerCase().endsWith(ext.toLowerCase())
        )

        if (isAudioFile) {
          audioFiles.push({ path: itemPath, name: item })
        }
      }
    }
  } catch (error) {
    console.error('Error reading directory:', directoryPath, error)
  }

  return audioFiles
}

/**
 * Moves all audio files from a folder (and its subfolders) to recently-deleted
 * Then deletes the empty folder structure
 * @param folderPath - The path of the folder to delete
 * @param folderName - The name of the folder being deleted
 * @returns Promise that resolves to the number of audio files moved
 */
export async function deleteFolderAndMoveAudioFiles(folderPath: string, folderName: string): Promise<number> {
  // Ensure recently-deleted directory exists
  await ensureRecentlyDeletedDirectoryExists()

  // Find all audio files in the folder and its subdirectories
  const audioFiles = await findAllAudioFilesInDirectory(folderPath)

  // Move each audio file to recently-deleted with a flat hierarchy
  let movedCount = 0
  for (const audioFile of audioFiles) {
    try {
      await moveToRecentlyDeleted(audioFile.path, audioFile.name)
      movedCount++
    } catch (error) {
      console.error(`Failed to move audio file ${audioFile.name} to recently-deleted:`, error)
      // Continue with other files even if one fails
    }
  }

  // Delete the original folder structure (now empty of audio files)
  try {
    await FileSystem.deleteAsync(folderPath)
  } catch (error) {
    console.error(`Failed to delete folder ${folderName}:`, error)
    throw error
  }

  return movedCount
}
