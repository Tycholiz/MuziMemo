import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { CloudStorage } from 'react-native-cloud-storage'
import * as FileSystem from 'expo-file-system'

import { getRelativePath } from '../utils/pathUtils'

/**
 * Sync status for individual files
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

/**
 * Sync queue item representing a file to be uploaded
 */
export type SyncQueueItem = {
  id: string
  localPath: string
  relativePath: string
  retryCount: number
  lastAttempt?: Date
  status: SyncStatus
  error?: string
}

/**
 * Network state information
 */
export type NetworkState = {
  isConnected: boolean
  isInternetReachable: boolean | null
}

/**
 * Retry intervals in milliseconds for exponential backoff
 * 0s, 30s, 1min, 2min, 5min
 */
const RETRY_INTERVALS = [0, 30000, 60000, 120000, 300000]
const MAX_RETRY_COUNT = RETRY_INTERVALS.length - 1

/**
 * SyncManager handles iCloud synchronization with retry logic and network monitoring
 *
 * Features:
 * - Basic iCloud file upload functionality
 * - Network state detection and automatic retry when online
 * - Exponential backoff retry logic for failed uploads (0s, 30s, 1min, 2min, 5min)
 * - Folder structure preservation from local to iCloud
 * - Integration with existing FileSystemService patterns
 *
 * Usage Example:
 * ```typescript
 * import { syncManager } from '../services/SyncManager'
 *
 * // Add a file to sync queue
 * await syncManager.addToSyncQueue('/path/to/recordings/folder/audio.m4a')
 *
 * // Check sync status
 * const status = syncManager.getSyncStatus('/path/to/recordings/folder/audio.m4a')
 * console.log(status) // 'pending' | 'syncing' | 'synced' | 'failed'
 *
 * // Get network state
 * const networkState = syncManager.getNetworkState()
 * console.log(networkState.isConnected)
 *
 * // Clear completed items
 * syncManager.clearCompletedItems()
 * ```
 *
 * Integration Points:
 * - RecordScreen.saveRecordingToFolder(): Add new recordings to sync queue
 * - AudioClipCard: Display sync status icons (cloud with checkmark/cross)
 * - FileSystem operations: Add moved/renamed files to sync queue
 */
export class SyncManager {
  private syncQueue: Map<string, SyncQueueItem> = new Map()
  private isProcessing = false
  private networkState: NetworkState = { isConnected: false, isInternetReachable: null }
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.initializeNetworkMonitoring()
  }

  /**
   * Initialize network monitoring to automatically process queue when online
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.networkState.isConnected
      this.networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      }

      console.log('🌐 Network state changed:', this.networkState)

      // If we just came back online, process the sync queue
      if (!wasConnected && this.networkState.isConnected && this.networkState.isInternetReachable) {
        console.log('📡 Network restored, processing sync queue...')
        this.processSyncQueue()
      }
    })

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      }
      console.log('🌐 Initial network state:', this.networkState)
    })
  }

  /**
   * Add a file to the sync queue for upload to iCloud
   * @param localPath - Full local file path
   */
  async addToSyncQueue(localPath: string): Promise<void> {
    try {
      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(localPath)
      if (!fileInfo.exists || fileInfo.isDirectory) {
        throw new Error(`File does not exist or is a directory: ${localPath}`)
      }

      // Generate relative path from recordings directory
      const relativePath = getRelativePath(localPath)
      
      if (!relativePath) {
        throw new Error(`File is not within recordings directory: ${localPath}`)
      }

      const queueItem: SyncQueueItem = {
        id: localPath, // Use full path as unique ID
        localPath,
        relativePath,
        retryCount: 0,
        status: 'pending',
      }

      this.syncQueue.set(queueItem.id, queueItem)
      console.log(`📤 Added to sync queue: ${relativePath}`)

      // Start processing if we're online
      if (this.isNetworkAvailable()) {
        this.processSyncQueue()
      }
    } catch (error) {
      console.error('❌ Failed to add file to sync queue:', error)
      throw error
    }
  }

  /**
   * Process the sync queue, uploading pending files
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing || !this.isNetworkAvailable()) {
      return
    }

    this.isProcessing = true
    console.log('🔄 Processing sync queue...')

    try {
      const pendingItems = Array.from(this.syncQueue.values()).filter(
        item => item.status === 'pending' || item.status === 'failed'
      )

      for (const item of pendingItems) {
        await this.uploadFile(item)
      }
    } catch (error) {
      console.error('❌ Error processing sync queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Upload a single file to iCloud with retry logic
   */
  private async uploadFile(item: SyncQueueItem): Promise<void> {
    if (item.status === 'syncing' || item.retryCount > MAX_RETRY_COUNT) {
      return
    }

    // Clear any existing retry timeout
    const existingTimeout = this.retryTimeouts.get(item.id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.retryTimeouts.delete(item.id)
    }

    try {
      // Update status to syncing
      item.status = 'syncing'
      item.lastAttempt = new Date()
      console.log(`☁️ Uploading to iCloud: ${item.relativePath} (attempt ${item.retryCount + 1})`)

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(item.localPath, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Upload to iCloud with full relative path to preserve folder structure
      // The path should start with '/' for CloudStorage API
      const cloudPath = `/${item.relativePath}`
      await CloudStorage.writeFile(cloudPath, fileContent, { encoding: 'base64' })

      // Mark as successfully synced
      item.status = 'synced'
      console.log(`✅ Successfully uploaded to iCloud: ${item.relativePath}`)

    } catch (error) {
      console.error(`❌ Failed to upload ${item.relativePath}:`, error)
      
      item.status = 'failed'
      item.error = error instanceof Error ? error.message : 'Unknown error'
      item.retryCount++

      // Schedule retry if we haven't exceeded max attempts
      if (item.retryCount <= MAX_RETRY_COUNT) {
        this.scheduleRetry(item)
      } else {
        console.error(`💀 Max retry attempts exceeded for: ${item.relativePath}`)
      }
    }
  }

  /**
   * Schedule a retry for a failed upload using exponential backoff
   */
  private scheduleRetry(item: SyncQueueItem): void {
    const retryDelay = RETRY_INTERVALS[item.retryCount] || RETRY_INTERVALS[RETRY_INTERVALS.length - 1]
    
    console.log(`⏰ Scheduling retry for ${item.relativePath} in ${retryDelay / 1000}s (attempt ${item.retryCount + 1})`)

    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(item.id)
      if (this.isNetworkAvailable()) {
        this.uploadFile(item)
      }
    }, retryDelay)

    this.retryTimeouts.set(item.id, timeout)
  }

  /**
   * Check if network is available for sync operations
   */
  private isNetworkAvailable(): boolean {
    return this.networkState.isConnected && this.networkState.isInternetReachable !== false
  }

  /**
   * Get current sync status for a file
   */
  getSyncStatus(localPath: string): SyncStatus | null {
    const item = this.syncQueue.get(localPath)
    return item?.status || null
  }

  /**
   * Get all items in sync queue
   */
  getSyncQueue(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values())
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return { ...this.networkState }
  }

  /**
   * Clear completed sync items from queue
   */
  clearCompletedItems(): void {
    for (const [id, item] of this.syncQueue.entries()) {
      if (item.status === 'synced') {
        this.syncQueue.delete(id)
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all retry timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.retryTimeouts.clear()
    this.syncQueue.clear()
  }
}

// Export singleton instance
export const syncManager = new SyncManager()
