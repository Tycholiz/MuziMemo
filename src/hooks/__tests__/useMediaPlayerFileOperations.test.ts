import { renderHook, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import * as FileSystem from 'expo-file-system'

import { useMediaPlayerFileOperations } from '../useMediaPlayerFileOperations'
import { useAudioPlayerContext } from '../../contexts/AudioPlayerContext'
import { useFileManager } from '../../contexts/FileManagerContext'
import * as moveUtils from '../../utils/moveUtils'

// Mock dependencies
jest.mock('../../contexts/AudioPlayerContext')
jest.mock('../../contexts/FileManagerContext')
jest.mock('expo-file-system', () => ({
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
}))
jest.mock('../../utils/moveUtils', () => ({
  showMoveSuccessToast: jest.fn(),
  getRelativePathFromRecordings: jest.fn(),
  pathToNavigationArray: jest.fn(),
}))

const mockUseAudioPlayerContext = useAudioPlayerContext as jest.MockedFunction<typeof useAudioPlayerContext>
const mockUseFileManager = useFileManager as jest.MockedFunction<typeof useFileManager>
const mockMoveAsync = FileSystem.moveAsync as jest.MockedFunction<typeof FileSystem.moveAsync>
const mockDeleteAsync = FileSystem.deleteAsync as jest.MockedFunction<typeof FileSystem.deleteAsync>
const mockShowMoveSuccessToast = moveUtils.showMoveSuccessToast as jest.MockedFunction<typeof moveUtils.showMoveSuccessToast>
const mockGetRelativePathFromRecordings = moveUtils.getRelativePathFromRecordings as jest.MockedFunction<typeof moveUtils.getRelativePathFromRecordings>
const mockPathToNavigationArray = moveUtils.pathToNavigationArray as jest.MockedFunction<typeof moveUtils.pathToNavigationArray>

// Mock Alert
jest.spyOn(Alert, 'prompt')
jest.spyOn(Alert, 'alert')

describe('useMediaPlayerFileOperations', () => {
  const mockAudioPlayer = {
    currentClip: {
      id: 'test-clip',
      name: 'Test Audio.m4a',
      uri: 'file:///path/to/Test Audio.m4a',
    },
    cleanup: jest.fn(),
    playClip: jest.fn(),
    isPlaying: false,
    isLoading: false,
    position: 0,
    duration: 0,
    pauseClip: jest.fn(),
    stopClip: jest.fn(),
    seekTo: jest.fn(),
    skipForward: jest.fn(),
    skipBackward: jest.fn(),
  }

  const mockFileManager = {
    refreshCurrentDirectory: jest.fn(),
    getFullPath: jest.fn().mockReturnValue('/recordings/folder'),
    getCurrentPathString: jest.fn().mockReturnValue('folder'),
    navigateToPath: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAudioPlayerContext.mockReturnValue(mockAudioPlayer)
    mockUseFileManager.mockReturnValue(mockFileManager as any)
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useMediaPlayerFileOperations())

      expect(result.current.showMoveModal).toBe(false)
      expect(result.current.selectedFileForMove).toBe(null)
      expect(typeof result.current.handleRename).toBe('function')
      expect(typeof result.current.handleMove).toBe('function')
      expect(typeof result.current.handleDelete).toBe('function')
      expect(typeof result.current.handleMoveConfirm).toBe('function')
      expect(typeof result.current.handleMoveCancel).toBe('function')
    })
  })

  describe('handleMove', () => {
    it('should set up move modal state when current clip exists', () => {
      const { result } = renderHook(() => useMediaPlayerFileOperations())

      act(() => {
        result.current.handleMove()
      })

      expect(result.current.showMoveModal).toBe(true)
      expect(result.current.selectedFileForMove).toEqual({
        name: 'Test Audio.m4a',
        path: '/path/to/Test Audio.m4a',
      })
    })

    it('should not set up move modal when no current clip', () => {
      mockUseAudioPlayerContext.mockReturnValue({
        ...mockAudioPlayer,
        currentClip: null,
      })

      const { result } = renderHook(() => useMediaPlayerFileOperations())

      act(() => {
        result.current.handleMove()
      })

      expect(result.current.showMoveModal).toBe(false)
      expect(result.current.selectedFileForMove).toBe(null)
    })
  })

  describe('handleMoveCancel', () => {
    it('should reset move modal state', () => {
      const { result } = renderHook(() => useMediaPlayerFileOperations())

      // First set up move state
      act(() => {
        result.current.handleMove()
      })

      expect(result.current.showMoveModal).toBe(true)
      expect(result.current.selectedFileForMove).not.toBe(null)

      // Then cancel
      act(() => {
        result.current.handleMoveCancel()
      })

      expect(result.current.showMoveModal).toBe(false)
      expect(result.current.selectedFileForMove).toBe(null)
    })
  })

  describe('handleDelete', () => {
    it('should show confirmation alert when current clip exists', () => {
      const { result } = renderHook(() => useMediaPlayerFileOperations())

      act(() => {
        result.current.handleDelete()
      })

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Audio File',
        'Are you sure you want to delete "Test Audio.m4a"?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Delete', style: 'destructive' }),
        ])
      )
    })

    it('should not show alert when no current clip', () => {
      mockUseAudioPlayerContext.mockReturnValue({
        ...mockAudioPlayer,
        currentClip: null,
      })

      const { result } = renderHook(() => useMediaPlayerFileOperations())

      act(() => {
        result.current.handleDelete()
      })

      expect(Alert.alert).not.toHaveBeenCalled()
    })
  })

  describe('handleRename', () => {
    it('should show prompt when current clip exists', () => {
      const { result } = renderHook(() => useMediaPlayerFileOperations())

      act(() => {
        result.current.handleRename()
      })

      expect(Alert.prompt).toHaveBeenCalledWith(
        'Rename Audio File',
        'Enter new file name:',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Rename' }),
        ]),
        'plain-text',
        'Test Audio'
      )
    })

    it('should not show prompt when no current clip', () => {
      mockUseAudioPlayerContext.mockReturnValue({
        ...mockAudioPlayer,
        currentClip: null,
      })

      const { result } = renderHook(() => useMediaPlayerFileOperations())

      act(() => {
        result.current.handleRename()
      })

      expect(Alert.prompt).not.toHaveBeenCalled()
    })
  })

  describe('handleMoveConfirm', () => {
    it('should perform move operation when file is selected', async () => {
      mockMoveAsync.mockResolvedValue()
      mockShowMoveSuccessToast.mockImplementation(() => {})
      mockGetRelativePathFromRecordings.mockReturnValue('destination')
      mockPathToNavigationArray.mockReturnValue(['destination'])

      const { result } = renderHook(() => useMediaPlayerFileOperations())

      // Set up move state first
      act(() => {
        result.current.handleMove()
      })

      // Perform move
      await act(async () => {
        await result.current.handleMoveConfirm('/recordings/destination')
      })

      expect(mockMoveAsync).toHaveBeenCalledWith({
        from: '/path/to/Test Audio.m4a',
        to: '/recordings/destination/Test Audio.m4a',
      })
      expect(mockAudioPlayer.cleanup).toHaveBeenCalled()
      expect(mockFileManager.refreshCurrentDirectory).toHaveBeenCalled()
      expect(result.current.showMoveModal).toBe(false)
      expect(result.current.selectedFileForMove).toBe(null)
    })

    it('should handle move operation errors', async () => {
      const error = new Error('Move failed')
      mockMoveAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useMediaPlayerFileOperations())

      // Set up move state first
      act(() => {
        result.current.handleMove()
      })

      // Perform move that fails
      await act(async () => {
        await result.current.handleMoveConfirm('/recordings/destination')
      })

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to move file')
    })

    it('should not perform move when no file is selected', async () => {
      const { result } = renderHook(() => useMediaPlayerFileOperations())

      await act(async () => {
        await result.current.handleMoveConfirm('/recordings/destination')
      })

      expect(mockMoveAsync).not.toHaveBeenCalled()
    })
  })
})
