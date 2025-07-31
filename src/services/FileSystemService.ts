import * as FileSystem from 'expo-file-system'
import { getRecordingsDirectory } from '../utils/pathUtils'

/**
 * Temporary stub for FileSystemService to maintain compatibility
 * This should be replaced with the new FileManagerContext approach
 */

export type FileSystemItem = {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modificationTime?: number
}

export class FileSystemService {
  async initialize(): Promise<void> {
    // Ensure recordings directory exists
    const recordingsDir = getRecordingsDirectory()
    const dirInfo = await FileSystem.getInfoAsync(recordingsDir)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true })
    }
  }

  async getFolderContents(folderPath: string): Promise<FileSystemItem[]> {
    try {
      const items = await FileSystem.readDirectoryAsync(folderPath)
      const result: FileSystemItem[] = []

      for (const item of items) {
        const itemPath = `${folderPath}/${item}`
        const itemInfo = await FileSystem.getInfoAsync(itemPath)
        
        result.push({
          id: `${itemInfo.isDirectory ? 'folder' : 'file'}-${item}`,
          name: item,
          path: itemPath,
          type: itemInfo.isDirectory ? 'folder' : 'file',
          size: (itemInfo as any).size,
          modificationTime: (itemInfo as any).modificationTime,
        })
      }

      return result
    } catch (error) {
      console.error('Failed to get folder contents:', error)
      return []
    }
  }

  async createFolder(options: { name: string; parentPath: string }): Promise<void> {
    const folderPath = `${options.parentPath}/${options.name}`
    await FileSystem.makeDirectoryAsync(folderPath)
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService()
