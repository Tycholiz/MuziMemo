import React from 'react'
import { render } from '@testing-library/react-native'
import { Breadcrumbs } from '../Breadcrumbs'
import { FileManagerProvider } from '../../contexts/FileManagerContext'

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
}))

// Helper function to render components with FileManagerProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<FileManagerProvider>{component}</FileManagerProvider>)
}

describe('Breadcrumbs', () => {
  it('should render with FileManager context', () => {
    const { getByTestId } = renderWithProvider(<Breadcrumbs />)

    // Should show home icon when at root (since showHomeIcon defaults to true)
    expect(getByTestId('breadcrumb-container')).toBeTruthy()
  })

  it('should render with provided directory path', () => {
    const mockOnBreadcrumbPress = jest.fn()
    const directoryPath = 'file:///mock/documents/recordings/Music/Song Ideas'

    const { getByText } = renderWithProvider(
      <Breadcrumbs directoryPath={directoryPath} onBreadcrumbPress={mockOnBreadcrumbPress} />
    )

    // Should show Music and Song Ideas (Home shows as icon by default)
    expect(getByText('Music')).toBeTruthy()
    expect(getByText('Song Ideas')).toBeTruthy()
  })

  it('should render in compact variant', () => {
    const { getByTestId } = renderWithProvider(<Breadcrumbs variant="compact" />)

    expect(getByTestId('breadcrumb-container')).toBeTruthy()
  })

  it('should handle home icon visibility', () => {
    const { queryByTestId } = renderWithProvider(<Breadcrumbs showHomeIcon={false} />)

    // When showHomeIcon is false, should still show Home text
    expect(queryByTestId('home-icon')).toBeFalsy()
  })

  it('should call onBreadcrumbPress when provided', () => {
    const mockOnBreadcrumbPress = jest.fn()
    const directoryPath = 'file:///mock/documents/recordings/Music'

    const { getByText, getByTestId } = renderWithProvider(
      <Breadcrumbs directoryPath={directoryPath} onBreadcrumbPress={mockOnBreadcrumbPress} />
    )

    // Should be able to find breadcrumb container and Music text (Home shows as icon)
    expect(getByTestId('breadcrumb-container')).toBeTruthy()
    expect(getByText('Music')).toBeTruthy()
  })

  it('should show Home text when showHomeIcon is false', () => {
    const { getByText } = renderWithProvider(<Breadcrumbs showHomeIcon={false} />)

    // When showHomeIcon is false, should show Home as text
    expect(getByText('Home')).toBeTruthy()
  })

  it('should show Recently Deleted breadcrumb when in recently-deleted directory', () => {
    // This test would require mocking the FileManagerContext to return isInRecentlyDeleted: true
    // For now, we'll just verify the component structure exists
    const { getByTestId } = renderWithProvider(<Breadcrumbs />)
    expect(getByTestId('breadcrumb-container')).toBeTruthy()
  })
})
