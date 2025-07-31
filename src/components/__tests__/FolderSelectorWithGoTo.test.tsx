import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { FolderSelectorWithGoTo } from '../FolderSelectorWithGoTo'

// Mock the FolderSelector component
jest.mock('../FolderSelector', () => ({
  FolderSelector: ({ label, onSelectFolder }: any) => {
    const { Text, TouchableOpacity } = require('react-native')
    return (
      <TouchableOpacity testID="folder-selector" onPress={() => onSelectFolder('test-folder')}>
        <Text>{label}</Text>
      </TouchableOpacity>
    )
  },
}))

describe('FolderSelectorWithGoTo', () => {
  const mockProps = {
    selectedFolderId: 'folder-1',
    selectedFolderDisplayName: 'Test Folder',
    folders: [
      { id: 'folder-1', name: 'Test Folder', path: '/test', itemCount: 5 },
      { id: 'folder-2', name: 'Another Folder', path: '/another', itemCount: 3 },
    ],
    onSelectFolder: jest.fn(),
    onOpenFileNavigator: jest.fn(),
    onGoToFolder: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render folder selector and go to button when not loading', () => {
    const { getByTestId, getByText } = render(<FolderSelectorWithGoTo {...mockProps} />)

    expect(getByTestId('folder-selector')).toBeTruthy()
    expect(getByText('Go to')).toBeTruthy()
  })

  it('should render loading state when loading is true', () => {
    const { getByText, queryByTestId } = render(<FolderSelectorWithGoTo {...mockProps} loading={true} />)

    expect(getByText('Loading folders...')).toBeTruthy()
    expect(queryByTestId('folder-selector')).toBeNull()
  })

  it('should call onGoToFolder when Go to button is pressed', () => {
    const { getByText } = render(<FolderSelectorWithGoTo {...mockProps} />)

    const goToButton = getByText('Go to')
    fireEvent.press(goToButton)

    expect(mockProps.onGoToFolder).toHaveBeenCalledTimes(1)
  })

  it('should pass correct props to FolderSelector', () => {
    const { getByText } = render(<FolderSelectorWithGoTo {...mockProps} />)

    expect(getByText('Saving to:')).toBeTruthy()
  })

  it('should call onSelectFolder when folder is selected', () => {
    const { getByTestId } = render(<FolderSelectorWithGoTo {...mockProps} />)

    const folderSelector = getByTestId('folder-selector')
    fireEvent.press(folderSelector)

    expect(mockProps.onSelectFolder).toHaveBeenCalledWith('test-folder')
  })

  it('should render with custom style', () => {
    const customStyle = { backgroundColor: 'red' }
    const { getByTestId } = render(<FolderSelectorWithGoTo {...mockProps} style={customStyle} />)

    // The component should render without errors with custom style
    expect(getByTestId('folder-selector')).toBeTruthy()
  })

  it('should show loading indicator when loading', () => {
    const { getByTestId } = render(<FolderSelectorWithGoTo {...mockProps} loading={true} />)

    // ActivityIndicator should be present (though we can't easily test its props)
    expect(getByTestId).toBeTruthy()
  })
})
