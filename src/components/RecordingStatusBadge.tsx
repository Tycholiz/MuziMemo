import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { theme } from '@utils/theme'
import { RecordingStatus } from '../customTypes/Recording'

export type RecordingStatusBadgeProps = {
  status: RecordingStatus
  isInitialized: boolean
  hasPermissions: boolean
  style?: any
}

/**
 * RecordingStatusBadge Component
 * Displays the current recording status with appropriate styling
 */
export function RecordingStatusBadge({ status, isInitialized, hasPermissions, style }: RecordingStatusBadgeProps) {
  const getStatusText = (): string => {
    if (!isInitialized) {
      return 'Initializing...'
    }

    if (!hasPermissions) {
      return 'Microphone Permission Required'
    }

    switch (status) {
      case 'recording':
        return 'Recording'
      case 'paused':
        return 'Paused'
      case 'stopped':
        return 'Ready to Record'
      case 'idle':
      default:
        return 'Ready to Record'
    }
  }

  const getBadgeStyle = () => {
    return status === 'paused' ? styles.statusBadgePaused : null
  }

  return (
    <View style={[styles.statusBadgeContainer, style]}>
      <View style={[styles.statusBadge, getBadgeStyle()]}>
        <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statusBadgeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    backgroundColor: theme.colors.surface.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  statusBadgePaused: {
    backgroundColor: theme.colors.secondary,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
})
