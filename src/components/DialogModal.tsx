import React, { useState, useEffect, useRef } from 'react'
import { Modal, View, Text, TextInput, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native'

import { Button } from './Button'
import { theme } from '@utils/theme'

export type TextInputDialogModalProps = {
  visible: boolean
  title: string
  message?: string
  placeholder?: string
  initialValue?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export type ConfirmationDialogModalProps = {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * TextInputDialogModal Component
 * A modal dialog with a text input field that automatically focuses when opened
 */
export function TextInputDialogModal({
  visible,
  title,
  message,
  placeholder = '',
  initialValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: TextInputDialogModalProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const inputRef = useRef<TextInput>(null)

  // Reset input value when dialog becomes visible
  useEffect(() => {
    if (visible) {
      setInputValue(initialValue)
      // Auto-focus the input with a small delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [visible, initialValue])

  const handleConfirm = () => {
    onConfirm(inputValue.trim())
    setInputValue('')
  }

  const handleCancel = () => {
    onCancel()
    setInputValue('')
  }

  const handleBackdropPress = () => {
    Keyboard.dismiss()
    handleCancel()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.dialogContainer}>
              <View style={styles.dialog}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {message && <Text style={styles.message}>{message}</Text>}
                </View>

                {/* Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.text.tertiary}
                    selectionColor={theme.colors.primary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                  />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <Button title={cancelText} variant="ghost" onPress={handleCancel} style={styles.cancelButton} />
                  <Button
                    title={confirmText}
                    variant="primary"
                    onPress={handleConfirm}
                    disabled={!inputValue.trim()}
                    style={styles.confirmButton}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

/**
 * ConfirmationDialogModal Component
 * A modal dialog for confirming actions with customizable button variants
 */
export function ConfirmationDialogModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmationDialogModalProps) {
  const handleBackdropPress = () => {
    onCancel()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.dialogContainer}>
              <View style={styles.dialog}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.message}>{message}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <Button title={cancelText} variant="ghost" onPress={onCancel} style={styles.cancelButton} />
                  <Button
                    title={confirmText}
                    variant={confirmVariant}
                    onPress={onConfirm}
                    style={styles.confirmButton}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dialogContainer: {
    width: '85%',
    maxWidth: 400,
  },

  dialog: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },

  header: {
    marginBottom: theme.spacing.lg,
  },

  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },

  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.base,
  },

  inputContainer: {
    marginBottom: theme.spacing.lg,
  },

  input: {
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 48,
  },

  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },

  cancelButton: {
    flex: 1,
  },

  confirmButton: {
    flex: 1,
  },
})
