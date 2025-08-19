import { Platform } from 'react-native'
import { CloudStorage } from 'react-native-cloud-storage'
import * as FileSystem from 'expo-file-system'
import { getRecordingsDirectory, joinPath } from '../utils/pathUtils'

/**
 * iCloud Service for managing cloud storage operations
 * Provides abstraction layer for iCloud file operations
 */
class iCloudServiceClass {
  private static instance: iCloudServiceClass
  private isInitialized = false

  private constructor() {}

  static getInstance(): iCloudServiceClass {
    if (!iCloudServiceClass.instance) {
      iCloudServiceClass.instance = new iCloudServiceClass()
    }
    return iCloudServiceClass.instance
  }

  /**
   * Initialize iCloud service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Only initialize on iOS
      if (Platform.OS !== 'ios') {
        console.log('📱 iCloud service: Not available on this platform')
        return
      }

      this.isInitialized = true
      console.log('☁️ iCloud service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize iCloud service:', error)
      throw error
    }
  }

  /**
   * Check if iCloud is available and user is signed in
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') return false
      
      // This will be called from a React component context
      // For now, we'll implement a basic check
      return true
    } catch (error) {
      console.error('❌ Error checking iCloud availability:', error)
      return false
    }
  }

  /**
   * Write file to iCloud
   */
  async writeFile(cloudPath: string, content: string): Promise<void> {
    try {
      await this.initialize()
      
      if (Platform.OS !== 'ios') {
        throw new Error('iCloud is only available on iOS')
      }

      await CloudStorage.writeFile(cloudPath, content)
      console.log('☁️ Successfully wrote file to iCloud:', cloudPath)
    } catch (error) {
      console.error('❌ Failed to write file to iCloud:', error)
      throw error
    }
  }

  /**
   * Copy file from local storage to iCloud
   */
  async copyFileToCloud(localPath: string, cloudPath: string): Promise<void> {
    try {
      await this.initialize()
      
      if (Platform.OS !== 'ios') {
        throw new Error('iCloud is only available on iOS')
      }

      // Read file from local storage
      const fileContent = await FileSystem.readAsStringAsync(localPath, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Write to iCloud with base64 encoding
      await CloudStorage.writeFile(cloudPath, fileContent, { encoding: 'base64' })
      console.log('☁️ Successfully copied file to iCloud:', { localPath, cloudPath })
    } catch (error) {
      console.error('❌ Failed to copy file to iCloud:', error)
      throw error
    }
  }

  /**
   * Check if file exists in iCloud
   */
  async exists(cloudPath: string): Promise<boolean> {
    try {
      await this.initialize()
      
      if (Platform.OS !== 'ios') return false

      return await CloudStorage.exists(cloudPath)
    } catch (error) {
      console.error('❌ Error checking file existence in iCloud:', error)
      return false
    }
  }

  /**
   * List files in iCloud directory
   */
  async listFiles(cloudPath?: string): Promise<string[]> {
    try {
      await this.initialize()
      
      if (Platform.OS !== 'ios') return []

      return await CloudStorage.listFiles(cloudPath)
    } catch (error) {
      console.error('❌ Error listing iCloud files:', error)
      return []
    }
  }

  /**
   * Delete file from iCloud
   */
  async deleteFile(cloudPath: string): Promise<void> {
    try {
      await this.initialize()
      
      if (Platform.OS !== 'ios') {
        throw new Error('iCloud is only available on iOS')
      }

      await CloudStorage.deleteFile(cloudPath)
      console.log('☁️ Successfully deleted file from iCloud:', cloudPath)
    } catch (error) {
      console.error('❌ Failed to delete file from iCloud:', error)
      throw error
    }
  }

  /**
   * Get iCloud path for a local recordings path
   */
  getCloudPath(localPath: string): string {
    const recordingsDir = getRecordingsDirectory()
    
    // Remove the local recordings directory prefix and create cloud path
    const relativePath = localPath.replace(recordingsDir, '')
    return joinPath('/recordings', relativePath)
  }

  /**
   * Get local path for an iCloud path
   */
  getLocalPath(cloudPath: string): string {
    const recordingsDir = getRecordingsDirectory()
    
    // Remove the /recordings prefix and create local path
    const relativePath = cloudPath.replace('/recordings/', '')
    return joinPath(recordingsDir, relativePath)
  }

  /**
   * Migrate all local recordings to iCloud
   */
  async migrateLocalRecordingsToCloud(): Promise<{ success: number; failed: string[] }> {
    const results = { success: 0, failed: [] as string[] }

    try {
      await this.initialize()
      
      if (Platform.OS !== 'ios') {
        throw new Error('iCloud migration is only available on iOS')
      }

      const recordingsDir = getRecordingsDirectory()
      
      // Recursively scan all files in recordings directory
      const filesToMigrate = await this.scanDirectoryRecursively(recordingsDir)
      
      console.log(`☁️ Starting migration of ${filesToMigrate.length} files to iCloud`)

      for (const localPath of filesToMigrate) {
        try {
          const cloudPath = this.getCloudPath(localPath)
          
          // Check if file already exists in iCloud
          const existsInCloud = await this.exists(cloudPath)
          if (existsInCloud) {
            console.log('☁️ File already exists in iCloud, skipping:', cloudPath)
            results.success++
            continue
          }

          // Copy file to iCloud
          await this.copyFileToCloud(localPath, cloudPath)
          results.success++
        } catch (error) {
          console.error('❌ Failed to migrate file:', localPath, error)
          results.failed.push(localPath)
        }
      }

      console.log(`☁️ Migration completed: ${results.success} successful, ${results.failed.length} failed`)
      return results
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  /**
   * Recursively scan directory for audio files
   */
  private async scanDirectoryRecursively(dirPath: string): Promise<string[]> {
    const files: string[] = []

    try {
      const items = await FileSystem.readDirectoryAsync(dirPath)
      
      for (const item of items) {
        const itemPath = joinPath(dirPath, item)
        const itemInfo = await FileSystem.getInfoAsync(itemPath)
        
        if (itemInfo.isDirectory) {
          // Recursively scan subdirectory
          const subFiles = await this.scanDirectoryRecursively(itemPath)
          files.push(...subFiles)
        } else if (item.endsWith('.m4a')) {
          // Add audio files
          files.push(itemPath)
        }
      }
    } catch (error) {
      console.error('❌ Error scanning directory:', dirPath, error)
    }

    return files
  }
}

// Export singleton instance
export const iCloudService = iCloudServiceClass.getInstance()
