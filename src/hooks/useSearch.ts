import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { searchFileSystem, type SearchResults, type SearchFilters } from '../utils/searchUtils'

/**
 * Custom hook for search functionality with debouncing and recent searches management
 */

const RECENT_SEARCHES_KEY = '@muzimemo_recent_searches'
const SEARCH_DEBOUNCE_MS = 300
const MAX_RECENT_SEARCHES = 5

export type RecentSearchItem = {
  type: 'audio' | 'folder'
  name: string
  relativePath: string
  id: string
  timestamp: number
}

export type SearchState = {
  query: string
  results: SearchResults
  isSearching: boolean
  recentSearches: RecentSearchItem[]
  filters: SearchFilters
  showResults: boolean
  error: string | null
  currentPath: string[]
}

export type SearchActions = {
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  clearSearch: () => void
  clearRecentSearches: () => void
  removeRecentSearchItem: (item: RecentSearchItem) => void
  addToRecentSearches: (item: Omit<RecentSearchItem, 'timestamp'>) => void
  setShowResults: (show: boolean) => void
  executeSearch: (query: string) => Promise<void>
  setCurrentPath: (path: string[]) => void
}

export type UseSearchReturn = SearchState & SearchActions

export function useSearch(): UseSearchReturn {
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<SearchResults>({ audioFiles: [], folders: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [filters, setFiltersState] = useState<SearchFilters>({
    audio: true,
    folders: true,
    text: false,
    currentDirectoryOnly: false,
  })
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const currentSearchRef = useRef<string>('')

  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        const searches = JSON.parse(stored)
        setRecentSearches(Array.isArray(searches) ? searches : [])
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error)
    }
  }, [])

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches()
  }, [loadRecentSearches])

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (query.trim()) {
      // @ts-expect-error
      debounceTimeoutRef.current = setTimeout(async () => {
        const trimmedQuery = query.trim()
        if (!trimmedQuery) {
          setResults({ audioFiles: [], folders: [] })
          setShowResults(false)
          return
        }

        // Prevent duplicate searches
        if (currentSearchRef.current === trimmedQuery) {
          return
        }

        currentSearchRef.current = trimmedQuery
        setIsSearching(true)
        setError(null)

        try {
          const searchResults = await searchFileSystem(trimmedQuery, filters, currentPath)

          // Only update if this is still the current search
          if (currentSearchRef.current === trimmedQuery) {
            setResults(searchResults)
            setShowResults(true)
          }
        } catch (searchError) {
          console.error('Search failed:', searchError)
          if (currentSearchRef.current === trimmedQuery) {
            setError('Search failed. Please try again.')
            setResults({ audioFiles: [], folders: [] })
          }
        } finally {
          if (currentSearchRef.current === trimmedQuery) {
            setIsSearching(false)
          }
        }
      }, SEARCH_DEBOUNCE_MS)
    } else {
      setResults({ audioFiles: [], folders: [] })
      setShowResults(false)
      setError(null)
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, filters, currentPath])

  // Re-execute search when filters change (without debounce)
  useEffect(() => {
    if (query.trim() && showResults) {
      // Re-execute search immediately when filters change
      const trimmedQuery = query.trim()
      if (trimmedQuery) {
        currentSearchRef.current = trimmedQuery
        setIsSearching(true)
        setError(null)

        searchFileSystem(trimmedQuery, filters, currentPath)
          .then(searchResults => {
            if (currentSearchRef.current === trimmedQuery) {
              setResults(searchResults)
              setShowResults(true)
            }
          })
          .catch(searchError => {
            console.error('Search failed:', searchError)
            if (currentSearchRef.current === trimmedQuery) {
              setError('Search failed. Please try again.')
              setResults({ audioFiles: [], folders: [] })
            }
          })
          .finally(() => {
            if (currentSearchRef.current === trimmedQuery) {
              setIsSearching(false)
            }
          })
      }
    }
  }, [filters, currentPath])

  const saveRecentSearches = async (searches: RecentSearchItem[]) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches))
    } catch (error) {
      console.warn('Failed to save recent searches:', error)
    }
  }

  const addToSearchHistory = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery || trimmedQuery.length < 2) return

    setSearchHistory(prev => {
      // Remove existing instance if present
      const filtered = prev.filter(item => item !== trimmedQuery)
      // Add to beginning
      const newHistory = [trimmedQuery, ...filtered].slice(0, MAX_SEARCH_HISTORY)
      saveSearchHistory(newHistory)
      return newHistory
    })
  }, [])

  const executeSearch = useCallback(
    async (searchQuery: string) => {
      const trimmedQuery = searchQuery.trim()
      if (!trimmedQuery) {
        setResults({ audioFiles: [], folders: [] })
        setShowResults(false)
        return
      }

      // Prevent duplicate searches
      if (currentSearchRef.current === trimmedQuery) {
        return
      }

      currentSearchRef.current = trimmedQuery
      setIsSearching(true)
      setError(null)

      try {
        const searchResults = await searchFileSystem(trimmedQuery, filters, currentPath)

        // Only update if this is still the current search
        if (currentSearchRef.current === trimmedQuery) {
          setResults(searchResults)
          setShowResults(true)
        }
      } catch (searchError) {
        console.error('Search failed:', searchError)
        if (currentSearchRef.current === trimmedQuery) {
          setError('Search failed. Please try again.')
          setResults({ audioFiles: [], folders: [] })
        }
      } finally {
        if (currentSearchRef.current === trimmedQuery) {
          setIsSearching(false)
        }
      }
    },
    [filters, currentPath]
  )

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
    if (!newQuery.trim()) {
      setShowResults(false)
      setError(null)
    }
  }, [])

  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState(newFilters)
    // The useEffect will automatically re-search when filters change
  }, [])

  const clearSearch = useCallback(() => {
    setQueryState('')
    setResults({ audioFiles: [], folders: [] })
    setShowResults(false)
    setError(null)
    currentSearchRef.current = ''

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
  }, [])

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([])
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch (error) {
      console.warn('Failed to clear recent searches:', error)
    }
  }, [])

  const removeHistoryItem = useCallback((item: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(historyItem => historyItem !== item)
      saveSearchHistory(newHistory)
      return newHistory
    })
  }, [])

  return {
    // State
    query,
    results,
    isSearching,
    recentSearches,
    filters,
    showResults,
    error,
    currentPath,

    // Actions
    setQuery,
    setFilters,
    clearSearch,
    clearRecentSearches,
    removeRecentSearchItem,
    addToRecentSearches,
    setShowResults,
    executeSearch,
    setCurrentPath,
  }
}
