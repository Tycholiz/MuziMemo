import React, { ReactNode } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { FileManagerProvider } from './FileManagerContext'
import { AudioPlayerProvider } from './AudioPlayerContext'
import { SyncProvider } from './SyncContext'

type AppProvidersProps = {
  children: ReactNode
}

/**
 * App Providers Component
 * Wraps the app with all necessary context providers and error boundaries
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <SyncProvider>
        <FileManagerProvider>
          <AudioPlayerProvider>
            {children}
          </AudioPlayerProvider>
        </FileManagerProvider>
      </SyncProvider>
    </ErrorBoundary>
  )
}
