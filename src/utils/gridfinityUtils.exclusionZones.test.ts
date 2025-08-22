/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';

describe('gridfinityUtils - Exclusion Zones', () => {
  describe('Basic exclusion zone calculations', () => {
    it('should reduce effective printer size with front exclusion zone', () => {
      const drawerSize = { width: 10, height: 10 };
      const printerSize = {
        x: 256,
        y: 256,
        z: 256,
        exclusionZone: {
          front: 20, // 20mm exclusion from front
        }
      };

      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // With 20mm front exclusion, effective Y becomes 236mm
      // 236mm / 42mm = 5.619... so max 5 grids in Y direction
      // Original would be 256mm / 42mm = 6.095... so 6 grids
      const layout = result.layout.filter(item => item.type === 'baseplate');
      const maxYGrid = Math.max(...layout.map(item => item.height));
      expect(maxYGrid).toBeLessThanOrEqual(5);
    });

    it('should handle multiple exclusion zones simultaneously', () => {
      const drawerSize = { width: 10, height: 10 };
      const printerSize = {
        x: 256,
        y: 256,
        z: 256,
        exclusionZone: {
          front: 20,
          back: 20,
          left: 20,
          right: 20,
        }
      };

      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // With 20mm exclusion on all sides:
      // Effective X = 256 - 20 - 20 = 216mm (5.14 grids, so max 5)
      // Effective Y = 256 - 20 - 20 = 216mm (5.14 grids, so max 5)
      const layout = result.layout.filter(item => item.type === 'baseplate');
      const maxXGrid = Math.max(...layout.map(item => item.width));
      const maxYGrid = Math.max(...layout.map(item => item.height));
      
      expect(maxXGrid).toBeLessThanOrEqual(5);
      expect(maxYGrid).toBeLessThanOrEqual(5);
    });

    it('should handle zero exclusion zones', () => {
      const drawerSize = { width: 10, height: 10 };
      const printerSizeWithZeroExclusion = {
        x: 256,
        y: 256,
        z: 256,
        exclusionZone: {
          front: 0,
          back: 0,
          left: 0,
          right: 0,
        }
      };
      const printerSizeWithoutExclusion = {
        x: 256,
        y: 256,
        z: 256,
      };

      const resultWithZero = calculateGrids(drawerSize, printerSizeWithZeroExclusion, false, false);
      const resultWithout = calculateGrids(drawerSize, printerSizeWithoutExclusion, false, false);
      
      // Results should be identical
      expect(resultWithZero.baseplates).toEqual(resultWithout.baseplates);
      expect(resultWithZero.layout.length).toEqual(resultWithout.layout.length);
    });
  });

  describe('Real-world scenarios', () => {
    it('should calculate correct layout for Bambu X1C with exclusion zone', () => {
      const drawerSize = { width: 9, height: 9 }; // 9x9 inch drawer
      const bambuX1C = {
        x: 256,
        y: 256,
        z: 256,
        exclusionZone: {
          front: 18, // Typical Bambu X1C front exclusion area
        }
      };

      const result = calculateGrids(drawerSize, bambuX1C, false, false);
      
      // Verify the calculation produces reasonable results
      expect(result.baseplates).toBeDefined();
      expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
      
      // With front exclusion, Y dimension is reduced
      const layout = result.layout.filter(item => item.type === 'baseplate');
      layout.forEach(item => {
        // 256 - 18 = 238mm, 238/42 = 5.66, so max 5 grids in Y
        expect(item.height).toBeLessThanOrEqual(5);
      });
    });
  });
});