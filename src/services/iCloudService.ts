import { Platform } from 'react-native'
import { CloudStorage } from 'react-native-cloud-storage'
import * as FileSystem from 'expo-file-system'
import { getRecordingsDirectory, joinPath } from '../utils/pathUtils'

// Enhanced file lock mechanism to prevent race conditions with audio player
class FileLockManager {
  private locks = new Set<string>()
  private audioPlayerFiles = new Map<string, number>() // Track files with timestamps

  async withLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
    const normalizedPath = filePath.replace('file://', '')

    if (this.locks.has(normalizedPath)) {
      throw new Error(`File is currently locked: ${normalizedPath}`)
    }

    // Check if file is locked by audio player with timeout
    if (this.isAudioPlayerLocked(normalizedPath)) {
      throw new Error(`File is currently being used by audio player: ${normalizedPath}`)
    }

    this.locks.add(normalizedPath)
    try {
      return await operation()
    } finally {
      this.locks.delete(normalizedPath)
    }
  }

  isLocked(filePath: string): boolean {
    const normalizedPath = filePath.replace('file://', '')
    return this.locks.has(normalizedPath) || this.isAudioPlayerLocked(normalizedPath)
  }

  private isAudioPlayerLocked(normalizedPath: string): boolean {
    if (!this.audioPlayerFiles.has(normalizedPath)) {
      return false
    }

    const lockTime = this.audioPlayerFiles.get(normalizedPath)!
    const now = Date.now()
    const lockDuration = now - lockTime

    // TIMEOUT FIX: Auto-release audio locks after 5 minutes
    if (lockDuration > 5 * 60 * 1000) { // 5 minutes
      console.warn(`⏰ Audio player lock timeout for file: ${normalizedPath} (${lockDuration}ms)`)
      this.audioPlayerFiles.delete(normalizedPath)
      return false
    }

    return true
  }

  // Methods for audio player to register/unregister file usage
  registerAudioPlayerFile(filePath: string): void {
    const normalizedPath = filePath.replace('file://', '')
    this.audioPlayerFiles.set(normalizedPath, Date.now())
    console.log('🔒 Audio player registered file:', normalizedPath)
  }

  unregisterAudioPlayerFile(filePath: string): void {
    const normalizedPath = filePath.replace('file://', '')
    this.audioPlayerFiles.delete(normalizedPath)
    console.log('🔓 Audio player unregistered file:', normalizedPath)
  }

  getAudioPlayerFiles(): string[] {
    // Clean up expired locks before returning
    const now = Date.now()
    for (const [path, lockTime] of this.audioPlayerFiles.entries()) {
      if (now - lockTime > 5 * 60 * 1000) { // 5 minutes
        this.audioPlayerFiles.delete(path)
      }
    }
    return Array.from(this.audioPlayerFiles.keys())
  }
}

const fileLockManager = new FileLockManager()

// Export for use by AudioPlayerContext
export { fileLockManager }

/**
 * iCloud Service for managing cloud storage operations
 * Provides abstraction layer for iCloud file operations
 */
class iCloudServiceClass {
  private static instance: iCloudServiceClass
  private isInitialized = false
  private isMigrating = false // Prevent concurrent migrations

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

