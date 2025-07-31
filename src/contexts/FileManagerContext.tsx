import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import * as FileSystem from 'expo-file-system'

export type FileManagerState = {
  currentPath: string[]
  isLoading: boolean
  error: string | null
}

export type FileManagerActions = {
  navigateToFolder: (folderName: string) => void
  navigateToPath: (path: string[]) => void
  navigateToRoot: () => void
  navigateToBreadcrumb: (index: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getCurrentPathString: () => string
  getFullPath: () => string
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

  const navigateToFolder = useCallback((folderName: string) => {
    setCurrentPath(prev => [...prev, folderName])
  }, [])

  const navigateToPath = useCallback((path: string[]) => {
    setCurrentPath(path)
  }, [])

  const navigateToRoot = useCallback(() => {
    setCurrentPath([])
  }, [])

  const navigateToBreadcrumb = useCallback((index: number) => {
    if (index === 0) {
      setCurrentPath([])
    } else {
      setCurrentPath(prev => prev.slice(0, index))
    }
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
    
    const recordingsPath = `${documentsDirectory}recordings`
    if (currentPath.length === 0) {
      return recordingsPath
    }
    
    return `${recordingsPath}/${currentPath.join('/')}`
  }, [currentPath])

  const value: FileManagerContextType = {
    // State
    currentPath,
    isLoading,
    error,
    
    // Actions
    navigateToFolder,
    navigateToPath,
    navigateToRoot,
    navigateToBreadcrumb,
    setLoading: setLoadingState,
    setError: setErrorState,
    getCurrentPathString,
    getFullPath,
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
