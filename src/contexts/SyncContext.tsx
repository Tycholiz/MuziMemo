import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
import { Platform, Alert, AppState, AppStateStatus } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useIsCloudAvailable } from 'react-native-cloud-storage'
import { saveSyncEnabled, loadSyncEnabled } from '../utils/storageUtils'
import { iCloudService } from '../services/iCloudService'

// Constants
const MAX_RETRY_COUNT = 3 // Maximum number of retry attempts before giving up

// Network and sync state types
type NetworkState = { isConnected: boolean; isInternetReachable: boolean | null }
type SyncQueueItem = {
  id: string
  localPath: string
  relativePath: string
  retryCount: number
  lastAttempt?: Date
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  error?: string
}

export type SyncContextState = {
  isSyncEnabled: boolean
  networkState: NetworkState
  syncQueue: SyncQueueItem[]
  isLoading: boolean
  isCloudAvailable: boolean
  isMigrating: boolean
  isBackgroundSyncing: boolean
}

export type SyncContextActions = {
  enableSync: () => Promise<void>
  disableSync: () => Promise<void>
  addToSyncQueue: (filePath: string) => Promise<void>
  getSyncStatus: (filePath: string) => string | null
  clearCompletedItems: () => void
  refreshSyncQueue: () => void
  migrateToCloud: () => Promise<void>
  syncAllPendingFiles: () => Promise<void>
}

export type SyncContextType = SyncContextState & SyncContextActions

const SyncContext = createContext<SyncContextType | null>(null)

type SyncProviderProps = {
  children: ReactNode
}

