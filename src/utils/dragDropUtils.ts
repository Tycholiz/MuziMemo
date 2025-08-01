import { DragItem } from '../contexts/DragDropContext'
import { FolderData } from '../components/FileSystem'

export type DragDropValidationResult = {
  isValid: boolean
  errorMessage?: string
}

/**
 * Validates if a drag and drop operation is allowed
 * @param dragItem - The item being dragged
 * @param targetFolder - The target folder for the drop
 * @param currentPath - The current directory path
 * @returns Validation result with error message if invalid
 */
export function validateDragDropOperation(
  dragItem: DragItem,
  targetFolder: FolderData,
  currentPath: string
): DragDropValidationResult {
  // Don't allow dropping on the same location
  if (dragItem.sourcePath === `${currentPath}/${targetFolder.name}`) {
    return {
      isValid: false,
      errorMessage: `"${dragItem.name}" is already in "${targetFolder.name}"`,
    }
  }

  // For folder drag operations, prevent circular moves
  if (dragItem.type === 'folder') {
    const dragFolderPath = `${currentPath}/${dragItem.name}`
    const targetPath = `${currentPath}/${targetFolder.name}`
    
    // Check if trying to move folder into itself
    if (dragFolderPath === targetPath) {
      return {
        isValid: false,
        errorMessage: `Cannot move "${dragItem.name}" into itself`,
      }
    }
    
    // Check if trying to move folder into its subdirectory
    if (targetPath.startsWith(dragFolderPath + '/')) {
      return {
        isValid: false,
        errorMessage: `Cannot move "${dragItem.name}" into its subdirectory`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Gets the list of valid drop target IDs for a drag item
 * @param dragItem - The item being dragged
 * @param folders - Available folders in current directory
 * @param currentPath - The current directory path
 * @returns Array of valid drop target folder IDs
 */
export function getValidDropTargets(
  dragItem: DragItem,
  folders: FolderData[],
  currentPath: string
): string[] {
  return folders
    .filter(folder => {
      const validation = validateDragDropOperation(dragItem, folder, currentPath)
      return validation.isValid
    })
    .map(folder => folder.id)
}

/**
 * Creates a DragItem from folder data
 * @param folder - The folder data
 * @param currentPath - The current directory path
 * @returns DragItem for the folder
 */
export function createFolderDragItem(folder: FolderData, currentPath: string): DragItem {
  return {
    id: folder.id,
    name: folder.name,
    type: 'folder',
    sourcePath: currentPath,
  }
}

/**
 * Creates a DragItem from audio file data
 * @param audioFile - The audio file data
 * @param currentPath - The current directory path
 * @returns DragItem for the audio file
 */
export function createAudioFileDragItem(
  audioFile: { id: string; name: string },
  currentPath: string
): DragItem {
  return {
    id: audioFile.id,
    name: audioFile.name,
    type: 'audio',
    sourcePath: currentPath,
  }
}

/**
 * Gets the destination path for a drop operation
 * @param targetFolder - The target folder
 * @param currentPath - The current directory path
 * @returns Full destination path
 */
export function getDropDestinationPath(targetFolder: FolderData, currentPath: string): string {
  return `${currentPath}/${targetFolder.name}`
}
