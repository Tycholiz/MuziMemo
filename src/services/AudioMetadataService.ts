import * as FileSystem from 'expo-file-system'

export type AudioMetadata = {
  duration: number // in seconds
  bitrate?: number
  sampleRate?: number
  channels?: number
  format?: string
}

/**
 * Service for reading audio file metadata
 * Supports M4A/AAC files (most common from recordings)
 */
export class AudioMetadataService {
  /**
   * Read metadata from an audio file
   */
  static async getMetadata(filePath: string): Promise<AudioMetadata> {
    try {
      // Read the first few KB of the file to get metadata
      const fileInfo = await FileSystem.getInfoAsync(filePath)
      if (!fileInfo.exists) {
        throw new Error('File does not exist')
      }

      // For M4A files, we need to parse the MP4 container
      if (filePath.toLowerCase().endsWith('.m4a')) {
        return await this.parseM4AMetadata(filePath)
      }

      // For MP3 files
      if (filePath.toLowerCase().endsWith('.mp3')) {
        return await this.parseMP3Metadata(filePath)
      }

      // Fallback: estimate based on file size
      return this.estimateMetadata(fileInfo.size || 0)
    } catch (error) {
      console.warn('Failed to read audio metadata:', error)
      // Return default metadata
      return { duration: 0 }
    }
  }

  /**
   * Parse M4A/AAC metadata from MP4 container
   */
  private static async parseM4AMetadata(filePath: string): Promise<AudioMetadata> {
    try {
      // Read first 8KB of file to find metadata atoms
      const base64Data = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
        length: 8192,
        position: 0,
      })

      const buffer = this.base64ToArrayBuffer(base64Data)
      const view = new DataView(buffer)

      let duration = 0
      let sampleRate = 0
      let channels = 0

      // Look for 'mvhd' atom which contains duration info
      const mvhdOffset = this.findAtom(buffer, 'mvhd')
      if (mvhdOffset !== -1) {
        // mvhd atom structure:
        // 4 bytes: atom size
        // 4 bytes: 'mvhd'
        // 1 byte: version
        // 3 bytes: flags
        // 4 bytes: creation time
        // 4 bytes: modification time
        // 4 bytes: time scale
        // 4 bytes: duration

        const timeScale = view.getUint32(mvhdOffset + 20, false) // big-endian
        const durationTicks = view.getUint32(mvhdOffset + 24, false) // big-endian

        if (timeScale > 0) {
          duration = durationTicks / timeScale
        }
      }

      // Look for 'stsd' atom for audio format info
      const stsdOffset = this.findAtom(buffer, 'stsd')
      if (stsdOffset !== -1) {
        // Try to extract sample rate and channels from audio description
        // This is more complex and format-dependent
        sampleRate = 44100 // Default assumption
        channels = 2 // Default assumption
      }

      return {
        duration,
        sampleRate,
        channels,
        format: 'm4a',
      }
    } catch (error) {
      console.warn('Failed to parse M4A metadata:', error)
      return this.estimateMetadata(0)
    }
  }

  /**
   * Parse MP3 metadata (basic implementation)
   */
  private static async parseMP3Metadata(filePath: string): Promise<AudioMetadata> {
    try {
      // Read first 4KB to look for MP3 frame header
      const base64Data = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
        length: 4096,
        position: 0,
      })

      const buffer = this.base64ToArrayBuffer(base64Data)
      const view = new DataView(buffer)

      // Look for MP3 frame sync (0xFF followed by 0xE0-0xFF)
      for (let i = 0; i < buffer.byteLength - 4; i++) {
        if (view.getUint8(i) === 0xff && (view.getUint8(i + 1) & 0xe0) === 0xe0) {
          // Found potential MP3 frame header
          const header = view.getUint32(i, false)
          const frameInfo = this.parseMP3FrameHeader(header)

          if (frameInfo) {
            // Get file size to calculate duration
            const fileInfo = await FileSystem.getInfoAsync(filePath)
            const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0

            // Estimate duration based on bitrate
            const duration = frameInfo.bitrate > 0 ? (fileSize * 8) / (frameInfo.bitrate * 1000) : 0

            return {
              duration,
              bitrate: frameInfo.bitrate,
              sampleRate: frameInfo.sampleRate,
              format: 'mp3',
            }
          }
        }
      }

      return this.estimateMetadata(0)
    } catch (error) {
      console.warn('Failed to parse MP3 metadata:', error)
      return this.estimateMetadata(0)
    }
  }

  /**
   * Parse MP3 frame header to extract audio info
   */
  private static parseMP3FrameHeader(header: number) {
    // MP3 frame header parsing (simplified)
    const version = (header >> 19) & 0x3
    const layer = (header >> 17) & 0x3
    const bitrateIndex = (header >> 12) & 0xf
    const sampleRateIndex = (header >> 10) & 0x3

    // Bitrate table for MPEG-1 Layer 3
    const bitrateTable = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
    const sampleRateTable = [44100, 48000, 32000, 0]

    if (version === 3 && layer === 1 && bitrateIndex > 0 && bitrateIndex < 15) {
      return {
        bitrate: bitrateTable[bitrateIndex],
        sampleRate: sampleRateTable[sampleRateIndex],
      }
    }

    return null
  }

  /**
   * Find an atom in MP4 container
   */
  private static findAtom(buffer: ArrayBuffer, atomType: string): number {
    const view = new DataView(buffer)
    const targetBytes = new TextEncoder().encode(atomType)

    for (let i = 0; i < buffer.byteLength - 8; i++) {
      let match = true
      for (let j = 0; j < 4; j++) {
        if (view.getUint8(i + 4 + j) !== targetBytes[j]) {
          match = false
          break
        }
      }
      if (match) {
        return i
      }
    }

    return -1
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Estimate metadata based on file size (fallback)
   */
  private static estimateMetadata(fileSize: number): AudioMetadata {
    // Assume 128kbps bitrate for estimation
    const estimatedDuration = Math.max(1, Math.floor(fileSize / 16000))

    return {
      duration: estimatedDuration,
      bitrate: 128,
      sampleRate: 44100,
      channels: 2,
      format: 'unknown',
    }
  }

  /**
   * Format duration as MM:SS string
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}
