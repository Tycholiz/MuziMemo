// Import gesture handler setup if available
try {
  require('react-native-gesture-handler/jestSetup')
} catch (e) {
  // react-native-gesture-handler not installed, skip setup
}

// Mock react-native-reanimated (only if installed)
try {
  require.resolve('react-native-reanimated')
  jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock')
    Reanimated.default.call = () => {}
    return Reanimated
  })
} catch (e) {
  // react-native-reanimated is not installed, skip mocking
}

// Mock expo modules
jest.mock('expo-audio', () => ({
  AudioRecorder: jest.fn().mockImplementation(() => ({
    record: jest.fn(),
    stop: jest.fn(),
    uri: 'mock://recording.m4a',
    isRecording: false,
  })),
  AudioPlayer: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
  })),
}))

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}))

// Silence the warning: Animated: `useNativeDriver` is not supported
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')
} catch (e) {
  // Module not found, skip mocking
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}
