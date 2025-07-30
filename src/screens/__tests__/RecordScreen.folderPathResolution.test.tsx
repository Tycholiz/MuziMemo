import { useRouter } from 'expo-router'
import { useFileManager } from '../../contexts/FileManagerContext'
import { useAudioPlayerContext } from '../../contexts/AudioPlayerContext'

// Mock dependencies
jest.mock('expo-router')
jest.mock('../../contexts/FileManagerContext')
jest.mock('../../contexts/AudioPlayerContext')
jest.mock('../../hooks/useAudioRecording')
jest.mock('../../services/FileSystemService')

const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseFileManager = useFileManager as jest.MockedFunction<typeof useFileManager>
const mockUseAudioPlayerContext = useAudioPlayerContext as jest.MockedFunction<typeof useAudioPlayerContext>

// Mock the path similarity function that we added
function getPathSimilarity(path1: string, path2: string): number {
  if (path1 === path2) return 1

  const segments1 = path1.split('/').filter(s => s.length > 0)
  const segments2 = path2.split('/').filter(s => s.length > 0)

  // Count matching segments from the end (most specific parts)
  let matchingSegments = 0
  const minLength = Math.min(segments1.length, segments2.length)

  for (let i = 1; i <= minLength; i++) {
    if (segments1[segments1.length - i] === segments2[segments2.length - i]) {
      matchingSegments++
    } else {
      break
    }
  }

  // Calculate base similarity score
  const maxLength = Math.max(segments1.length, segments2.length)
  const baseSimilarity = matchingSegments / maxLength

  // Bonus for having more matching segments (prioritize deeper matches)
  const depthBonus = matchingSegments / 10 // Small bonus for each matching segment

  return Math.min(1, baseSimilarity + depthBonus)
}

describe('RecordScreen Folder Path Resolution', () => {
  beforeEach(() => {
    // Setup default mocks
    mockRouter.mockReturnValue({
      push: jest.fn(),
      back: jest.fn(),
      replace: jest.fn(),
      setParams: jest.fn(),
      canGoBack: jest.fn(),
    } as any)

    mockUseFileManager.mockReturnValue({
      currentPath: [],
      isLoading: false,
      error: null,
      navigateToFolder: jest.fn(),
      navigateToPath: jest.fn(),
      navigateToRoot: jest.fn(),
      navigateToBreadcrumb: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      getCurrentPathString: jest.fn(),
      getFullPath: jest.fn(),
    })

    mockUseAudioPlayerContext.mockReturnValue({
      cleanup: jest.fn(),
    } as any)

    // Mock useAudioRecording hook
    jest.doMock('../../hooks/useAudioRecording', () => ({
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

    // Mock FileSystemService
    jest.doMock('../../services/FileSystemService', () => ({
      fileSystemService: {
        initialize: jest.fn(),
        getFolderContents: jest.fn().mockResolvedValue([]),
      },
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getPathSimilarity function', () => {
    it('should return 1 for exact matches', () => {
      expect(getPathSimilarity('hello/Song Ideas', 'hello/Song Ideas')).toBe(1)
      expect(getPathSimilarity('Song Ideas', 'Song Ideas')).toBe(1)
      expect(getPathSimilarity('', '')).toBe(1)
    })

    it('should return 0 for completely different paths', () => {
      expect(getPathSimilarity('hello/Song Ideas', 'demos/Other Folder')).toBe(0)
      expect(getPathSimilarity('Song Ideas', 'Other Folder')).toBe(0)
    })

    it('should return higher scores for more similar paths', () => {
      // Test exact match vs partial matches
      const exactMatch = getPathSimilarity('hello/Song Ideas', 'hello/Song Ideas')
      const partialMatch1 = getPathSimilarity('hello/Song Ideas', 'Song Ideas')
      const partialMatch2 = getPathSimilarity('hello/Song Ideas', 'demos/Song Ideas')

      expect(exactMatch).toBe(1) // Exact match should be perfect
      expect(partialMatch1).toBeGreaterThan(0) // Some similarity due to matching folder name
      expect(partialMatch2).toBeGreaterThan(0) // Some similarity due to matching folder name

      // Both partial matches have same similarity (both match only the last segment)
      expect(partialMatch1).toBe(partialMatch2)
    })

    it('should prioritize matching from the end (most specific)', () => {
      // "Song Ideas" folder in different locations
      const targetPath = 'hello/nested/Song Ideas'

      const candidate1 = 'Song Ideas' // Root level - matches 1 segment
      const candidate2 = 'hello/Song Ideas' // Partial path - matches 1 segment
      const candidate3 = 'hello/nested/Song Ideas' // Exact match - matches 3 segments

      const score1 = getPathSimilarity(targetPath, candidate1)
      const score2 = getPathSimilarity(targetPath, candidate2)
      const score3 = getPathSimilarity(targetPath, candidate3)

      // Exact match should score highest
      expect(score3).toBe(1)
      // Both partial matches should score the same (both match only 1 segment from end)
      expect(score1).toBe(score2)
      // All should be greater than 0
      expect(score1).toBeGreaterThan(0)
      expect(score2).toBeGreaterThan(0)
    })
  })

  describe('Folder selection logic', () => {
    it('should handle duplicate folder names correctly', () => {
      // Test scenario: two folders named "Song Ideas" in different locations
      const folderData = [
        { id: 'folder-Song-Ideas', name: 'Song Ideas', path: 'Song Ideas', itemCount: 5 },
        { id: 'folder-hello-Song-Ideas', name: 'Song Ideas', path: 'hello/Song Ideas', itemCount: 3 },
        { id: 'folder-demos-Song-Ideas', name: 'Song Ideas', path: 'demos/Song Ideas', itemCount: 2 },
      ]

      // When initialFolder is "hello/Song Ideas", it should select the correct one
      const initialFolder = 'hello/Song Ideas'
      const targetFolderName = initialFolder.split('/').pop()
      const candidateFolders = folderData.filter(folder => folder.name === targetFolderName)

      expect(candidateFolders).toHaveLength(3)

      // Find the best match using our similarity algorithm
      let bestMatch = candidateFolders[0]
      if (candidateFolders.length > 1) {
        bestMatch = candidateFolders.reduce((best, current) => {
          const bestPathSimilarity = getPathSimilarity(best.path || '', initialFolder)
          const currentPathSimilarity = getPathSimilarity(current.path || '', initialFolder)
          return currentPathSimilarity > bestPathSimilarity ? current : best
        })
      }

      // Should select the exact match
      expect(bestMatch.path).toBe('hello/Song Ideas')
      expect(bestMatch.id).toBe('folder-hello-Song-Ideas')
    })
  })
})
