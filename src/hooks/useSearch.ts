import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { searchFileSystem, type SearchResults, type SearchFilters } from '../utils/searchUtils'

/**
 * Custom hook for search functionality with debouncing and history management
 */

const SEARCH_HISTORY_KEY = '@muzimemo_search_history'
const SEARCH_DEBOUNCE_MS = 300
const MAX_SEARCH_HISTORY = 10

export type SearchState = {
  query: string
  results: SearchResults
  isSearching: boolean
  searchHistory: string[]
  filters: SearchFilters
  showResults: boolean
  error: string | null
}

export type SearchActions = {
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  clearSearch: () => void
  clearHistory: () => void
  removeHistoryItem: (item: string) => void
  setShowResults: (show: boolean) => void
  executeSearch: (query: string) => Promise<void>
}

export type UseSearchReturn = SearchState & SearchActions

export function useSearch(): UseSearchReturn {
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<SearchResults>({ audioFiles: [], folders: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [filters, setFiltersState] = useState<SearchFilters>({
    audio: true,
    folders: true,
    text: false,
  })
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const currentSearchRef = useRef<string>('')

  const loadSearchHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        const history = JSON.parse(stored)
        setSearchHistory(Array.isArray(history) ? history : [])
      }
    } catch (error) {
      console.warn('Failed to load search history:', error)
    }
  }, [])

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory()
  }, [loadSearchHistory])

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (query.trim()) {
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
          const searchResults = await searchFileSystem(trimmedQuery, filters)

          // Only update if this is still the current search
          if (currentSearchRef.current === trimmedQuery) {
            setResults(searchResults)
            setShowResults(true)

            // Add to search history
            if (trimmedQuery.length >= 2) {
              setSearchHistory(prev => {
                const filtered = prev.filter(item => item !== trimmedQuery)
                const newHistory = [trimmedQuery, ...filtered].slice(0, MAX_SEARCH_HISTORY)
                saveSearchHistory(newHistory)
                return newHistory
              })
            }
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
  }, [query, filters])

  const saveSearchHistory = async (history: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.warn('Failed to save search history:', error)
    }
  }

  const addToSearchHistory = useCallback(
    (searchQuery: string) => {
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
    },
    []
  )

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
        const searchResults = await searchFileSystem(trimmedQuery, filters)
        
        // Only update if this is still the current search
        if (currentSearchRef.current === trimmedQuery) {
          setResults(searchResults)
          setShowResults(true)
          addToSearchHistory(trimmedQuery)
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
    [filters, addToSearchHistory]
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

  const clearHistory = useCallback(async () => {
    setSearchHistory([])
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      console.warn('Failed to clear search history:', error)
    }
  }, [])

  const removeHistoryItem = useCallback(
    (item: string) => {
      setSearchHistory(prev => {
        const newHistory = prev.filter(historyItem => historyItem !== item)
        saveSearchHistory(newHistory)
        return newHistory
      })
    },
    []
  )

  return {
    // State
    query,
    results,
    isSearching,
    searchHistory,
    filters,
    showResults,
    error,

    // Actions
    setQuery,
    setFilters,
    clearSearch,
    clearHistory,
    removeHistoryItem,
    setShowResults,
    executeSearch,
  }
}
