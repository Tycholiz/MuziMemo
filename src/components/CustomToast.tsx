import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message'

import { theme } from '@utils/theme'

/**
 * Custom toast component with navigation button support
 */
export function SuccessToastWithButton({ text1, text2, props }: any) {
  return (
    <View style={styles.successToastContainer}>
      <View style={styles.toastContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.text1}>{text1}</Text>
          {text2 && <Text style={styles.text2}>{text2}</Text>}
        </View>
        {props?.onPress && (
          <TouchableOpacity style={styles.actionButton} onPress={props.onPress} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>{props.buttonText || 'Go Here'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

/**
 * Toast configuration for the app
 */
export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={styles.baseToast}
      contentContainerStyle={styles.baseToastContent}
      text1Style={styles.baseText1}
      text2Style={styles.baseText2}
    />
  ),
  
  successWithButton: (props) => <SuccessToastWithButton {...props} />,
  
  error: (props) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.baseToastContent}
      text1Style={styles.baseText1}
      text2Style={styles.baseText2}
    />
  ),
}

const styles = StyleSheet.create({
  successToastContainer: {
    height: 80,
    width: '90%',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: '5%',
  },
  
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  
  textContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  
  text1: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  text2: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  
  actionButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  
  baseToast: {
    borderLeftColor: theme.colors.success,
    backgroundColor: theme.colors.surface.primary,
  },
  
  errorToast: {
    borderLeftColor: theme.colors.error,
    backgroundColor: theme.colors.surface.primary,
  },
  
  baseToastContent: {
    paddingHorizontal: theme.spacing.md,
  },
  
  baseText1: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  baseText2: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
})