/**
 * SyncProvider manages iCloud synchronization
 *
 * Features:
 * - Real iCloud sync functionality using react-native-cloud-storage
 * - Network state monitoring with @react-native-community/netinfo
 * - File migration from local to iCloud storage
 * - Sync queue management for offline operations
 * - Error handling and user feedback
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const [isSyncEnabled, setIsSyncEnabled] = useState(false)
  const [networkState, setNetworkState] = useState<NetworkState>({ isConnected: true, isInternetReachable: true })
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false)

  // Use the cloud availability hook
  const isCloudAvailable = useIsCloudAvailable()

  // Ref to store the background sync interval
  const backgroundSyncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track app state for background sync management
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Initialize sync context with network monitoring and iCloud setup
  useEffect(() => {
    const initializeSync = async () => {
      try {
        setIsLoading(true)

        // Initialize iCloud service
        await iCloudService.initialize()

        // Load sync preference from storage
        const syncEnabled = await loadSyncEnabled()
        setIsSyncEnabled(syncEnabled)

        console.log('🔄 SyncContext initialized:', { syncEnabled, isCloudAvailable })
      } catch (error) {
        console.error('❌ Failed to initialize sync context:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSync()
  }, [isCloudAvailable])

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      })
    })

    return unsubscribe
  }, [])
  const enableSync = useCallback(async () => {
    try {
      // Check if iCloud is available
      if (Platform.OS === 'ios' && !isCloudAvailable) {
        Alert.alert(
          'iCloud Drive Required',
          'Please enable iCloud Drive in your device settings to use sync functionality.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // Note: Opening settings requires additional setup
              console.log('📱 User should open Settings > [Apple ID] > iCloud > iCloud Drive')
            }}
          ]
        )
        return
      }

      if (Platform.OS !== 'ios') {
        Alert.alert(
          'iOS Only Feature',
          'iCloud sync is only available on iOS devices.',
          [{ text: 'OK' }]
        )
        return
      }

      setIsSyncEnabled(true)
      await saveSyncEnabled(true)

      console.log('✅ Sync enabled - iCloud functionality active')

      // Optionally trigger migration dialog
      Alert.alert(
        'Sync Enabled',
        'Would you like to upload your existing recordings to iCloud?',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Upload Now', onPress: () => migrateToCloud() }
        ]
      )
    } catch (error) {
      console.error('❌ Failed to enable sync:', error)
      // Revert state on error
      setIsSyncEnabled(false)
      throw error
    }
  }, [isCloudAvailable])

  const disableSync = useCallback(async () => {
    try {
      setIsSyncEnabled(false)
      await saveSyncEnabled(false)

      // Clear sync queue when disabling
      setSyncQueue([])

      console.log('🚫 Sync disabled - switching to local storage only')
    } catch (error) {
      console.error('❌ Failed to disable sync:', error)
      // Revert state on error
      setIsSyncEnabled(true)
      throw error
    }
  }, [])

  const migrateToCloud = useCallback(async () => {
    if (isMigrating) return

    try {
      setIsMigrating(true)

      console.log('☁️ Starting migration to iCloud...')
      const results = await iCloudService.migrateLocalRecordingsToCloud()

      Alert.alert(
        'Migration Complete',
        `Successfully uploaded ${results.success} recordings to iCloud.${
          results.failed.length > 0 ? ` ${results.failed.length} files failed to upload.` : ''
        }`,
        [{ text: 'OK' }]
      )

      console.log('✅ Migration completed:', results)
    } catch (error) {
      console.error('❌ Migration failed:', error)
      Alert.alert(
        'Migration Failed',
        'Failed to upload recordings to iCloud. Please try again later.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsMigrating(false)
    }
  }, [isMigrating])

  const refreshSyncQueue = useCallback(async () => {
    if (!isSyncEnabled || !networkState.isConnected) return

    // Filter items that haven't exceeded max retry count
    const pendingItems = syncQueue.filter(item =>
      (item.status === 'pending' || item.status === 'failed') &&
      item.retryCount < MAX_RETRY_COUNT
    )

    // Remove items that have exceeded max retry count
    const itemsToRemove = syncQueue.filter(item =>
      item.status === 'failed' && item.retryCount >= MAX_RETRY_COUNT
    )

    if (itemsToRemove.length > 0) {
      console.warn(`🗑️ Removing ${itemsToRemove.length} permanently failed items from sync queue:`,
        itemsToRemove.map(item => ({ path: item.localPath, retries: item.retryCount, error: item.error }))
      )

      setSyncQueue(prev => prev.filter(item =>
        !(item.status === 'failed' && item.retryCount >= MAX_RETRY_COUNT)
      ))
    }

    for (const item of pendingItems) {
      try {
        setSyncQueue(prev => prev.map(queueItem =>
          queueItem.id === item.id
            ? { ...queueItem, status: 'syncing' as const }
            : queueItem
        ))

        await iCloudService.copyFileToCloud(item.localPath, item.relativePath)

        setSyncQueue(prev => prev.map(queueItem =>
          queueItem.id === item.id
            ? { ...queueItem, status: 'synced' as const }
            : queueItem
        ))

        console.log('✅ Synced queued file:', item.localPath)
      } catch (error) {
        const newRetryCount = item.retryCount + 1
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        console.error(`❌ Failed to sync queued file (attempt ${newRetryCount}/${MAX_RETRY_COUNT}):`, {
          path: item.localPath,
          error: errorMessage,
          retryCount: newRetryCount
        })

        // Handle file lock errors with shorter retry delay
        const isFileLockError = errorMessage.includes('File is currently locked')
        const isFileNotFoundError = errorMessage.includes('Local file does not exist') ||
                                   errorMessage.includes('File disappeared')

        if (newRetryCount >= MAX_RETRY_COUNT) {
          console.error(`🚫 File permanently failed after ${MAX_RETRY_COUNT} attempts:`, item.localPath)
        } else if (isFileLockError) {
          console.log(`🔒 File locked, will retry shortly: ${item.localPath}`)
        } else if (isFileNotFoundError) {
          console.warn(`📁 File not found, may have been moved by audio player: ${item.localPath}`)
        }

        setSyncQueue(prev => prev.map(queueItem =>
          queueItem.id === item.id
            ? {
                ...queueItem,
                status: 'failed' as const,
                retryCount: newRetryCount,
                lastAttempt: new Date(),
                error: errorMessage
              }
            : queueItem
        ))
      }
    }
  }, [isSyncEnabled, networkState.isConnected, syncQueue])

  const syncAllPendingFiles = useCallback(async () => {
    if (!isSyncEnabled || !networkState.isConnected) {
      console.log('📤 Sync not available - disabled or offline')
      return
    }

    try {
      console.log('🔄 Starting sync of all pending files...')

      // Get all local recordings that haven't been synced yet
      const results = await iCloudService.migrateLocalRecordingsToCloud()

      console.log(`✅ Sync completed: ${results.success} files synced, ${results.failed.length} failed`)

      if (results.failed.length > 0) {
        console.warn('❌ Some files failed to sync:', results.failed)
      }
    } catch (error) {
      console.error('❌ Failed to sync pending files:', error)
    }
  }, [isSyncEnabled, networkState.isConnected])

  // Background sync function - scans for unsynced files and retries failed syncs
  const performBackgroundSync = useCallback(async () => {
    if (!isSyncEnabled || !networkState.isConnected || isBackgroundSyncing) {
      return
    }

    try {
      setIsBackgroundSyncing(true)
      console.log('🔄 Starting background sync...')

      // First, retry any failed or pending items in the sync queue (within retry limits)
      const pendingItems = syncQueue.filter(item =>
        (item.status === 'pending' || item.status === 'failed') &&
        item.retryCount < MAX_RETRY_COUNT
      )

      const permanentlyFailedItems = syncQueue.filter(item =>
        item.status === 'failed' && item.retryCount >= MAX_RETRY_COUNT
      )

      if (permanentlyFailedItems.length > 0) {
        console.log(`🗑️ Found ${permanentlyFailedItems.length} permanently failed items to clean up`)
      }

      if (pendingItems.length > 0) {
        console.log(`🔄 Retrying ${pendingItems.length} pending/failed sync items (within retry limits)`)
        await refreshSyncQueue()
      }

      // Then, scan for any unsynced files that might have been missed
      // This is a fallback to catch any files that weren't added to the queue
      try {
        const results = await iCloudService.migrateLocalRecordingsToCloud()
        if (results.success > 0) {
          console.log(`✅ Background sync: ${results.success} additional files synced`)
        }
        if (results.failed.length > 0) {
          console.warn(`❌ Background sync: ${results.failed.length} files failed`)
        }
      } catch (migrationError) {
        console.warn('Background sync migration check failed:', migrationError)
      }

    } catch (error) {
      console.error('❌ Background sync failed:', error)
    } finally {
      setIsBackgroundSyncing(false)

      // Periodic cleanup: Remove old completed and permanently failed items
      // This prevents the sync queue from growing indefinitely
      const now = new Date()
      const oldItems = syncQueue.filter(item => {
        if (!item.lastAttempt) return false
        const hoursSinceLastAttempt = (now.getTime() - item.lastAttempt.getTime()) / (1000 * 60 * 60)
        return (item.status === 'synced' || (item.status === 'failed' && item.retryCount >= MAX_RETRY_COUNT))
               && hoursSinceLastAttempt > 1 // Remove items older than 1 hour
      })

      if (oldItems.length > 0) {
        console.log(`🧹 Auto-cleaning ${oldItems.length} old sync queue items`)
        setSyncQueue(prev => prev.filter(item => !oldItems.includes(item)))
      }
    }
  }, [isSyncEnabled, networkState.isConnected, isBackgroundSyncing, syncQueue, refreshSyncQueue])

  // Handle app state changes for background sync management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current
      appStateRef.current = nextAppState

      if (previousAppState === 'background' && nextAppState === 'active') {
        // App came to foreground - trigger immediate background sync
        console.log('📱 App came to foreground - triggering sync check')
        if (isSyncEnabled && networkState.isConnected) {
          // Small delay to let the app settle
          setTimeout(() => {
            performBackgroundSync()
          }, 1000)
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription?.remove()
    }
  }, [isSyncEnabled, networkState.isConnected, performBackgroundSync])

  // Setup periodic background sync
  useEffect(() => {
    // Clear any existing interval
    if (backgroundSyncIntervalRef.current) {
      clearInterval(backgroundSyncIntervalRef.current)
    }

    // Start background sync if conditions are met
    if (isSyncEnabled && networkState.isConnected) {
      console.log('🔄 Starting periodic background sync (every 10 seconds)')

      backgroundSyncIntervalRef.current = setInterval(() => {
        performBackgroundSync()
      }, 10000) // 10 seconds
    }

    // Cleanup function
    return () => {
      if (backgroundSyncIntervalRef.current) {
        clearInterval(backgroundSyncIntervalRef.current)
        backgroundSyncIntervalRef.current = null
      }
    }
  }, [isSyncEnabled, networkState.isConnected, performBackgroundSync])

  const addToSyncQueue = useCallback(
    async (filePath: string) => {
      if (!isSyncEnabled) {
        console.log('📤 Sync disabled, skipping file:', filePath)
        return
      }

      if (!networkState.isConnected) {
        // Add to queue for later sync when network is available
        const queueItem: SyncQueueItem = {
          id: `sync-${Date.now()}-${Math.random()}`,
          localPath: filePath,
          relativePath: iCloudService.getCloudPath(filePath),
          retryCount: 0,
          status: 'pending',
        }

        setSyncQueue(prev => [...prev, queueItem])
        console.log('📤 Added to sync queue (offline):', filePath)
        return
      }

      // Try to sync immediately
      try {
        const cloudPath = iCloudService.getCloudPath(filePath)

        // Check if this is a file lock error and handle gracefully
        try {
          await iCloudService.copyFileToCloud(filePath, cloudPath)
          console.log('📤 File synced immediately:', filePath)
        } catch (lockError) {
          const errorMessage = lockError instanceof Error ? lockError.message : 'Unknown error'

          // If file is locked (likely by audio player), add to queue for later retry
          if (errorMessage.includes('File is currently locked') ||
              errorMessage.includes('Local file does not exist') ||
              errorMessage.includes('File disappeared')) {
            console.log('🔒 File locked or temporarily unavailable, adding to sync queue for retry:', filePath)
            throw lockError // This will trigger the queue addition below
          } else {
            // For other errors, re-throw immediately
            throw lockError
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ Failed to sync file immediately:', errorMessage)

        // Add to queue for retry
        const queueItem: SyncQueueItem = {
          id: `sync-${Date.now()}-${Math.random()}`,
          localPath: filePath,
          relativePath: iCloudService.getCloudPath(filePath),
          retryCount: 0,
          status: 'pending', // Start as pending instead of failed for immediate retry
          error: errorMessage,
        }

        setSyncQueue(prev => [...prev, queueItem])
        console.log('📋 Added file to sync queue for retry:', filePath)
      }
    },
    [isSyncEnabled, networkState.isConnected]
  )

  const getSyncStatus = useCallback((filePath: string) => {
    const queueItem = syncQueue.find(item => item.localPath === filePath)
    return queueItem?.status || null
  }, [syncQueue])

  const clearCompletedItems = useCallback(() => {
    const itemsToRemove = syncQueue.filter(item =>
      item.status === 'synced' || (item.status === 'failed' && item.retryCount >= MAX_RETRY_COUNT)
    )

    if (itemsToRemove.length > 0) {
      console.log(`🧹 Clearing ${itemsToRemove.length} completed/permanently failed items from sync queue`)
    }

    setSyncQueue(prev => prev.filter(item =>
      item.status !== 'synced' && !(item.status === 'failed' && item.retryCount >= MAX_RETRY_COUNT)
    ))
  }, [syncQueue])

  // Auto-refresh sync queue when network comes back online
  useEffect(() => {
    if (networkState.isConnected && isSyncEnabled && syncQueue.length > 0) {
      const timer = setTimeout(() => {
        refreshSyncQueue()
      }, 1000) // Wait 1 second after network reconnection

      return () => clearTimeout(timer)
    }
  }, [networkState.isConnected, isSyncEnabled, syncQueue.length, refreshSyncQueue])

  const value: SyncContextType = {
    // State
    isSyncEnabled,
    networkState,
    syncQueue,
    isLoading,
    isCloudAvailable,
    isMigrating,
    isBackgroundSyncing,

    // Actions
    enableSync,
    disableSync,
    addToSyncQueue,
    getSyncStatus,
    clearCompletedItems,
    refreshSyncQueue,
    migrateToCloud,
    syncAllPendingFiles,
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSyncContext(): SyncContextType {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider')
  }
  return context
}
