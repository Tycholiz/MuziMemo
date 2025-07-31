import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import { SearchFilters } from './SearchFilters'
import { SearchHistory } from './SearchHistory'
import { formatFolderPath, truncatePath, getParentDirectoryPath } from '../utils/searchUtils'
import type { SearchResults as SearchResultsType, SearchFilters as SearchFiltersType } from '../utils/searchUtils'

export type SearchResultsProps = {
  query: string
  results: SearchResultsType
  searchHistory: string[]
  filters: SearchFiltersType
  isSearching: boolean
  error: string | null
  onFiltersChange: (filters: SearchFiltersType) => void
  onHistorySelect: (item: string) => void
  onHistoryRemove: (item: string) => void
  onClearHistory: () => void
  onAudioFileSelect: (audioFile: any) => void
  onFolderSelect: (folder: any) => void
  onGoToFolder: (folderPath: string[]) => void
}

/**
 * SearchResults Component
 * Displays search results with filters, history, and result sections
 */
export function SearchResults({
  query,
  results,
  searchHistory,
  filters,
  isSearching,
  error,
  onFiltersChange,
  onHistorySelect,
  onHistoryRemove,
  onClearHistory,
  onAudioFileSelect,
  onFolderSelect,
  onGoToFolder,
}: SearchResultsProps) {
  const hasResults = results.audioFiles.length > 0 || results.folders.length > 0
  const showHistory = !query.trim() && searchHistory.length > 0
  const showFilters = query.trim().length > 0

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Filters */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          style={styles.filtersSection}
        />
      )}

      {/* Search History */}
      {showHistory && (
        <SearchHistory
          history={searchHistory}
          onHistorySelect={onHistorySelect}
          onHistoryRemove={onHistoryRemove}
          onClearHistory={onClearHistory}
          style={styles.historySection}
        />
      )}

      {/* Loading State */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search Results */}
      {query.trim() && !isSearching && !error && (
        <>
          {/* Audio Files Section */}
          {filters.audio && results.audioFiles.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="musical-notes" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.sectionTitle}>Audio Files</Text>
                <Text style={styles.sectionCount}>({results.audioFiles.length})</Text>
              </View>

              {results.audioFiles.map((audioFile) => (
                <TouchableOpacity
                  key={audioFile.id}
                  style={styles.resultItem}
                  onPress={() => onAudioFileSelect(audioFile)}
                  activeOpacity={0.7}
                >
                  <View style={styles.audioFileContent}>
                    <View style={styles.audioFileIcon}>
                      <Ionicons name="play-circle" size={24} color={theme.colors.primary} />
                    </View>

                    <View style={styles.audioFileInfo}>
                      <Text style={styles.audioFileName} numberOfLines={1}>
                        {audioFile.name}
                      </Text>
                      <Text style={styles.audioFileDetails}>
                        {formatDate(audioFile.createdAt)} • {formatFileSize(audioFile.size)}
                        {audioFile.duration && ` • ${audioFile.duration}`}
                      </Text>
                      <Text style={styles.audioFilePath} numberOfLines={1}>
                        {formatFolderPath(getParentDirectoryPath(audioFile.relativePath).join('/'))}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.goToButton}
                      onPress={(e) => {
                        e.stopPropagation()
                        onGoToFolder(getParentDirectoryPath(audioFile.relativePath))
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="arrow-forward" size={16} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Separator */}
          {filters.audio && filters.folders && results.audioFiles.length > 0 && results.folders.length > 0 && (
            <View style={styles.separator} />
          )}

          {/* Folders Section */}
          {filters.folders && results.folders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="folder" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.sectionTitle}>Folders</Text>
                <Text style={styles.sectionCount}>({results.folders.length})</Text>
              </View>

              {results.folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={styles.resultItem}
                  onPress={() => onFolderSelect(folder)}
                  activeOpacity={0.7}
                >
                  <View style={styles.folderContent}>
                    <View style={styles.folderIcon}>
                      <Ionicons name="folder" size={24} color={theme.colors.text.secondary} />
                    </View>

                    <View style={styles.folderInfo}>
                      <Text style={styles.folderName} numberOfLines={1}>
                        {folder.name}
                      </Text>
                      <Text style={styles.folderPath} numberOfLines={1}>
                        {truncatePath(formatFolderPath(folder.relativePath), 40)}
                      </Text>
                      <Text style={styles.folderItemCount}>
                        {folder.itemCount} {folder.itemCount === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* No Results */}
          {!hasResults && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={32} color={theme.colors.text.tertiary} />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                Try adjusting your search terms or filters
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  filtersSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  historySection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  errorText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.error,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  sectionCount: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.md,
  },
  resultItem: {
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  audioFileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioFileIcon: {
    marginRight: theme.spacing.sm,
  },
  audioFileInfo: {
    flex: 1,
  },
  audioFileName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  audioFileDetails: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  audioFilePath: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  goToButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    marginRight: theme.spacing.sm,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  folderPath: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  folderItemCount: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
})
