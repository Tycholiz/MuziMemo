import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { Platform, Alert } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useIsCloudAvailable } from 'react-native-cloud-storage'
import { saveSyncEnabled, loadSyncEnabled } from '../utils/storageUtils'
import { iCloudService } from '../services/iCloudService'

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

  // Use the cloud availability hook
  const isCloudAvailable = useIsCloudAvailable()

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
        await iCloudService.copyFileToCloud(filePath, cloudPath)
        console.log('📤 File synced immediately:', filePath)
      } catch (error) {
        console.error('❌ Failed to sync file immediately:', error)

        // Add to queue for retry
        const queueItem: SyncQueueItem = {
          id: `sync-${Date.now()}-${Math.random()}`,
          localPath: filePath,
          relativePath: iCloudService.getCloudPath(filePath),
          retryCount: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }

        setSyncQueue(prev => [...prev, queueItem])
      }
    },
    [isSyncEnabled, networkState.isConnected]
  )

  const getSyncStatus = useCallback((filePath: string) => {
    const queueItem = syncQueue.find(item => item.localPath === filePath)
    return queueItem?.status || null
  }, [syncQueue])

  const clearCompletedItems = useCallback(() => {
    setSyncQueue(prev => prev.filter(item => item.status !== 'synced'))
    console.log('🧹 Cleared completed sync items')
  }, [])

  const refreshSyncQueue = useCallback(async () => {
    if (!isSyncEnabled || !networkState.isConnected) return

    const pendingItems = syncQueue.filter(item =>
      item.status === 'pending' || item.status === 'failed'
    )

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
        console.error('❌ Failed to sync queued file:', error)

        setSyncQueue(prev => prev.map(queueItem =>
          queueItem.id === item.id
            ? {
                ...queueItem,
                status: 'failed' as const,
                retryCount: queueItem.retryCount + 1,
                lastAttempt: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : queueItem
        ))
      }
    }
  }, [isSyncEnabled, networkState.isConnected, syncQueue])

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
