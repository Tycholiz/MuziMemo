import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '../utils/theme'
import { Toggle } from './Toggle'
import { useSyncContext } from '../contexts/SyncContext'

export type SettingsModalProps = {
  visible: boolean
  onClose: () => void
}

/**
 * SettingsModal for app configuration options
 * Follows the same architectural patterns as FileNavigatorModal
 */
export const SettingsModal = React.memo(function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const syncContext = useSyncContext()

  const handleBackdropPress = () => {
    onClose()
  }

  const handleSyncToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await syncContext.enableSync()
      } else {
        await syncContext.disableSync()
      }
    } catch (error) {
      console.error('Failed to toggle sync:', error)
      Alert.alert('Sync Error', 'Failed to update sync settings. Please try again.', [{ text: 'OK' }])
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modal}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Cloud Synchronization Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="cloud-outline"
                      size={24}
                      color={theme.colors.text.secondary}
                      style={styles.sectionIcon}
                    />
                    <Text style={styles.sectionTitle}>iCloud Synchronization</Text>
                  </View>

                  <Toggle
                    value={syncContext.isSyncEnabled}
                    onValueChange={handleSyncToggle}
                    disabled={syncContext.isLoading}
                    label="Enable iCloud Sync"
                    description="Automatically sync your recordings to iCloud Drive"
                    testID="icloud-sync-toggle"
                  />

                  {/* Sync Status */}
                  {syncContext.isSyncEnabled && (
                    <View style={styles.syncStatus}>
                      <View style={styles.statusRow}>
                        <Ionicons
                          name={syncContext.networkState.isConnected ? 'wifi' : 'wifi-outline'}
                          size={16}
                          color={
                            syncContext.networkState.isConnected ? theme.colors.success : theme.colors.text.tertiary
                          }
                        />
                        <Text style={styles.statusText}>
                          {syncContext.networkState.isConnected ? 'Connected' : 'Offline'}
                        </Text>
                      </View>

                      {syncContext.syncQueue.length > 0 && (
                        <View style={styles.statusRow}>
                          <Ionicons name="cloud-upload-outline" size={16} color={theme.colors.text.tertiary} />
                          <Text style={styles.statusText}>
                            {
                              syncContext.syncQueue.filter(
                                item => item.status === 'pending' || item.status === 'syncing'
                              ).length
                            }{' '}
                            files pending
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Future sections can be added here */}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
})

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    display: 'flex',
    flexDirection: 'column',
    ...theme.shadows.lg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },

  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },

  closeButton: {
    padding: theme.spacing.xs,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  section: {
    marginBottom: theme.spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  sectionIcon: {
    marginRight: theme.spacing.sm,
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },

  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
  },

  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },

  syncStatus: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },

  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
})
