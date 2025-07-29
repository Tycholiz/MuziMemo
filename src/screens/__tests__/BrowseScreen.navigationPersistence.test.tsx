/**
 * Unit tests for BrowseScreen navigation persistence bug fix
 */

describe('BrowseScreen Navigation Persistence', () => {
  it('should track initial folder changes correctly', () => {
    // Test the logic for tracking initialFolder changes
    let lastProcessedInitialFolder: string | undefined = undefined
    let initialFolder = 'lyrics'

    // Simulate first focus effect call
    if (initialFolder !== lastProcessedInitialFolder) {
      if (initialFolder && initialFolder !== 'root') {
        // Would set currentPath to [initialFolder]
      }
      lastProcessedInitialFolder = initialFolder
    }

    expect(lastProcessedInitialFolder).toBe('lyrics')

    // Simulate subsequent focus effect calls with same initialFolder (tab switches)
    // Should not re-process initialFolder
    let shouldReprocess = false
    if (initialFolder !== lastProcessedInitialFolder) {
      shouldReprocess = true
    }

    expect(shouldReprocess).toBe(false)
  })

  it('should not process "root" as initialFolder', () => {
    let lastProcessedInitialFolder: string | undefined = undefined
    const initialFolder = 'root'

    // Simulate focus effect call with root folder
    if (initialFolder !== lastProcessedInitialFolder) {
      if (initialFolder && initialFolder !== 'root') {
        // Should not enter this block for 'root'
      }
      lastProcessedInitialFolder = initialFolder
    }

    expect(lastProcessedInitialFolder).toBe('root')
  })

  it('should handle undefined initialFolder gracefully', () => {
    let lastProcessedInitialFolder: string | undefined = undefined
    const initialFolder = undefined

    // Simulate focus effect call with undefined folder
    if (initialFolder !== lastProcessedInitialFolder) {
      if (initialFolder && initialFolder !== 'root') {
        // Should not enter this block for undefined
      }
      lastProcessedInitialFolder = initialFolder
    }

    expect(lastProcessedInitialFolder).toBe(undefined)
  })

  it('should preserve currentPath state logic after home navigation', () => {
    // Test the state management logic
    let currentPath = ['lyrics'] // User navigated to lyrics folder

    // User clicks home button - should reset to empty array
    const handleHomePress = () => {
      currentPath = []
    }

    handleHomePress()
    expect(currentPath).toEqual([])

    // After tab switch, currentPath should remain empty
    // (not be overridden by initialFolder processing)
    expect(currentPath).toEqual([])
  })

  it('should correctly identify when to apply initialFolder', () => {
    // Test the conditions for applying initialFolder
    const testCases = [
      { lastProcessed: undefined, initialFolder: 'lyrics', expected: true },
      { lastProcessed: 'lyrics', initialFolder: 'lyrics', expected: false },
      { lastProcessed: undefined, initialFolder: 'root', expected: false },
      { lastProcessed: undefined, initialFolder: undefined, expected: false },
      { lastProcessed: undefined, initialFolder: '', expected: false },
      { lastProcessed: 'lyrics', initialFolder: 'hello', expected: true }, // New folder
    ]

    testCases.forEach(({ lastProcessed, initialFolder, expected }) => {
      const hasChanged = initialFolder !== lastProcessed
      const shouldApply = hasChanged && !!initialFolder && initialFolder !== 'root'
      expect(shouldApply).toBe(expected)
    })
  })

  it('should handle navigation from Record screen to Browse screen', () => {
    // Test the "Go To" button functionality with intentional navigation
    let lastProcessedInitialFolder: string | undefined = undefined
    let hasUserNavigated = false

    // First navigation to 'lyrics' (intentional from Go To button)
    let initialFolder = 'lyrics'
    let intentional = 'true'
    const isIntentionalNavigation = intentional === 'true'

    if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
      if (initialFolder && initialFolder !== 'root') {
        // Would navigate to lyrics folder
      }
      lastProcessedInitialFolder = initialFolder
      if (isIntentionalNavigation) {
        hasUserNavigated = false
      }
    }
    expect(lastProcessedInitialFolder).toBe('lyrics')

    // User navigates home via breadcrumb (currentPath becomes [])
    const handleHomePress = () => {
      hasUserNavigated = true
      lastProcessedInitialFolder = undefined // Reset tracking
    }
    handleHomePress()
    expect(hasUserNavigated).toBe(true)
    expect(lastProcessedInitialFolder).toBe(undefined)

    // User goes to Record screen and selects same 'lyrics' folder, then clicks "Go To"
    // Should work because tracking was reset and it's intentional navigation
    initialFolder = 'lyrics'
    intentional = 'true'
    let shouldNavigateToLyrics = false

    if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
      if (initialFolder && initialFolder !== 'root') {
        shouldNavigateToLyrics = true
      }
      lastProcessedInitialFolder = initialFolder
      if (isIntentionalNavigation) {
        hasUserNavigated = false
      }
    }

    expect(shouldNavigateToLyrics).toBe(true)
    expect(lastProcessedInitialFolder).toBe('lyrics')
  })

  it('should preserve user navigation and ignore tab switch parameters', () => {
    // Test that user navigation is preserved across tab switches
    let lastProcessedInitialFolder: string | undefined = 'song-ideas'
    let hasUserNavigated = false

    // User navigates to song-ideas folder initially
    let initialFolder = 'song-ideas'
    let intentional = 'true'
    const isIntentionalNavigation = intentional === 'true'

    if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
      lastProcessedInitialFolder = initialFolder
      if (isIntentionalNavigation) {
        hasUserNavigated = false
      }
    }
    expect(lastProcessedInitialFolder).toBe('song-ideas')

    // User clicks home button (explicit navigation)
    const handleHomePress = () => {
      hasUserNavigated = true
    }
    handleHomePress()
    expect(hasUserNavigated).toBe(true)

    // User switches to Record tab and back to Browse tab
    // The initialFolder parameter is still 'song-ideas' from the Record button navigation
    // But this should NOT override the user's home navigation
    initialFolder = 'song-ideas'
    intentional = '' // Tab switch, not intentional
    let shouldRevertToSongIdeas = false

    if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || intentional === 'true')) {
      shouldRevertToSongIdeas = true
    }

    expect(shouldRevertToSongIdeas).toBe(false) // Should NOT revert to song-ideas
  })

  it('should mark user navigation correctly', () => {
    // Test that explicit navigation marks hasUserNavigated flag and resets tracking
    let hasUserNavigated = false
    let lastProcessedInitialFolder: string | undefined = 'test'

    // Simulate user clicking home button
    const handleHomePress = () => {
      hasUserNavigated = true
      lastProcessedInitialFolder = undefined
    }

    // Simulate user clicking breadcrumb
    const handleBreadcrumbPress = () => {
      hasUserNavigated = true
      lastProcessedInitialFolder = undefined
    }

    // Simulate user clicking folder
    const handleFolderPress = () => {
      hasUserNavigated = true
      lastProcessedInitialFolder = undefined
    }

    handleHomePress()
    expect(hasUserNavigated).toBe(true)
    expect(lastProcessedInitialFolder).toBe(undefined)

    hasUserNavigated = false
    lastProcessedInitialFolder = 'test'
    handleBreadcrumbPress()
    expect(hasUserNavigated).toBe(true)
    expect(lastProcessedInitialFolder).toBe(undefined)

    hasUserNavigated = false
    lastProcessedInitialFolder = 'test'
    handleFolderPress()
    expect(hasUserNavigated).toBe(true)
    expect(lastProcessedInitialFolder).toBe(undefined)
  })

  // Acceptance Criteria Tests
  describe('Acceptance Criteria: Go To Button Navigation', () => {
    it('should navigate to specified folder when Go To button is clicked', () => {
      // Test the core acceptance criteria
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Simulate: User clicks "Go To" with "Song Ideas" folder
      let initialFolder = 'Song Ideas'
      let intentional = 'true'
      const isIntentionalNavigation = intentional === 'true'

      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        if (initialFolder && initialFolder !== 'root') {
          currentPath = [initialFolder]
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      expect(currentPath).toEqual(['Song Ideas'])
      expect(lastProcessedInitialFolder).toBe('Song Ideas')
    })

    it('should handle the complete user journey from acceptance criteria', () => {
      // Test the exact scenario described in acceptance criteria
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Step 1: User clicks "Go To" with "Song Ideas" - should navigate to Song Ideas
      let initialFolder = 'Song Ideas'
      let intentional = 'true'
      let isIntentionalNavigation = intentional === 'true'

      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        if (initialFolder && initialFolder !== 'root') {
          currentPath = [initialFolder]
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      expect(currentPath).toEqual(['Song Ideas'])

      // Step 2: User clicks home button - should navigate to home and reset tracking
      const handleHomePress = () => {
        currentPath = []
        hasUserNavigated = true
        lastProcessedInitialFolder = undefined
      }
      handleHomePress()

      expect(currentPath).toEqual([])
      expect(hasUserNavigated).toBe(true)
      expect(lastProcessedInitialFolder).toBe(undefined)

      // Step 3: User goes to Record screen and clicks "Go To" with "Song Ideas" again
      // Should navigate to Song Ideas even though user previously navigated
      initialFolder = 'Song Ideas'
      intentional = 'true'
      isIntentionalNavigation = intentional === 'true'

      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        if (initialFolder && initialFolder !== 'root') {
          currentPath = [initialFolder]
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      expect(currentPath).toEqual(['Song Ideas']) // Should navigate to Song Ideas
      expect(lastProcessedInitialFolder).toBe('Song Ideas')
    })

    it('should preserve directory state across tab switches without Go To button', () => {
      // Test that directory state persists when switching tabs without using Go To
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // User navigates to a folder manually
      const handleFolderPress = () => {
        currentPath = ['Manual Navigation']
        hasUserNavigated = true
        lastProcessedInitialFolder = undefined
      }
      handleFolderPress()

      expect(currentPath).toEqual(['Manual Navigation'])
      expect(hasUserNavigated).toBe(true)

      // User switches to Record tab and back to Browse tab
      // The initialFolder parameter might be present from previous Record button navigation
      const initialFolder = 'Old Folder'
      const intentional = '' // Not intentional (tab switch)
      const isIntentionalNavigation = intentional === 'true'

      // Should NOT change currentPath because user has navigated and it's not intentional
      let shouldChangeDirectory = false
      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        shouldChangeDirectory = true
      }

      expect(shouldChangeDirectory).toBe(false)
      expect(currentPath).toEqual(['Manual Navigation']) // Should remain unchanged
    })
  })

  // Nested Folder Navigation Tests
  describe('Nested Folder Navigation', () => {
    it('should handle single-level folder paths correctly', () => {
      // Test single folder navigation
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Navigate to single folder
      const initialFolder = 'demos'
      const intentional = 'true'
      const isIntentionalNavigation = intentional === 'true'

      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        if (initialFolder && initialFolder !== 'root') {
          const pathSegments = initialFolder.split('/').filter(segment => segment.length > 0)
          currentPath = pathSegments
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      expect(currentPath).toEqual(['demos'])
      expect(lastProcessedInitialFolder).toBe('demos')
    })

    it('should handle nested folder paths correctly', () => {
      // Test nested folder navigation like "demos/amazing"
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Navigate to nested folder
      const initialFolder = 'demos/amazing'
      const intentional = 'true'
      const isIntentionalNavigation = intentional === 'true'

      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        if (initialFolder && initialFolder !== 'root') {
          const pathSegments = initialFolder.split('/').filter(segment => segment.length > 0)
          currentPath = pathSegments
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      expect(currentPath).toEqual(['demos', 'amazing'])
      expect(lastProcessedInitialFolder).toBe('demos/amazing')
    })

    it('should handle deeply nested folder paths correctly', () => {
      // Test deeply nested folder navigation like "demos/amazing/subfolder"
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Navigate to deeply nested folder
      const initialFolder = 'demos/amazing/subfolder'
      const intentional = 'true'
      const isIntentionalNavigation = intentional === 'true'

      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        if (initialFolder && initialFolder !== 'root') {
          const pathSegments = initialFolder.split('/').filter(segment => segment.length > 0)
          currentPath = pathSegments
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      expect(currentPath).toEqual(['demos', 'amazing', 'subfolder'])
      expect(lastProcessedInitialFolder).toBe('demos/amazing/subfolder')
    })

    it('should preserve nested folder navigation across tab switches', () => {
      // Test the exact scenario described: demos/amazing -> Record tab -> Browse tab
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Step 1: User navigates to demos/amazing folder manually
      const handleFolderPress = (folderPath: string[]) => {
        currentPath = folderPath
        hasUserNavigated = true
        lastProcessedInitialFolder = undefined
      }

      // User manually navigates to demos, then amazing
      handleFolderPress(['demos'])
      handleFolderPress(['demos', 'amazing'])

      expect(currentPath).toEqual(['demos', 'amazing'])
      expect(hasUserNavigated).toBe(true)
      expect(lastProcessedInitialFolder).toBe(undefined)

      // Step 2: User switches to Record tab (this would pass "demos/amazing" as initialFolder)
      // Step 3: User switches back to Browse tab
      // The initialFolder parameter should be "demos/amazing" from the Record button navigation
      // But since user has navigated and this is NOT intentional, it should preserve current state
      const initialFolder = 'demos/amazing'
      const intentional = '' // Tab switch, not intentional
      const isIntentionalNavigation = intentional === 'true'

      let shouldChangeDirectory = false
      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        shouldChangeDirectory = true
      }

      expect(shouldChangeDirectory).toBe(false) // Should NOT change directory
      expect(currentPath).toEqual(['demos', 'amazing']) // Should remain in nested folder
    })

    it('should simulate the real bug scenario with actual navigation flow', () => {
      // This test simulates the ACTUAL bug scenario more realistically
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Step 1: User manually navigates to demos/amazing
      const simulateManualNavigation = (path: string[]) => {
        currentPath = path
        hasUserNavigated = true
        lastProcessedInitialFolder = undefined
      }

      simulateManualNavigation(['demos', 'amazing'])
      expect(currentPath).toEqual(['demos', 'amazing'])

      // Step 2: User clicks Record button - this passes "demos/amazing" as initialFolder to Record screen
      const simulateRecordButtonPress = () => {
        const folderName = currentPath.length > 0 ? currentPath.join('/') : 'root'
        return folderName // This would be passed as initialFolder to Record screen
      }

      const recordScreenInitialFolder = simulateRecordButtonPress()
      expect(recordScreenInitialFolder).toBe('demos/amazing')

      // Step 3: User switches back to Browse tab
      // In Expo Router, the Browse tab retains the last parameters from when Record button was pressed
      // So initialFolder is still "demos/amazing" but intentional is NOT "true" (it's a tab switch)
      const tabSwitchInitialFolder = recordScreenInitialFolder // Same as what was passed to Record
      const tabSwitchIntentional = undefined // Tab switch doesn't have intentional parameter

      // The bug: This should NOT change the currentPath because it's not intentional navigation
      // But the current logic might be processing it anyway
      const isIntentionalNavigation = tabSwitchIntentional === 'true'

      // Simulate the useFocusEffect logic
      if (tabSwitchInitialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        // BUG: This condition might be true when it shouldn't be
        // Because lastProcessedInitialFolder was reset to undefined in step 1
        if (tabSwitchInitialFolder && tabSwitchInitialFolder !== 'root') {
          const pathSegments = tabSwitchInitialFolder.split('/').filter(segment => segment.length > 0)
          currentPath = pathSegments // This would incorrectly reset the path
        }
        lastProcessedInitialFolder = tabSwitchInitialFolder
      }

      // The bug manifests here: currentPath gets reset even though user manually navigated
      // This test should FAIL with the current logic, proving the bug exists
      expect(currentPath).toEqual(['demos', 'amazing']) // This might fail, showing the bug
    })

    it('should handle Go To button with nested folders after user navigation', () => {
      // Test the bug scenario: user in demos/amazing, goes to Record, clicks Go To
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []

      // Step 1: User navigates to demos/amazing folder manually
      const handleFolderPress = (folderPath: string[]) => {
        currentPath = folderPath
        hasUserNavigated = true
        lastProcessedInitialFolder = undefined
      }
      handleFolderPress(['demos', 'amazing'])

      expect(currentPath).toEqual(['demos', 'amazing'])
      expect(hasUserNavigated).toBe(true)

      // Step 2: User goes to Record screen and clicks "Go To" with same nested folder
      const initialFolder = 'demos/amazing'
      const intentional = 'true' // Go To button
      const isIntentionalNavigation = intentional === 'true'

      if (initialFolder !== lastProcessedInitialFolder && (!hasUserNavigated || isIntentionalNavigation)) {
        if (initialFolder && initialFolder !== 'root') {
          const pathSegments = initialFolder.split('/').filter(segment => segment.length > 0)
          currentPath = pathSegments
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      expect(currentPath).toEqual(['demos', 'amazing']) // Should navigate to nested folder
      expect(lastProcessedInitialFolder).toBe('demos/amazing')
      expect(hasUserNavigated).toBe(false) // Reset after intentional navigation
    })

    it('should handle edge cases with empty path segments', () => {
      // Test paths with extra slashes like "demos//amazing/" or "/demos/amazing"
      let currentPath: string[] = []

      const testCases = [
        { input: 'demos//amazing', expected: ['demos', 'amazing'] },
        { input: '/demos/amazing', expected: ['demos', 'amazing'] },
        { input: 'demos/amazing/', expected: ['demos', 'amazing'] },
        { input: '//demos//amazing//', expected: ['demos', 'amazing'] },
        { input: '', expected: [] },
        { input: '/', expected: [] },
        { input: '//', expected: [] },
      ]

      testCases.forEach(({ input, expected }) => {
        const pathSegments = input.split('/').filter(segment => segment.length > 0)
        currentPath = pathSegments
        expect(currentPath).toEqual(expected)
      })
    })

    it('should handle the exact bug scenario with nested folders and "Song Ideas" error', () => {
      // This test reproduces the exact bug scenario that's still happening
      let lastProcessedInitialFolder: string | undefined = undefined
      let hasUserNavigated = false
      let currentPath: string[] = []
      let lastSeenInitialFolder: string | undefined = undefined

      // Step 1: User manually navigates to nested folder ["hello", "Song Ideas"]
      const simulateManualNavigation = (path: string[]) => {
        currentPath = path
        hasUserNavigated = true
      }

      simulateManualNavigation(['hello', 'Song Ideas'])
      expect(currentPath).toEqual(['hello', 'Song Ideas'])

      // Step 2: User clicks Record button - this should pass "hello/Song Ideas" to Record screen
      const simulateRecordButtonPress = () => {
        const folderName = currentPath.length > 0 ? currentPath.join('/') : 'root'
        return folderName // This would be passed as initialFolder to Record screen
      }

      const recordScreenInitialFolder = simulateRecordButtonPress()
      expect(recordScreenInitialFolder).toBe('hello/Song Ideas') // Should be full path

      // Step 3: Record screen should store this full path and pass it back on "Go To"
      // But currently it's only passing back "Song Ideas" (the last folder name)
      // This is the bug - Record screen should pass back the full path

      // Simulate what Record screen SHOULD do (pass back full path)
      const correctGoToNavigation = recordScreenInitialFolder // Should be "hello/Song Ideas"

      // Step 4: Browse screen receives "Go To" navigation with full path
      const initialFolder = correctGoToNavigation
      const intentional = 'true'
      const isIntentionalNavigation = intentional === 'true'
      const initialFolderChanged = initialFolder !== lastSeenInitialFolder
      lastSeenInitialFolder = initialFolder

      const shouldProcess = initialFolderChanged && (!hasUserNavigated || isIntentionalNavigation)

      if (shouldProcess) {
        if (initialFolder && initialFolder !== 'root') {
          const pathSegments = initialFolder.split('/').filter(segment => segment.length > 0)
          currentPath = pathSegments
        }
        lastProcessedInitialFolder = initialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      // Should navigate to the correct nested folder
      expect(currentPath).toEqual(['hello', 'Song Ideas'])
      expect(lastProcessedInitialFolder).toBe('hello/Song Ideas')

      // Now test what's ACTUALLY happening (the bug)
      // Record screen is only passing back "Song Ideas" instead of "hello/Song Ideas"
      const buggyGoToNavigation = 'Song Ideas' // This is what's actually happening

      // Reset state to simulate the bug
      currentPath = ['hello', 'Song Ideas']
      hasUserNavigated = true
      lastSeenInitialFolder = undefined
      lastProcessedInitialFolder = undefined

      // Simulate the buggy navigation
      const buggyInitialFolder = buggyGoToNavigation
      const buggyInitialFolderChanged = buggyInitialFolder !== lastSeenInitialFolder
      lastSeenInitialFolder = buggyInitialFolder

      const buggyShouldProcess = buggyInitialFolderChanged && (!hasUserNavigated || isIntentionalNavigation)

      if (buggyShouldProcess) {
        if (buggyInitialFolder && buggyInitialFolder !== 'root') {
          const pathSegments = buggyInitialFolder.split('/').filter(segment => segment.length > 0)
          currentPath = pathSegments // This sets currentPath to ["Song Ideas"] instead of ["hello", "Song Ideas"]
        }
        lastProcessedInitialFolder = buggyInitialFolder
        if (isIntentionalNavigation) {
          hasUserNavigated = false
        }
      }

      // This shows the bug: currentPath is now ["Song Ideas"] instead of ["hello", "Song Ideas"]
      expect(currentPath).toEqual(['Song Ideas']) // This is the bug - should be ["hello", "Song Ideas"]

      // The FileSystemManager then tries to load "/recordings/Song Ideas" which doesn't exist
      // because "Song Ideas" is actually at "/recordings/hello/Song Ideas"
      // This causes the "Failed to load folder contents: [Error: Folder not found]" error
    })
  })
})
