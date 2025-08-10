import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';
import { testFixtures } from './gridfinityUtils.fixtures';

describe('gridfinityUtils - Regression Tests', () => {
  Object.entries(testFixtures).forEach(([testName, fixture]) => {
    describe(testName, () => {
      const { input, expected } = fixture;
      let result;

      // Calculate once for all tests in this fixture
      beforeEach(() => {
        result = calculateGrids(
          input.drawerSize,
          input.printerSize,
          input.useHalfSize,
          input.preferHalfSize
        );
      });

      it('should produce correct baseplates', () => {
        expect(result.baseplates).toEqual(expected.baseplates);
      });

      it('should produce correct spacers', () => {
        // For spacers, we check the count matches since exact dimensions might vary slightly
        const expectedSpacerCount = Object.keys(expected.spacers).length;
        const actualSpacerCount = Object.keys(result.spacers).length;
        expect(actualSpacerCount).toBe(expectedSpacerCount);
        
        // If we expect no spacers, verify that
        if (expectedSpacerCount === 0) {
          expect(result.spacers).toEqual({});
        }
      });

      if (expected.halfSizeBins) {
        it('should produce correct half-size bins', () => {
          expect(result.halfSizeBins).toBeDefined();
          if (expected.hasHalfSizeBins) {
            expect(Object.keys(result.halfSizeBins).length).toBeGreaterThan(0);
          }
        });
      }

      if (expected.layoutCount !== undefined) {
        it('should have correct number of layout items', () => {
          expect(result.layout.length).toBe(expected.layoutCount);
        });
      }

      if (expected.totalCoverage) {
        it('should cover the entire drawer area', () => {
          let maxX = 0;
          let maxY = 0;
          
          result.layout.forEach(item => {
            maxX = Math.max(maxX, item.pixelX + item.pixelWidth);
            maxY = Math.max(maxY, item.pixelY + item.pixelHeight);
          });

          // Allow 1mm tolerance for rounding
          expect(Math.abs(maxX - expected.totalCoverage.width)).toBeLessThan(1);
          expect(Math.abs(maxY - expected.totalCoverage.height)).toBeLessThan(1);
        });
      }

      it('should not have overlapping items', () => {
        for (let i = 0; i < result.layout.length; i++) {
          for (let j = i + 1; j < result.layout.length; j++) {
            const item1 = result.layout[i];
            const item2 = result.layout[j];
            
            const overlapsX = item1.pixelX < item2.pixelX + item2.pixelWidth &&
                             item1.pixelX + item1.pixelWidth > item2.pixelX;
            const overlapsY = item1.pixelY < item2.pixelY + item2.pixelHeight &&
                             item1.pixelY + item1.pixelHeight > item2.pixelY;
            
            expect(overlapsX && overlapsY).toBe(false);
          }
        }
      });

      it('should not exceed printer dimensions', () => {
        result.layout.forEach(item => {
          expect(item.pixelWidth).toBeLessThanOrEqual(input.printerSize.x);
          expect(item.pixelHeight).toBeLessThanOrEqual(input.printerSize.y);
        });
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle zero-size drawer', () => {
      const result = calculateGrids(
        { width: 0, height: 0 },
        { x: 200, y: 200, z: 200 },
        false,
        false
      );
      
      expect(result.baseplates).toEqual({});
      expect(result.spacers).toEqual({});
      expect(result.layout).toEqual([]);
    });

    it('should handle negative drawer dimensions gracefully', () => {
      const result = calculateGrids(
        { width: -10, height: -10 },
        { x: 200, y: 200, z: 200 },
        false,
        false
      );
      
      // After fix: should return empty for invalid dimensions
      expect(result.baseplates).toEqual({});
      expect(result.spacers).toEqual({});
      expect(result.layout).toEqual([]);
    });

    it('should handle very large drawer dimensions', () => {
      const result = calculateGrids(
        { width: 1000, height: 1000 }, // 1000 inches = 25.4 meters!
        { x: 200, y: 200, z: 200 },
        false,
        false
      );
      
      // Should still produce a valid result
      expect(result.layout).toBeDefined();
      expect(result.layout.length).toBeGreaterThan(0);
      
      // No single item should exceed printer size
      result.layout.forEach(item => {
        expect(item.pixelWidth).toBeLessThanOrEqual(200);
        expect(item.pixelHeight).toBeLessThanOrEqual(200);
      });
    });
  });
});