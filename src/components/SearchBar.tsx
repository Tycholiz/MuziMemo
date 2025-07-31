import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import { SearchResults } from './SearchResults'
import { useSearch } from '../hooks/useSearch'

export type SearchBarProps = {
  placeholder?: string
  autoFocus?: boolean
  onResultSelect?: (type: 'audio' | 'folder', item: any) => void
  onAudioPlayPause?: (audioFile: any) => void
  currentPath?: string[]
  currentPlayingId?: string
  isPlaying?: boolean
  style?: any
}

export type SearchBarRef = {
  dismissDropdown: () => void
}

/**
 * SearchBar Component
 * Provides search functionality with dropdown results and history
 */
export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({
  placeholder = 'Search audio files and folders...',
  autoFocus = false,
  onResultSelect,
  onAudioPlayPause,
  currentPath = [],
  currentPlayingId,
  isPlaying = false,
  style,
}, ref) => {
  const inputRef = useRef<TextInput>(null)
  const search = useSearch()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  // Update search hook with current path
  useEffect(() => {
    search.setCurrentPath(currentPath)
  }, [currentPath, search])

  // Track if user is interacting with the dropdown to prevent dismissal during scrolling
  const isInteractingWithDropdown = useRef(false)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    dismissDropdown: () => {
      search.setShowResults(false)
    }
  }), [search])

  // Listen for keyboard events to hide suggestions when keyboard is dismissed
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Don't hide if user is actively interacting with the dropdown (scrolling)
      if (isInteractingWithDropdown.current) {
        return
      }

      // Only hide if there's no query (showing suggestions) or if input is not focused
      if (!search.query.trim() || !inputRef.current?.isFocused()) {
        search.setShowResults(false)
      }
    })

    return () => {
      keyboardDidHideListener.remove()
    }
  }, [search])

  // Auto-focus when component mounts
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  // Animate dropdown appearance
  useEffect(() => {
    if (search.showResults || (search.query === '' && search.searchHistory.length > 0)) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [search.showResults, search.query, search.searchHistory.length, fadeAnim, scaleAnim])

  const handleFocus = () => {
    search.setShowResults(true)
  }

  const handleBlur = () => {
    // Only hide results if there's no query (showing suggestions)
    // For search results, let the keyboard listener handle hiding
    if (!search.query.trim()) {
      setTimeout(() => {
        search.setShowResults(false)
      }, 300)
    }
  }

  const handleClear = () => {
    search.clearSearch()
    inputRef.current?.focus()
  }

  const handleHistorySelect = (historyItem: string) => {
    search.setQuery(historyItem)
    inputRef.current?.blur()
  }

  const handleAudioFileSelect = (audioFile: any) => {
    onResultSelect?.('audio', audioFile)
    search.setShowResults(false)
    Keyboard.dismiss()
  }

  const handleAudioPlayPause = (audioFile: any) => {
    onAudioPlayPause?.(audioFile)
    // Keep search results open when playing audio
  }

  const handleScrollStart = () => {
    isInteractingWithDropdown.current = true
  }

  const handleScrollEnd = () => {
    // Delay resetting the flag to ensure keyboard dismissal doesn't interfere
    setTimeout(() => {
      isInteractingWithDropdown.current = false
    }, 100)
  }

  const handleFolderSelect = (folder: any) => {
    onResultSelect?.('folder', folder)
    search.setShowResults(false)
    Keyboard.dismiss()
  }



  const showDropdown = search.showResults || (search.query === '' && search.searchHistory.length > 0)

  return (
    <View style={[styles.container, style]}>
      {/* Search Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.text.tertiary}
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          value={search.query}
          onChangeText={search.setQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={theme.colors.primary}
        />

        {search.query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <SearchResults
            query={search.query}
            results={search.results}
            searchHistory={search.searchHistory}
            filters={search.filters}
            isSearching={search.isSearching}
            error={search.error}
            onFiltersChange={search.setFilters}
            onHistorySelect={handleHistorySelect}
            onHistoryRemove={search.removeHistoryItem}
            onClearHistory={search.clearHistory}
            onAudioFileSelect={handleAudioFileSelect}
            onFolderSelect={handleFolderSelect}
            onAudioPlayPause={handleAudioPlayPause}
            currentPlayingId={currentPlayingId}
            isPlaying={isPlaying}
            onScrollStart={handleScrollStart}
            onScrollEnd={handleScrollEnd}
          />
        </Animated.View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    marginLeft: theme.spacing.sm,
    padding: 2,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    maxHeight: 400,
    ...theme.shadows.md,
    // Ensure dropdown appears above other content
    zIndex: 1001,
    elevation: 10,
  },
})

SearchBar.displayName = 'SearchBar'