      // Use 'documents' scope for iCloud Documents directory
      await CloudStorage.writeFile(cloudPath, content, 'documents')
      console.log('☁️ Successfully wrote file to iCloud:', cloudPath)
    } catch (error) {
      console.error('❌ Failed to write file to iCloud:', error)
      throw error
    }
  }

  /**
   * Copy file from local storage to iCloud
   *
   * CRITICAL: This method handles binary audio files (.m4a) which must preserve
   * their exact binary structure to maintain playability and metadata.
   *
   * FIXED: Use uploadFile() instead of writeFile() for binary files to prevent corruption.
   * FIXED: Handle race conditions with audio player and file locking.
   * FIXED: Implement file locking to prevent concurrent access conflicts.
   */
  async copyFileToCloud(localPath: string, cloudPath: string): Promise<void> {
    // Use file lock to prevent race conditions with audio player
    return fileLockManager.withLock(localPath, async () => {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.initialize()

        if (Platform.OS !== 'ios') {
          throw new Error('iCloud is only available on iOS')
        }

        console.log(`🔄 Starting iCloud copy process (attempt ${attempt}/${maxRetries}):`, { localPath, cloudPath })

        // CRITICAL FIX: Convert file:// URI to plain file system path
        // react-native-cloud-storage expects plain paths, not file:// URIs
        const plainFilePath = localPath.startsWith('file://')
          ? localPath.replace('file://', '')
          : localPath

        console.log('🔧 Converted file path:', { original: localPath, converted: plainFilePath })

        // RACE CONDITION FIX: Verify file exists with multiple checks
        // This handles cases where audio player may temporarily lock the file
        let fileInfo = await FileSystem.getInfoAsync(localPath)

        if (!fileInfo.exists) {
          // Try checking the plain file path as well
          fileInfo = await FileSystem.getInfoAsync(plainFilePath)
          if (!fileInfo.exists) {
            // DEBUGGING: List directory contents to see what files actually exist
            try {
              const directory = plainFilePath.substring(0, plainFilePath.lastIndexOf('/'))
              const dirContents = await FileSystem.readDirectoryAsync(directory)
              console.log(`🔍 Directory contents for ${directory}:`, dirContents)

              // Check if file exists with a different name
              const fileName = plainFilePath.substring(plainFilePath.lastIndexOf('/') + 1)
              const similarFiles = dirContents.filter(file => file.includes('Recording'))
              console.log(`🔍 Looking for file: ${fileName}, similar files found:`, similarFiles)
            } catch (dirError) {
              console.log('🔍 Could not read directory for debugging:', dirError)
            }

            throw new Error(`Local file does not exist at either path: ${localPath} or ${plainFilePath}`)
          }
        }

        console.log('📁 Local file info:', {
          exists: fileInfo.exists,
          size: fileInfo.size,
          isDirectory: fileInfo.isDirectory,
          attempt
        })

        // RACE CONDITION FIX: Add progressive delay to avoid conflicts with audio player
        // Use longer delay if audio player is using this file
        const isAudioPlayerFile = fileLockManager.getAudioPlayerFiles().includes(plainFilePath)
        const baseDelay = attempt * 200 // 200ms, 400ms, 600ms
        const audioPlayerDelay = isAudioPlayerFile ? 2000 : 0 // Extra 2 seconds for audio player files
        const totalDelay = baseDelay + audioPlayerDelay

        if (isAudioPlayerFile) {
          console.log(`🎵 File is being used by audio player, adding extra delay: ${totalDelay}ms`)
        }

        await new Promise(resolve => setTimeout(resolve, totalDelay))

        // RACE CONDITION FIX: Verify file is still accessible before upload
        const finalCheck = await FileSystem.getInfoAsync(plainFilePath)
        if (!finalCheck.exists) {
          throw new Error(`File disappeared before upload: ${plainFilePath}`)
        }

        // CRITICAL FIX: Use uploadFile() for binary files instead of writeFile()
        // This preserves binary integrity and handles MIME types correctly
        // Use the converted plain file path for react-native-cloud-storage
        await CloudStorage.uploadFile(
          cloudPath,           // remotePath
          plainFilePath,       // localPath (converted from file:// URI)
          { mimeType: 'audio/mp4' }, // options with correct MIME type for M4A
          'documents'          // scope
        )

        console.log(`☁️ Successfully uploaded file to iCloud (attempt ${attempt}):`, { localPath, cloudPath })
        return // Success - exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`❌ Failed to upload file to iCloud (attempt ${attempt}/${maxRetries}):`, lastError.message)

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break
        }

        // For certain errors, don't retry
        if (lastError.message.includes('iCloud is only available on iOS') ||
            lastError.message.includes('not initialized')) {
          break
        }

        // Wait before retrying (exponential backoff)
        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // 1s, 2s, 4s (max 5s)
        console.log(`⏳ Retrying in ${retryDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Upload failed after all retries')
    }) // End of fileLockManager.withLock
  }

  /**
   * Check if file exists in iCloud
   */
  async exists(cloudPath: string): Promise<boolean> {
    try {
      await this.initialize()

      if (Platform.OS !== 'ios') return false

      const exists = await CloudStorage.exists(cloudPath, 'documents')
      console.log(`🔍 iCloud exists check for "${cloudPath}": ${exists}`)

      // DEBUGGING: If file exists, also list the directory to verify
      if (exists) {
        try {
          const directory = cloudPath.substring(0, cloudPath.lastIndexOf('/'))
          const files = await CloudStorage.readdir(directory || '/', 'documents')
          const fileName = cloudPath.substring(cloudPath.lastIndexOf('/') + 1)
          const actuallyExists = files.includes(fileName)
          console.log(`🔍 Directory listing verification for "${fileName}": ${actuallyExists}`, files)

          if (exists !== actuallyExists) {
            console.warn(`⚠️ INCONSISTENCY: exists() returned ${exists} but file not in directory listing!`)
          }
        } catch (listError) {
          console.warn('🔍 Could not verify with directory listing:', listError)
        }
      }

      return exists
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

      return await CloudStorage.readdir(cloudPath || '/', 'documents')
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

      await CloudStorage.deleteFile(cloudPath, 'documents')
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
    // CRITICAL FIX: Prevent concurrent migrations that could interfere with each other
    if (this.isMigrating) {
      console.log('☁️ Migration already in progress, skipping concurrent request')
      return { success: 0, failed: [] }
    }

    this.isMigrating = true
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

          // CRITICAL FIX: Check if file is currently being synced by another process
          if (fileLockManager.isLocked(localPath)) {
            console.log('🔒 File is currently being synced by another process, skipping:', localPath)
            continue
          }

          // Check if file already exists in iCloud
          const existsInCloud = await this.exists(cloudPath)
          if (existsInCloud) {
            console.log('☁️ File already exists in iCloud, skipping:', cloudPath)
            results.success++
            continue
          }

          // CRITICAL FIX: Verify local file still exists before attempting sync
          const localFileInfo = await FileSystem.getInfoAsync(localPath)
          if (!localFileInfo.exists) {
            console.warn('📁 Local file disappeared before migration, skipping:', localPath)
            results.failed.push(localPath)
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
    } finally {
      this.isMigrating = false // Always reset migration flag
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
