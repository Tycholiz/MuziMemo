import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'

import { FolderSelector, type Folder } from '../FolderSelector'

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
    itemCount: 3,
    path: 'Music',
  },
  {
    id: 'nested',
    name: 'Song Ideas',
    itemCount: 2,
    path: 'Music/Song Ideas',
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
  })

  it('renders correctly with home folder selected', () => {
    render(<FolderSelector {...defaultProps} />)

    // Should show house icon for home folder
    expect(screen.getByTestId('home-icon')).toBeTruthy()
  })

  it('renders correctly with nested folder selected', () => {
    render(<FolderSelector {...defaultProps} selectedFolder="nested" selectedFolderName="Music/Song Ideas" />)

    // Should show house icon and path segments with "/" separators
    expect(screen.getByTestId('home-icon')).toBeTruthy()
    expect(screen.getByText('Music')).toBeTruthy()
    expect(screen.getByText('Song Ideas')).toBeTruthy()
    expect(screen.getAllByText('>')).toHaveLength(2) // Two separators in the path
  })

  it('displays folder paths with house icon and ">" separators in modal', () => {
    render(<FolderSelector {...defaultProps} />)

    // Open the modal
    const selector = screen.getByTestId('folder-selector')
    fireEvent.press(selector)

    // Check that folders in the list show house icons and proper separators
    expect(screen.getAllByTestId('home-icon')).toHaveLength(4) // One in selector + 3 in list

    // Check for path separators in nested folder
    const pathSeparators = screen.getAllByText('/')
    expect(pathSeparators.length).toBeGreaterThan(0)
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
})
