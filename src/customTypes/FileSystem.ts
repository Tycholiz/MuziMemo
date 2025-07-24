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

export const DEFAULT_FOLDERS = [
  'Song Ideas',
  'Demos', 
  'Voice Memos',
  'Lyrics',
  'Drafts'
] as const

export type DefaultFolder = typeof DEFAULT_FOLDERS[number]

export const FILE_SYSTEM_ERRORS = {
  FOLDER_EXISTS: 'FOLDER_EXISTS',
  FOLDER_NOT_FOUND: 'FOLDER_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_NAME: 'INVALID_NAME',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  STORAGE_FULL: 'STORAGE_FULL',
  OPERATION_FAILED: 'OPERATION_FAILED',
  PLATFORM_NOT_SUPPORTED: 'PLATFORM_NOT_SUPPORTED'
} as const

export type FileSystemErrorCode = typeof FILE_SYSTEM_ERRORS[keyof typeof FILE_SYSTEM_ERRORS]
