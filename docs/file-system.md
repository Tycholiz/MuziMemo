# File System Architecture

This document describes how MuziMemo integrates with the device file system to store and manage audio recordings.

## Overview

MuziMemo utilizes the device's native file system through Expo's FileSystem API to provide persistent storage for audio recordings. The app creates a structured folder hierarchy within the device's document directory.

## Storage Location

### Document Directory
All recordings are stored in the device's **document directory**, which provides:

- **Persistence**: Files survive app updates and device restarts
- **User Access**: Files can be accessed by users on supported platforms
- **Adequate Space**: Sufficient storage for audio files
- **Proper Permissions**: Read/write access without additional permissions

### Path Structure
```
[Document Directory]/
└── Recordings/                    # Root recordings folder
    ├── song-ideas/                # User-created folder
    │   ├── Recording_2024-01-15T10-30-00-123Z.m4a
    │   └── Recording_2024-01-15T11-45-30-456Z.m4a
    ├── voice-memos/               # User-created folder
    │   └── Recording_2024-01-15T12-00-15-789Z.m4a
    └── practice-sessions/         # User-created folder
        └── Recording_2024-01-15T14-20-45-012Z.m4a
```

## File System Service

### Core Functionality
The `FileSystemService` class provides a unified interface for all file operations:

```typescript
class FileSystemService {
  // Initialize the service and create root directories
  async initialize(): Promise<void>
  
  // Get contents of a folder
  async getFolderContents(folderPath: string): Promise<FileSystemItem[]>
  
  // Create a new folder
  async createFolder(parentPath: string, folderName: string): Promise<void>
  
  // Delete a folder and its contents
  async deleteFolder(folderPath: string): Promise<void>
  
  // Move files between folders
  async moveFile(sourcePath: string, destinationPath: string): Promise<void>
  
  // Rename files or folders
  async renameItem(itemPath: string, newName: string): Promise<void>
}
```

### Error Handling
The service includes comprehensive error handling for:

- **Permission Errors**: When the app lacks file system access
- **Storage Full**: When device storage is insufficient
- **File Not Found**: When attempting to access non-existent files
- **Name Conflicts**: When creating files/folders with existing names

## Folder Management

### Folder Creation
Users can create custom folders through the UI:

1. **Validation**: Check folder name for invalid characters
2. **Path Generation**: Create full path using `pathUtils`
3. **Directory Creation**: Use `FileSystem.makeDirectoryAsync()`
4. **UI Update**: Refresh folder listings

### Folder Operations
Supported operations include:

- **Create**: Add new folders for organization
- **Rename**: Change folder names while preserving contents
- **Delete**: Remove folders and all contained files
- **Move**: Relocate folders within the hierarchy

### Default Folders
The app creates a default "song-ideas" folder on first launch to provide immediate usability.

## File Operations

### Recording Storage Process

1. **Temporary Storage**: expo-audio creates temporary recording file
2. **Filename Generation**: Create timestamped filename
3. **Destination Selection**: Use folder selected in "Saving to:" dropdown
4. **Directory Verification**: Ensure target folder exists
5. **File Transfer**: Copy from temporary to permanent location
6. **Cleanup**: Remove temporary file
7. **Metadata Update**: Refresh file listings

### File Naming Convention
```typescript
// Format: Recording_YYYY-MM-DDTHH-mm-ss-sssZ.m4a
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const fileName = `Recording_${timestamp}.m4a`
```

### File Metadata
Each file includes metadata:

```typescript
type FileSystemItem = {
  id: string           // Unique identifier
  name: string         // Display name
  path: string         // Full file path
  type: 'file' | 'folder'
  size?: number        // File size in bytes
  createdAt: Date      // Creation timestamp
  modifiedAt: Date     // Last modification timestamp
  parentPath?: string  // Parent directory path
}
```

## Path Utilities

### Path Management
The `pathUtils` module provides cross-platform path handling:

```typescript
// Get the recordings root directory
export function getRecordingsDirectory(): string

// Safely join path components
export function joinPath(...components: string[]): string

// Generate breadcrumb navigation
export function generateBreadcrumbs(currentPath: string[]): BreadcrumbItem[]

// Extract filename from path
export function getFileName(filePath: string): string

// Get file extension
export function getFileExtension(filePath: string): string
```

### Platform Considerations
- **iOS**: Uses document directory with proper sandboxing
- **Android**: Utilizes internal storage with appropriate permissions
- **Web**: Falls back to browser storage APIs (limited functionality)

## Integration with "Saving to:" Dropdown

### Folder Selection Process

1. **Load Folders**: Scan recordings directory for existing folders
2. **Populate Dropdown**: Display available folders in UI
3. **User Selection**: User chooses destination folder
4. **Path Resolution**: Convert selection to full file path
5. **Recording Storage**: Save new recordings to selected location

### Dynamic Updates
The dropdown automatically updates when:
- New folders are created
- Folders are renamed or deleted
- App returns from background (refresh)

### Default Behavior
- **First Launch**: Defaults to "song-ideas" folder
- **Subsequent Launches**: Remembers last selected folder
- **Folder Deletion**: Falls back to first available folder

## Performance Optimization

### Efficient File Listing
- **Lazy Loading**: Load folder contents only when needed
- **Caching**: Cache folder structures to reduce file system calls
- **Pagination**: Handle large directories efficiently

### Memory Management
- **Stream Processing**: Use streams for large file operations
- **Cleanup**: Properly dispose of file handles and temporary files
- **Background Processing**: Perform heavy operations off main thread

### Storage Monitoring
- **Space Checking**: Monitor available storage before recording
- **Cleanup Suggestions**: Notify users when storage is low
- **Compression**: Use efficient audio codecs to minimize file size

## Security and Privacy

### Data Protection
- **Local Storage**: All data remains on device
- **No Cloud Sync**: Files are not automatically uploaded
- **Sandboxing**: App can only access its own directory

### Permission Management
- **Minimal Permissions**: Only request necessary file system access
- **User Control**: Users can manage files through standard OS interfaces
- **Privacy Compliance**: No data collection or external transmission

## Backup and Recovery

### User Backup Options
Users can backup recordings through:
- **iTunes/Finder**: iOS file sharing
- **Android File Transfer**: Direct file access
- **Cloud Services**: Manual upload to user's preferred service

### Data Recovery
- **Persistent Storage**: Files survive app updates
- **Standard Formats**: Use widely-supported audio formats
- **Metadata Preservation**: Maintain file timestamps and organization

## Troubleshooting

### Common Issues

1. **Files Not Appearing**: Check folder permissions and refresh UI
2. **Storage Full**: Guide users to delete old recordings
3. **Folder Creation Failed**: Validate folder names and check permissions
4. **File Access Denied**: Restart app to refresh permissions

### Debug Tools
```typescript
// Log file system state
console.log('Recordings directory:', getRecordingsDirectory())
console.log('Available space:', await FileSystem.getFreeDiskStorageAsync())
console.log('Folder contents:', await fileSystemService.getFolderContents(path))
```

### Recovery Procedures
- **Corrupted Metadata**: Rebuild from file system scan
- **Missing Folders**: Recreate default folder structure
- **Permission Issues**: Guide user through permission reset
