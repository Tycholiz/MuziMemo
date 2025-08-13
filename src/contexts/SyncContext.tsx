import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { syncManager } from '../services/SyncManager'
import { saveSyncEnabled, loadSyncEnabled } from '../utils/storageUtils'
import type { NetworkState, SyncQueueItem } from '../services/SyncManager'

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
 * SyncProvider manages iCloud synchronization state and integrates with SyncManager
 * 
 * Features:
 * - Manages sync enabled/disabled preference with persistence
 * - Integrates with singleton SyncManager instance
 * - Provides sync queue status and network state
 * - Handles enabling/disabling sync functionality
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const [isSyncEnabled, setIsSyncEnabled] = useState(false)
  const [networkState, setNetworkState] = useState<NetworkState>({ isConnected: false, isInternetReachable: null })
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load initial sync preference and sync queue
  useEffect(() => {
    const initializeSync = async () => {
      try {
        setIsLoading(true)
        
        // Load sync preference from storage
        const syncEnabled = await loadSyncEnabled()
        setIsSyncEnabled(syncEnabled)
        
        // Get initial network state and sync queue from SyncManager
        setNetworkState(syncManager.getNetworkState())
        setSyncQueue(syncManager.getSyncQueue())
        
        console.log('🔄 SyncContext initialized:', { syncEnabled })
      } catch (error) {
        console.error('❌ Failed to initialize sync context:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSync()
  }, [])

  // Periodically refresh sync queue and network state
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkState(syncManager.getNetworkState())
      setSyncQueue(syncManager.getSyncQueue())
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [])

  const enableSync = useCallback(async () => {
    try {
      setIsSyncEnabled(true)
      await saveSyncEnabled(true)
      console.log('✅ Sync enabled')
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
      console.log('🚫 Sync disabled')
    } catch (error) {
      console.error('❌ Failed to disable sync:', error)
      // Revert state on error
      setIsSyncEnabled(true)
      throw error
    }
  }, [])

  const addToSyncQueue = useCallback(async (filePath: string) => {
    if (!isSyncEnabled) {
      console.log('📤 Sync disabled, skipping file:', filePath)
      return
    }

    try {
      await syncManager.addToSyncQueue(filePath)
      // Refresh sync queue to reflect the new item
      setSyncQueue(syncManager.getSyncQueue())
      console.log('📤 Added to sync queue:', filePath)
    } catch (error) {
      console.error('❌ Failed to add file to sync queue:', error)
      throw error
    }
  }, [isSyncEnabled])

  const getSyncStatus = useCallback((filePath: string) => {
    return syncManager.getSyncStatus(filePath)
  }, [])

  const clearCompletedItems = useCallback(() => {
    syncManager.clearCompletedItems()
    setSyncQueue(syncManager.getSyncQueue())
    console.log('🧹 Cleared completed sync items')
  }, [])

  const refreshSyncQueue = useCallback(() => {
    setSyncQueue(syncManager.getSyncQueue())
    setNetworkState(syncManager.getNetworkState())
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
