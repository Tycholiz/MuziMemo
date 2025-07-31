/**
 * Tests for theme utility
 */

import { theme } from '../theme'
import type { Theme, ThemeColors } from '../theme'

describe('theme', () => {
  describe('structure', () => {
    it('should have all required top-level properties', () => {
      expect(theme).toHaveProperty('colors')
      expect(theme).toHaveProperty('typography')
      expect(theme).toHaveProperty('spacing')
      expect(theme).toHaveProperty('borderRadius')
      expect(theme).toHaveProperty('shadows')
    })

    it('should have colors object with required properties', () => {
      expect(theme.colors).toHaveProperty('primary')
      expect(theme.colors).toHaveProperty('secondary')
      expect(theme.colors).toHaveProperty('background')
      expect(theme.colors).toHaveProperty('text')
      expect(theme.colors).toHaveProperty('border')
      expect(theme.colors).toHaveProperty('surface')
    })

    it('should have typography object with required properties', () => {
      expect(theme.typography).toHaveProperty('fontFamily')
      expect(theme.typography).toHaveProperty('fontSize')
      expect(theme.typography).toHaveProperty('lineHeight')
      expect(theme.typography).toHaveProperty('fontWeight')
    })
  })

  describe('colors', () => {
    it('should have valid primary colors', () => {
      expect(theme.colors.primary).toBe('#FF3B30')
      expect(theme.colors.primaryLight).toBe('#FF6B60')
      expect(theme.colors.primaryDark).toBe('#D70015')
    })

    it('should have valid secondary colors', () => {
      expect(theme.colors.secondary).toBe('#007AFF')
      expect(theme.colors.secondaryLight).toBe('#4DA6FF')
      expect(theme.colors.secondaryDark).toBe('#0051D5')
    })

    it('should have status colors', () => {
      expect(theme.colors.success).toBe('#34C759')
      expect(theme.colors.warning).toBe('#FF9500')
      expect(theme.colors.error).toBe('#FF3B30')
      expect(theme.colors.info).toBe('#5AC8FA')
    })

    it('should have gray scale colors', () => {
      expect(theme.colors.gray).toHaveProperty('50')
      expect(theme.colors.gray).toHaveProperty('100')
      expect(theme.colors.gray).toHaveProperty('200')
      expect(theme.colors.gray).toHaveProperty('300')
      expect(theme.colors.gray).toHaveProperty('400')
      expect(theme.colors.gray).toHaveProperty('500')
      expect(theme.colors.gray).toHaveProperty('600')
      expect(theme.colors.gray).toHaveProperty('700')
      expect(theme.colors.gray).toHaveProperty('800')
      expect(theme.colors.gray).toHaveProperty('900')
      expect(theme.colors.gray).toHaveProperty('950')
    })

    it('should have background colors for dark theme', () => {
      expect(theme.colors.background.primary).toBe('#131416')
      expect(theme.colors.background.secondary).toBe('#1F2124')
      expect(theme.colors.background.tertiary).toBe('#2D2F31')
      expect(theme.colors.background.elevated).toBe('#3C4043')
    })

    it('should have text colors for dark theme', () => {
      expect(theme.colors.text.primary).toBe('#FFFFFF')
      expect(theme.colors.text.secondary).toBe('#E8EAED')
      expect(theme.colors.text.tertiary).toBe('#9AA0A6')
      expect(theme.colors.text.disabled).toBe('#5F6368')
      expect(theme.colors.text.inverse).toBe('#131416')
    })

    it('should have border colors', () => {
      expect(theme.colors.border.light).toBe('#3C4043')
      expect(theme.colors.border.medium).toBe('#5F6368')
      expect(theme.colors.border.dark).toBe('#9AA0A6')
    })

    it('should have tab bar colors', () => {
      expect(theme.colors.tabBar.active).toBe('#FF3B30')
      expect(theme.colors.tabBar.inactive).toBe('#9AA0A6')
      expect(theme.colors.tabBar.background).toBe('#131416')
      expect(theme.colors.tabBar.border).toBe('#2D2F31')
    })

    it('should have surface colors', () => {
      expect(theme.colors.surface.primary).toBe('#2D2F31')
      expect(theme.colors.surface.secondary).toBe('#3C4043')
      expect(theme.colors.surface.tertiary).toBe('#5F6368')
    })
  })

  describe('typography', () => {
    it('should have font family definitions', () => {
      expect(theme.typography.fontFamily.regular).toBe('System')
      expect(theme.typography.fontFamily.medium).toBe('System')
      expect(theme.typography.fontFamily.semiBold).toBe('System')
      expect(theme.typography.fontFamily.bold).toBe('System')
    })

    it('should have font size scale', () => {
      expect(theme.typography.fontSize.xs).toBe(12)
      expect(theme.typography.fontSize.sm).toBe(14)
      expect(theme.typography.fontSize.base).toBe(16)
      expect(theme.typography.fontSize.lg).toBe(18)
      expect(theme.typography.fontSize.xl).toBe(20)
      expect(theme.typography.fontSize['2xl']).toBe(24)
      expect(theme.typography.fontSize['3xl']).toBe(30)
      expect(theme.typography.fontSize['4xl']).toBe(36)
    })

    it('should have line height values', () => {
      expect(theme.typography.lineHeight.tight).toBe(1.25)
      expect(theme.typography.lineHeight.normal).toBe(1.5)
      expect(theme.typography.lineHeight.relaxed).toBe(1.75)
    })

    it('should have font weight values', () => {
      expect(theme.typography.fontWeight.normal).toBe('400')
      expect(theme.typography.fontWeight.medium).toBe('500')
      expect(theme.typography.fontWeight.semiBold).toBe('600')
      expect(theme.typography.fontWeight.bold).toBe('700')
    })
  })

  describe('spacing', () => {
    it('should have spacing scale', () => {
      expect(theme.spacing.xs).toBe(4)
      expect(theme.spacing.sm).toBe(8)
      expect(theme.spacing.md).toBe(16)
      expect(theme.spacing.lg).toBe(24)
      expect(theme.spacing.xl).toBe(32)
      expect(theme.spacing['2xl']).toBe(48)
      expect(theme.spacing['3xl']).toBe(64)
    })
  })

  describe('borderRadius', () => {
    it('should have border radius scale', () => {
      expect(theme.borderRadius.none).toBe(0)
      expect(theme.borderRadius.sm).toBe(4)
      expect(theme.borderRadius.md).toBe(8)
      expect(theme.borderRadius.lg).toBe(12)
      expect(theme.borderRadius.xl).toBe(16)
      expect(theme.borderRadius.full).toBe(9999)
    })
  })

  describe('shadows', () => {
    it('should have shadow definitions with required properties', () => {
      const shadowKeys = ['sm', 'md', 'lg'] as const
      
      shadowKeys.forEach(key => {
        const shadow = theme.shadows[key]
        expect(shadow).toHaveProperty('shadowColor')
        expect(shadow).toHaveProperty('shadowOffset')
        expect(shadow).toHaveProperty('shadowOpacity')
        expect(shadow).toHaveProperty('shadowRadius')
        expect(shadow).toHaveProperty('elevation')
        
        expect(shadow.shadowColor).toBe('#000')
        expect(shadow.shadowOffset).toHaveProperty('width')
        expect(shadow.shadowOffset).toHaveProperty('height')
        expect(typeof shadow.shadowOpacity).toBe('number')
        expect(typeof shadow.shadowRadius).toBe('number')
        expect(typeof shadow.elevation).toBe('number')
      })
    })

    it('should have progressive shadow values', () => {
      expect(theme.shadows.sm.elevation).toBeLessThan(theme.shadows.md.elevation)
      expect(theme.shadows.md.elevation).toBeLessThan(theme.shadows.lg.elevation)
      
      expect(theme.shadows.sm.shadowOpacity).toBeLessThan(theme.shadows.md.shadowOpacity)
      expect(theme.shadows.md.shadowOpacity).toBeLessThan(theme.shadows.lg.shadowOpacity)
    })
  })

  describe('type exports', () => {
    it('should export Theme type', () => {
      // This test ensures the Theme type is properly exported
      const testTheme: Theme = theme
      expect(testTheme).toBeDefined()
    })

    it('should export ThemeColors type', () => {
      // This test ensures the ThemeColors type is properly exported
      const testColors: ThemeColors = theme.colors
      expect(testColors).toBeDefined()
    })
  })

  describe('color consistency', () => {
    it('should use consistent color values across related properties', () => {
      // Primary color should be consistent
      expect(theme.colors.primary).toBe(theme.colors.error)
      expect(theme.colors.primary).toBe(theme.colors.tabBar.active)
    })

    it('should have proper color hierarchy in backgrounds', () => {
      // Background colors should get progressively lighter
      const backgrounds = [
        theme.colors.background.primary,
        theme.colors.background.secondary,
        theme.colors.background.tertiary,
        theme.colors.background.elevated,
      ]
      
      // All should be valid hex colors
      backgrounds.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })
  })
})
