import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { saveSyncEnabled, loadSyncEnabled } from '../utils/storageUtils'

// Simplified types for UI-only sync context
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
}

export type SyncContextActions = {
  enableSync: () => Promise<void>
  disableSync: () => Promise<void>
  addToSyncQueue: (filePath: string) => Promise<void>
  getSyncStatus: (filePath: string) => string | null
  clearCompletedItems: () => void
  refreshSyncQueue: () => void
}

export type SyncContextType = SyncContextState & SyncContextActions

const SyncContext = createContext<SyncContextType | null>(null)

type SyncProviderProps = {
  children: ReactNode
}

/**
 * SyncProvider manages sync UI state without actual cloud operations
 *
 * Features:
 * - Manages sync enabled/disabled preference with persistence
 * - Provides UI state for sync toggle and status display
 * - No actual file synchronization or cloud operations
 * - Maintains interface compatibility for UI components
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const [isSyncEnabled, setIsSyncEnabled] = useState(false)
  const [networkState] = useState<NetworkState>({ isConnected: true, isInternetReachable: true })
  const [syncQueue] = useState<SyncQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load initial sync preference (UI only)
  useEffect(() => {
    const initializeSync = async () => {
      try {
        setIsLoading(true)

        // Load sync preference from storage
        const syncEnabled = await loadSyncEnabled()
        setIsSyncEnabled(syncEnabled)

        console.log('🔄 SyncContext initialized (UI only):', { syncEnabled })
      } catch (error) {
        console.error('❌ Failed to initialize sync context:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSync()
  }, [])
  const enableSync = useCallback(async () => {
    try {
      setIsSyncEnabled(true)
      await saveSyncEnabled(true)
      console.log('✅ Sync enabled (UI only - no actual sync operations)')
    } catch (error) {
      console.error('❌ Failed to enable sync:', error)
      // Revert state on error
      setIsSyncEnabled(false)
      throw error
    }
  }, [])

  const disableSync = useCallback(async () => {
    try {
      setIsSyncEnabled(false)
      await saveSyncEnabled(false)
      console.log('🚫 Sync disabled (UI only)')
    } catch (error) {
      console.error('❌ Failed to disable sync:', error)
      // Revert state on error
      setIsSyncEnabled(true)
      throw error
    }
  }, [])

  const addToSyncQueue = useCallback(
    async (filePath: string) => {
      if (!isSyncEnabled) {
        console.log('📤 Sync disabled, skipping file (UI only):', filePath)
        return
      }

      // UI only - no actual sync operations
      console.log('📤 Would add to sync queue (UI only):', filePath)
    },
    [isSyncEnabled]
  )

  // @ts-expect-error
  const getSyncStatus = useCallback((filePath: string) => {
    // UI only - always return null (no sync status)
    return null
  }, [])

  const clearCompletedItems = useCallback(() => {
    // UI only - no actual items to clear
    console.log('🧹 Would clear completed sync items (UI only)')
  }, [])

  const refreshSyncQueue = useCallback(() => {
    // UI only - no actual queue to refresh
    console.log('🔄 Would refresh sync queue (UI only)')
  }, [])

  const value: SyncContextType = {
    // State
    isSyncEnabled,
    networkState,
    syncQueue,
    isLoading,

    // Actions
    enableSync,
    disableSync,
    addToSyncQueue,
    getSyncStatus,
    clearCompletedItems,
    refreshSyncQueue,
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
