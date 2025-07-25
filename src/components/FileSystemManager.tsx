import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { Alert } from 'react-native'

import { TextInputDialogModal, ConfirmationDialogModal, FileNavigatorModal } from '@components/index'
import { fileSystemService } from '@services/FileSystemService'
import { getRecordingsDirectory, joinPath } from '@utils/pathUtils'

export type FolderCardData = {
  id: string
  name: string
  path: string
  itemCount: number
}

export type ClipData = {
  id: string
  name: string
  path: string
  folder: string
  duration: string
  date: string
}

export type FileSystemManagerProps = {
  currentPath: string[]
  onDataChange: (folders: FolderCardData[], clips: ClipData[]) => void
  onLoadingChange: (loading: boolean) => void
}

export type FileSystemManagerRef = {
  folderHandlers: {
    onNew: () => void
    onRename: (folder: FolderCardData) => void
    onDelete: (folder: FolderCardData) => void
    onMove: (folder: FolderCardData) => void
  }
  fileHandlers: {
    onRename: (file: ClipData) => void
    onDelete: (file: ClipData) => void
    onMove: (file: ClipData) => void
  }
}

/**
 * FileSystemManager Component
 * Handles all file system operations, state management, and dialogs
 * Separates business logic from UI presentation
 */
export const FileSystemManager = forwardRef<FileSystemManagerRef, FileSystemManagerProps>(
  ({ currentPath, onDataChange, onLoadingChange }, ref) => {
    // Dialog states
    const [createFolderVisible, setCreateFolderVisible] = useState(false)
    const [renameFolderVisible, setRenameFolderVisible] = useState(false)
    const [deleteFolderVisible, setDeleteFolderVisible] = useState(false)
    const [moveFolderVisible, setMoveFolderVisible] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState<FolderCardData | null>(null)

    // File operation states
    const [renameFileVisible, setRenameFileVisible] = useState(false)
    const [deleteFileVisible, setDeleteFileVisible] = useState(false)
    const [moveFileVisible, setMoveFileVisible] = useState(false)
    const [selectedFile, setSelectedFile] = useState<ClipData | null>(null)

    useEffect(() => {
      loadCurrentFolderData()
    }, [currentPath])

    const getCurrentFolderPath = (): string => {
      if (currentPath.length === 0) {
        return getRecordingsDirectory()
      }
      return joinPath(getRecordingsDirectory(), ...currentPath)
    }

    const getCurrentDisplayPath = (): string => {
      if (currentPath.length === 0) {
        return '/'
      }
      return '/' + currentPath.join('/')
    }

    const loadCurrentFolderData = async () => {
      onLoadingChange(true)
      try {
        await fileSystemService.initialize()
        const folderPath = getCurrentFolderPath()
        const contents = await fileSystemService.getFolderContents(folderPath)

        // Separate folders and files
        const folderItems: FolderCardData[] = []
        const fileItems: ClipData[] = []

        for (const item of contents) {
          if (item.type === 'folder') {
            // Count items in folder
            try {
              const folderContents = await fileSystemService.getFolderContents(item.path)
              const itemCount = folderContents.filter(subItem => subItem.type === 'file').length

              folderItems.push({
                id: item.id,
                name: item.name,
                path: item.path,
                itemCount,
              })
            } catch {
              folderItems.push({
                id: item.id,
                name: item.name,
                path: item.path,
                itemCount: 0,
              })
            }
          } else if (item.type === 'file') {
            // Convert file to clip data (simplified for now)
            fileItems.push({
              id: item.id,
              name: item.name,
              path: item.path,
              folder: currentPath[currentPath.length - 1] || 'Root',
              duration: '0:00', // TODO: Get actual duration
              date: item.modifiedAt.toLocaleDateString(),
            })
          }
        }

        onDataChange(folderItems, fileItems)
      } catch (error) {
        console.error('Failed to load folder contents:', error)
        Alert.alert('Error', 'Failed to load folder contents')
      } finally {
        onLoadingChange(false)
      }
    }

    // Folder operation handlers
    const handleNewFolder = () => {
      setCreateFolderVisible(true)
    }

    const handleCreateFolder = async (folderName: string) => {
      try {
        const parentPath = getCurrentFolderPath()
        await fileSystemService.createFolder({
          name: folderName,
          parentPath,
        })
        setCreateFolderVisible(false)
        loadCurrentFolderData() // Refresh the list
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to create folder')
      }
    }

    const handleRenameFolder = (folder: FolderCardData) => {
      setSelectedFolder(folder)
      setRenameFolderVisible(true)
    }

    const handleConfirmRename = async (newName: string) => {
      if (!selectedFolder) return

      try {
        await fileSystemService.renameFolder({
          oldPath: selectedFolder.path,
          newName,
        })
        setRenameFolderVisible(false)
        setSelectedFolder(null)
        loadCurrentFolderData() // Refresh the list
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to rename folder')
      }
    }

    const handleDeleteFolder = (folder: FolderCardData) => {
      setSelectedFolder(folder)
      setDeleteFolderVisible(true)
    }

    const handleConfirmDelete = async () => {
      if (!selectedFolder) return

      try {
        await fileSystemService.deleteFolder(selectedFolder.path)
        setDeleteFolderVisible(false)
        setSelectedFolder(null)
        loadCurrentFolderData() // Refresh the list
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to delete folder')
      }
    }

    const handleMoveFolder = (folder: FolderCardData) => {
      setSelectedFolder(folder)
      setMoveFolderVisible(true)
    }

    const handleConfirmMove = async (destinationPath: string) => {
      if (!selectedFolder) return

      try {
        await fileSystemService.moveFolder({
          sourcePath: selectedFolder.path,
          destinationPath,
        })
        setMoveFolderVisible(false)
        setSelectedFolder(null)
        loadCurrentFolderData() // Refresh the list
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to move folder')
      }
    }

    // File operation handlers
    const handleRenameFile = (file: ClipData) => {
      setSelectedFile(file)
      setRenameFileVisible(true)
    }

    const handleConfirmRenameFile = async (newName: string) => {
      if (!selectedFile) return

      try {
        await fileSystemService.renameFile({
          oldPath: selectedFile.path,
          newName,
        })
        setRenameFileVisible(false)
        setSelectedFile(null)
        loadCurrentFolderData() // Refresh the list
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to rename file')
      }
    }

    const handleDeleteFile = (file: ClipData) => {
      setSelectedFile(file)
      setDeleteFileVisible(true)
    }

    const handleConfirmDeleteFile = async () => {
      if (!selectedFile) return

      try {
        await fileSystemService.deleteFile(selectedFile.path)
        setDeleteFileVisible(false)
        setSelectedFile(null)
        loadCurrentFolderData() // Refresh the list
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to delete file')
      }
    }

    const handleMoveFile = (file: ClipData) => {
      setSelectedFile(file)
      setMoveFileVisible(true)
    }

    const handleConfirmMoveFile = async (destinationPath: string) => {
      if (!selectedFile) return

      try {
        const fileName = selectedFile.name
        const destinationFilePath = joinPath(destinationPath, fileName)

        await fileSystemService.moveFile({
          sourcePath: selectedFile.path,
          destinationPath: destinationFilePath,
        })
        setMoveFileVisible(false)
        setSelectedFile(null)
        loadCurrentFolderData() // Refresh the list
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to move file')
      }
    }

    // Expose handlers for use by parent component
    const folderHandlers = {
      onNew: handleNewFolder,
      onRename: handleRenameFolder,
      onDelete: handleDeleteFolder,
      onMove: handleMoveFolder,
    }

    const fileHandlers = {
      onRename: handleRenameFile,
      onDelete: handleDeleteFile,
      onMove: handleMoveFile,
    }

    // Expose handlers via ref
    useImperativeHandle(ref, () => ({
      folderHandlers,
      fileHandlers,
    }))

    return (
      <>
        {/* Folder Operation Dialogs */}
        <TextInputDialogModal
          visible={createFolderVisible}
          title="Create Folder"
          message={`Create new folder in: ${getCurrentDisplayPath()}`}
          placeholder="Folder name"
          confirmText="Create"
          onConfirm={handleCreateFolder}
          onCancel={() => setCreateFolderVisible(false)}
        />

        <TextInputDialogModal
          visible={renameFolderVisible}
          title="Rename Folder"
          message="Enter new folder name:"
          placeholder="Folder name"
          initialValue={selectedFolder?.name || ''}
          confirmText="Rename"
          onConfirm={handleConfirmRename}
          onCancel={() => {
            setRenameFolderVisible(false)
            setSelectedFolder(null)
          }}
        />

        <ConfirmationDialogModal
          visible={deleteFolderVisible}
          title="Delete Folder"
          message={`Are you sure you want to delete "${selectedFolder?.name}"? This folder contains ${selectedFolder?.itemCount || 0} items and cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteFolderVisible(false)
            setSelectedFolder(null)
          }}
        />

        <FileNavigatorModal
          visible={moveFolderVisible}
          title="Move Folder"
          primaryButtonText="Move Here"
          primaryButtonIcon="folder-outline"
          onClose={() => {
            setMoveFolderVisible(false)
            setSelectedFolder(null)
          }}
          onSelectFolder={() => {}} // Not used in move mode
          onPrimaryAction={handleConfirmMove}
          currentPath={getRecordingsDirectory()}
          excludePath={selectedFolder?.path} // Prevent moving folder to itself
        />

        {/* File Operation Dialogs */}
        <TextInputDialogModal
          visible={renameFileVisible}
          title="Rename File"
          message="Enter new file name:"
          placeholder="File name"
          initialValue={selectedFile?.name || ''}
          confirmText="Rename"
          onConfirm={handleConfirmRenameFile}
          onCancel={() => {
            setRenameFileVisible(false)
            setSelectedFile(null)
          }}
        />

        <ConfirmationDialogModal
          visible={deleteFileVisible}
          title="Delete File"
          message={`Are you sure you want to delete "${selectedFile?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
          onConfirm={handleConfirmDeleteFile}
          onCancel={() => {
            setDeleteFileVisible(false)
            setSelectedFile(null)
          }}
        />

        <FileNavigatorModal
          visible={moveFileVisible}
          title="Move File"
          primaryButtonText="Move Here"
          primaryButtonIcon="document-outline"
          onClose={() => {
            setMoveFileVisible(false)
            setSelectedFile(null)
          }}
          onSelectFolder={() => {}} // Not used in move mode
          onPrimaryAction={handleConfirmMoveFile}
          currentPath={getRecordingsDirectory()}
        />
      </>
    )
  }
)

// Export handlers type for use by parent components
export type FileSystemHandlers = {
  folderHandlers: {
    onNew: () => void
    onRename: (folder: FolderCardData) => void
    onDelete: (folder: FolderCardData) => void
    onMove: (folder: FolderCardData) => void
  }
  fileHandlers: {
    onRename: (file: ClipData) => void
    onDelete: (file: ClipData) => void
    onMove: (file: ClipData) => void
  }
}

// Custom hook to use FileSystemManager
export function useFileSystemManager(currentPath: string[]) {
  const [folders, setFolders] = useState<FolderCardData[]>([])
  const [clips, setClips] = useState<ClipData[]>([])
  const [loading, setLoading] = useState(false)
  const managerRef = useRef<FileSystemManagerRef>(null)

  const handleDataChange = (newFolders: FolderCardData[], newClips: ClipData[]) => {
    setFolders(newFolders)
    setClips(newClips)
  }

  const handleLoadingChange = (newLoading: boolean) => {
    setLoading(newLoading)
  }

  return {
    folders,
    clips,
    loading,
    handlers: managerRef.current,
    FileSystemManagerComponent: (
      <FileSystemManager
        ref={managerRef}
        currentPath={currentPath}
        onDataChange={handleDataChange}
        onLoadingChange={handleLoadingChange}
      />
    ),
  }
}
