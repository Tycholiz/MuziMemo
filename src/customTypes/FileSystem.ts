/**
 * TypeScript types for file system operations
 */

export type FileSystemItem = {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  createdAt: Date
  modifiedAt: Date
  parentPath?: string
}

export type FolderItem = FileSystemItem & {
  type: 'folder'
  children?: FileSystemItem[]
  itemCount: number
}

export type FileItem = FileSystemItem & {
  type: 'file'
  extension: string
  mimeType?: string
}

export type AudioFile = FileItem & {
  duration?: number
  format: string
  bitRate?: number
  sampleRate?: number
}

export type BreadcrumbItem = {
  name: string
  path: string
  isLast: boolean
}

export type FileSystemError = {
  code: string
  message: string
  path?: string
  originalError?: Error
}

export type CreateFolderOptions = {
  name: string
  parentPath?: string
  createIntermediates?: boolean
}

export type MoveFileOptions = {
  sourcePath: string
  destinationPath: string
  overwrite?: boolean
}

export type MoveFolderOptions = {
  sourcePath: string
  destinationPath: string
  overwrite?: boolean
}

export type RenameOptions = {
  oldPath: string
  newName: string
  validateName?: boolean
}

export type FileSystemStats = {
  totalFiles: number
  totalFolders: number
  totalSize: number
  lastModified: Date
}

export const DEFAULT_FOLDERS = ['Song Ideas', 'Demos', 'Voice Memos', 'Lyrics', 'Drafts'] as const

export type DefaultFolder = (typeof DEFAULT_FOLDERS)[number]

export type CreateFileOptions = {
  name: string
  content?: string
  parentPath?: string
  extension?: string
  mimeType?: string
}

export const DEFAULT_AUDIO_FILES = [
  { name: 'Guitar Riff Idea', folder: 'Song Ideas', duration: 45, format: 'mp3' },
  { name: 'Verse Melody', folder: 'Song Ideas', duration: 32, format: 'mp3' },
  { name: 'Demo Track 1', folder: 'Demos', duration: 180, format: 'mp3' },
  { name: 'Vocal Demo', folder: 'Demos', duration: 95, format: 'mp3' },
  { name: 'Quick Voice Note', folder: 'Voice Memos', duration: 15, format: 'mp3' },
  { name: 'Song Structure Ideas', folder: 'Voice Memos', duration: 67, format: 'mp3' },
  { name: 'Chorus Lyrics Draft', folder: 'Lyrics', duration: 28, format: 'mp3' },
  { name: 'Bridge Section', folder: 'Drafts', duration: 41, format: 'mp3' },
] as const

export type DefaultAudioFile = (typeof DEFAULT_AUDIO_FILES)[number]

export const FILE_SYSTEM_ERRORS = {
  FOLDER_EXISTS: 'FOLDER_EXISTS',
  FOLDER_NOT_FOUND: 'FOLDER_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_NAME: 'INVALID_NAME',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  STORAGE_FULL: 'STORAGE_FULL',
  OPERATION_FAILED: 'OPERATION_FAILED',
  PLATFORM_NOT_SUPPORTED: 'PLATFORM_NOT_SUPPORTED',
} as const

export type FileSystemErrorCode = (typeof FILE_SYSTEM_ERRORS)[keyof typeof FILE_SYSTEM_ERRORS]
