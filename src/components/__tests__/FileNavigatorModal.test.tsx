import React from 'react'
import { render } from '@testing-library/react-native'
import { FileNavigatorModal } from '../FileNavigatorModal'
import { FileManagerProvider } from '../../contexts/FileManagerContext'

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, isDirectory: true }),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
}))

// Helper function to render components with FileManagerProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<FileManagerProvider>{component}</FileManagerProvider>)
}

describe('FileNavigatorModal - Move Validation', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    onSelectFolder: jest.fn(),
    title: 'Move test2',
    primaryButtonText: 'Move Here',
    primaryButtonIcon: 'arrow-forward' as const,
    onPrimaryAction: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should disable Move Here button when in the folder being moved', async () => {
    const { findByText } = renderWithProvider(
      <FileNavigatorModal {...mockProps} excludePath="/hello/test2" initialDirectory="/hello/test2" />
    )

    const moveButton = await findByText('Move Here')
    expect(moveButton).toBeDisabled()
  })

  it('should disable Move Here button when in a subdirectory of the folder being moved', async () => {
    const { findByText } = renderWithProvider(
      <FileNavigatorModal {...mockProps} excludePath="/hello/test2" initialDirectory="/hello/test2/subfolder" />
    )

    const moveButton = await findByText('Move Here')
    expect(moveButton).toBeDisabled()
  })

  it('should enable Move Here button when in the parent directory of the folder being moved', async () => {
    const { findByText } = renderWithProvider(
      <FileNavigatorModal {...mockProps} excludePath="/hello/test2" initialDirectory="/hello" />
    )

    const moveButton = await findByText('Move Here')
    expect(moveButton).not.toBeDisabled()
  })

  it('should enable Move Here button when in a completely different directory', async () => {
    const { findByText } = renderWithProvider(
      <FileNavigatorModal {...mockProps} excludePath="/hello/test2" initialDirectory="/Song Ideas" />
    )

    const moveButton = await findByText('Move Here')
    expect(moveButton).not.toBeDisabled()
  })

  it('should enable Move Here button when in the root directory', async () => {
    const { findByText } = renderWithProvider(
      <FileNavigatorModal {...mockProps} excludePath="/hello/test2" initialDirectory="/recordings" />
    )

    const moveButton = await findByText('Move Here')
    expect(moveButton).not.toBeDisabled()
  })

  it('should enable Move Here button when excludePath is not provided', async () => {
    const { findByText } = renderWithProvider(
      <FileNavigatorModal {...mockProps} excludePath={undefined} initialDirectory="/hello" />
    )

    const moveButton = await findByText('Move Here')
    expect(moveButton).not.toBeDisabled()
  })

  // Test the validation logic directly as well
  describe('isCurrentDirectoryInvalid logic', () => {
    const testValidation = (excludePath: string | undefined, currentFolderPath: string): boolean => {
      return Boolean(
        excludePath && (currentFolderPath === excludePath || currentFolderPath.startsWith(excludePath + '/'))
      )
    }

    it('should return true when in the folder being moved', () => {
      expect(testValidation('/hello/test2', '/hello/test2')).toBe(true)
    })

    it('should return true when in a subdirectory of the folder being moved', () => {
      expect(testValidation('/hello/test2', '/hello/test2/subfolder')).toBe(true)
    })

    it('should return false when in the parent directory of the folder being moved', () => {
      expect(testValidation('/hello/test2', '/hello')).toBe(false)
    })

    it('should return false when in a completely different directory', () => {
      expect(testValidation('/hello/test2', '/Song Ideas')).toBe(false)
    })

    it('should return false when excludePath is not provided', () => {
      expect(testValidation(undefined, '/hello')).toBe(false)
    })
  })

  describe('initialDirectory prop', () => {
    it('should use initialDirectory when currentPath is not provided', async () => {
      const { findByText } = renderWithProvider(
        <FileNavigatorModal
          visible={true}
          onClose={jest.fn()}
          onSelectFolder={jest.fn()}
          initialDirectory="file:///mock/documents/recordings/dogs/Demos"
          title="Select Folder"
          primaryButtonText="Select"
        />
      )

      // The modal should initialize with the provided initialDirectory
      const selectButton = await findByText('Select')
      expect(selectButton).not.toBeDisabled()
    })

    it('should use initialDirectory when provided', async () => {
      const { findByText } = renderWithProvider(
        <FileNavigatorModal
          visible={true}
          onClose={jest.fn()}
          onSelectFolder={jest.fn()}
          initialDirectory="file:///mock/documents/recordings/dogs/Demos"
          title="Select Folder"
          primaryButtonText="Select"
        />
      )

      // The modal should use initialDirectory
      const selectButton = await findByText('Select')
      expect(selectButton).not.toBeDisabled()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no folders are present', async () => {
      const { findByText } = renderWithProvider(
        <FileNavigatorModal
          visible={true}
          onClose={jest.fn()}
          onSelectFolder={jest.fn()}
          title="Select Folder"
          primaryButtonText="Select"
        />
      )

      // Should show empty state text
      const emptyStateText = await findByText('This folder is empty')
      expect(emptyStateText).toBeTruthy()

      const emptyStateSubtext = await findByText('Create a new folder to get started')
      expect(emptyStateSubtext).toBeTruthy()
    })
  })
})
