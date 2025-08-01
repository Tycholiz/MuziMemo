import React, { useRef, useEffect, ReactNode } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { useDragDrop } from '../contexts/DragDropContext'
import { theme } from '../utils/theme'

export type DropZoneWrapperProps = {
  children: ReactNode
  dropTargetId: string
  disabled?: boolean
  onDragEnter?: () => void
  onDragLeave?: () => void
}

export function DropZoneWrapper({
  children,
  dropTargetId,
  disabled = false,
  onDragEnter,
  onDragLeave,
}: DropZoneWrapperProps) {
  const dragDrop = useDragDrop()
  const borderOpacity = useRef(new Animated.Value(0)).current
  const backgroundColor = useRef(new Animated.Value(0)).current
  const viewRef = useRef<View>(null)
  const isCurrentDropTarget = dragDrop.currentDropTarget === dropTargetId
  const isValidDropTarget = dragDrop.validDropTargets.includes(dropTargetId)

  // Check if drag position is over this drop zone
  useEffect(() => {
    if (!dragDrop.isDragging || !dragDrop.dragPosition || disabled || !isValidDropTarget) {
      return
    }

    if (viewRef.current) {
      viewRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        const { x: dragX, y: dragY } = dragDrop.dragPosition!
        
        const isOver = 
          dragX >= pageX &&
          dragX <= pageX + width &&
          dragY >= pageY &&
          dragY <= pageY + height

        if (isOver && !isCurrentDropTarget) {
          // Drag entered
          dragDrop.setCurrentDropTarget(dropTargetId)
          onDragEnter?.()
        } else if (!isOver && isCurrentDropTarget) {
          // Drag left
          dragDrop.setCurrentDropTarget(null)
          onDragLeave?.()
        }
      })
    }
  }, [
    dragDrop.isDragging,
    dragDrop.dragPosition,
    dropTargetId,
    isCurrentDropTarget,
    isValidDropTarget,
    disabled,
    onDragEnter,
    onDragLeave,
  ])

  // Animate visual feedback based on drag state
  useEffect(() => {
    if (!dragDrop.isDragging || disabled) {
      // Reset to normal state
      Animated.parallel([
        Animated.timing(borderOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundColor, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start()
      return
    }

    if (isCurrentDropTarget && isValidDropTarget) {
      // Active drop target - highlight
      Animated.parallel([
        Animated.timing(borderOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundColor, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start()
    } else if (isValidDropTarget) {
      // Valid drop target - subtle highlight
      Animated.parallel([
        Animated.timing(borderOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundColor, {
          toValue: 0.05,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start()
    } else {
      // Invalid drop target - no highlight
      Animated.parallel([
        Animated.timing(borderOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundColor, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start()
    }
  }, [
    dragDrop.isDragging,
    isCurrentDropTarget,
    isValidDropTarget,
    disabled,
    borderOpacity,
    backgroundColor,
  ])

  const animatedBorderColor = borderOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', theme.colors.primary],
  })

  const animatedBackgroundColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', theme.colors.primary],
  })

  const animatedStyle = {
    borderColor: animatedBorderColor,
    backgroundColor: animatedBackgroundColor,
    borderWidth: dragDrop.isDragging && isValidDropTarget ? 2 : 0,
  }

  return (
    <Animated.View
      ref={viewRef}
      style={[styles.container, animatedStyle]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
  },
})
