import React, { useState, forwardRef } from 'react'
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { theme } from '@utils/theme'

export type InputProps = TextInputProps & {
  label?: string
  error?: string
  hint?: string
  leftIcon?: keyof typeof Ionicons.glyphMap
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightIconPress?: () => void
  containerStyle?: ViewStyle
  inputStyle?: TextStyle
  labelStyle?: TextStyle
  disabled?: boolean
  required?: boolean
}

/**
 * Base Input component with label, validation, and icon support
 * Follows the dark theme design with proper focus states
 */
export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      labelStyle,
      disabled = false,
      required = false,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    const containerStyles = [styles.container, containerStyle]
    
    const inputContainerStyles = [
      styles.inputContainer,
      isFocused && styles.inputContainerFocused,
      error && styles.inputContainerError,
      disabled && styles.inputContainerDisabled,
    ]

    const textInputStyles = [
      styles.input,
      leftIcon && styles.inputWithLeftIcon,
      rightIcon && styles.inputWithRightIcon,
      disabled && styles.inputDisabled,
      inputStyle,
    ]

    const labelStyles = [
      styles.label,
      required && styles.labelRequired,
      error && styles.labelError,
      labelStyle,
    ]

    return (
      <View style={containerStyles}>
        {label && (
          <Text style={labelStyles}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        
        <View style={inputContainerStyles}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={
                error
                  ? theme.colors.error
                  : isFocused
                  ? theme.colors.primary
                  : theme.colors.text.tertiary
              }
              style={styles.leftIcon}
            />
          )}
          
          <TextInput
            ref={ref}
            style={[textInputStyles, style]}
            placeholderTextColor={theme.colors.text.tertiary}
            selectionColor={theme.colors.primary}
            editable={!disabled}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIconContainer}
              disabled={!onRightIconPress}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={
                  error
                    ? theme.colors.error
                    : isFocused
                    ? theme.colors.primary
                    : theme.colors.text.tertiary
                }
              />
            </TouchableOpacity>
          )}
        </View>
        
        {(error || hint) && (
          <Text style={error ? styles.errorText : styles.hintText}>
            {error || hint}
          </Text>
        )}
      </View>
    )
  }
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  labelRequired: {
    color: theme.colors.text.primary,
  },
  
  labelError: {
    color: theme.colors.error,
  },
  
  required: {
    color: theme.colors.error,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  },
  
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  
  inputContainerDisabled: {
    backgroundColor: theme.colors.surface.secondary,
    opacity: 0.6,
  },
  
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.sm,
  },
  
  inputWithLeftIcon: {
    marginLeft: theme.spacing.sm,
  },
  
  inputWithRightIcon: {
    marginRight: theme.spacing.sm,
  },
  
  inputDisabled: {
    color: theme.colors.text.disabled,
  },
  
  leftIcon: {
    marginRight: 0,
  },
  
  rightIconContainer: {
    padding: theme.spacing.xs,
  },
  
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  
  hintText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
})
