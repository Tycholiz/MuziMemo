import { renderHook } from '@testing-library/react-native'
import { useMediaPlayerSpacing } from '../useMediaPlayerSpacing'
import { useAudioPlayerContext } from '../../contexts/AudioPlayerContext'

// Mock the AudioPlayerContext
jest.mock('../../contexts/AudioPlayerContext', () => ({
  useAudioPlayerContext: jest.fn(),
}))

// Mock theme
jest.mock('../../utils/theme', () => ({
  theme: {
    spacing: {
      md: 16,
    },
  },
}))

const mockUseAudioPlayerContext = useAudioPlayerContext as jest.MockedFunction<typeof useAudioPlayerContext>

describe('useMediaPlayerSpacing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return default spacing when no media player is visible', () => {
    mockUseAudioPlayerContext.mockReturnValue({
      currentClip: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      playClip: jest.fn(),
      pauseClip: jest.fn(),
      stopClip: jest.fn(),
      seekTo: jest.fn(),
      skipForward: jest.fn(),
      skipBackward: jest.fn(),
      cleanup: jest.fn(),
    })

    const { result } = renderHook(() => useMediaPlayerSpacing())

    expect(result.current.bottomPadding).toBe(16) // theme.spacing.md
    expect(result.current.isMediaPlayerVisible).toBe(false)
    expect(result.current.mediaPlayerHeight).toBe(140)
  })

  it('should return increased spacing when media player is visible', () => {
    mockUseAudioPlayerContext.mockReturnValue({
      currentClip: {
        id: 'test-clip',
        name: 'Test Audio',
        uri: 'file://test.mp3',
      },
      isPlaying: true,
      isLoading: false,
      position: 0,
      duration: 0,
      playClip: jest.fn(),
      pauseClip: jest.fn(),
      stopClip: jest.fn(),
      seekTo: jest.fn(),
      skipForward: jest.fn(),
      skipBackward: jest.fn(),
      cleanup: jest.fn(),
    })

    const { result } = renderHook(() => useMediaPlayerSpacing())

    expect(result.current.bottomPadding).toBe(156) // 140 + 16 (MEDIA_PLAYER_HEIGHT + theme.spacing.md)
    expect(result.current.isMediaPlayerVisible).toBe(true)
    expect(result.current.mediaPlayerHeight).toBe(140)
  })

  it('should update spacing when media player visibility changes', () => {
    const { result, rerender } = renderHook(() => useMediaPlayerSpacing())

    // Initially no media player
    mockUseAudioPlayerContext.mockReturnValue({
      currentClip: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      playClip: jest.fn(),
      pauseClip: jest.fn(),
      stopClip: jest.fn(),
      seekTo: jest.fn(),
      skipForward: jest.fn(),
      skipBackward: jest.fn(),
      cleanup: jest.fn(),
    })

    rerender({})
    expect(result.current.bottomPadding).toBe(16)
    expect(result.current.isMediaPlayerVisible).toBe(false)

    // Media player becomes visible
    mockUseAudioPlayerContext.mockReturnValue({
      currentClip: {
        id: 'test-clip',
        name: 'Test Audio',
        uri: 'file://test.mp3',
      },
      isPlaying: true,
      isLoading: false,
      position: 0,
      duration: 0,
      playClip: jest.fn(),
      pauseClip: jest.fn(),
      stopClip: jest.fn(),
      seekTo: jest.fn(),
      skipForward: jest.fn(),
      skipBackward: jest.fn(),
      cleanup: jest.fn(),
    })

    rerender({})
    expect(result.current.bottomPadding).toBe(156)
    expect(result.current.isMediaPlayerVisible).toBe(true)
  })
})
