/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomPrinter } from './useCustomPrinter';

interface MockStorage {
  [key: string]: string;
}

describe('useCustomPrinter', () => {
  let mockStorage: MockStorage = {};

  beforeEach(() => {
    // Reset mock storage
    mockStorage = {};
    
    // Mock localStorage methods
    global.localStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null)
    } as Storage;
    
    // Reset modules to clear any cached state
    vi.resetModules();
  });

  afterEach(() => {
    mockStorage = {};
  });

  describe('Basic functionality', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      expect(result.current.customDimensions).toEqual({
        x: 200,
        y: 200,
        z: 200,
      });
      
      expect(result.current.inputValues).toEqual({
        x: '200',
        y: '200',
        z: '200',
      });
      
      expect(result.current.errors).toEqual({
        x: null,
        y: null,
        z: null,
      });
    });

    it('should handle dimension input changes in mm', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      act(() => {
        result.current.handleInputChange('x', '250');
      });
      
      expect(result.current.inputValues.x).toBe('250');
      expect(result.current.customDimensions.x).toBe(250);
    });

    it('should handle dimension input changes in inches', () => {
      const { result } = renderHook(() => useCustomPrinter(false));
      
      act(() => {
        result.current.handleInputChange('x', '10');
      });
      
      // The input value is stored exactly as entered by the user
      expect(result.current.inputValues.x).toBe('10');
      expect(result.current.customDimensions.x).toBeCloseTo(254, 0); // 10 inches = 254mm
    });

    it('should validate dimensions', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      act(() => {
        result.current.handleInputChange('x', '700'); // Too large
      });
      
      expect(result.current.errors.x).toContain('exceed');
    });

    it('should reset to defaults', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      act(() => {
        result.current.handleInputChange('x', '300');
        result.current.handleInputChange('y', '350');
      });
      
      expect(result.current.customDimensions.x).toBe(300);
      expect(result.current.customDimensions.y).toBe(350);
      
      act(() => {
        result.current.resetToDefault();
      });
      
      expect(result.current.customDimensions).toEqual({
        x: 200,
        y: 200,
        z: 200,
      });
    });
  });

  describe('Exclusion zone functionality', () => {
    it('should initialize exclusion zones as empty', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      expect(result.current.exclusionZoneInputs).toEqual({
        front: '',
        back: '',
        left: '',
        right: '',
      });
      
      expect(result.current.exclusionZoneErrors).toEqual({
        front: null,
        back: null,
        left: null,
        right: null,
      });
    });

    it('should handle exclusion zone input in mm', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      act(() => {
        result.current.handleExclusionZoneChange('front', '20');
      });
      
      expect(result.current.exclusionZoneInputs.front).toBe('20');
      expect(result.current.customDimensions.exclusionZone?.front).toBe(20);
    });

    it('should handle exclusion zone input in inches', () => {
      const { result } = renderHook(() => useCustomPrinter(false));
      
      act(() => {
        result.current.handleExclusionZoneChange('left', '1');
      });
      
      // The input value is stored exactly as entered by the user
      expect(result.current.exclusionZoneInputs.left).toBe('1');
      expect(result.current.customDimensions.exclusionZone?.left).toBeCloseTo(25.4, 1); // 1 inch = 25.4mm
    });

    it('should validate exclusion zones against printer dimensions', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      // Set printer to 200mm x 200mm
      act(() => {
        result.current.handleInputChange('x', '200');
        result.current.handleInputChange('y', '200');
      });
      
      // Try to set front exclusion larger than Y dimension
      act(() => {
        result.current.handleExclusionZoneChange('front', '250');
      });
      
      expect(result.current.exclusionZoneErrors.front).toContain('exceed');
      expect(result.current.customDimensions.exclusionZone?.front).toBeUndefined();
    });

    it('should clear exclusion zone when empty string is provided', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      // Set an exclusion zone
      act(() => {
        result.current.handleExclusionZoneChange('back', '30');
      });
      
      expect(result.current.customDimensions.exclusionZone?.back).toBe(30);
      
      // Clear it
      act(() => {
        result.current.handleExclusionZoneChange('back', '');
      });
      
      expect(result.current.exclusionZoneInputs.back).toBe('');
      expect(result.current.customDimensions.exclusionZone?.back).toBeUndefined();
    });

    it('should handle multiple exclusion zones', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      act(() => {
        result.current.handleExclusionZoneChange('front', '15');
        result.current.handleExclusionZoneChange('back', '10');
        result.current.handleExclusionZoneChange('left', '20');
        result.current.handleExclusionZoneChange('right', '25');
      });
      
      expect(result.current.customDimensions.exclusionZone).toEqual({
        front: 15,
        back: 10,
        left: 20,
        right: 25,
      });
    });

    it('should reset exclusion zones when resetting to defaults', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      // Set some exclusion zones
      act(() => {
        result.current.handleExclusionZoneChange('front', '20');
        result.current.handleExclusionZoneChange('left', '15');
      });
      
      expect(result.current.customDimensions.exclusionZone?.front).toBe(20);
      expect(result.current.customDimensions.exclusionZone?.left).toBe(15);
      
      // Reset
      act(() => {
        result.current.resetToDefault();
      });
      
      expect(result.current.exclusionZoneInputs).toEqual({
        front: '',
        back: '',
        left: '',
        right: '',
      });
      expect(result.current.customDimensions.exclusionZone).toBeUndefined();
    });

    it('should validate left/right exclusions against X dimension', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      // Set X dimension
      act(() => {
        result.current.handleInputChange('x', '150');
      });
      
      // Try to set left exclusion larger than X
      act(() => {
        result.current.handleExclusionZoneChange('left', '200');
      });
      
      expect(result.current.exclusionZoneErrors.left).toContain('exceed');
      
      // Try to set right exclusion larger than X
      act(() => {
        result.current.handleExclusionZoneChange('right', '200');
      });
      
      expect(result.current.exclusionZoneErrors.right).toContain('exceed');
    });

    it('should validate front/back exclusions against Y dimension', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      // Set Y dimension
      act(() => {
        result.current.handleInputChange('y', '180');
      });
      
      // Valid front exclusion
      act(() => {
        result.current.handleExclusionZoneChange('front', '50');
      });
      
      expect(result.current.exclusionZoneErrors.front).toBeNull();
      expect(result.current.customDimensions.exclusionZone?.front).toBe(50);
      
      // Invalid back exclusion
      act(() => {
        result.current.handleExclusionZoneChange('back', '200');
      });
      
      expect(result.current.exclusionZoneErrors.back).toContain('exceed');
    });
  });

  describe('Unit conversion', () => {
    it('should convert exclusion zones when unit changes', () => {
      // Start in mm mode
      const { result, rerender } = renderHook(
        ({ useMm }) => useCustomPrinter(useMm),
        { initialProps: { useMm: true } }
      );
      
      // Set exclusion in mm
      act(() => {
        result.current.handleExclusionZoneChange('front', '25.4');
      });
      
      expect(result.current.exclusionZoneInputs.front).toBe('25.4');
      
      // Switch to inches
      rerender({ useMm: false });
      
      // Should show as 1.0 inches
      expect(result.current.exclusionZoneInputs.front).toBe('1.0');
    });
  });

  describe('Persistence', () => {
    it('should persist custom dimensions with exclusion zones', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      act(() => {
        result.current.handleInputChange('x', '300');
        result.current.handleExclusionZoneChange('front', '20');
        result.current.handleExclusionZoneChange('left', '15');
      });
      
      // Check that the state was updated
      expect(result.current.customDimensions.x).toBe(300);
      expect(result.current.customDimensions.exclusionZone?.front).toBe(20);
      expect(result.current.customDimensions.exclusionZone?.left).toBe(15);
      
      // The actual localStorage persistence is handled by usePersistedState
      // and tested in its own test file
    });

    it('should handle exclusion zones in custom dimensions', () => {
      const { result } = renderHook(() => useCustomPrinter(true));
      
      // Set dimensions with exclusion zones
      act(() => {
        result.current.handleInputChange('x', '250');
        result.current.handleInputChange('y', '210');
        result.current.handleExclusionZoneChange('front', '18');
        result.current.handleExclusionZoneChange('back', '12');
      });
      
      // Verify the values are set correctly
      expect(result.current.customDimensions.x).toBe(250);
      expect(result.current.customDimensions.y).toBe(210);
      expect(result.current.customDimensions.exclusionZone?.front).toBe(18);
      expect(result.current.customDimensions.exclusionZone?.back).toBe(12);
      expect(result.current.exclusionZoneInputs.front).toBe('18');
      expect(result.current.exclusionZoneInputs.back).toBe('12');
    });
  });
});