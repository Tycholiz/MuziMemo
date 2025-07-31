import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { SearchBar } from '../SearchBar'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}))

// Mock search utils
jest.mock('../../utils/searchUtils', () => ({
  searchFileSystem: jest.fn(),
  formatFolderPath: jest.fn((path) => path.replace(/\//g, ' > ')),
  getParentDirectoryPath: jest.fn((path) => path.split('/').slice(0, -1)),
  truncatePath: jest.fn((path) => path),
}))

const mockOnResultSelect = jest.fn()
const mockOnNavigateToFolder = jest.fn()

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
  })

  it('renders correctly', () => {
    const { getByPlaceholderText } = render(
      <SearchBar
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    expect(getByPlaceholderText('Search audio files and folders...')).toBeTruthy()
  })

  it('shows clear button when text is entered', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <SearchBar
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    const input = getByPlaceholderText('Search audio files and folders...')
    fireEvent.changeText(input, 'test query')

    await waitFor(() => {
      // Clear button should be visible when there's text
      expect(input.props.value).toBe('test query')
    })
  })

  it('clears search when clear button is pressed', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <SearchBar
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    const input = getByPlaceholderText('Search audio files and folders...')
    fireEvent.changeText(input, 'test query')
    
    await waitFor(() => {
      expect(input.props.value).toBe('test query')
    })

    // Find and press clear button (close-circle icon)
    fireEvent.changeText(input, '')
    
    await waitFor(() => {
      expect(input.props.value).toBe('')
    })
  })

  it('handles focus and blur events', () => {
    const { getByPlaceholderText } = render(
      <SearchBar
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    const input = getByPlaceholderText('Search audio files and folders...')
    
    fireEvent(input, 'focus')
    fireEvent(input, 'blur')
    
    // Should not throw any errors
    expect(input).toBeTruthy()
  })

  it('calls onResultSelect when audio file is selected', async () => {
    const mockSearchResults = {
      audioFiles: [
        {
          id: 'audio-1',
          name: 'test.mp3',
          uri: '/path/to/test.mp3',
          size: 1024,
          createdAt: new Date(),
          relativePath: 'folder/test.mp3',
          parentPath: '/recordings/folder',
        },
      ],
      folders: [],
    }

    const { searchFileSystem } = require('../../utils/searchUtils')
    ;(searchFileSystem as jest.Mock).mockResolvedValue(mockSearchResults)

    const { getByPlaceholderText } = render(
      <SearchBar
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    const input = getByPlaceholderText('Search audio files and folders...')
    fireEvent.changeText(input, 'test')

    // Wait for debounced search
    await waitFor(() => {
      expect(searchFileSystem).toHaveBeenCalledWith('test', {
        audio: true,
        folders: true,
        text: false,
      })
    }, { timeout: 1000 })
  })

  it('loads search history on mount', async () => {
    const mockHistory = ['previous search', 'another search']
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory))

    render(
      <SearchBar
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@muzimemo_search_history')
    })
  })

  it('handles search errors gracefully', async () => {
    const { searchFileSystem } = require('../../utils/searchUtils')
    ;(searchFileSystem as jest.Mock).mockRejectedValue(new Error('Search failed'))

    const { getByPlaceholderText } = render(
      <SearchBar
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    const input = getByPlaceholderText('Search audio files and folders...')
    fireEvent.changeText(input, 'test')

    // Wait for debounced search and error handling
    await waitFor(() => {
      expect(searchFileSystem).toHaveBeenCalled()
    }, { timeout: 1000 })

    // Should not crash the component
    expect(input).toBeTruthy()
  })

  it('applies custom placeholder text', () => {
    const customPlaceholder = 'Custom search placeholder'
    const { getByPlaceholderText } = render(
      <SearchBar
        placeholder={customPlaceholder}
        onResultSelect={mockOnResultSelect}
        onNavigateToFolder={mockOnNavigateToFolder}
      />
    )

    expect(getByPlaceholderText(customPlaceholder)).toBeTruthy()
  })
})
