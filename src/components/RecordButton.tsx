import React from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type RecordButtonProps = {
  isRecording?: boolean
  isPaused?: boolean
  onPress?: () => void
  disabled?: boolean
  style?: any
  testID?: string
}

/**
 * RecordButton Component
 * Large circular record button with dynamic states for recording/paused
 */
export function RecordButton({
  isRecording = false,
  isPaused = false,
  onPress,
  disabled = false,
  style,
  testID,
}: RecordButtonProps) {
  // Determine the icon based on state
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (isPaused) {
      return 'play' // Resume icon when paused
    }
    if (isRecording) {
      return 'pause' // Pause icon when recording
    }
    return 'mic' // Microphone icon when idle
  }

  // Determine the button color based on state
  const getButtonStyle = () => {
    if (isPaused) return styles.recordButtonPaused
    if (isRecording) return styles.recordButtonRecording
    return null
  }

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.recordButton, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[styles.recordButtonInner, getButtonStyle()]}>
        <Ionicons name={getIconName()} size={32} color={theme.colors.white} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },

  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordButtonRecording: {
    backgroundColor: theme.colors.warning, // Orange color when recording
  },

  recordButtonPaused: {
    backgroundColor: theme.colors.secondary, // Different color when paused
  },

  disabled: {
    opacity: 0.5,
  },
})
