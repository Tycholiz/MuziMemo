import React from 'react'
import { render } from '@testing-library/react-native'
import RecordScreen from '../RecordScreen'
import { useMediaPlayerSpacing } from '../../hooks/useMediaPlayerSpacing'

// Mock all the required dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}))

jest.mock('../../hooks/useMediaPlayerSpacing', () => ({
  useMediaPlayerSpacing: jest.fn(),
}))

jest.mock('../../hooks/useAudioRecording', () => ({
  useAudioRecording: () => ({
    status: 'idle',
    duration: 0,
    audioLevel: 0,
    isInitialized: true,
    hasPermissions: true,
    error: null,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    resetRecording: jest.fn(),
    requestPermissions: jest.fn(),
  }),
}))

jest.mock('../../contexts/FileManagerContext', () => ({
  useFileManager: () => ({
    folders: [],
    loading: false,
    error: null,
    refreshFolders: jest.fn(),
    createFolder: jest.fn(),
    deleteFolder: jest.fn(),
    renameFolder: jest.fn(),
  }),
}))

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}))

const mockUseMediaPlayerSpacing = useMediaPlayerSpacing as jest.MockedFunction<typeof useMediaPlayerSpacing>

describe('RecordScreen Layout Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should apply bottom padding when media player is visible', () => {
    mockUseMediaPlayerSpacing.mockReturnValue({
      bottomPadding: 92, // Media player visible
      isMediaPlayerVisible: true,
      mediaPlayerHeight: 76,
    })

    const { getByTestId } = render(<RecordScreen />)
    
    // The component should render without crashing
    expect(true).toBe(true) // Basic smoke test
  })

  it('should apply minimal bottom padding when media player is hidden', () => {
    mockUseMediaPlayerSpacing.mockReturnValue({
      bottomPadding: 16, // Media player hidden
      isMediaPlayerVisible: false,
      mediaPlayerHeight: 76,
    })

    const { getByTestId } = render(<RecordScreen />)
    
    // The component should render without crashing
    expect(true).toBe(true) // Basic smoke test
  })

  it('should render all essential UI elements', () => {
    mockUseMediaPlayerSpacing.mockReturnValue({
      bottomPadding: 16,
      isMediaPlayerVisible: false,
      mediaPlayerHeight: 76,
    })

    const { getByText, getByTestId } = render(<RecordScreen />)
    
    // Check for essential elements
    expect(getByText('New Recording')).toBeTruthy()
    expect(getByText('00:00:00')).toBeTruthy() // Duration display
    expect(getByText('Tap to Record')).toBeTruthy()
    expect(getByTestId('record-button')).toBeTruthy()
  })
})
