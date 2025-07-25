import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'

import type {
  FileSystemItem,
  FolderItem,
  FileItem,
  CreateFolderOptions,
  MoveFileOptions,
  MoveFolderOptions,
  RenameOptions,
  FileSystemError,
  FileSystemErrorCode,
  FileSystemStats,
} from '../customTypes/FileSystem'
import { FILE_SYSTEM_ERRORS } from '../customTypes/FileSystem'
import {
  getRecordingsDirectory,
  joinPath,
  sanitizeFileName,
  validateFileName,
  getFileName,
  getParentDirectory,
} from '@utils/pathUtils'

/**
 * FileSystem service for managing folders and files
 * Handles both native and web platforms with appropriate fallbacks
 */
export class FileSystemService {
  private static instance: FileSystemService | null = null
  private isInitialized = false
  private webStorage: Map<string, any> = new Map()

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService()
    }
    return FileSystemService.instance
  }

  /**
   * Initialize the file system and create default folder structure
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return
      }

      if (Platform.OS === 'web') {
        await this.initializeWebStorage()
      } else {
        await this.initializeNativeFileSystem()
      }

      await this.initializeFolderStructure()
      this.isInitialized = true
    } catch (error) {
      throw this.createError(
        FILE_SYSTEM_ERRORS.OPERATION_FAILED,
        'Failed to initialize file system',
        undefined,
        error as Error
      )
    }
  }

  /**
   * Initialize web storage
   */
  private async initializeWebStorage(): Promise<void> {
    // For web, we'll use localStorage to persist folder structure
    const storedData = localStorage.getItem('muzimemo_filesystem')
    if (storedData) {
      try {
        const data = JSON.parse(storedData)
        this.webStorage = new Map(Object.entries(data))
      } catch (error) {
        console.warn('Failed to load web storage data:', error)
        this.webStorage = new Map()
      }
    }
  }

  /**
   * Initialize native file system
   */
  private async initializeNativeFileSystem(): Promise<void> {
    const recordingsDir = getRecordingsDirectory()

    // Check if recordings directory exists, create if not
    const dirInfo = await FileSystem.getInfoAsync(recordingsDir)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true })
    }
  }

  /**
   * Create default folder structure on first launch
   */
  async initializeFolderStructure(): Promise<void> {
    const defaultFolders: readonly string[] = ['Song Ideas', 'Demos', 'Lyrics', 'Drafts']

    for (const folderName of defaultFolders) {
      try {
        await this.createFolder({ name: folderName })
      } catch (error) {
        // Ignore if folder already exists
        const fsError = error as FileSystemError
        if (fsError.code !== FILE_SYSTEM_ERRORS.FOLDER_EXISTS) {
          console.warn(`Failed to create default folder "${folderName}":`, error)
        }
      }
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(options: CreateFolderOptions): Promise<FolderItem> {
    const { name, parentPath, createIntermediates = true } = options

    // Validate folder name
    const validation = validateFileName(name)
    if (!validation.isValid) {
      throw this.createError(FILE_SYSTEM_ERRORS.INVALID_NAME, validation.error || 'Invalid folder name', name)
    }

    const sanitizedName = sanitizeFileName(name)
    const basePath = parentPath || getRecordingsDirectory()
    const folderPath = joinPath(basePath, sanitizedName)

    try {
      // Check if folder already exists
      if (await this.fileExists(folderPath)) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_EXISTS, `Folder "${sanitizedName}" already exists`, folderPath)
      }

      if (Platform.OS === 'web') {
        return await this.createFolderWeb(folderPath, sanitizedName, basePath)
      } else {
        return await this.createFolderNative(folderPath, sanitizedName, basePath, createIntermediates)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error // Re-throw FileSystemError
      }
      throw this.createError(
        FILE_SYSTEM_ERRORS.OPERATION_FAILED,
        `Failed to create folder "${sanitizedName}"`,
        folderPath,
        error as Error
      )
    }
  }

  /**
   * Create folder on web platform
   */
  private async createFolderWeb(folderPath: string, name: string, parentPath: string): Promise<FolderItem> {
    const folder: FolderItem = {
      id: this.generateId(),
      name,
      path: folderPath,
      type: 'folder',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parentPath,
      children: [],
      itemCount: 0,
    }

    this.webStorage.set(folderPath, folder)
    await this.saveWebStorage()

    return folder
  }

  /**
   * Create folder on native platform
   */
  private async createFolderNative(
    folderPath: string,
    name: string,
    parentPath: string,
    createIntermediates: boolean
  ): Promise<FolderItem> {
    await FileSystem.makeDirectoryAsync(folderPath, { intermediates: createIntermediates })

    const folder: FolderItem = {
      id: this.generateId(),
      name,
      path: folderPath,
      type: 'folder',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parentPath,
      children: [],
      itemCount: 0,
    }

    return folder
  }

  /**
   * Delete a folder
   */
  async deleteFolder(path: string): Promise<void> {
    try {
      if (!(await this.fileExists(path))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_NOT_FOUND, 'Folder not found', path)
      }

      if (Platform.OS === 'web') {
        await this.deleteFolderWeb(path)
      } else {
        await this.deleteFolderNative(path)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(FILE_SYSTEM_ERRORS.OPERATION_FAILED, 'Failed to delete folder', path, error as Error)
    }
  }

  /**
   * Delete folder on web platform
   */
  private async deleteFolderWeb(path: string): Promise<void> {
    // Remove folder and all its children from web storage
    const keysToDelete = Array.from(this.webStorage.keys()).filter(key => key === path || key.startsWith(path + '/'))

    keysToDelete.forEach(key => this.webStorage.delete(key))
    await this.saveWebStorage()
  }

  /**
   * Delete folder on native platform
   */
  private async deleteFolderNative(path: string): Promise<void> {
    await FileSystem.deleteAsync(path)
  }

  /**
   * Check if file or folder exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return this.webStorage.has(path)
      } else {
        const info = await FileSystem.getInfoAsync(path)
        return info.exists
      }
    } catch (error) {
      return false
    }
  }

  /**
   * Generate unique ID for items
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save web storage to localStorage
   */
  private async saveWebStorage(): Promise<void> {
    if (Platform.OS === 'web') {
      const data = Object.fromEntries(this.webStorage.entries())
      localStorage.setItem('muzimemo_filesystem', JSON.stringify(data))
    }
  }

  /**
   * Rename a folder
   */
  async renameFolder(options: RenameOptions): Promise<FolderItem> {
    const { oldPath, newName, validateName = true } = options

    if (validateName) {
      const validation = validateFileName(newName)
      if (!validation.isValid) {
        throw this.createError(FILE_SYSTEM_ERRORS.INVALID_NAME, validation.error || 'Invalid folder name', oldPath)
      }
    }

    const sanitizedName = sanitizeFileName(newName)
    const parentPath = getParentDirectory(oldPath)
    const newPath = joinPath(parentPath, sanitizedName)

    try {
      if (!(await this.fileExists(oldPath))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_NOT_FOUND, 'Folder not found', oldPath)
      }

      if (await this.fileExists(newPath)) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_EXISTS, `Folder "${sanitizedName}" already exists`, newPath)
      }

      if (Platform.OS === 'web') {
        return await this.renameFolderWeb(oldPath, newPath, sanitizedName)
      } else {
        return await this.renameFolderNative(oldPath, newPath, sanitizedName)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(
        FILE_SYSTEM_ERRORS.OPERATION_FAILED,
        `Failed to rename folder to "${sanitizedName}"`,
        oldPath,
        error as Error
      )
    }
  }

  /**
   * Rename folder on web platform
   */
  private async renameFolderWeb(oldPath: string, newPath: string, newName: string): Promise<FolderItem> {
    const folder = this.webStorage.get(oldPath) as FolderItem
    if (!folder) {
      throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_NOT_FOUND, 'Folder not found', oldPath)
    }

    // Update folder
    const updatedFolder: FolderItem = {
      ...folder,
      name: newName,
      path: newPath,
      modifiedAt: new Date(),
    }

    // Remove old entry and add new one
    this.webStorage.delete(oldPath)
    this.webStorage.set(newPath, updatedFolder)

    // Update all children paths
    const keysToUpdate = Array.from(this.webStorage.keys()).filter(key => key.startsWith(oldPath + '/'))

    keysToUpdate.forEach(key => {
      const item = this.webStorage.get(key)
      if (item) {
        const newKey = key.replace(oldPath, newPath)
        const updatedItem = { ...item, path: newKey, parentPath: newPath }
        this.webStorage.delete(key)
        this.webStorage.set(newKey, updatedItem)
      }
    })

    await this.saveWebStorage()
    return updatedFolder
  }

  /**
   * Rename folder on native platform
   */
  private async renameFolderNative(oldPath: string, newPath: string, newName: string): Promise<FolderItem> {
    await FileSystem.moveAsync({ from: oldPath, to: newPath })

    return {
      id: this.generateId(),
      name: newName,
      path: newPath,
      type: 'folder',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parentPath: getParentDirectory(newPath),
      children: [],
      itemCount: 0,
    }
  }

  /**
   * Move a folder from source to destination
   */
  async moveFolder(options: MoveFolderOptions): Promise<FolderItem> {
    const { sourcePath, destinationPath, overwrite = false } = options

    try {
      if (!(await this.fileExists(sourcePath))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_NOT_FOUND, 'Source folder not found', sourcePath)
      }

      // Prevent moving folder to itself or its subdirectories
      if (destinationPath === sourcePath || destinationPath.startsWith(sourcePath + '/')) {
        throw this.createError(
          FILE_SYSTEM_ERRORS.OPERATION_FAILED,
          'Cannot move folder to its current location or into itself',
          sourcePath
        )
      }

      const folderName = getFileName(sourcePath)
      const currentParentPath = getParentDirectory(sourcePath)
      const finalDestinationPath = joinPath(destinationPath, folderName)

      // Prevent moving folder to its current parent (no-op)
      if (destinationPath === currentParentPath) {
        throw this.createError(
          FILE_SYSTEM_ERRORS.OPERATION_FAILED,
          'Cannot move folder to its current location',
          sourcePath
        )
      }

      if (!overwrite && (await this.fileExists(finalDestinationPath))) {
        throw this.createError(
          FILE_SYSTEM_ERRORS.FOLDER_EXISTS,
          'A folder by this name already exists',
          finalDestinationPath
        )
      }

      if (Platform.OS === 'web') {
        return await this.moveFolderWeb(sourcePath, finalDestinationPath, folderName)
      } else {
        return await this.moveFolderNative(sourcePath, finalDestinationPath, folderName)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(FILE_SYSTEM_ERRORS.OPERATION_FAILED, 'Failed to move folder', sourcePath, error as Error)
    }
  }

  /**
   * Move folder on web platform
   */
  private async moveFolderWeb(sourcePath: string, destinationPath: string, folderName: string): Promise<FolderItem> {
    const folder = this.webStorage.get(sourcePath) as FolderItem
    if (!folder) {
      throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_NOT_FOUND, 'Folder not found', sourcePath)
    }

    // Update folder
    const updatedFolder: FolderItem = {
      ...folder,
      name: folderName,
      path: destinationPath,
      parentPath: getParentDirectory(destinationPath),
      modifiedAt: new Date(),
    }

    // Remove old entry and add new one
    this.webStorage.delete(sourcePath)
    this.webStorage.set(destinationPath, updatedFolder)

    // Update all children paths
    const keysToUpdate = Array.from(this.webStorage.keys()).filter(key => key.startsWith(sourcePath + '/'))

    keysToUpdate.forEach(key => {
      const item = this.webStorage.get(key)
      if (item) {
        const newKey = key.replace(sourcePath, destinationPath)
        const updatedItem = {
          ...item,
          path: newKey,
          parentPath: item.type === 'folder' ? getParentDirectory(newKey) : destinationPath,
        }
        this.webStorage.delete(key)
        this.webStorage.set(newKey, updatedItem)
      }
    })

    await this.saveWebStorage()
    return updatedFolder
  }

  /**
   * Move folder on native platform
   */
  private async moveFolderNative(sourcePath: string, destinationPath: string, folderName: string): Promise<FolderItem> {
    await FileSystem.moveAsync({ from: sourcePath, to: destinationPath })

    return {
      id: this.generateId(),
      name: folderName,
      path: destinationPath,
      type: 'folder',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parentPath: getParentDirectory(destinationPath),
      children: [],
      itemCount: 0,
    }
  }

  /**
   * Move a file from source to destination
   */
  async moveFile(options: MoveFileOptions): Promise<FileItem> {
    const { sourcePath, destinationPath, overwrite = false } = options

    try {
      if (!(await this.fileExists(sourcePath))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FILE_NOT_FOUND, 'Source file not found', sourcePath)
      }

      if (!overwrite && (await this.fileExists(destinationPath))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_EXISTS, 'Destination file already exists', destinationPath)
      }

      if (Platform.OS === 'web') {
        return await this.moveFileWeb(sourcePath, destinationPath)
      } else {
        return await this.moveFileNative(sourcePath, destinationPath)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(FILE_SYSTEM_ERRORS.OPERATION_FAILED, 'Failed to move file', sourcePath, error as Error)
    }
  }

  /**
   * Move file on web platform
   */
  private async moveFileWeb(sourcePath: string, destinationPath: string): Promise<FileItem> {
    const file = this.webStorage.get(sourcePath) as FileItem
    if (!file) {
      throw this.createError(FILE_SYSTEM_ERRORS.FILE_NOT_FOUND, 'File not found', sourcePath)
    }

    const updatedFile: FileItem = {
      ...file,
      path: destinationPath,
      parentPath: getParentDirectory(destinationPath),
      modifiedAt: new Date(),
    }

    this.webStorage.delete(sourcePath)
    this.webStorage.set(destinationPath, updatedFile)
    await this.saveWebStorage()

    return updatedFile
  }

  /**
   * Move file on native platform
   */
  private async moveFileNative(sourcePath: string, destinationPath: string): Promise<FileItem> {
    await FileSystem.moveAsync({ from: sourcePath, to: destinationPath })

    const fileName = getFileName(destinationPath)
    return {
      id: this.generateId(),
      name: fileName,
      path: destinationPath,
      type: 'file',
      extension: fileName.split('.').pop() || '',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parentPath: getParentDirectory(destinationPath),
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    try {
      if (!(await this.fileExists(path))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FILE_NOT_FOUND, 'File not found', path)
      }

      if (Platform.OS === 'web') {
        this.webStorage.delete(path)
        await this.saveWebStorage()
      } else {
        await FileSystem.deleteAsync(path)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(FILE_SYSTEM_ERRORS.OPERATION_FAILED, 'Failed to delete file', path, error as Error)
    }
  }

  /**
   * Rename a file
   */
  async renameFile(options: RenameOptions): Promise<FileItem> {
    const { oldPath, newName, validateName = true } = options

    if (validateName) {
      const validation = validateFileName(newName)
      if (!validation.isValid) {
        throw this.createError(FILE_SYSTEM_ERRORS.INVALID_NAME, validation.error || 'Invalid file name', oldPath)
      }
    }

    const sanitizedName = sanitizeFileName(newName)
    const parentPath = getParentDirectory(oldPath)
    const newPath = joinPath(parentPath, sanitizedName)

    try {
      if (!(await this.fileExists(oldPath))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FILE_NOT_FOUND, 'File not found', oldPath)
      }

      if (await this.fileExists(newPath)) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_EXISTS, `File "${sanitizedName}" already exists`, newPath)
      }

      if (Platform.OS === 'web') {
        return await this.renameFileWeb(oldPath, newPath, sanitizedName)
      } else {
        return await this.renameFileNative(oldPath, newPath, sanitizedName)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(
        FILE_SYSTEM_ERRORS.OPERATION_FAILED,
        `Failed to rename file to "${sanitizedName}"`,
        oldPath,
        error as Error
      )
    }
  }

  /**
   * Rename file on web platform
   */
  private async renameFileWeb(oldPath: string, newPath: string, newName: string): Promise<FileItem> {
    const file = this.webStorage.get(oldPath) as FileItem
    if (!file) {
      throw this.createError(FILE_SYSTEM_ERRORS.FILE_NOT_FOUND, 'File not found', oldPath)
    }

    const updatedFile: FileItem = {
      ...file,
      name: newName,
      path: newPath,
      modifiedAt: new Date(),
    }

    this.webStorage.delete(oldPath)
    this.webStorage.set(newPath, updatedFile)
    await this.saveWebStorage()

    return updatedFile
  }

  /**
   * Rename file on native platform
   */
  private async renameFileNative(oldPath: string, newPath: string, newName: string): Promise<FileItem> {
    await FileSystem.moveAsync({ from: oldPath, to: newPath })

    return {
      id: this.generateId(),
      name: newName,
      path: newPath,
      type: 'file',
      extension: newName.split('.').pop() || '',
      createdAt: new Date(),
      modifiedAt: new Date(),
      parentPath: getParentDirectory(newPath),
    }
  }

  /**
   * Get folder contents
   */
  async getFolderContents(folderPath: string): Promise<FileSystemItem[]> {
    try {
      if (!(await this.fileExists(folderPath))) {
        throw this.createError(FILE_SYSTEM_ERRORS.FOLDER_NOT_FOUND, 'Folder not found', folderPath)
      }

      if (Platform.OS === 'web') {
        return await this.getFolderContentsWeb(folderPath)
      } else {
        return await this.getFolderContentsNative(folderPath)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(
        FILE_SYSTEM_ERRORS.OPERATION_FAILED,
        'Failed to get folder contents',
        folderPath,
        error as Error
      )
    }
  }

  /**
   * Get folder contents on web platform
   */
  private async getFolderContentsWeb(folderPath: string): Promise<FileSystemItem[]> {
    const items: FileSystemItem[] = []
    const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/'

    for (const [path, item] of this.webStorage.entries()) {
      if (path.startsWith(normalizedPath)) {
        const relativePath = path.substring(normalizedPath.length)
        // Only include direct children (no nested paths)
        if (relativePath && !relativePath.includes('/')) {
          items.push(item)
        }
      }
    }

    return items.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Get folder contents on native platform
   */
  private async getFolderContentsNative(folderPath: string): Promise<FileSystemItem[]> {
    const items: FileSystemItem[] = []
    const dirContents = await FileSystem.readDirectoryAsync(folderPath)

    for (const itemName of dirContents) {
      const itemPath = joinPath(folderPath, itemName)
      const info = await FileSystem.getInfoAsync(itemPath)

      if (info.exists) {
        const item: FileSystemItem = {
          id: this.generateId(),
          name: itemName,
          path: itemPath,
          type: info.isDirectory ? 'folder' : 'file',
          size: info.size,
          createdAt: new Date(info.modificationTime || Date.now()),
          modifiedAt: new Date(info.modificationTime || Date.now()),
          parentPath: folderPath,
        }

        if (item.type === 'file') {
          ;(item as FileItem).extension = getFileName(itemName).split('.').pop() || ''
        } else {
          ;(item as FolderItem).children = []
          ;(item as FolderItem).itemCount = 0
        }

        items.push(item)
      }
    }

    return items.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Get file system statistics
   */
  async getStats(path?: string): Promise<FileSystemStats> {
    const targetPath = path || getRecordingsDirectory()

    try {
      if (Platform.OS === 'web') {
        return await this.getStatsWeb(targetPath)
      } else {
        return await this.getStatsNative(targetPath)
      }
    } catch (error) {
      throw this.createError(
        FILE_SYSTEM_ERRORS.OPERATION_FAILED,
        'Failed to get file system statistics',
        targetPath,
        error as Error
      )
    }
  }

  /**
   * Get stats on web platform
   */
  private async getStatsWeb(path: string): Promise<FileSystemStats> {
    let totalFiles = 0
    let totalFolders = 0
    let totalSize = 0
    let lastModified = new Date(0)

    for (const [itemPath, item] of this.webStorage.entries()) {
      if (itemPath.startsWith(path)) {
        if (item.type === 'file') {
          totalFiles++
          totalSize += item.size || 0
        } else {
          totalFolders++
        }

        if (item.modifiedAt > lastModified) {
          lastModified = item.modifiedAt
        }
      }
    }

    return {
      totalFiles,
      totalFolders,
      totalSize,
      lastModified,
    }
  }

  /**
   * Get stats on native platform
   */
  private async getStatsNative(path: string): Promise<FileSystemStats> {
    let totalFiles = 0
    let totalFolders = 0
    let totalSize = 0
    let lastModified = new Date(0)

    const processDirectory = async (dirPath: string) => {
      try {
        const contents = await FileSystem.readDirectoryAsync(dirPath)

        for (const itemName of contents) {
          const itemPath = joinPath(dirPath, itemName)
          const info = await FileSystem.getInfoAsync(itemPath)

          if (info.exists) {
            const modTime = new Date(info.modificationTime || Date.now())
            if (modTime > lastModified) {
              lastModified = modTime
            }

            if (info.isDirectory) {
              totalFolders++
              await processDirectory(itemPath) // Recursive
            } else {
              totalFiles++
              totalSize += info.size || 0
            }
          }
        }
      } catch (error) {
        // Ignore permission errors for individual directories
        console.warn(`Failed to process directory ${dirPath}:`, error)
      }
    }

    await processDirectory(path)

    return {
      totalFiles,
      totalFolders,
      totalSize,
      lastModified,
    }
  }

  /**
   * Create a FileSystemError
   */
  private createError(
    code: FileSystemErrorCode,
    message: string,
    path?: string,
    originalError?: Error
  ): FileSystemError {
    const error = Object.assign(new Error(message), {
      code,
      path,
      originalError,
    }) as FileSystemError
    return error
  }
}

// Export singleton instance
export const fileSystemService = FileSystemService.getInstance()
