import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import * as FileSystem from 'expo-file-system'
import { getRecentlyDeletedDirectory } from '../utils/recentlyDeletedUtils'

export type FileManagerState = {
  currentPath: string[]
  isLoading: boolean
  error: string | null
  isInRecentlyDeleted: boolean
}

export type FileManagerActions = {
  navigateToFolder: (folderName: string) => void
  navigateToPath: (path: string[]) => void
  navigateToRoot: () => void
  navigateToBreadcrumb: (index: number) => void
  navigateToRecentlyDeleted: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getCurrentPathString: () => string
  getFullPath: () => string
  getIsInRecentlyDeleted: () => boolean
}

export type FileManagerContextType = FileManagerState & FileManagerActions

const FileManagerContext = createContext<FileManagerContextType | null>(null)

type FileManagerProviderProps = {
  children: ReactNode
}

export function FileManagerProvider({ children }: FileManagerProviderProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInRecentlyDeleted, setIsInRecentlyDeleted] = useState(false)

  const navigateToFolder = useCallback((folderName: string) => {
    setCurrentPath(prev => [...prev, folderName])
    setIsInRecentlyDeleted(false)
  }, [])

  const navigateToPath = useCallback((path: string[]) => {
    setCurrentPath(path)
    setIsInRecentlyDeleted(false)
  }, [])

  const navigateToRoot = useCallback(() => {
    setCurrentPath([])
    setIsInRecentlyDeleted(false)
  }, [])

  const navigateToBreadcrumb = useCallback((index: number) => {
    if (index === 0) {
      setCurrentPath([])
    } else {
      setCurrentPath(prev => prev.slice(0, index))
    }
    setIsInRecentlyDeleted(false)
  }, [])

  const navigateToRecentlyDeleted = useCallback(() => {
    setCurrentPath([])
    setIsInRecentlyDeleted(true)
  }, [])

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage)
  }, [])

  const getCurrentPathString = useCallback(() => {
    return currentPath.join('/')
  }, [currentPath])

  const getFullPath = useCallback(() => {
    const documentsDirectory = FileSystem.documentDirectory
    if (!documentsDirectory) return ''

    if (isInRecentlyDeleted) {
      return getRecentlyDeletedDirectory()
    }

    const recordingsPath = `${documentsDirectory}recordings`
    if (currentPath.length === 0) {
      return recordingsPath
    }

    return `${recordingsPath}/${currentPath.join('/')}`
  }, [currentPath, isInRecentlyDeleted])

  const getIsInRecentlyDeleted = useCallback(() => {
    return isInRecentlyDeleted
  }, [isInRecentlyDeleted])

  const value: FileManagerContextType = {
    // State
    currentPath,
    isLoading,
    error,
    isInRecentlyDeleted,

    // Actions
    navigateToFolder,
    navigateToPath,
    navigateToRoot,
    navigateToBreadcrumb,
    navigateToRecentlyDeleted,
    setLoading: setLoadingState,
    setError: setErrorState,
    getCurrentPathString,
    getFullPath,
    getIsInRecentlyDeleted,
  }

  return (
    <FileManagerContext.Provider value={value}>
      {children}
    </FileManagerContext.Provider>
  )
}

export function useFileManager(): FileManagerContextType {
  const context = useContext(FileManagerContext)
  if (!context) {
    throw new Error('useFileManager must be used within a FileManagerProvider')
  }
  return context
}
