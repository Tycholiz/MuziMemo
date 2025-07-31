/**
 * Sort utilities for file system components
 * Handles sorting of audio files with different criteria
 */

export type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest'

export type SortOptionData = {
  value: SortOption
  label: string
  icon: 'arrow-up' | 'arrow-down' | 'time' | 'time-outline'
}

/**
 * Available sort options for audio files
 */
export const SORT_OPTIONS: SortOptionData[] = [
  {
    value: 'name-asc',
    label: 'Name (A-Z)',
    icon: 'arrow-up',
  },
  {
    value: 'name-desc', 
    label: 'Name (Z-A)',
    icon: 'arrow-down',
  },
  {
    value: 'date-newest',
    label: 'Date (Newest)',
    icon: 'time',
  },
  {
    value: 'date-oldest',
    label: 'Date (Oldest)', 
    icon: 'time-outline',
  },
]

/**
 * Default sort option for new users
 */
export const DEFAULT_SORT_OPTION: SortOption = 'name-asc'

/**
 * Audio file data structure for sorting
 */
export type SortableAudioFile = {
  id: string
  name: string
  createdAt: Date
  [key: string]: any // Allow additional properties
}

/**
 * Sort audio files based on the selected sort option
 * Folders are always sorted alphabetically and remain at the top
 */
export function sortAudioFiles<T extends SortableAudioFile>(
  files: T[],
  sortOption: SortOption
): T[] {
  const sortedFiles = [...files]

  switch (sortOption) {
    case 'name-asc':
      return sortedFiles.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      )
    
    case 'name-desc':
      return sortedFiles.sort((a, b) => 
        b.name.toLowerCase().localeCompare(a.name.toLowerCase())
      )
    
    case 'date-newest':
      return sortedFiles.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )
    
    case 'date-oldest':
      return sortedFiles.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      )
    
    default:
      // Fallback to default sort
      return sortedFiles.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      )
  }
}

/**
 * Sort folders alphabetically (always the same regardless of audio file sort)
 */
export function sortFolders<T extends { name: string }>(folders: T[]): T[] {
  return [...folders].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get sort option data by value
 */
export function getSortOptionData(value: SortOption): SortOptionData | undefined {
  return SORT_OPTIONS.find(option => option.value === value)
}

/**
 * Validate if a string is a valid sort option
 */
export function isValidSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some(option => option.value === value)
}
