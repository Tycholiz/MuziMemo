import React from 'react'
import { render } from '@testing-library/react-native'
import { RecordingStatusBadge } from '../RecordingStatusBadge'

describe('RecordingStatusBadge', () => {
  const defaultProps = {
    status: 'idle' as const,
    isInitialized: true,
    hasPermissions: true,
  }

  it('should render "Ready to Record" when idle and initialized with permissions', () => {
    const { getByText } = render(<RecordingStatusBadge {...defaultProps} />)
    expect(getByText('Ready to Record')).toBeTruthy()
  })

  it('should render "Recording" when status is recording', () => {
    const { getByText } = render(
      <RecordingStatusBadge {...defaultProps} status="recording" />
    )
    expect(getByText('Recording')).toBeTruthy()
  })

  it('should render "Paused" when status is paused', () => {
    const { getByText } = render(
      <RecordingStatusBadge {...defaultProps} status="paused" />
    )
    expect(getByText('Paused')).toBeTruthy()
  })

  it('should render "Ready to Record" when status is stopped', () => {
    const { getByText } = render(
      <RecordingStatusBadge {...defaultProps} status="stopped" />
    )
    expect(getByText('Ready to Record')).toBeTruthy()
  })

  it('should render "Initializing..." when not initialized', () => {
    const { getByText } = render(
      <RecordingStatusBadge {...defaultProps} isInitialized={false} />
    )
    expect(getByText('Initializing...')).toBeTruthy()
  })

  it('should render "Microphone Permission Required" when permissions are not granted', () => {
    const { getByText } = render(
      <RecordingStatusBadge {...defaultProps} hasPermissions={false} />
    )
    expect(getByText('Microphone Permission Required')).toBeTruthy()
  })

  it('should prioritize initialization status over permissions', () => {
    const { getByText } = render(
      <RecordingStatusBadge
        {...defaultProps}
        isInitialized={false}
        hasPermissions={false}
      />
    )
    expect(getByText('Initializing...')).toBeTruthy()
  })

  it('should prioritize permissions over recording status', () => {
    const { getByText } = render(
      <RecordingStatusBadge
        {...defaultProps}
        status="recording"
        hasPermissions={false}
      />
    )
    expect(getByText('Microphone Permission Required')).toBeTruthy()
  })
})
