# Audio Recording System

This document details how the audio recording process works in MuziMemo, including the libraries used, file storage, and integration with the device file system.

## Libraries Used

### expo-audio

MuziMemo uses `expo-audio` as the primary library for audio recording functionality. This library provides:

- Cross-platform audio recording capabilities
- Built-in recording presets for different quality levels
- Real-time audio level monitoring (metering)
- Proper audio session management for iOS and Android

**Key Components:**

- `useAudioRecorder`: Hook for creating and managing audio recorder instances
- `RecordingPresets`: Predefined recording configurations
- `setAudioModeAsync`: Audio session configuration
- `AudioModule`: Permission management and audio system integration

### React Native Platform APIs

- **Platform**: Used for platform-specific logic (iOS vs Android vs Web)
- **Alert**: User notifications for recording status and errors

## Recording Process Flow

### 1. Initialization

```typescript
// Audio session setup
await setAudioModeAsync({
  playsInSilentMode: true,
  allowsRecording: true,
  shouldPlayInBackground: false,
  // iOS-specific settings
  iosCategory: 'playAndRecord',
  iosCategoryMode: 'default',
  iosCategoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
})
```

### 2. Permission Management

- Requests microphone permissions on app startup
- Checks permissions before each recording attempt
- Handles permission denial gracefully with user feedback

### 3. Recording Quality Settings

The app supports three quality levels:

| Quality | Preset Used                     | Description                          |
| ------- | ------------------------------- | ------------------------------------ |
| High    | `RecordingPresets.HIGH_QUALITY` | Best quality, larger file size       |
| Medium  | `RecordingPresets.HIGH_QUALITY` | Same as high (expo-audio limitation) |
| Low     | `RecordingPresets.LOW_QUALITY`  | Smaller file size, lower quality     |

**Note**: expo-audio only provides `HIGH_QUALITY` and `LOW_QUALITY` presets, so "Medium" maps to `HIGH_QUALITY`.

### 4. Recording States

The recording system manages the following states:

- **idle**: Ready to start recording
- **recording**: Currently recording audio
- **paused**: Recording paused, can be resumed
- **stopped**: Recording completed

### 5. Real-time Features

- **Duration Tracking**: Updates every second during recording
- **Audio Level Monitoring**: Real-time audio input visualization
- **Sound Wave Animation**: Visual feedback responding to audio levels

## File Storage System

### Storage Location

Audio files are saved to the device's **document directory**, which provides:

- Persistent storage that survives app updates
- User-accessible location (on some platforms)
- Adequate space for audio files
- Proper file system permissions

### File Organization

Files are organized using the folder structure selected in the "Saving to:" dropdown:

```
Document Directory/
├── Recordings/
│   ├── song-ideas/
│   │   ├── Recording_2024-01-15T10-30-00-123Z.m4a
│   │   └── Recording_2024-01-15T11-45-30-456Z.m4a
│   ├── voice-memos/
│   │   └── Recording_2024-01-15T12-00-15-789Z.m4a
│   └── practice-sessions/
│       └── Recording_2024-01-15T14-20-45-012Z.m4a
```

### File Naming Convention

Recordings are automatically named with timestamps:

```
Recording_YYYY-MM-DDTHH-mm-ss-sssZ.m4a
```

Example: `Recording_2024-01-15T10-30-00-123Z.m4a`

### File Format

- **Extension**: `.m4a` (MPEG-4 Audio)
- **Encoding**: AAC (Advanced Audio Coding)
- **Container**: MPEG-4

## Integration with Device File System

### File System Service

The `FileSystemService` handles all file operations:

```typescript
// Create folder
await fileSystemService.createFolder(folderPath, folderName)

// List folder contents
const contents = await fileSystemService.getFolderContents(folderPath)

// Move files between folders
await fileSystemService.moveFile(sourcePath, destinationPath)
```

### Path Management

The `pathUtils` module provides utilities for path handling:

```typescript
// Get recordings root directory
const recordingsDir = getRecordingsDirectory()

// Join path components safely
const filePath = joinPath(recordingsDir, folderName, fileName)

// Generate breadcrumb navigation
const breadcrumbs = generateBreadcrumbs(currentPath)
```

### File Operations

When a recording is completed:

1. **Stop Recording**: `audioRecorder.stop()` returns the temporary file URI
2. **Generate Filename**: Create timestamped filename
3. **Determine Destination**: Use selected folder from dropdown
4. **Ensure Directory**: Create target folder if it doesn't exist
5. **Copy File**: Move from temporary location to final destination
6. **Update UI**: Refresh file listings and show success message

### Error Handling

The system handles various file system errors:

- **Permission Denied**: Request appropriate permissions
- **Insufficient Space**: Alert user to free up space
- **File Already Exists**: Generate unique filename
- **Network Storage**: Handle cloud storage sync issues

## Audio Metadata

### Metadata Extraction

The `AudioMetadataService` extracts information from audio files:

- **Duration**: Calculated from file size and bitrate
- **File Size**: Retrieved from file system
- **Format**: Detected from file headers
- **Creation Date**: From file system metadata

### Duration Calculation

For files without embedded duration metadata:

```typescript
const duration = (fileSize * 8) / (bitrate * 1000)
```

## Performance Considerations

### Memory Management

- Audio recorder instances are properly disposed
- File operations use streaming when possible
- Large file lists are paginated

### Battery Optimization

- Recording stops automatically on app backgrounding
- Audio session is configured for optimal power usage
- Unnecessary background processing is minimized

### Storage Efficiency

- Users can select appropriate quality levels
- Old recordings can be deleted through the UI
- File compression is handled by the audio codec

## Troubleshooting

### Common Issues

1. **No Audio Recorded**: Check microphone permissions
2. **Poor Quality**: Verify selected quality setting
3. **File Not Found**: Ensure target folder exists
4. **Recording Fails**: Check available storage space

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
console.log('Recording status:', status)
console.log('File path:', targetFilePath)
console.log('Permissions:', hasPermissions)
```

## Testing

The audio recording system includes comprehensive tests:

- **Unit Tests**: Logic validation for recording states and quality mapping
- **Integration Tests**: File system operations and audio session management
- **Format Tests**: Duration formatting and file naming utilities

See the `src/hooks/__tests__/` directory for test implementations.
