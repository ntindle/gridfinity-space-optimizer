
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
          front: 20, 
        }
      };

      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      
      
      
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
      
      
      expect(resultWithZero.baseplates).toEqual(resultWithout.baseplates);
      expect(resultWithZero.layout.length).toEqual(resultWithout.layout.length);
    });
  });

  describe('Real-world scenarios', () => {
    it('should calculate correct layout for Bambu X1C with exclusion zone', () => {
      const drawerSize = { width: 9, height: 9 }; 
      const bambuX1C = {
        x: 256,
        y: 256,
        z: 256,
        exclusionZone: {
          front: 18, 
        }
      };

      const result = calculateGrids(drawerSize, bambuX1C, false, false);
      
      
      expect(result.baseplates).toBeDefined();
      expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
      
      
      const layout = result.layout.filter(item => item.type === 'baseplate');
      layout.forEach(item => {
        
        expect(item.height).toBeLessThanOrEqual(5);
      });
    });
  });
});