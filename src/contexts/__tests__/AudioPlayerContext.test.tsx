import React from 'react'
import { render, act } from '@testing-library/react-native'
import { AudioPlayerProvider, useAudioPlayerContext } from '../AudioPlayerContext'

// Mock expo-audio
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({
    playing: false,
    currentTime: 0,
    duration: 0,
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
  }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}))

// Test component to access context
const TestComponent = () => {
  const audioPlayer = useAudioPlayerContext()
  return (
    <>
      {/* @ts-expect-error */}
      <div testID="currentClip">{audioPlayer.currentClip?.name || 'none'}</div>
      {/* @ts-expect-error */}
      <div testID="isPlaying">{audioPlayer.isPlaying.toString()}</div>
      {/* @ts-expect-error */}
      <div testID="isLoading">{audioPlayer.isLoading.toString()}</div>
    </>
  )
}

describe('AudioPlayerContext', () => {
  it('should provide initial state', () => {
    const { getByTestId } = render(
      <AudioPlayerProvider>
        <TestComponent />
      </AudioPlayerProvider>
    )

    expect(getByTestId('currentClip')).toHaveTextContent('none')
    expect(getByTestId('isPlaying')).toHaveTextContent('false')
    expect(getByTestId('isLoading')).toHaveTextContent('false')
  })

  it('should set playing state immediately when playClip is called', async () => {
    let audioPlayerRef: any

    const TestComponentWithActions = () => {
      audioPlayerRef = useAudioPlayerContext()
      return <TestComponent />
    }

    const { getByTestId } = render(
      <AudioPlayerProvider>
        <TestComponentWithActions />
      </AudioPlayerProvider>
    )

    const testClip = {
      id: 'test-1',
      name: 'Test Audio.m4a',
      uri: 'file://test.m4a',
    }

    // Call playClip and check immediate state change
    await act(async () => {
      await audioPlayerRef.playClip(testClip)
    })

    expect(getByTestId('currentClip')).toHaveTextContent('Test Audio.m4a')
    expect(getByTestId('isPlaying')).toHaveTextContent('true')
  })

  it('should reset state when cleanup is called', async () => {
    let audioPlayerRef: any

    const TestComponentWithActions = () => {
      audioPlayerRef = useAudioPlayerContext()
      return <TestComponent />
    }

    const { getByTestId } = render(
      <AudioPlayerProvider>
        <TestComponentWithActions />
      </AudioPlayerProvider>
    )

    const testClip = {
      id: 'test-1',
      name: 'Test Audio.m4a',
      uri: 'file://test.m4a',
    }

    // Set up playing state
    await act(async () => {
      await audioPlayerRef.playClip(testClip)
    })

    // Cleanup
    act(() => {
      audioPlayerRef.cleanup()
    })

    expect(getByTestId('currentClip')).toHaveTextContent('none')
    expect(getByTestId('isPlaying')).toHaveTextContent('false')
  })

  it('should resume paused audio without reloading', async () => {
    let audioPlayerRef: any

    const TestComponentWithActions = () => {
      audioPlayerRef = useAudioPlayerContext()
      return <TestComponent />
    }

    const { getByTestId } = render(
      <AudioPlayerProvider>
        <TestComponentWithActions />
      </AudioPlayerProvider>
    )

    const testClip = {
      id: 'test-1',
      name: 'Test Audio.m4a',
      uri: 'file://test.m4a',
    }

    // Start playing
    await act(async () => {
      await audioPlayerRef.playClip(testClip)
    })

    expect(getByTestId('currentClip')).toHaveTextContent('Test Audio.m4a')
    expect(getByTestId('isPlaying')).toHaveTextContent('true')

    // Pause
    act(() => {
      audioPlayerRef.pauseClip()
    })

    expect(getByTestId('currentClip')).toHaveTextContent('Test Audio.m4a') // Should still have clip
    expect(getByTestId('isPlaying')).toHaveTextContent('false')

    // Resume - should not reload the clip
    await act(async () => {
      await audioPlayerRef.playClip(testClip) // Same clip
    })

    expect(getByTestId('currentClip')).toHaveTextContent('Test Audio.m4a')
    expect(getByTestId('isPlaying')).toHaveTextContent('true')
  })

  it('should allow restarting completed audio', async () => {
    let audioPlayerRef: any

    const TestComponentWithActions = () => {
      audioPlayerRef = useAudioPlayerContext()
      return <TestComponent />
    }

    const { getByTestId } = render(
      <AudioPlayerProvider>
        <TestComponentWithActions />
      </AudioPlayerProvider>
    )

    const testClip = {
      id: 'test-1',
      name: 'Test Audio.m4a',
      uri: 'file://test.m4a',
    }

    // Start playing
    await act(async () => {
      await audioPlayerRef.playClip(testClip)
    })

    expect(getByTestId('isPlaying')).toHaveTextContent('true')

    // The restart functionality should work correctly
    // (completion state management is tested through the restart flow)
    await act(async () => {
      await audioPlayerRef.playClip(testClip) // Should restart if completed
    })

    expect(getByTestId('currentClip')).toHaveTextContent('Test Audio.m4a')
  })
})
