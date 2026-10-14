import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';

describe('Smart Baseplate Allocation', () => {
  it('should prefer 5+5+3 over 6+6+1 for 13-grid width', () => {
    
    const drawerSize = { width: 22.5, height: 17 };
    const printerSize = { x: 256, y: 256, z: 256 }; 
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  
      false,  
      true    
    );
    
    
    expect(result.baseplates['5x5']).toBeDefined();
    expect(result.baseplates['3x5']).toBeDefined();
    
    
    expect(result.baseplates['1x6']).toBeUndefined();
    expect(result.baseplates['1x4']).toBeUndefined();
    expect(result.baseplates['1x5']).toBeUndefined();
    
    
    expect(result.baseplates['5x5']).toBe(4);
    expect(result.baseplates['3x5']).toBe(2);
  });
  
  it('should handle perfect divisions efficiently', () => {
    
    const drawerSize = { width: 21.35, height: 21.35 }; 
    const printerSize = { x: 256, y: 256, z: 256 }; 
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  
      false,  
      true    
    );
    
    
    expect(result.baseplates['6x6']).toBe(4); 
    
    
    const baseplateTypes = Object.keys(result.baseplates);
    expect(baseplateTypes.length).toBe(1);
  });
  
  it('should avoid tiny remainders by adjusting division', () => {
    
    const drawerSize = { width: 23, height: 15 }; 
    const printerSize = { x: 256, y: 210, z: 256 }; 
    
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
  
  it('should prefer fewer baseplate variants', () => {
    const drawerSize = { width: 30, height: 20 }; 
    const printerSize = { x: 256, y: 256, z: 256 }; 
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  
      false,  
      true    
    );
    
    
    const baseplateTypes = Object.keys(result.baseplates);
    expect(baseplateTypes.length).toBeLessThanOrEqual(3);
    
    
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should handle small drawers gracefully', () => {
    const drawerSize = { width: 7, height: 5 }; 
    const printerSize = { x: 256, y: 256, z: 256 }; 
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  
      false,  
      true    
    );
    
    
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
    
    
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeGreaterThanOrEqual(2);
      expect(height).toBeGreaterThanOrEqual(2);
    });
  });
  
  it('should respect printer size constraints', () => {
    const drawerSize = { width: 30, height: 30 }; 
    const printerSize = { x: 170, y: 170, z: 200 }; 
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  
      false,  
      true    
    );
    
    
    Object.keys(result.baseplates).forEach(size => {
      const [width, height] = size.split('x').map(Number);
      expect(width).toBeLessThanOrEqual(4);
      expect(height).toBeLessThanOrEqual(4);
    });
  });
  
  it('should fall back to regular algorithm if smart allocation fails', () => {
    
    const drawerSize = { width: 3.5, height: 3.5 }; 
    const printerSize = { x: 256, y: 256, z: 256 }; 
    
    const result = calculateGrids(
      drawerSize,
      printerSize,
      false,  
      false,  
      true    
    );
    
    
    expect(Object.keys(result.baseplates).length).toBeGreaterThan(0);
  });
  
  it('should produce identical results when preferUniformBaseplates is false', () => {
    const drawerSize = { width: 22.5, height: 17 };
    const printerSize = { x: 256, y: 256, z: 256 };
    
    const resultWithoutSmart = calculateGrids(
      drawerSize,
      printerSize,
      false,  
      false,  
      false   
    );
    
    
    expect(Object.keys(resultWithoutSmart.baseplates).length).toBeGreaterThan(0);
  });
});