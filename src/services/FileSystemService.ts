import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'
import { getRecordingsDirectory } from '../utils/pathUtils'
import { iCloudService } from './iCloudService'

/**
 * FileSystemService with iCloud sync support
 * Abstracts local and cloud storage operations
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
  private isSyncEnabled = false

  /**
   * Set sync state - determines whether to use local or cloud storage
   */
  setSyncEnabled(enabled: boolean): void {
    this.isSyncEnabled = enabled && Platform.OS === 'ios'
    console.log(`📁 FileSystemService: Sync ${this.isSyncEnabled ? 'enabled' : 'disabled'}`)
  }

  async initialize(): Promise<void> {
    // Always ensure local recordings directory exists
    const recordingsDir = getRecordingsDirectory()
    const dirInfo = await FileSystem.getInfoAsync(recordingsDir)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true })
    }

    // Initialize iCloud service if sync is enabled
    if (this.isSyncEnabled) {
      await iCloudService.initialize()
    }
  }

  async getFolderContents(folderPath: string): Promise<FileSystemItem[]> {
    try {
      // Always use local file system for folder contents
      // iCloud sync happens in the background
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

    // Always create folder locally first
    await FileSystem.makeDirectoryAsync(folderPath)

    // If sync is enabled, the folder structure will be maintained when files are synced
    console.log(`📁 Created folder: ${folderPath}`)
  }

  /**
   * Save file with optional cloud sync
   */
  async saveFile(filePath: string, content: string | Uint8Array): Promise<void> {
    // Always save locally first
    if (typeof content === 'string') {
      await FileSystem.writeAsStringAsync(filePath, content)
    } else {
      await FileSystem.writeAsStringAsync(filePath, content.toString(), {
        encoding: FileSystem.EncodingType.Base64
      })
    }

    console.log(`💾 Saved file locally: ${filePath}`)
  }

  /**
   * Get the appropriate storage path based on sync settings
   */
  getStoragePath(relativePath: string): string {
    const recordingsDir = getRecordingsDirectory()
    return `${recordingsDir}${relativePath}`
  }

  /**
   * Check if sync is currently enabled
   */
  getSyncEnabled(): boolean {
    return this.isSyncEnabled
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService()
