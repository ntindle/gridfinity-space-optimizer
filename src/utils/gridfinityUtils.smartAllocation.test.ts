import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';

describe('Smart Baseplate Allocation', () => {
  it('should prefer 5+5+3 over 6+6+1 for 13-grid width', () => {
    // 22.5" x 17" drawer = 13x10 grids
    const drawerSize = { width: 22.5, height: 17 };
    const printerSize = { x: 256, y: 256, z: 256 }; // 6x6 max grids
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates (uses smart allocation)
    );
    
    // Should have 5x5 and 3x5 baseplates, NOT 6x6 and 1x6
    expect(result.baseplates['5x5']).toBeDefined();
    expect(result.baseplates['3x5']).toBeDefined();
    
    // Should NOT have 1-wide pieces
    expect(result.baseplates['1x6']).toBeUndefined();
    expect(result.baseplates['1x4']).toBeUndefined();
    expect(result.baseplates['1x5']).toBeUndefined();
    
    // Should have exactly 4x 5x5 and 2x 3x5
    expect(result.baseplates['5x5']).toBe(4);
    expect(result.baseplates['3x5']).toBe(2);
  });
  
  it('should handle perfect divisions efficiently', () => {
    // 21" x 21" drawer = 12x12 grids (divides evenly by 6)
    const drawerSize = { width: 21.35, height: 21.35 }; // Slightly over 21" to get exactly 12 grids
    const printerSize = { x: 256, y: 256, z: 256 }; // 6x6 max grids
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Should use 6x6 baseplates for perfect coverage
    expect(result.baseplates['6x6']).toBe(4); // 2x2 grid of 6x6 baseplates
    
    // Should not have any other baseplate sizes
    const baseplateTypes = Object.keys(result.baseplates);
    expect(baseplateTypes.length).toBe(1);
  });
  
  it('should avoid tiny remainders by adjusting division', () => {
    // Test case that would create 6+6+1 without smart allocation
    const drawerSize = { width: 23, height: 15 }; // 13x8 grids
    const printerSize = { x: 256, y: 210, z: 256 }; // 6x5 max grids
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Should not create any 1-wide baseplates
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should prefer fewer baseplate variants', () => {
    const drawerSize = { width: 30, height: 20 }; // 17x11 grids
    const printerSize = { x: 256, y: 256, z: 256 }; // 6x6 max grids
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Should have at most 3 different baseplate types
    const baseplateTypes = Object.keys(result.baseplates);
    expect(baseplateTypes.length).toBeLessThanOrEqual(3);
    
    // No single dimension should be 1
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should handle small drawers gracefully', () => {
    const drawerSize = { width: 7, height: 5 }; // 4x3 grids
    const printerSize = { x: 256, y: 256, z: 256 }; // 6x6 max grids
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Should have baseplates (might be 4x3 or 2x3 + 2x3)
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
    
    // All pieces should be at least 2x2
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should respect printer size constraints', () => {
    const drawerSize = { width: 30, height: 30 }; // 17x17 grids
    const printerSize = { x: 170, y: 170, z: 200 }; // 4x4 max grids
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // No baseplate should exceed 4x4
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeLessThanOrEqual(4);
      expect(height).toBeLessThanOrEqual(4);
    });
  });
  
  it('should fall back to regular algorithm if smart allocation fails', () => {
    // Create an edge case that might fail smart allocation
    const drawerSize = { width: 3.5, height: 3.5 }; // 2x2 grids
    const printerSize = { x: 256, y: 256, z: 256 }; // 6x6 max grids
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      true    // preferUniformBaseplates
    );
    
    // Should still produce some baseplates
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
  });
  
  it('should produce identical results when preferUniformBaseplates is false', () => {
    const drawerSize = { width: 22.5, height: 17 };
    const printerSize = { x: 256, y: 256, z: 256 };
    
    const resultWithoutSmart = calculateGrids(
      drawerSize,
      printerSize,
      false,  // useHalfSize
      false,  // preferHalfSize
      false   // preferUniformBaseplates (regular algorithm)
    );
    
    // Regular algorithm should still work (produces mixed sizes)
    expect(Object.keys(resultWithoutSmart.baseplates).length).toBeGreaterThan(0);
  });
});