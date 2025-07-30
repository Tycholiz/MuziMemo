/**
 * Integration test for intelligent recording naming functionality
 * Tests the complete flow from directory scanning to name generation
 */

import { generateIntelligentRecordingName } from '../formatUtils'

describe('Intelligent Recording Naming - Integration Tests', () => {
  describe('Real-world scenarios', () => {
    it('should handle empty folder correctly', () => {
      const emptyFolder: string[] = []
      const result = generateIntelligentRecordingName(emptyFolder)
      expect(result).toBe('Recording 1.m4a')
    })

    it('should handle folder with mixed content', () => {
      const mixedFolder = [
        'Recording 1.m4a',
        'folder1',
        'image.jpg',
        'Recording 3.m4a',
        'document.pdf',
        'Recording 5.m4a',
        'another-folder',
        'music.mp3',
      ]
      const result = generateIntelligentRecordingName(mixedFolder)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should handle sequential recordings without gaps', () => {
      const sequentialFolder = [
        'Recording 1.m4a',
        'Recording 2.m4a',
        'Recording 3.m4a',
        'Recording 4.m4a',
        'Recording 5.m4a',
      ]
      const result = generateIntelligentRecordingName(sequentialFolder)
      expect(result).toBe('Recording 6.m4a')
    })

    it('should handle multiple gaps and find the first one', () => {
      const gappyFolder = [
        'Recording 1.m4a',
        'Recording 3.m4a',
        'Recording 5.m4a',
        'Recording 7.m4a',
        'Recording 10.m4a',
      ]
      const result = generateIntelligentRecordingName(gappyFolder)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should handle recordings starting from higher numbers', () => {
      const highNumberFolder = ['Recording 5.m4a', 'Recording 6.m4a', 'Recording 8.m4a']
      const result = generateIntelligentRecordingName(highNumberFolder)
      expect(result).toBe('Recording 1.m4a')
    })

    it('should handle very large numbers efficiently', () => {
      const largeNumberFolder = ['Recording 1.m4a', 'Recording 2.m4a', 'Recording 1000.m4a', 'Recording 9999.m4a']
      const result = generateIntelligentRecordingName(largeNumberFolder)
      expect(result).toBe('Recording 3.m4a')
    })

    it('should ignore non-standard recording names', () => {
      const nonStandardFolder = [
        'My Recording 1.m4a', // Different prefix
        'recording 1.m4a', // Lowercase (should work)
        'Recording1.m4a', // No space
        'Recording .m4a', // No number
        'Recording 2.m4a', // Valid
        'Voice Memo 3.m4a', // Different prefix
        'Recording 4.m4a', // Valid
      ]
      const result = generateIntelligentRecordingName(nonStandardFolder)
      expect(result).toBe('Recording 3.m4a') // Should find gap at 3 (1, 2, 4 exist)
    })

    it('should handle case variations correctly', () => {
      const caseVariationFolder = [
        'recording 1.m4a', // lowercase
        'RECORDING 2.M4A', // uppercase
        'Recording 4.m4a', // normal case
      ]
      const result = generateIntelligentRecordingName(caseVariationFolder)
      expect(result).toBe('Recording 3.m4a')
    })

    it('should handle files with and without extensions', () => {
      const mixedExtensionFolder = [
        'Recording 1', // No extension
        'Recording 2.m4a', // With extension
        'Recording 4', // No extension
        'Recording 5.m4a', // With extension
      ]
      const result = generateIntelligentRecordingName(mixedExtensionFolder)
      expect(result).toBe('Recording 3.m4a')
    })
  })

  describe('Edge cases', () => {
    it('should handle single file scenarios', () => {
      const singleFileFolder = ['Recording 5.m4a']
      const result = generateIntelligentRecordingName(singleFileFolder)
      expect(result).toBe('Recording 1.m4a')
    })

    it('should handle duplicate numbers (should not happen in real filesystem)', () => {
      const duplicateFolder = [
        'Recording 1.m4a',
        'Recording 1.m4a', // Duplicate (shouldn't happen in real FS)
        'Recording 3.m4a',
      ]
      const result = generateIntelligentRecordingName(duplicateFolder)
      expect(result).toBe('Recording 2.m4a')
    })

    it('should handle very sparse numbering', () => {
      const sparseFolder = ['Recording 1.m4a', 'Recording 100.m4a', 'Recording 1000.m4a']
      const result = generateIntelligentRecordingName(sparseFolder)
      expect(result).toBe('Recording 2.m4a')
    })
  })

  describe('Performance considerations', () => {
    it('should handle large directories efficiently', () => {
      // Create a large array of file names
      const largeFolder: string[] = []

      // Add 1000 non-recording files
      for (let i = 0; i < 1000; i++) {
        largeFolder.push(`file${i}.txt`)
      }

      // Add some recording files with gaps
      largeFolder.push('Recording 1.m4a')
      largeFolder.push('Recording 3.m4a')
      largeFolder.push('Recording 5.m4a')

      const startTime = Date.now()
      const result = generateIntelligentRecordingName(largeFolder)
      const endTime = Date.now()

      expect(result).toBe('Recording 2.m4a')
      expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
    })
  })
})
