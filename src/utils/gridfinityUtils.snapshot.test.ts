import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';
import type { DrawerSize, PrinterSize } from '@/types/gridfinity';

describe('gridfinityUtils - Snapshot Tests', () => {
  describe('Standard configurations snapshots', () => {
    it('should match snapshot for standard US drawer', () => {
      const drawerSize: DrawerSize = { width: 22.5, height: 16.5 };
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
      
      const result = calculateGrids(
        drawerSize,
        printerSize,
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for metric drawer', () => {
      const drawerSize: DrawerSize = { width: 500 / 25.4, height: 400 / 25.4 };
      const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
      
      const result = calculateGrids(
        drawerSize,
        printerSize,
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot with half-size bins enabled', () => {
      const drawerSize: DrawerSize = { width: 10, height: 8 };
      const printerSize: PrinterSize = { x: 200, y: 200, z: 200 };
      
      const result = calculateGrids(
        drawerSize,
        printerSize,
        true,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot with prefer half-size', () => {
      const drawerSize: DrawerSize = { width: 10, height: 8 };
      const printerSize: PrinterSize = { x: 200, y: 200, z: 200 };
      
      const result = calculateGrids(
        drawerSize,
        printerSize,
        false,
        true
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for small printer', () => {
      const drawerSize: DrawerSize = { width: 15, height: 12 };
      const printerSize: PrinterSize = { x: 150, y: 150, z: 150 };
      
      const result = calculateGrids(
        drawerSize,
        printerSize,
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for large printer', () => {
      const drawerSize: DrawerSize = { width: 15, height: 12 };
      const printerSize: PrinterSize = { x: 350, y: 350, z: 350 };
      
      const result = calculateGrids(
        drawerSize,
        printerSize,
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });
  });

  describe('Common drawer sizes', () => {
    interface CommonSize {
      name: string;
      width: number;
      height: number;
    }

    const commonSizes: CommonSize[] = [
      { name: 'IKEA MAXIMERA small', width: 300 / 25.4, height: 370 / 25.4 },
      { name: 'IKEA MAXIMERA medium', width: 400 / 25.4, height: 370 / 25.4 },
      { name: 'IKEA MAXIMERA large', width: 500 / 25.4, height: 370 / 25.4 },
      { name: 'US Kitchen standard', width: 22, height: 20 },
      { name: 'US Desk drawer', width: 14, height: 10 },
      { name: 'Toolbox drawer', width: 18, height: 12 },
    ];

    commonSizes.forEach(({ name, width, height }) => {
      it(`should match snapshot for ${name}`, () => {
        const drawerSize: DrawerSize = { width, height };
        const printerSize: PrinterSize = { x: 256, y: 256, z: 256 };
        
        const result = calculateGrids(
          drawerSize,
          printerSize,
          false,
          false
        );
        
        expect(result).toMatchSnapshot();
      });
    });
  });

  describe('Common printer sizes', () => {
    interface PrinterInfo {
      name: string;
      size: PrinterSize;
    }

    const printers: PrinterInfo[] = [
      { name: 'Prusa Mini', size: { x: 180, y: 180, z: 180 } },
      { name: 'Ender 3', size: { x: 220, y: 220, z: 250 } },
      { name: 'Prusa MK3S+', size: { x: 250, y: 210, z: 210 } },
      { name: 'Bambu Lab A1', size: { x: 256, y: 256, z: 256 } },
      { name: 'Prusa XL', size: { x: 360, y: 360, z: 360 } },
    ];

    printers.forEach(({ name, size }) => {
      it(`should match snapshot for ${name}`, () => {
        const drawerSize: DrawerSize = { width: 12, height: 10 }; // Standard test drawer
        
        const result = calculateGrids(
          drawerSize,
          size,
          false,
          false
        );
        
        expect(result).toMatchSnapshot();
      });
    });
  });
});