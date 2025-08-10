import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';

describe('gridfinityUtils - Snapshot Tests', () => {
  describe('Standard configurations snapshots', () => {
    it('should match snapshot for standard US drawer', () => {
      const result = calculateGrids(
        { width: 22.5, height: 16.5 },
        { x: 256, y: 256, z: 256 },
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for metric drawer', () => {
      const result = calculateGrids(
        { width: 500 / 25.4, height: 400 / 25.4 },
        { x: 256, y: 256, z: 256 },
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot with half-size bins enabled', () => {
      const result = calculateGrids(
        { width: 10, height: 8 },
        { x: 200, y: 200, z: 200 },
        true,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot with prefer half-size', () => {
      const result = calculateGrids(
        { width: 10, height: 8 },
        { x: 200, y: 200, z: 200 },
        false,
        true
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for small printer', () => {
      const result = calculateGrids(
        { width: 15, height: 12 },
        { x: 150, y: 150, z: 150 },
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for large printer', () => {
      const result = calculateGrids(
        { width: 15, height: 12 },
        { x: 350, y: 350, z: 350 },
        false,
        false
      );
      
      expect(result).toMatchSnapshot();
    });
  });

  describe('Common drawer sizes', () => {
    const commonSizes = [
      { name: 'IKEA MAXIMERA small', width: 300 / 25.4, height: 370 / 25.4 },
      { name: 'IKEA MAXIMERA medium', width: 400 / 25.4, height: 370 / 25.4 },
      { name: 'IKEA MAXIMERA large', width: 500 / 25.4, height: 370 / 25.4 },
      { name: 'US Kitchen standard', width: 22, height: 20 },
      { name: 'US Desk drawer', width: 14, height: 10 },
      { name: 'Toolbox drawer', width: 18, height: 12 },
    ];

    commonSizes.forEach(({ name, width, height }) => {
      it(`should match snapshot for ${name}`, () => {
        const result = calculateGrids(
          { width, height },
          { x: 256, y: 256, z: 256 },
          false,
          false
        );
        
        expect(result).toMatchSnapshot();
      });
    });
  });

  describe('Common printer sizes', () => {
    const printers = [
      { name: 'Prusa Mini', size: { x: 180, y: 180, z: 180 } },
      { name: 'Ender 3', size: { x: 220, y: 220, z: 250 } },
      { name: 'Prusa MK3S+', size: { x: 250, y: 210, z: 210 } },
      { name: 'Bambu Lab A1', size: { x: 256, y: 256, z: 256 } },
      { name: 'Prusa XL', size: { x: 360, y: 360, z: 360 } },
    ];

    printers.forEach(({ name, size }) => {
      it(`should match snapshot for ${name}`, () => {
        const result = calculateGrids(
          { width: 12, height: 10 }, // Standard test drawer
          size,
          false,
          false
        );
        
        expect(result).toMatchSnapshot();
      });
    });
  });
});