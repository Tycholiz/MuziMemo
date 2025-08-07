import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AudioClipCard, AudioClipData } from '../AudioClipCard'

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}))

const mockAudioClip: AudioClipData = {
  id: 'test-audio-1',
  name: 'Test Recording.m4a',
  uri: 'file:///path/to/test-recording.m4a',
  size: 1024000,
  createdAt: new Date('2023-01-15T10:30:00Z'),
  duration: 120,
}

describe('AudioClipCard', () => {
  const defaultProps = {
    clip: mockAudioClip,
    isPlaying: false,
    onPlay: jest.fn(),
    onPause: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders audio clip information correctly', () => {
    const { getByText } = render(<AudioClipCard {...defaultProps} />)
    
    expect(getByText('Test Recording.m4a')).toBeTruthy()
  })

  it('calls onPlay when play button is pressed and not playing', () => {
    const onPlay = jest.fn()
    const { getByTestId } = render(
      <AudioClipCard {...defaultProps} onPlay={onPlay} />
    )
    
    // The play button is the main touchable area
    const playButton = getByTestId('audio-clip-card-content') || getByTestId('play-button')
    fireEvent.press(playButton)
    
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('calls onPause when play button is pressed and currently playing', () => {
    const onPause = jest.fn()
    const { getByTestId } = render(
      <AudioClipCard {...defaultProps} isPlaying={true} onPause={onPause} />
    )
    
    const playButton = getByTestId('audio-clip-card-content') || getByTestId('play-button')
    fireEvent.press(playButton)
    
    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('shows context menu when onShare is provided', () => {
    const onShare = jest.fn()
    const onRename = jest.fn()
    const onDelete = jest.fn()
    
    const { getByTestId } = render(
      <AudioClipCard 
        {...defaultProps} 
        onShare={onShare}
        onRename={onRename}
        onDelete={onDelete}
      />
    )
    
    // The ellipsis menu should be present when menu actions are provided
    const ellipsisButton = getByTestId('ellipsis-button')
    expect(ellipsisButton).toBeTruthy()
  })

  it('calls onShare when share option is selected from menu', () => {
    const onShare = jest.fn()
    const onRename = jest.fn()
    const onDelete = jest.fn()
    
    const { getByTestId, getByText } = render(
      <AudioClipCard 
        {...defaultProps} 
        onShare={onShare}
        onRename={onRename}
        onDelete={onDelete}
      />
    )
    
    // Open the context menu
    const ellipsisButton = getByTestId('ellipsis-button')
    fireEvent.press(ellipsisButton)
    
    // Find and press the Share option
    const shareOption = getByText('Share')
    fireEvent.press(shareOption)
    
    expect(onShare).toHaveBeenCalledTimes(1)
  })

  it('does not show context menu when no menu actions are provided', () => {
    const { queryByTestId } = render(<AudioClipCard {...defaultProps} />)
    
    // The ellipsis menu should not be present
    const ellipsisButton = queryByTestId('ellipsis-button')
    expect(ellipsisButton).toBeNull()
  })

  it('handles multi-select mode correctly', () => {
    const onToggleSelection = jest.fn()
    
    const { getByTestId } = render(
      <AudioClipCard 
        {...defaultProps} 
        isMultiSelectMode={true}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    )
    
    const playButton = getByTestId('audio-clip-card-content') || getByTestId('play-button')
    fireEvent.press(playButton)
    
    expect(onToggleSelection).toHaveBeenCalledTimes(1)
  })
})
