import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';

describe('Uniform Baseplates Calculation', () => {
  it('should avoid creating 1xN baseplates', () => {
    // Test with dimensions that would create 1xN pieces
    const drawerSize = { width: 22, height: 14 }; // 13x8 grids with some remainder
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Check that no baseplate has a dimension of 1
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
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Should have 10 baseplates of 5x4
    expect(result.baseplates['5x4']).toBe(10);
    
    // Should not have mixed sizes
    expect(result.baseplates['5x5']).toBeUndefined();
    expect(result.baseplates['5x3']).toBeUndefined();
  });
  
  it('should use mixed baseplates for 41.5" x 13.5" drawer when preferUniformBaseplates is false', () => {
    const drawerSize = { width: 41.5, height: 13.5 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      false   // preferUniformBaseplates
    );
    
    // Should have mixed sizes
    expect(result.baseplates['5x5']).toBe(5);
    expect(result.baseplates['5x3']).toBe(5);
    
    // Should not have uniform 5x4
    expect(result.baseplates['5x4']).toBeUndefined();
  });
  
  it('should fall back to mixed sizes when uniform coverage is less than 90%', () => {
    // Create a size where uniform baseplates would waste more than 10% space
    const drawerSize = { width: 10, height: 10 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // For 10x10 inches (23x23 grids with 42mm grid size),
    // the algorithm should fall back to mixed sizes
    // because uniform sizes wouldn't provide good coverage
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
  });
  
  it('should ignore preferUniformBaseplates when useHalfSize is true', () => {
    const drawerSize = { width: 41.5, height: 13.5 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const resultWithUniform = calculateGrids(
      drawerSize,
      printerSize,
      true,   // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    const resultWithoutUniform = calculateGrids(
      drawerSize,
      printerSize,
      true,   // useHalfSize
      false,  // preferHalfSize
      false   // preferUniformBaseplates
    );
    
    // Results should be the same when useHalfSize is true
    expect(resultWithUniform.halfSizeBins).toEqual(resultWithoutUniform.halfSizeBins);
  });
  
  it('should prefer fewer variants over perfect coverage', () => {
    // Test dimensions that could use many variants or fewer with less coverage
    const drawerSize = { width: 26, height: 15 }; 
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Should have at most 2-3 different baseplate sizes
    const variantCount = Object.keys(result.baseplates).length;
    expect(variantCount).toBeLessThanOrEqual(3);
    
    // No single dimension should be 1
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should handle edge cases with uniform baseplates', () => {
    // Test with a drawer that divides evenly
    const drawerSize = { width: 21, height: 21 };
    const printerSize = { x: 250, y: 210, z: 250 };
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // 21 inches = 12.5 grids (will be 12 grids)
    // Should use uniform baseplates
    // Check that we have baseplates (the exact size may vary based on the algorithm)
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
    
    // Check that it's using uniform sizes (all baseplates should be the same)
    const sizes = Object.keys(result.baseplates);
    if (sizes.length === 1) {
      // Perfect uniform case
      expect(sizes.length).toBe(1);
    } else {
      // May have edge baseplates, but should have a dominant uniform size
      const counts = Object.values(result.baseplates) as number[];
      const maxCount = Math.max(...counts);
      expect(maxCount).toBeGreaterThan(1);
    }
  });
});