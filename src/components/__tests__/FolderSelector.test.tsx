import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'

import { FolderSelector, type Folder } from '../FolderSelector'
import { doesFolderPathExist } from '@utils/pathUtils'

// Mock the pathUtils module
jest.mock('@utils/pathUtils', () => ({
  doesFolderPathExist: jest.fn(),
}))

const mockDoesExist = doesFolderPathExist as jest.MockedFunction<typeof doesFolderPathExist>

const mockFolders: Folder[] = [
  {
    id: 'home',
    name: 'Home',
    itemCount: 5,
    path: '',
  },
  {
    id: 'music',
    name: 'Music',
    itemCount: 15, // Higher count for ranking test
    path: 'Music',
  },
  {
    id: 'nested',
    name: 'Song Ideas',
    itemCount: 2,
    path: 'Music/Song Ideas',
  },
  {
    id: 'recordings',
    name: 'Recordings',
    itemCount: 8,
    path: 'Recordings',
  },
  {
    id: 'demos',
    name: 'Demos',
    itemCount: 12,
    path: 'Demos',
  },
  {
    id: 'archive',
    name: 'Archive',
    itemCount: 3,
    path: 'Archive',
  },
  {
    id: 'temp',
    name: 'Temp',
    itemCount: 1,
    path: 'Temp',
  },
  {
    id: 'projects',
    name: 'Projects',
    itemCount: 20, // Highest count
    path: 'Projects',
  },
]

