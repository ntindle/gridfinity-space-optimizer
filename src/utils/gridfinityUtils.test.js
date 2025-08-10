import { describe, it, expect } from 'vitest'
import {
  calculateGrids,
  FULL_GRID_SIZE,
  HALF_GRID_SIZE,
  INCH_TO_MM,
  splitSpacerIfNeeded,
  fillSpacerWithHalfSizeBins,
  combineHalfSizeBins,
  getColor
} from './gridfinityUtils'

describe('gridfinityUtils', () => {
  describe('calculateGrids', () => {
    it('should calculate correct grid layout for standard drawer size', () => {
      const drawerSize = { width: 10, height: 10 } // inches
      const printerSize = { x: 210, y: 210, z: 200 }
      
      const result = calculateGrids(drawerSize, printerSize, false, false)
      
      expect(result).toHaveProperty('baseplates')
      expect(result).toHaveProperty('spacers')
      expect(result).toHaveProperty('halfSizeBins')
      expect(result).toHaveProperty('layout')
      expect(result.layout).toBeInstanceOf(Array)
    })

    it('should handle half-size bins when enabled', () => {
      const drawerSize = { width: 5, height: 5 }
      const printerSize = { x: 150, y: 150, z: 150 }
      
      const result = calculateGrids(drawerSize, printerSize, true, false)
      
      expect(result.layout.some(item => item.type === 'half-size')).toBe(true)
    })

    it('should generate spacers for non-standard dimensions', () => {
      const drawerSize = { width: 3.5, height: 3.5 } // Creates remainder
      const printerSize = { x: 200, y: 200, z: 200 }
      
      const result = calculateGrids(drawerSize, printerSize, false, false)
      
      expect(Object.keys(result.spacers).length).toBeGreaterThan(0)
    })

    it('should respect printer build volume constraints', () => {
      const drawerSize = { width: 20, height: 20 } // Large drawer
      const printerSize = { x: 100, y: 100, z: 100 } // Small printer
      
      const result = calculateGrids(drawerSize, printerSize, false, false)
      
      // Check that no baseplate exceeds printer size
      result.layout.forEach(item => {
        if (item.type === 'baseplate') {
          expect(item.pixelWidth).toBeLessThanOrEqual(printerSize.x)
          expect(item.pixelHeight).toBeLessThanOrEqual(printerSize.y)
        }
      })
    })
  })

  describe('unit conversions', () => {
    it('should correctly convert inches to millimeters', () => {
      expect(INCH_TO_MM).toBe(25.4)
      expect(10 * INCH_TO_MM).toBe(254)
    })

    it('should use correct grid sizes', () => {
      expect(FULL_GRID_SIZE).toBe(42)
      expect(HALF_GRID_SIZE).toBe(21)
    })
  })

  describe('splitSpacerIfNeeded', () => {
    it('should split spacers that exceed max dimensions', () => {
      const spacer = {
        pixelX: 0,
        pixelY: 0,
        pixelWidth: 300,
        pixelHeight: 300,
        x: 0,
        y: 0,
        width: 7.14,
        height: 7.14,
        type: 'spacer'
      }
      
      const result = splitSpacerIfNeeded(spacer, 200, 200)
      
      expect(result.length).toBeGreaterThan(1)
      result.forEach(s => {
        expect(s.pixelWidth).toBeLessThanOrEqual(200)
        expect(s.pixelHeight).toBeLessThanOrEqual(200)
      })
    })

    it('should not split spacers within max dimensions', () => {
      const spacer = {
        pixelX: 0,
        pixelY: 0,
        pixelWidth: 100,
        pixelHeight: 100,
        x: 0,
        y: 0,
        width: 2.38,
        height: 2.38,
        type: 'spacer'
      }
      
      const result = splitSpacerIfNeeded(spacer, 200, 200)
      
      expect(result).toHaveLength(1)
      expect(result[0].pixelWidth).toBe(100)
      expect(result[0].pixelHeight).toBe(100)
    })
  })

  describe('fillSpacerWithHalfSizeBins', () => {
    it('should fill spacer with half-size bins', () => {
      const spacer = {
        pixelX: 0,
        pixelY: 0,
        pixelWidth: 42,
        pixelHeight: 42,
        x: 0,
        y: 0,
        type: 'spacer'
      }
      
      const result = fillSpacerWithHalfSizeBins(spacer)
      
      expect(result.halfSizeBins).toHaveLength(4) // 2x2 half-size bins
      expect(result.remainingSpacers).toHaveLength(0)
    })

    it('should handle remainders when filling with half-size bins', () => {
      const spacer = {
        pixelX: 0,
        pixelY: 0,
        pixelWidth: 50,
        pixelHeight: 50,
        x: 0,
        y: 0,
        type: 'spacer'
      }
      
      const result = fillSpacerWithHalfSizeBins(spacer)
      
      expect(result.halfSizeBins.length).toBeGreaterThan(0)
      expect(result.remainingSpacers.length).toBeGreaterThan(0)
    })
  })

  describe('combineHalfSizeBins', () => {
    it('should combine half-size bins into larger groups', () => {
      const halfSizeBins = [
        { pixelX: 0, pixelY: 0, pixelWidth: 21, pixelHeight: 21, type: 'half-size' },
        { pixelX: 21, pixelY: 0, pixelWidth: 21, pixelHeight: 21, type: 'half-size' },
        { pixelX: 0, pixelY: 21, pixelWidth: 21, pixelHeight: 21, type: 'half-size' },
        { pixelX: 21, pixelY: 21, pixelWidth: 21, pixelHeight: 21, type: 'half-size' },
      ]
      
      const result = combineHalfSizeBins(halfSizeBins, 200, 200)
      
      // The function combines bins, so we should have fewer results
      expect(result.length).toBeLessThanOrEqual(halfSizeBins.length)
      // Check that bins were combined (have larger dimensions)
      const hasCombinedBin = result.some(bin => 
        bin.pixelWidth > 21 || bin.pixelHeight > 21
      )
      expect(hasCombinedBin).toBe(true)
    })

    it('should respect printer build volume when combining', () => {
      const halfSizeBins = Array(100).fill(null).map((_, i) => ({
        pixelX: (i % 10) * 21,
        pixelY: Math.floor(i / 10) * 21,
        pixelWidth: 21,
        pixelHeight: 21,
        type: 'half-size'
      }))
      
      const result = combineHalfSizeBins(halfSizeBins, 100, 100)
      
      result.forEach(group => {
        expect(group.pixelWidth).toBeLessThanOrEqual(100)
        expect(group.pixelHeight).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('getColor', () => {
    it('should return correct colors for different types', () => {
      expect(getColor('spacer', 0)).toBe('rgba(255, 0, 0, 0.3)')
      expect(getColor('half-size', 0)).toBe('rgba(0, 255, 0, 0.3)')
      expect(getColor('baseplate', 0)).toMatch(/^hsl\(/)
    })

    it('should generate different colors for different indices', () => {
      const color1 = getColor('baseplate', 0)
      const color2 = getColor('baseplate', 1)
      const color3 = getColor('baseplate', 2)
      
      expect(color1).not.toBe(color2)
      expect(color2).not.toBe(color3)
      expect(color1).not.toBe(color3)
    })
  })

  describe('Half-size bins with spacers', () => {
    it('should generate spacers when using half-size bins', () => {
      const drawerSize = { width: 22.5, height: 16.5 }
      const printerSize = { x: 256, y: 256 }
      
      // Test with half-size bins enabled
      const result = calculateGrids(drawerSize, printerSize, true, false)
      
      // Should have half-size bins
      expect(Object.keys(result.halfSizeBins).length).toBeGreaterThan(0)
      
      // Should also have spacers for the remaining space
      expect(Object.keys(result.spacers).length).toBeGreaterThan(0)
      
      // Check that spacers are in the layout
      const spacersInLayout = result.layout.filter(item => item.type === 'spacer')
      expect(spacersInLayout.length).toBeGreaterThan(0)
      
      // Verify the spacers cover the edges (remainder space)
      // With 22.5" x 16.5" drawer and 21mm half-size bins:
      // 571.5mm / 21mm = 27.21... -> 27 bins with remainder
      // 419.1mm / 21mm = 19.95... -> 19 bins with remainder
      const hasHorizontalSpacer = spacersInLayout.some(s => s.pixelX > 500)
      const hasVerticalSpacer = spacersInLayout.some(s => s.pixelY > 350)
      
      expect(hasHorizontalSpacer).toBe(true)
      expect(hasVerticalSpacer).toBe(true)
    })
  })
})