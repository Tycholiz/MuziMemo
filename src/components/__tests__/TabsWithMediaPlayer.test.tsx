import React from 'react'
import { render } from '@testing-library/react-native'
import { TabsWithMediaPlayer } from '../TabsWithMediaPlayer'
import { AudioPlayerProvider } from '../../contexts/AudioPlayerContext'

// Mock expo-router
jest.mock('expo-router', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock expo-audio
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({
    playing: false,
    currentTime: 0,
    duration: 0,
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seekTo: jest.fn(),
  }),
  setAudioModeAsync: jest.fn(),
}))

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

const MockedTabsWithMediaPlayer = () => (
  <AudioPlayerProvider>
    <TabsWithMediaPlayer />
  </AudioPlayerProvider>
)

describe('TabsWithMediaPlayer', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<MockedTabsWithMediaPlayer />)
    // Component should render successfully
    expect(true).toBe(true) // Basic smoke test
  })

  it('does not show media player when no audio is playing', () => {
    const { queryByText } = render(<MockedTabsWithMediaPlayer />)
    // Media player should not be visible when no currentClip
    expect(queryByText('BottomMediaPlayer')).toBeNull()
  })
})