describe('FolderSelector', () => {
  const defaultProps = {
    selectedFolder: 'home',
    folders: mockFolders,
    onSelectFolder: jest.fn(),
    onOpenFileNavigator: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock: all folders exist
    mockDoesExist.mockResolvedValue(true)
  })

  it('renders correctly with home folder selected', () => {
    render(<FolderSelector {...defaultProps} />)

    // Should show house icon for home folder
    expect(screen.getByTestId('home-icon')).toBeTruthy()
  })

  it('renders correctly with nested folder selected', () => {
    render(<FolderSelector {...defaultProps} selectedFolder="nested" selectedFolderName="Music/Song Ideas" />)

    // Should show house icon and path segments
    expect(screen.getByTestId('home-icon')).toBeTruthy()
    expect(screen.getByText('Music')).toBeTruthy()
    expect(screen.getByText('Song Ideas')).toBeTruthy()
    // Note: ">" separators are rendered as Ionicons, not text, so we can't test for them directly
  })

  it('displays folder paths with house icon and ">" separators in modal', async () => {
    render(<FolderSelector {...defaultProps} />)

    // Open the modal
    const selector = screen.getByTestId('folder-selector')
    fireEvent.press(selector)

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.queryByText('Validating folders...')).toBeNull()
    })

    // Check that folders in the list show house icons and proper separators
    // Should have at least 2 home icons (one in selector + at least one in list)
    expect(screen.getAllByTestId('home-icon').length).toBeGreaterThanOrEqual(2)

    // Check that we have folder names displayed
    expect(screen.getByText('Projects')).toBeTruthy()
    expect(screen.getByText('Music')).toBeTruthy()
  })

  it('shows label when provided', () => {
    const label = 'Save to folder'
    render(<FolderSelector {...defaultProps} label={label} />)

    expect(screen.getByText(label)).toBeTruthy()
  })

  it('is disabled when disabled prop is true', () => {
    render(<FolderSelector {...defaultProps} disabled />)

    const selector = screen.getByTestId('folder-selector')
    expect(selector.props.accessibilityState?.disabled).toBe(true)
  })

  describe('Folder Existence Validation', () => {
    it('filters out non-existent folders when modal opens', async () => {
      // Mock some folders as non-existent
      mockDoesExist.mockImplementation(async (path: string) => {
        if (path === 'Music/Song Ideas' || path === 'Temp') {
          return false // These folders don't exist
        }
        return true
      })

      render(<FolderSelector {...defaultProps} />)

      // Open the modal
      const selector = screen.getByTestId('folder-selector')
      fireEvent.press(selector)

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.queryByText('Validating folders...')).toBeNull()
      })

      // Non-existent folders should not appear in the list
      expect(screen.queryByText('Song Ideas')).toBeNull()
      expect(screen.queryByText('Temp')).toBeNull()

      // Existing folders should still appear
      expect(screen.getByText('Music')).toBeTruthy()
      expect(screen.getByText('Projects')).toBeTruthy()
    })

    it('shows loading indicator during validation', async () => {
      // Make validation take some time
      let resolveValidation: (value: boolean) => void
      const validationPromise = new Promise<boolean>(resolve => {
        resolveValidation = resolve
      })
      mockDoesExist.mockReturnValue(validationPromise)

      render(<FolderSelector {...defaultProps} />)

      // Open the modal
      const selector = screen.getByTestId('folder-selector')
      fireEvent.press(selector)

      // Should show loading indicator immediately
      expect(screen.getByText('Validating folders...')).toBeTruthy()

      // Resolve the validation
      resolveValidation!(true)

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.queryByText('Validating folders...')).toBeNull()
      })
    })

    it('handles validation errors gracefully', async () => {
      // Mock validation to throw an error
      mockDoesExist.mockRejectedValue(new Error('File system error'))

      render(<FolderSelector {...defaultProps} />)

      // Open the modal
      const selector = screen.getByTestId('folder-selector')
      fireEvent.press(selector)

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.queryByText('Validating folders...')).toBeNull()
      })

      // Component should not crash and modal should still be open
      expect(screen.getByText('Commonly Used Folders')).toBeTruthy()
      expect(screen.getByText('File Navigator')).toBeTruthy()
    })
  })

  describe('Intelligent Folder Ranking', () => {
    it('limits folders to maximum of 6', async () => {
      render(<FolderSelector {...defaultProps} />)

      // Open the modal
      const selector = screen.getByTestId('folder-selector')
      fireEvent.press(selector)

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.queryByText('Validating folders...')).toBeNull()
      })

      // Should only show 6 folders (we have 8 in mockFolders)
      const folderItems = screen.getAllByText(/items$/)
      expect(folderItems).toHaveLength(6)
    })

    it('ranks folders by hierarchical item count in descending order', async () => {
      render(<FolderSelector {...defaultProps} />)

      // Open the modal
      const selector = screen.getByTestId('folder-selector')
      fireEvent.press(selector)

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.queryByText('Validating folders...')).toBeNull()
      })

      // Get all folder items text - look for the pattern "number items"
      const folderItems = screen.getAllByText(/\d+\s+items/)

      // Extract item counts from the text
      const itemCounts = folderItems.map(item => {
        // The text content might be in different formats, let's handle arrays too
        let text = ''
        if (typeof item.props.children === 'string') {
          text = item.props.children
        } else if (Array.isArray(item.props.children)) {
          text = item.props.children.join('')
        } else {
          text = item.props.children?.toString() || ''
        }
        const match = text.match(/(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      })

      // Should be sorted in descending order
      for (let i = 0; i < itemCounts.length - 1; i++) {
        expect(itemCounts[i]).toBeGreaterThanOrEqual(itemCounts[i + 1])
      }

      // Top folder should be Projects (20 items)
      expect(itemCounts[0]).toBe(20)
    })

    it('excludes low-ranking folders when limit is reached', async () => {
      render(<FolderSelector {...defaultProps} />)

      // Open the modal
      const selector = screen.getByTestId('folder-selector')
      fireEvent.press(selector)

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.queryByText('Validating folders...')).toBeNull()
      })

      // Temp folder (1 item) should not appear as it's the lowest ranking
      expect(screen.queryByText('Temp')).toBeNull()

      // Song Ideas (2 items) should also not appear
      expect(screen.queryByText('Song Ideas')).toBeNull()
    })
  })
})
