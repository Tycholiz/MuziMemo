import React, { useRef, ReactNode } from 'react'
import {
  PanResponder,
  Animated,
  StyleSheet,
  Dimensions,
  PanResponderGestureState,
  GestureResponderEvent,
} from 'react-native'
import { useDragDrop, DragItem } from '../contexts/DragDropContext'

// Get screen dimensions for potential future use
Dimensions.get('window')

export type DraggableWrapperProps = {
  children: ReactNode
  dragItem: DragItem
  disabled?: boolean
  longPressDuration?: number
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function DraggableWrapper({
  children,
  dragItem,
  disabled = false,
  longPressDuration = 500,
  onDragStart,
  onDragEnd,
}: DraggableWrapperProps) {
  const dragDrop = useDragDrop()
  const pan = useRef(new Animated.ValueXY()).current
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current
  const isDraggingRef = useRef(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isDraggingRef.current,
      onMoveShouldSetPanResponderCapture: () => isDraggingRef.current,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (disabled || dragDrop.isDragging) return

        // Start long press timer
        longPressTimerRef.current = setTimeout(() => {
          isDraggingRef.current = true
          
          // Get the touch position relative to screen
          const { pageX, pageY } = evt.nativeEvent
          
          // Start drag operation
          dragDrop.startDrag(dragItem, { x: pageX, y: pageY })
          
          // Animate to dragging state
          Animated.parallel([
            Animated.spring(scale, {
              toValue: 1.1,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 0.8,
              useNativeDriver: true,
            }),
          ]).start()

          onDragStart?.()
        }, longPressDuration)
      },

      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (!isDraggingRef.current) return

        // Update drag position
        const { pageX, pageY } = evt.nativeEvent
        dragDrop.updateDragPosition({ x: pageX, y: pageY })

        // Update animated position
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(evt, gestureState)
      },

      onPanResponderRelease: () => {
        // Clear long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }

        if (isDraggingRef.current) {
          // Handle drop
          if (dragDrop.currentDropTarget) {
            dragDrop.onDrop(dragDrop.currentDropTarget)
          } else {
            dragDrop.endDrag()
          }

          // Reset animations
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start()

          isDraggingRef.current = false
          onDragEnd?.()
        }
      },

      onPanResponderTerminate: () => {
        // Clear long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }

        if (isDraggingRef.current) {
          dragDrop.endDrag()

          // Reset animations
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start()

          isDraggingRef.current = false
          onDragEnd?.()
        }
      },
    })
  ).current

  const animatedStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { scale: scale },
    ],
    opacity: opacity,
    zIndex: isDraggingRef.current ? 1000 : 1,
  }

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    // No additional styling needed - wrapper should be transparent
  },
})
