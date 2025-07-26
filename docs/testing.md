# Testing Strategy

This document outlines the testing approach for MuziMemo, including unit tests, integration tests, and testing best practices.

## Testing Framework

### Jest Configuration
MuziMemo uses Jest as the primary testing framework with the following setup:

```json
{
  "preset": "jest-expo",
  "testMatch": ["**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)"],
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts"
  ]
}
```

### Test Structure
Tests are organized alongside source code in `__tests__` directories:

```
src/
├── hooks/
│   ├── useAudioRecording.ts
│   └── __tests__/
│       └── useAudioRecording.unit.test.ts
├── utils/
│   ├── formatUtils.ts
│   └── __tests__/
│       └── formatUtils.test.ts
└── services/
    ├── FileSystemService.ts
    └── __tests__/
        └── FileSystemService.basic.test.ts
```

## Test Categories

### Unit Tests

#### Format Utilities (`formatUtils.test.ts`)
Tests for utility functions that handle data formatting:

```typescript
describe('formatUtils', () => {
  describe('formatDurationFromSeconds', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDurationFromSeconds(65)).toBe('01:05')
      expect(formatDurationFromSeconds(3661)).toBe('61:01')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes to human readable format', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
    })
  })
})
```

#### Audio Recording Logic (`useAudioRecording.unit.test.ts`)
Tests for recording hook business logic without React dependencies:

```typescript
describe('useAudioRecording types and constants', () => {
  it('should map audio quality to correct presets', () => {
    // Test quality mapping logic
    expect(getRecordingPreset('high')).toBe(HIGH_QUALITY)
    expect(getRecordingPreset('medium')).toBe(HIGH_QUALITY)
    expect(getRecordingPreset('low')).toBe(LOW_QUALITY)
  })

  it('should handle duration tracking logic', () => {
    const duration = calculateDuration(startTime, currentTime)
    expect(duration).toBeGreaterThan(0)
  })
})
```

### Integration Tests

#### File System Service (`FileSystemService.basic.test.ts`)
Tests for file system operations and service integration:

```typescript
describe('FileSystemService', () => {
  it('should initialize with default folder structure', async () => {
    await fileSystemService.initialize()
    const contents = await fileSystemService.getFolderContents(recordingsDir)
    expect(contents).toContainEqual(expect.objectContaining({
      name: 'song-ideas',
      type: 'folder'
    }))
  })
})
```

## Mocking Strategy

### External Dependencies

#### expo-audio Mocking
```typescript
jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => mockAudioRecorder),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(),
    getRecordingPermissionsAsync: jest.fn(),
  },
  setAudioModeAsync: jest.fn(),
  RecordingPresets: {
    HIGH_QUALITY: { extension: '.m4a', sampleRate: 44100 },
    LOW_QUALITY: { extension: '.m4a', sampleRate: 22050 },
  },
}))
```

#### File System Mocking
```typescript
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
}))
```

#### React Native Platform
```typescript
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
}))
```

## Test Utilities

### Mock Data Factories
```typescript
// Create mock file system items
export const createMockFileItem = (overrides = {}): FileSystemItem => ({
  id: 'mock-file-id',
  name: 'test-recording.m4a',
  path: '/recordings/test-recording.m4a',
  type: 'file',
  size: 1024,
  createdAt: new Date(),
  modifiedAt: new Date(),
  ...overrides,
})

// Create mock folder items
export const createMockFolderItem = (overrides = {}): FolderItem => ({
  id: 'mock-folder-id',
  name: 'test-folder',
  path: '/recordings/test-folder',
  type: 'folder',
  itemCount: 0,
  createdAt: new Date(),
  modifiedAt: new Date(),
  ...overrides,
})
```

### Test Helpers
```typescript
// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock timer utilities
export const mockTimers = () => {
  jest.useFakeTimers()
  return () => jest.useRealTimers()
}
```

## Testing Best Practices

### Test Organization
1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern for test structure
3. **Single Responsibility**: Each test should verify one behavior
4. **Independent Tests**: Tests should not depend on each other

### Mock Management
1. **Reset Mocks**: Clear mocks between tests using `beforeEach`
2. **Minimal Mocking**: Only mock what's necessary for the test
3. **Realistic Mocks**: Ensure mocks behave like real implementations
4. **Mock Verification**: Verify mock calls when testing interactions

### Error Testing
```typescript
it('should handle recording errors gracefully', async () => {
  mockAudioRecorder.prepareToRecordAsync.mockRejectedValue(
    new Error('Recording failed')
  )
  
  await startRecording()
  
  expect(errorState).toBe('Recording failed')
})
```

### Async Testing
```typescript
it('should complete recording process', async () => {
  const recordingPromise = startRecording()
  
  await waitFor(() => {
    expect(mockAudioRecorder.record).toHaveBeenCalled()
  })
  
  await recordingPromise
  expect(status).toBe('recording')
})
```

## Coverage Goals

### Target Coverage
- **Unit Tests**: 90%+ coverage for utility functions
- **Integration Tests**: 80%+ coverage for services
- **Critical Paths**: 100% coverage for recording and file operations

### Coverage Reports
```bash
# Generate coverage report
npm test -- --coverage

# View detailed coverage
npm test -- --coverage --watchAll=false
```

## Continuous Integration

### GitHub Actions
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npx tsc --noEmit
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test && npm run type-check"
    }
  }
}
```

## Manual Testing

### Device Testing
1. **iOS Simulator**: Test iOS-specific behaviors
2. **Android Emulator**: Verify Android compatibility
3. **Physical Devices**: Test real-world performance

### Test Scenarios
1. **Recording Flow**: Complete recording from start to finish
2. **Permission Handling**: Test permission request and denial
3. **File Management**: Create, rename, delete folders and files
4. **Error Conditions**: Test network issues, storage full, etc.

### Performance Testing
1. **Large Files**: Test with long recordings
2. **Many Files**: Test with hundreds of recordings
3. **Low Storage**: Test behavior when storage is nearly full
4. **Background**: Test recording interruption and resumption

## Debugging Tests

### Common Issues
1. **Async Timing**: Use proper async/await patterns
2. **Mock Leakage**: Ensure mocks are properly reset
3. **Platform Differences**: Account for iOS/Android variations
4. **State Management**: Verify state updates in hooks

### Debug Tools
```typescript
// Enable debug logging in tests
process.env.NODE_ENV = 'test'
console.log('Test state:', testState)

// Use Jest debugging
jest.setTimeout(30000) // Increase timeout for debugging
```

## Future Testing Enhancements

### Planned Improvements
1. **E2E Testing**: Add Detox for end-to-end testing
2. **Visual Testing**: Screenshot comparison for UI consistency
3. **Performance Testing**: Automated performance benchmarks
4. **Accessibility Testing**: Ensure app is accessible to all users

### Test Automation
1. **Automated Regression**: Run full test suite on every commit
2. **Performance Monitoring**: Track test execution time
3. **Flaky Test Detection**: Identify and fix unreliable tests
4. **Coverage Tracking**: Monitor coverage trends over time
