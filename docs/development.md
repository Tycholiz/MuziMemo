# Development Setup

This document provides instructions for setting up the MuziMemo development environment and contributing to the project.

## Prerequisites

### Required Software
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Expo CLI**: Latest version
- **Git**: For version control

### Development Tools
- **VS Code**: Recommended IDE with React Native extensions
- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development
- **Expo Go**: Mobile app for testing

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/Tycholiz/MuziMemo.git
cd MuziMemo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Expo CLI
```bash
npm install -g @expo/cli
```

## Development Workflow

### Starting Development Server
```bash
npm start
```

This will start the Expo development server and display a QR code for testing on mobile devices.

### Platform-Specific Development

#### iOS Development
```bash
npm run ios
```
Requires Xcode and iOS Simulator.

#### Android Development
```bash
npm run android
```
Requires Android Studio and Android Emulator.

#### Web Development
```bash
npm run web
```
Opens the app in a web browser (limited functionality).

## Project Structure

```
MuziMemo/
├── src/                          # Source code
│   ├── app/                      # Expo Router app directory
│   ├── components/               # Reusable UI components
│   │   ├── Icon.tsx             # Icon components
│   │   ├── Dropdown.tsx         # Dropdown component
│   │   └── __tests__/           # Component tests
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAudioRecording.ts # Audio recording hook
│   │   └── __tests__/           # Hook tests
│   ├── screens/                 # Main app screens
│   │   ├── RecordScreen.tsx     # Recording interface
│   │   └── BrowseScreen.tsx     # File browser
│   ├── services/                # Business logic services
│   │   ├── FileSystemService.ts # File operations
│   │   └── AudioMetadataService.ts # Audio metadata
│   ├── utils/                   # Utility functions
│   │   ├── formatUtils.ts       # Data formatting
│   │   └── pathUtils.ts         # Path handling
│   └── customTypes/             # TypeScript type definitions
├── docs/                        # Documentation
├── assets/                      # Static assets
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

## Code Style and Standards

### TypeScript Configuration
The project uses strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Coding Guidelines
- Use TypeScript for all new code
- Follow React Native best practices
- Implement proper error handling
- Write comprehensive tests
- Use descriptive variable and function names

### Import Organization
```typescript
// 1. Framework imports
import React from 'react'
import { View, Text } from 'react-native'

// 2. External libraries
import { Ionicons } from '@expo/vector-icons'

// 3. Internal modules
import { theme } from '@utils/theme'
import { FileSystemService } from '@services/FileSystemService'

// 4. Relative imports
import { Button } from './Button'
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for utility functions
- Integration tests for services
- Component tests for UI components
- End-to-end tests for critical flows

### Writing Tests
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should perform expected behavior', () => {
    // Arrange
    const input = 'test input'
    
    // Act
    const result = functionUnderTest(input)
    
    // Assert
    expect(result).toBe('expected output')
  })
})
```

## Building and Deployment

### Type Checking
```bash
npx tsc --noEmit
```

### Building for Production
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for web
npm run build:web
```

### Environment Configuration
Create environment-specific configuration files:

```typescript
// config/development.ts
export const config = {
  apiUrl: 'http://localhost:3000',
  debugMode: true,
}

// config/production.ts
export const config = {
  apiUrl: 'https://api.muzimemo.com',
  debugMode: false,
}
```

## Debugging

### Development Tools
- **React Native Debugger**: For debugging React components
- **Flipper**: For network and performance debugging
- **Expo DevTools**: Built-in debugging tools

### Common Debug Commands
```bash
# Clear Metro cache
npx expo start --clear

# Reset Expo cache
npx expo install --fix

# View logs
npx expo logs
```

### Debug Configuration
```typescript
// Enable debug logging
if (__DEV__) {
  console.log('Debug information:', debugData)
}

// Performance monitoring
if (__DEV__) {
  console.time('Operation')
  performOperation()
  console.timeEnd('Operation')
}
```

## Contributing

### Git Workflow
1. Create feature branch from main
2. Make changes with descriptive commits
3. Write/update tests
4. Ensure all tests pass
5. Submit pull request

### Commit Messages
Use conventional commit format:
```
feat: add audio quality selection
fix: resolve recording timer reset issue
docs: update API documentation
test: add unit tests for formatUtils
```

### Pull Request Process
1. **Description**: Provide clear description of changes
2. **Testing**: Include test results and coverage
3. **Documentation**: Update relevant documentation
4. **Review**: Address feedback from code review

## Troubleshooting

### Common Issues

#### Metro Bundle Error
```bash
# Clear cache and restart
npx expo start --clear
```

#### iOS Simulator Issues
```bash
# Reset simulator
xcrun simctl erase all
```

#### Android Emulator Issues
```bash
# Cold boot emulator
emulator -avd <device_name> -cold-boot
```

#### Permission Issues
- Check app permissions in device settings
- Restart development server
- Clear app data and reinstall

### Performance Issues
- Use React DevTools Profiler
- Monitor memory usage
- Optimize image assets
- Implement lazy loading

### Build Issues
- Verify all dependencies are installed
- Check TypeScript compilation
- Ensure all tests pass
- Review build logs for errors

## Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community
- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Tools
- [Expo Snack](https://snack.expo.dev/) - Online playground
- [React Native Directory](https://reactnative.directory/) - Package discovery
- [Expo Application Services](https://expo.dev/eas) - Build and deployment
