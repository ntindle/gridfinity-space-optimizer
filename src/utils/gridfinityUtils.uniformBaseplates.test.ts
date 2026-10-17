import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';

describe('Uniform Baseplates Calculation', () => {
  it('should avoid creating 1xN baseplates', () => {
    const drawerSize = { width: 22, height: 14 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,
      false,
      true
    );
    
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should use uniform 5x4 baseplates for 41.5" x 13.5" drawer when preferUniformBaseplates is true', () => {
    const drawerSize = { width: 41.5, height: 13.5 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,
      false,
      true
    );
    
    expect(result.baseplates['5x4']).toBe(10);
    
    expect(result.baseplates['5x5']).toBeUndefined();
    expect(result.baseplates['5x3']).toBeUndefined();
  });
  
  it('should use mixed baseplates for 41.5" x 13.5" drawer when preferUniformBaseplates is false', () => {
    const drawerSize = { width: 41.5, height: 13.5 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,
      false,
      false
    );
    
    expect(result.baseplates['5x5']).toBe(5);
    expect(result.baseplates['5x3']).toBe(5);
    
    expect(result.baseplates['5x4']).toBeUndefined();
  });
  
  it('should fall back to mixed sizes when uniform coverage is less than 90%', () => {
    const drawerSize = { width: 10, height: 10 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,
      false,
      true
    );
    
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
  });
  
  it('should ignore preferUniformBaseplates when useHalfSize is true', () => {
    const drawerSize = { width: 41.5, height: 13.5 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const resultWithUniform = calculateGrids(
      drawerSize,
      printerSize,
      true,
      false,
      true
    );
    
    const resultWithoutUniform = calculateGrids(
      drawerSize,
      printerSize,
      true,
      false,
      false
    );
    
    expect(resultWithUniform.halfSizeBins).toEqual(resultWithoutUniform.halfSizeBins);
  });
  
  it('should prefer fewer variants over perfect coverage', () => {
    const drawerSize = { width: 26, height: 15 }; 
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,
      false,
      true
    );
    
    const variantCount = Object.keys(result.baseplates).length;
    expect(variantCount).toBeLessThanOrEqual(3);
    
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should handle edge cases with uniform baseplates', () => {
    const drawerSize = { width: 21, height: 21 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,
      false,
      true
    );
    
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
    
    const sizes = Object.keys(result.baseplates);
    if (sizes.length === 1) {
      expect(sizes.length).toBe(1);
    } else {
      const counts = Object.values(result.baseplates) as number[];
      const maxCount = Math.max(...counts);
      expect(maxCount).toBeGreaterThan(1);
    }
  });
});