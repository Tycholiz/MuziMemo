# MuziMemo Documentation

Welcome to MuziMemo, a React Native audio recording application that allows users to record, organize, and manage audio files on their mobile devices.

## Table of Contents

- [Audio Recording System](./audio-recording.md)
- [File System Architecture](./file-system.md)
- [User Interface Components](./ui-components.md)
- [Testing Strategy](./testing.md)
- [Development Setup](./development.md)

## Overview

MuziMemo is built with React Native and Expo, providing a cross-platform solution for audio recording and file management. The app utilizes the device's native file system to store recordings and provides an intuitive interface for organizing audio content.

## Key Features

- **High-Quality Audio Recording**: Support for multiple quality settings using expo-audio
- **File System Integration**: Direct integration with device document directory
- **Folder Organization**: Create and manage custom folders for organizing recordings
- **Real-time Audio Visualization**: Sound wave visualization during recording
- **Cross-Platform Support**: Works on both iOS and Android devices

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **Screens**: Main UI screens (RecordScreen, BrowseScreen)
- **Components**: Reusable UI components (Dropdown, SoundWave, etc.)
- **Hooks**: Custom React hooks for state management (useAudioRecording, useAudioPlayer)
- **Services**: Business logic and external integrations (FileSystemService, AudioMetadataService)
- **Utils**: Utility functions and helpers (formatUtils, pathUtils)

## Getting Started

For development setup and installation instructions, see [Development Setup](./development.md).

For detailed information about the audio recording system, see [Audio Recording System](./audio-recording.md).
