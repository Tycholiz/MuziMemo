# MuziMemo

A React Native Expo app for recording and managing audio memos, built with TypeScript.

## Features

- 🎤 Audio recording with real-time duration display
- 📁 Browse and manage recorded audio files
- 🎨 Modern UI with red accent theme
- 📱 Cross-platform (iOS, Android, Web)
- 🔧 TypeScript with strict type checking
- 🎯 Path aliases for clean imports
- ✅ ESLint and Prettier for code quality
- 🧪 Jest testing framework setup

## Project Structure

```
src/
├── app/                # Expo Router app directory
│   ├── (tabs)/         # Tab navigation group
│   │   ├── _layout.tsx # Tab layout configuration
│   │   ├── record.tsx  # Record tab screen
│   │   └── browse.tsx  # Browse tab screen
│   ├── _layout.tsx     # Root layout
│   └── index.tsx       # Index route (redirects to tabs)
├── components/         # Reusable UI components
│   ├── ErrorBoundary.tsx
│   ├── SafeAreaWrapper.tsx
│   └── index.ts
├── screens/            # Screen components
│   ├── RecordScreen.tsx
│   ├── BrowseScreen.tsx
│   └── index.ts
├── services/           # Business logic services
│   ├── AudioService.ts
│   └── index.ts
├── utils/              # Helper functions and theme
│   ├── formatUtils.ts
│   ├── theme.ts
│   └── index.ts
├── types/              # TypeScript type definitions
│   ├── Recording.ts
│   └── index.ts
├── constants/          # App constants
│   ├── colors.ts
│   └── index.ts
└── hooks/              # Custom React hooks
    ├── useAudioRecording.ts
    └── index.ts
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm start
```

Run on specific platforms:

```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

### Code Quality

Run linting:

```bash
npm run lint
npm run lint:fix   # Auto-fix issues
```

Format code:

```bash
npm run format
npm run format:check
```

Type checking:

```bash
npm run type-check
```

### Testing

Run tests:

```bash
npm test
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

## Path Aliases

The project uses TypeScript path aliases for clean imports:

- `@components/*` → `src/components/*`
- `@screens/*` → `src/screens/*`
- `@services/*` → `src/services/*`
- `@utils/*` → `src/utils/*`
- `@types/*` → `src/types/*`
- `@constants/*` → `src/constants/*`
- `@hooks/*` → `src/hooks/*`

## Theme

The app uses a centralized theme system with:

- Red accent color (#FF3B30)
- Consistent spacing and typography
- Dark/light color variants
- Responsive design tokens

## Dependencies

### Core

- React Native with Expo SDK 53
- TypeScript
- Expo Router (file-based routing)

### Audio & File System

- expo-audio (audio recording/playback)
- expo-file-system (file operations)

### UI & Icons

- @expo/vector-icons

### Development

- ESLint + Prettier
- Jest + jest-expo
- TypeScript strict mode

## License

MIT
