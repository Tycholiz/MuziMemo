import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '@components/Layout'
import { MediaCard } from '@components/Card'
import {
  TextInputDialog,
  ConfirmationDialog,
  FolderContextMenu,
  FileContextMenu,
  FileNavigator,
} from '@components/index'
import { theme } from '@utils/theme'
import { fileSystemService } from '@services/FileSystemService'
import { getRecordingsDirectory, joinPath } from '@utils/pathUtils'

type FolderCardData = {
  id: string
  name: string
  path: string
  itemCount: number
}

type ClipData = {
  id: string
  name: string
  path: string
  folder: string
  duration: string
  date: string
}

/**
 * BrowseScreen Component
 * Main screen for browsing and managing recorded audio files
 */
export default function BrowseScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPath, setCurrentPath] = useState<string[]>([]) // Empty array means root
  const [folders, setFolders] = useState<FolderCardData[]>([])
  const [clips, setClips] = useState<ClipData[]>([])
  const [, setLoading] = useState(false)

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
    setLoading(true)
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
          } catch (error) {
            // If we can't read the folder, add it with 0 count
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

      setFolders(folderItems)
      setClips(fileItems)
    } catch (error) {
      console.error('Failed to load folder contents:', error)
      Alert.alert('Error', 'Failed to load folder contents')
    } finally {
      setLoading(false)
    }
  }

  const handleFolderPress = (folder: FolderCardData) => {
    // Navigate into the folder
    setCurrentPath([...currentPath, folder.name])
  }

  const handleClipPress = (clip: ClipData) => {
    Alert.alert('Play Clip', `Playing: ${clip.name}`)
  }

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

  const handleHomePress = () => {
    // Navigate to root
    setCurrentPath([])
  }

  const handleBreadcrumbPress = (index: number) => {
    // Navigate to specific level in breadcrumb
    if (index === 0) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, index))
    }
  }

  const renderFolderCard = (folder: FolderCardData) => (
    <View key={folder.id} style={styles.folderCard}>
      <TouchableOpacity style={styles.folderCardContent} onPress={() => handleFolderPress(folder)} activeOpacity={0.7}>
        <View style={styles.folderIconContainer}>
          <Ionicons name="folder" size={32} color="#FF6B6B" />
        </View>
        <Text style={styles.folderName}>{folder.name}</Text>
        <Text style={styles.folderItemCount}>{folder.itemCount} items</Text>
      </TouchableOpacity>

      <View style={styles.folderMenuContainer}>
        <FolderContextMenu
          onRename={() => handleRenameFolder(folder)}
          onMove={() => handleMoveFolder(folder)}
          onDelete={() => handleDeleteFolder(folder)}
        />
      </View>
    </View>
  )

  const renderClipItem = (clip: ClipData) => (
    <TouchableOpacity key={clip.id} style={styles.clipItem} onPress={() => handleClipPress(clip)} activeOpacity={0.7}>
      <View style={styles.clipInfo}>
        <Text style={styles.clipName}>{clip.name}</Text>
        <Text style={styles.clipDetails}>
          {clip.date} • {clip.duration}
        </Text>
      </View>
      <FileContextMenu
        onRename={() => handleRenameFile(clip)}
        onMove={() => handleMoveFile(clip)}
        onDelete={() => handleDeleteFile(clip)}
      />
    </TouchableOpacity>
  )

  return (
    <Screen backgroundColor={theme.colors.background.primary}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Browse</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons
                name={viewMode === 'grid' ? 'grid-outline' : 'list-outline'}
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="menu-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clips, folders..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Breadcrumb */}
        <View style={styles.breadcrumbContainer}>
          <TouchableOpacity style={styles.breadcrumbItem} onPress={handleHomePress}>
            <Ionicons name="home-outline" size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          {currentPath.length > 0 && (
            <>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              {currentPath.map((pathSegment, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity onPress={() => handleBreadcrumbPress(index + 1)}>
                    <Text style={styles.breadcrumbText}>{pathSegment}</Text>
                  </TouchableOpacity>
                  {index < currentPath.length - 1 && (
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* New Folder Button - always show at top */}
          <View style={styles.newFolderContainer}>
            <TouchableOpacity style={styles.newFolderButton} onPress={handleNewFolder}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newFolderButtonText}>New Folder</Text>
            </TouchableOpacity>
          </View>

          {/* Folders Grid - show folders at any level */}
          {folders.length > 0 && (
            <View style={styles.foldersContainer}>
              <View style={styles.foldersGrid}>{folders.map(renderFolderCard)}</View>
            </View>
          )}

          {/* Clips Section - show when there are clips */}
          {clips.length > 0 && (
            <View style={styles.clipsSection}>
              <Text style={styles.clipsTitle}>{clips.length} clips</Text>
              <View style={styles.clipsList}>{clips.map(renderClipItem)}</View>
            </View>
          )}

          {/* Empty state when folder has no content */}
          {folders.length === 0 && clips.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {currentPath.length === 0 ? 'No folders or clips yet' : 'This folder is empty'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Media Player - Fixed at bottom, full width */}
      <View style={styles.mediaPlayerContainer}>
        <MediaCard
          title="Guitar Riff Idea"
          artist="Song Ideas • 0:45"
          duration="0:45"
          onPlayPause={() => Alert.alert('Play/Pause')}
          onNext={() => Alert.alert('Next')}
          onPrevious={() => Alert.alert('Previous')}
          onMore={() => Alert.alert('More options')}
          isPlaying={false}
        />
      </View>

      {/* Dialogs */}
      <TextInputDialog
        visible={createFolderVisible}
        title="Create Folder"
        message={`Create new folder in: ${getCurrentDisplayPath()}`}
        placeholder="Folder name"
        confirmText="Create"
        onConfirm={handleCreateFolder}
        onCancel={() => setCreateFolderVisible(false)}
      />

      <TextInputDialog
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

      <ConfirmationDialog
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

      <FileNavigator
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
      <TextInputDialog
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

      <ConfirmationDialog
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

      <FileNavigator
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
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  breadcrumbItem: {
    padding: theme.spacing.xs,
  },
  breadcrumbText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  newFolderContainer: {
    marginBottom: theme.spacing.md,
  },
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E', // Green color for primary action
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  newFolderButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: '#FFFFFF', // White text on green background
    fontWeight: theme.typography.fontWeight.medium,
  },
  foldersContainer: {
    marginBottom: theme.spacing.md,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  folderCard: {
    width: '45%',
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    minHeight: 100,
    position: 'relative',
  },
  folderCardContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  folderMenuContainer: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  folderIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  folderName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  folderItemCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  clipsSection: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  clipsTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.md,
  },
  clipsList: {
    gap: theme.spacing.sm,
  },
  clipItem: {
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clipInfo: {
    flex: 1,
  },
  clipName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  clipDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  mediaPlayerContainer: {
    paddingHorizontal: 0,
    paddingBottom: theme.spacing.lg,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
})
