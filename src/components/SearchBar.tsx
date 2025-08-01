import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
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

  // Listen for keyboard events to hide dropdown when keyboard is dismissed programmatically
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Don't hide if user is actively interacting with the dropdown (scrolling)
      if (isInteractingWithDropdown.current) {
        return
      }

      // Only hide if input is not focused (keyboard was dismissed programmatically)
      // If input is still focused, let the blur handler manage the dismissal
      if (!inputRef.current?.isFocused()) {
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
    if (search.showResults) {
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
  }, [search.showResults, fadeAnim, scaleAnim])

  const handleFocus = () => {
    search.setShowResults(true)
  }

  const handleBlur = () => {
    // Always hide dropdown when search field loses focus
    // Use timeout to allow for result selection before hiding
    setTimeout(() => {
      // Don't hide if user is actively interacting with the dropdown (scrolling)
      if (!isInteractingWithDropdown.current) {
        search.setShowResults(false)
      }
    }, 300)
  }

  const handleClear = () => {
    search.clearSearch()
    inputRef.current?.focus()
  }

  const handleRecentSearchSelect = (recentItem: any) => {
    // Navigate to the recent search item
    if (recentItem.type === 'audio') {
      onResultSelect?.('audio', {
        id: recentItem.id,
        name: recentItem.name,
        relativePath: recentItem.relativePath
      })
    } else if (recentItem.type === 'folder') {
      onResultSelect?.('folder', {
        id: recentItem.id,
        name: recentItem.name,
        relativePath: recentItem.relativePath
      })
    }

    // Clear search bar and dismiss dropdown after navigation
    search.clearSearch()
    Keyboard.dismiss()
  }

  const handleAudioFileSelect = (audioFile: any) => {
    // Add to recent searches before navigation
    search.addToRecentSearches({
      type: 'audio',
      name: audioFile.name,
      relativePath: audioFile.relativePath,
      id: audioFile.id
    })

    onResultSelect?.('audio', audioFile)

    // Clear search bar and dismiss dropdown after navigation
    search.clearSearch()
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
    // Delay resetting the flag to ensure keyboard dismissal animation completes
    // Keyboard animations typically take 250-300ms, so we use 400ms for safety
    setTimeout(() => {
      isInteractingWithDropdown.current = false
    }, 400)
  }

  const handleFolderSelect = (folder: any) => {
    // Add to recent searches before navigation
    search.addToRecentSearches({
      type: 'folder',
      name: folder.name,
      relativePath: folder.relativePath,
      id: folder.id
    })

    onResultSelect?.('folder', folder)

    // Clear search bar and dismiss dropdown after navigation
    search.clearSearch()
    Keyboard.dismiss()
  }

  const handleOverlayPress = () => {
    // Dismiss dropdown when overlay (background) is touched
    search.setShowResults(false)
    inputRef.current?.blur()
  }

  const handleSubmitEditing = () => {
    // Handle keyboard "Search" button press
    // For real-time search, we don't want to dismiss the results
    // Just dismiss the keyboard but keep the search results visible
    Keyboard.dismiss()
    // Don't blur the input to prevent search results from being dismissed
  }

  const showDropdown = search.showResults

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
          returnKeyType="done"
          onSubmitEditing={handleSubmitEditing}
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

      {/* Full-screen overlay to block touch events when dropdown is open */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

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
            recentSearches={search.recentSearches}
            filters={search.filters}
            isSearching={search.isSearching}
            error={search.error}
            onFiltersChange={search.setFilters}
            onRecentSearchSelect={handleRecentSearchSelect}
            onRecentSearchRemove={search.removeRecentSearchItem}
            onClearRecentSearches={search.clearRecentSearches}
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
  overlay: {
    position: 'absolute',
    top: '100%', // Start below the search bar
    left: -1000, // Extend far to the left
    width: Dimensions.get('window').width + 2000, // Cover entire screen width + extra
    height: Dimensions.get('window').height + 1000, // Cover screen height + extra below
    backgroundColor: 'transparent',
    zIndex: 1000, // Below dropdown but above main content
    elevation: 9,
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
