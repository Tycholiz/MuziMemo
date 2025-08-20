# iCloud Synchronization Documentation

## Overview

The app provides seamless iCloud synchronization for audio recordings, allowing users to access their recordings across multiple iOS devices. When enabled, the sync feature automatically manages the upload, download, and reconciliation of audio files between local storage and iCloud Drive.

## How Sync Works

### Enabling Sync

1. User navigates to Settings and toggles "Enable iCloud Sync"
2. App checks for iCloud availability and user sign-in status
3. If available, sync is enabled and a migration dialog appears
4. User can choose to upload existing recordings immediately or later

### Initial Migration

When sync is first enabled:

1. **Upload Phase**: All local recordings are scanned and uploaded to iCloud
   - Files are uploaded to `iCloud Drive/MuziMemo/recordings/` directory
   - Preserves folder structure and file metadata
   - Shows progress and completion status

2. **Download Phase**: All iCloud recordings are scanned and downloaded locally
   - Downloads any recordings that exist in iCloud but not locally
   - Maintains the same folder structure locally

### Ongoing Synchronization

#### New Recording Creation

1. Recording is created and saved locally first (for immediate playback)
2. After a 5-second delay, the file is automatically synced to iCloud
3. Background sync ensures upload completes even if user navigates away

#### Background Sync

- Periodic sync runs every 10 seconds when app is active
- Checks for new local files to upload
- Checks for new iCloud files to download
- Handles network connectivity changes gracefully

#### Offline Behavior

- When offline, recordings are queued for sync when connectivity returns
- Sync queue persists across app restarts
- Failed uploads are retried with exponential backoff

## Conflict Resolution

### File Naming Conflicts

When the same filename exists both locally and in iCloud but represents different recordings, the app follows iOS's standard conflict resolution pattern by preserving both versions.

#### Conflict Resolution Strategy

**Preserve Both Versions**: When conflicts are detected, both files are kept with clear naming:

```
Original file: "Recording 1.m4a"
Conflict scenario creates:
- "Recording 1.m4a" (newer version)
- "Recording 1 (conflicted copy 2024-01-15).m4a" (older version)
```

#### Conflict Detection

Conflicts are detected when:

1. A file exists both locally and in iCloud
2. File sizes differ significantly (>1KB difference)
3. Modification timestamps differ by more than 1 minute
4. File content hashes don't match (if implemented)

#### Resolution Process

1. **Detection**: During sync, identify conflicting files
2. **Preservation**: Rename older file with conflict suffix including date
3. **Notification**: Log conflict resolution (future: user notification)
4. **Sync**: Continue with newer version as primary

### Edge Cases

#### Simultaneous Creation

If the same filename is created simultaneously on different devices:

- Both files are preserved with device-specific suffixes
- User can manually review and delete duplicates

#### Partial Upload Failures

If upload fails partway through:

- File lock prevents corruption during retry
- Retry mechanism with exponential backoff
- Failed uploads are queued for later retry

## Technical Implementation

### File Structure

```
Local: /Documents/recordings/
iCloud: /iCloud Drive/MuziMemo/recordings/

Example:
Local:  /Documents/recordings/Meeting Notes/Recording 1.m4a
iCloud: /recordings/Meeting Notes/Recording 1.m4a
```

### Sync States

- **Synced**: File exists in both locations with matching content
- **Local Only**: File exists locally but not in iCloud (pending upload)
- **Cloud Only**: File exists in iCloud but not locally (pending download)
- **Conflicted**: File exists in both locations with different content

### Error Handling

- Network connectivity issues: Queue for retry
- iCloud storage full: User notification with guidance
- File corruption: Re-upload/re-download with verification
- Permission issues: User guidance to check iCloud settings

## User Experience

### Visual Indicators

- Sync status icons next to recordings
- Progress indicators during migration
- Network status awareness
- Error notifications with actionable guidance

### Settings

- Toggle to enable/disable sync
- Manual sync trigger
- View sync status and queue
- Clear sync cache option

### Troubleshooting

- Diagnostic tools for debugging sync issues
- Manual conflict resolution interface
- Sync history and logs
- Reset sync state option

## Privacy and Security

### Data Handling

- All files are encrypted by iOS during iCloud transfer
- No additional encryption layer needed (relies on iOS security)
- Files remain private to the user's iCloud account

### Permissions

- Requires iCloud Drive to be enabled
- Uses iOS document-based iCloud storage
- No access to other apps' iCloud data

## Troubleshooting Guide

### Common Issues

1. **Sync Not Working**: Check iCloud Drive settings
2. **Files Missing**: Run manual sync or diagnostic
3. **Conflicts**: Review conflicted files and choose versions
4. **Storage Full**: Free up iCloud storage space
5. **Slow Sync**: Check network connection and file sizes

### Diagnostic Commands

```typescript
// Check sync status
await iCloudService.diagnoseCloudSync()

// Force full migration
await iCloudService.migrateLocalRecordingsToCloud()

// List all cloud files
const files = await iCloudService.listFiles('recordings')
```
