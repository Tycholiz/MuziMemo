// Export all components from this directory

// Core components
export { ErrorBoundary } from './ErrorBoundary'
export { SafeAreaWrapper } from './SafeAreaWrapper'

// Design system components
export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { Input } from './Input'
export type { InputProps } from './Input'

export { Card, FileCard, MediaCard } from './Card'
export type { CardProps, FileCardProps, CardVariant } from './Card'

export { Icon, IconButton, RecordButton } from './Icon'
export type { IconProps, IconSize, IconColor } from './Icon'

export { Screen, Container, Row, Column, Spacer } from './Layout'
export type { ScreenProps, ContainerProps } from './Layout'

export { Touchable, TouchableListItem, TouchableCard, TouchableFAB } from './Touchable'
export type { TouchableProps, TouchableVariant } from './Touchable'

export { Dropdown } from './Dropdown'
export type { DropdownProps, DropdownOption } from './Dropdown'

export { FolderSelector } from './FolderSelector'
export type { FolderSelectorProps, Folder } from './FolderSelector'

export { FileNavigatorModal } from './FileNavigatorModal'
export type { FileNavigatorModalProps, FileNavigatorFolder } from './FileNavigatorModal'

export { TextInputDialogModal, ConfirmationDialogModal } from './DialogModal'
export type { TextInputDialogModalProps, ConfirmationDialogModalProps } from './DialogModal'

export { FolderContextMenuModal } from './FolderContextMenuModal'
export type { FolderContextMenuModalProps } from './FolderContextMenuModal'

export { FileContextMenuModal } from './FileContextMenuModal'
export type { FileContextMenuModalProps } from './FileContextMenuModal'

export { Breadcrumbs } from './Breadcrumbs'
export type { BreadcrumbsProps } from './Breadcrumbs'

export { FileSystemManager, useFileSystemManager } from './FileSystemManager'
export type {
  FileSystemManagerProps,
  FileSystemManagerRef,
  FileSystemHandlers,
  FolderCardData,
  ClipData,
} from './FileSystemManager'
