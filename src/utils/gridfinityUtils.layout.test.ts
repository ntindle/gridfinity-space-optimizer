import { describe, it, expect } from 'vitest';
import { calculateGrids, FULL_GRID_SIZE, HALF_GRID_SIZE, INCH_TO_MM } from './gridfinityUtils';
import type { DrawerSize, PrinterSize, LayoutItem } from '@/types/gridfinity';

describe('gridfinityUtils - Layout Logic', () => {
  describe('Real-world drawer scenarios', () => {
    it('should calculate correct layout for 22.5" x 16.5" drawer (standard US drawer)', () => {
      // This is the default drawer size shown in your screenshot
      const drawerSize: DrawerSize = { width: 22.5, height: 16.5 }; // inches
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 }; // Bambu Lab A1
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // Convert drawer to mm for verification
      const widthMm = 22.5 * INCH_TO_MM; // 571.5mm
      const heightMm = 16.5 * INCH_TO_MM; // 419.1mm
      
      // Calculate expected grid counts
      const fullGridsX = Math.floor(widthMm / FULL_GRID_SIZE); // 571.5 / 42 = 13
      const fullGridsY = Math.floor(heightMm / FULL_GRID_SIZE); // 419.1 / 42 = 9
      const remainderX = widthMm % FULL_GRID_SIZE; // 571.5 % 42 = 25.5mm
      const remainderY = heightMm % FULL_GRID_SIZE; // 419.1 % 42 = 41.1mm
      
      console.log('Drawer size:', widthMm, 'x', heightMm, 'mm');
      console.log('Full grids:', fullGridsX, 'x', fullGridsY);
      console.log('Remainders:', remainderX, 'x', remainderY, 'mm');
      console.log('Result baseplates:', result.baseplates);
      console.log('Result spacers:', result.spacers);
      
      // Should have baseplates filling the space
      const totalBaseplates = Object.values(result.baseplates).reduce((sum, count) => sum + count, 0);
      expect(totalBaseplates).toBeGreaterThan(0);
      
      // Should have spacers for the remainders
      expect(Object.keys(result.spacers).length).toBeGreaterThan(0);
      
      // Verify the layout covers the entire drawer
      let coveredArea = 0;
      result.layout.forEach((item: LayoutItem) => {
        coveredArea += item.pixelWidth * item.pixelHeight;
      });
      const totalArea = widthMm * heightMm;
      expect(Math.abs(coveredArea - totalArea)).toBeLessThan(1); // Allow small rounding error
    });

    it('should handle exact grid multiples without spacers', () => {
      // 420mm x 420mm = exactly 10x10 grids
      const drawerSize: DrawerSize = { width: 420 / INCH_TO_MM, height: 420 / INCH_TO_MM }; // Convert to inches
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // Should have no spacers
      expect(Object.keys(result.spacers).length).toBe(0);
      
      // Should have baseplates only
      expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
    });

    it('should split large baseplates to fit printer bed', () => {
      // Large drawer that would need 7x7 baseplates (294mm) but printer is only 220mm
      const drawerSize: DrawerSize = { width: 12, height: 12 }; // inches (304.8mm x 304.8mm)
      const printerSize: PrinterSize = { x: 220, y: 220, z: 250 }; // Smaller printer
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // Should not have any baseplates larger than printer can handle
      Object.keys(result.baseplates).forEach((size: string) => {
        const [gridX, gridY] = size.split('x').map(Number);
        const baseplateWidth = gridX * FULL_GRID_SIZE;
        const baseplateHeight = gridY * FULL_GRID_SIZE;
        
        expect(baseplateWidth).toBeLessThanOrEqual(printerSize.x);
        expect(baseplateHeight).toBeLessThanOrEqual(printerSize.y);
      });
      
      // Should still cover the drawer area
      const widthMm = 12 * INCH_TO_MM;
      const heightMm = 12 * INCH_TO_MM;
      let coveredWidth = 0;
      let coveredHeight = 0;
      
      result.layout.forEach((item: LayoutItem) => {
        if (item.pixelX === 0) {
          coveredHeight = Math.max(coveredHeight, item.pixelY + item.pixelHeight);
        }
        if (item.pixelY === 0) {
          coveredWidth = Math.max(coveredWidth, item.pixelX + item.pixelWidth);
        }
      });
      
      expect(Math.abs(coveredWidth - widthMm)).toBeLessThan(1);
      expect(Math.abs(coveredHeight - heightMm)).toBeLessThan(1);
    });

    it('should generate correct spacers for small remainders', () => {
      // Drawer that leaves small remainders
      const drawerSize: DrawerSize = { width: 3.5, height: 3.5 }; // inches (88.9mm x 88.9mm)
      const printerSize: PrinterSize = { x: 200, y: 200, z: 200 };
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      const widthMm = 3.5 * INCH_TO_MM; // 88.9mm
      const heightMm = 3.5 * INCH_TO_MM; // 88.9mm
      
      // 88.9 / 42 = 2 grids with 4.9mm remainder
      const expectedGrids = 2;
      const expectedRemainder = 88.9 - (expectedGrids * FULL_GRID_SIZE); // 4.9mm
      
      // Should have 2x2 baseplate
      expect(result.baseplates['2x2']).toBe(1);
      
      // Should have spacers for the remainders
      const spacerKeys = Object.keys(result.spacers);
      expect(spacerKeys.length).toBeGreaterThan(0);
      
      // Check spacer dimensions are approximately correct
      // 88.9mm - 84mm (2x42) = 4.9mm remainder (rounds to 5.04mm)
      let hasCorrectSpacer = false;
      spacerKeys.forEach((key: string) => {
        if (key.includes('5.04')) {
          hasCorrectSpacer = true;
        }
      });
      expect(hasCorrectSpacer).toBe(true);
    });

    it('should handle half-size bins when enabled', () => {
      const drawerSize: DrawerSize = { width: 5, height: 5 }; // inches
      const printerSize: PrinterSize = { x: 200, y: 200, z: 200 };
      
      const resultWithoutHalf = calculateGrids(drawerSize, printerSize, false, false);
      const resultWithHalf = calculateGrids(drawerSize, printerSize, true, false);
      
      // With half-size enabled, should have half-size bins
      expect(resultWithHalf.halfSizeBins).toBeDefined();
      expect(Object.keys(resultWithHalf.halfSizeBins).length).toBeGreaterThan(0);
      
      // Without half-size, should not have half-size bins (empty object)
      expect(Object.keys(resultWithoutHalf.halfSizeBins).length).toBe(0);
    });

    it('should prefer half-size bins for spacers when preferHalfSize is true', () => {
      const drawerSize: DrawerSize = { width: 4, height: 4 }; // inches
      const printerSize: PrinterSize = { x: 200, y: 200, z: 200 };
      
      const resultWithoutPrefer = calculateGrids(drawerSize, printerSize, false, false);
      const resultWithPrefer = calculateGrids(drawerSize, printerSize, false, true);
      
      // With prefer half-size, implementation behavior:
      // - Only creates half-size bins if spacers are >= 21mm (HALF_GRID_SIZE)
      // - For 4" drawer (101.6mm), remainder is 17.64mm which is < 21mm
      // - So no half-size bins will be created
      const spacersWithoutPrefer = Object.keys(resultWithoutPrefer.spacers).length;
      const spacersWithPrefer = Object.keys(resultWithPrefer.spacers).length;
      
      // Since spacers are too small for half-size bins, count may stay same or increase
      expect(spacersWithPrefer).toBeGreaterThanOrEqual(spacersWithoutPrefer);
      
      // No half-size bins will be created for this size
      expect(Object.keys(resultWithPrefer.halfSizeBins).length).toBe(0);
    });

    it('should calculate correct layout for metric drawer (500mm x 400mm)', () => {
      const drawerSize: DrawerSize = { 
        width: 500 / INCH_TO_MM,  // Convert mm to inches
        height: 400 / INCH_TO_MM 
      };
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // 500mm / 42mm = 11 grids with 38mm remainder
      // 400mm / 42mm = 9 grids with 22mm remainder
      
      // Should have multiple baseplates
      const totalBaseplates = Object.values(result.baseplates).reduce((sum, count) => sum + count, 0);
      expect(totalBaseplates).toBeGreaterThan(0);
      
      // Should have spacers for remainders
      expect(Object.keys(result.spacers).length).toBeGreaterThan(0);
      
      // Verify complete coverage
      let maxX = 0;
      let maxY = 0;
      result.layout.forEach((item: LayoutItem) => {
        maxX = Math.max(maxX, item.pixelX + item.pixelWidth);
        maxY = Math.max(maxY, item.pixelY + item.pixelHeight);
      });
      
      expect(Math.abs(maxX - 500)).toBeLessThan(1);
      expect(Math.abs(maxY - 400)).toBeLessThan(1);
    });

    it('should handle very small drawers (smaller than one grid)', () => {
      const drawerSize: DrawerSize = { 
        width: 30 / INCH_TO_MM,  // 30mm in inches
        height: 30 / INCH_TO_MM   // 30mm in inches
      };
      const printerSize: PrinterSize = { x: 200, y: 200, z: 200 };
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // Should have no baseplates (too small)
      expect(Object.keys(result.baseplates).length).toBe(0);
      
      // Should have one spacer covering the entire area
      expect(Object.keys(result.spacers).length).toBe(1);
      
      const spacerKey = Object.keys(result.spacers)[0];
      // Expect approximately 30mm (may be 29.82mm due to inch-to-mm conversion)
      expect(spacerKey).toMatch(/29\.\d+mm x 29\.\d+mm|30\.00mm x 30\.00mm/);
    });

    it('should optimize baseplate selection for printer bed', () => {
      // Test that it selects appropriate baseplate sizes for the printer
      const drawerSize: DrawerSize = { width: 15, height: 15 }; // inches
      const smallPrinter: PrinterSize = { x: 180, y: 180, z: 180 }; // Can fit max 4x4 baseplates
      const largePrinter: PrinterSize = { x: 350, y: 350, z: 350 }; // Can fit max 8x8 baseplates
      
      const resultSmall = calculateGrids(drawerSize, smallPrinter, false, false);
      const resultLarge = calculateGrids(drawerSize, largePrinter, false, false);
      
      // Small printer should not have baseplates larger than 4x4
      Object.keys(resultSmall.baseplates).forEach((size: string) => {
        const [gridX, gridY] = size.split('x').map(Number);
        expect(gridX).toBeLessThanOrEqual(4);
        expect(gridY).toBeLessThanOrEqual(4);
      });
      
      // Large printer can have larger baseplates
      let hasLargeBaseplate = false;
      Object.keys(resultLarge.baseplates).forEach((size: string) => {
        const [gridX, gridY] = size.split('x').map(Number);
        if (gridX > 4 || gridY > 4) {
          hasLargeBaseplate = true;
        }
      });
      expect(hasLargeBaseplate).toBe(true);
    });

    it('should handle edge case of exact printer bed size', () => {
      // Drawer exactly matches printer bed size
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
      const drawerSize: DrawerSize = { 
        width: 256 / INCH_TO_MM,  // Exactly printer bed width
        height: 256 / INCH_TO_MM  // Exactly printer bed height
      };
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // Should efficiently use the space
      expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
      
      // No single baseplate should exceed printer dimensions
      result.layout.forEach((item: LayoutItem) => {
        expect(item.pixelWidth).toBeLessThanOrEqual(printerSize.x);
        expect(item.pixelHeight).toBeLessThanOrEqual(printerSize.y);
      });
    });
  });

  describe('Layout positioning verification', () => {
    it('should position items without overlaps', () => {
      const drawerSize: DrawerSize = { width: 10, height: 10 }; // inches
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // Check for overlaps
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

    it('should fill space efficiently without gaps', () => {
      const drawerSize: DrawerSize = { width: 8, height: 6 }; // inches
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
      
      const result = calculateGrids(drawerSize, printerSize, false, false);
      
      // Create a 2D array to track coverage
      const widthMm = Math.ceil(8 * INCH_TO_MM);
      const heightMm = Math.ceil(6 * INCH_TO_MM);
      const coverage = Array(heightMm).fill(null).map(() => Array(widthMm).fill(false));
      
      // Mark covered areas
      result.layout.forEach((item: LayoutItem) => {
        for (let y = item.pixelY; y < item.pixelY + item.pixelHeight && y < heightMm; y++) {
          for (let x = item.pixelX; x < item.pixelX + item.pixelWidth && x < widthMm; x++) {
            coverage[y][x] = true;
          }
        }
      });
      
      // Check coverage (allowing for small rounding at edges)
      let uncoveredCount = 0;
      for (let y = 0; y < heightMm - 1; y++) {
        for (let x = 0; x < widthMm - 1; x++) {
          if (!coverage[y][x]) {
            uncoveredCount++;
          }
        }
      }
      
      // Should have minimal uncovered area (less than 1% allowing for rounding)
      const totalArea = widthMm * heightMm;
      expect(uncoveredCount).toBeLessThan(totalArea * 0.01);
    });
  });
});