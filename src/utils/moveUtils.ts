import * as FileSystem from 'expo-file-system'
import Toast from 'react-native-toast-message'

/**
 * Utility functions for moving files and folders with validation
 */

export type MoveValidationResult = {
  isValid: boolean
  errorMessage?: string
}

/**
 * Validates if a move operation is allowed
 * @param sourcePath - The path of the item being moved
 * @param destinationPath - The destination directory path
 * @param itemName - The name of the item being moved
 * @returns Validation result with error message if invalid
 */
export function validateMoveOperation(
  sourcePath: string,
  destinationPath: string,
  itemName: string
): MoveValidationResult {
  // Check if trying to move to the same location
  const sourceParentPath = sourcePath.substring(0, sourcePath.lastIndexOf('/'))
  if (sourceParentPath === destinationPath) {
    return {
      isValid: false,
      errorMessage: `"${itemName}" is already in this location`,
    }
  }

  // Check if trying to move a folder into itself or its subdirectory (circular move)
  if (destinationPath.startsWith(sourcePath + '/') || destinationPath === sourcePath) {
    return {
      isValid: false,
      errorMessage: `Cannot move "${itemName}" into itself or its subdirectory`,
    }
  }

  return { isValid: true }
}

/**
 * Moves a file or folder to a new location
 * @param sourcePath - The current path of the item
 * @param destinationPath - The destination directory path
 * @param itemName - The name of the item being moved
 * @returns Promise that resolves to the new path if successful
 */
export async function moveItem(sourcePath: string, destinationPath: string, itemName: string): Promise<string> {
  // Validate the move operation
  const validation = validateMoveOperation(sourcePath, destinationPath, itemName)
  if (!validation.isValid) {
    throw new Error(validation.errorMessage)
  }

  // Ensure destination directory exists
  const destInfo = await FileSystem.getInfoAsync(destinationPath)
  if (!destInfo.exists) {
    await FileSystem.makeDirectoryAsync(destinationPath, { intermediates: true })
  }

  // Construct the new path
  const newPath = `${destinationPath}/${itemName}`

  // Check if an item with the same name already exists at destination
  const existingInfo = await FileSystem.getInfoAsync(newPath)
  if (existingInfo.exists) {
    throw new Error(`An item named "${itemName}" already exists in the destination folder`)
  }

  // Perform the move operation
  await FileSystem.moveAsync({
    from: sourcePath,
    to: newPath,
  })

  return newPath
}

/**
 * Shows a success toast with navigation option after a successful move
 * @param itemName - The name of the moved item
 * @param onNavigateToDestination - Callback to navigate to the destination
 */
export function showMoveSuccessToast(itemName: string, onNavigateToDestination: () => void) {
  Toast.show({
    type: 'successWithButton',
    text1: `${itemName} moved successfully`,
    text2: 'Tap "Go Here" to navigate to the new location',
    visibilityTime: 5000,
    props: {
      onPress: onNavigateToDestination,
      buttonText: 'Go Here',
    },
  })
}

/**
 * Shows an error toast for failed move operations
 * @param errorMessage - The error message to display
 */
export function showMoveErrorToast(errorMessage: string) {
  Toast.show({
    type: 'error',
    text1: 'Move Failed',
    text2: errorMessage,
    visibilityTime: 4000,
  })
}

/**
 * Extracts the relative path from the recordings directory
 * @param fullPath - The full file system path
 * @param recordingsBasePath - The base recordings directory path
 * @returns The relative path from recordings directory
 */
export function getRelativePathFromRecordings(fullPath: string, recordingsBasePath: string): string {
  if (fullPath === recordingsBasePath) {
    return ''
  }
  return fullPath.replace(recordingsBasePath + '/', '')
}

/**
 * Converts a relative path to an array of folder names for navigation
 * @param relativePath - The relative path from recordings directory
 * @returns Array of folder names for navigation
 */
export function pathToNavigationArray(relativePath: string): string[] {
  if (!relativePath || relativePath === '') {
    return []
  }
  return relativePath.split('/')
}
