import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGridfinityCalculation } from './useGridfinityCalculation';
import type { DrawerSize, PrinterSize, GridfinityResult } from '@/types/gridfinity';

// Mock the calculateGrids function
vi.mock('../utils/gridfinityUtils', () => ({
  calculateGrids: vi.fn((drawerSize: DrawerSize, printerSize: PrinterSize, useHalfSize: boolean): GridfinityResult => ({
    baseplates: {
      '3x3': 4,
      '2x2': 2,
    },
    spacers: {
      '10x10mm': 2,
    },
    halfSizeBins: useHalfSize ? { '1x1': 8 } : {},
    layout: [
      { type: 'baseplate', x: 0, y: 0, width: 3, height: 3, pixelX: 0, pixelY: 0, pixelWidth: 126, pixelHeight: 126 },
      { type: 'baseplate', x: 3, y: 0, width: 3, height: 3, pixelX: 126, pixelY: 0, pixelWidth: 126, pixelHeight: 126 },
    ],
  })),
}));

// Mock printerSizes
vi.mock('../lib/utils', () => ({
  printerSizes: {
    'Test Printer': { x: 200, y: 200, z: 200 },
    'Large Printer': { x: 300, y: 300, z: 300 },
  },
}));


describe.skip('useGridfinityCalculation', () => {
  it('should calculate results for standard printer', () => {
    const { result } = renderHook(() =>
      useGridfinityCalculation({
        drawerSize: { width: 10, height: 10 },
        selectedPrinter: 'Test Printer',
        customPrinterSize: null,
        useHalfSize: false,
        preferHalfSize: false,
        numDrawers: 1,
      })
    );

    expect(result.current.result).toBeDefined();
    expect(result.current.result?.baseplates).toEqual({
      '3x3': 4,
      '2x2': 2,
    });
    expect(result.current.result?.numDrawers).toBe(1);
    expect(result.current.layout).toHaveLength(2);
    expect(result.current.printerSize).toEqual({ x: 200, y: 200, z: 200 });
    expect(result.current.isCalculating).toBe(false);
  });

  it('should use custom printer size when selected', () => {
    const customSize: PrinterSize = { x: 250, y: 250, z: 250 };
    
    const { result } = renderHook(() =>
      useGridfinityCalculation({
        drawerSize: { width: 10, height: 10 },
        selectedPrinter: 'Custom Printer',
        customPrinterSize: customSize,
        useHalfSize: false,
        preferHalfSize: false,
        numDrawers: 1,
      })
    );

    expect(result.current.printerSize).toEqual(customSize);
  });

  it('should handle half-size bins when enabled', () => {
    const { result } = renderHook(() =>
      useGridfinityCalculation({
        drawerSize: { width: 10, height: 10 },
        selectedPrinter: 'Test Printer',
        customPrinterSize: null,
        useHalfSize: true,
        preferHalfSize: false,
        numDrawers: 1,
      })
    );

    expect(result.current.result?.halfSizeBins).toBeDefined();
    expect(result.current.result?.halfSizeBins).toEqual({ '1x1': 8 });
  });

  it('should multiply results by number of drawers', () => {
    const { result } = renderHook(() =>
      useGridfinityCalculation({
        drawerSize: { width: 10, height: 10 },
        selectedPrinter: 'Test Printer',
        customPrinterSize: null,
        useHalfSize: false,
        preferHalfSize: false,
        numDrawers: 3,
      })
    );

    expect(result.current.result?.numDrawers).toBe(3);
  });

  it('should memoize printer size calculation', () => {
    const { result, rerender } = renderHook(
      ({ selectedPrinter }: { selectedPrinter: string }) =>
        useGridfinityCalculation({
          drawerSize: { width: 10, height: 10 },
          selectedPrinter,
          customPrinterSize: null,
          useHalfSize: false,
          preferHalfSize: false,
          numDrawers: 1,
        }),
      {
        initialProps: { selectedPrinter: 'Test Printer' },
      }
    );

    const initialPrinterSize = result.current.printerSize;

    // Rerender with same printer
    rerender({ selectedPrinter: 'Test Printer' });
    expect(result.current.printerSize).toBe(initialPrinterSize);

    // Rerender with different printer
    rerender({ selectedPrinter: 'Large Printer' });
    expect(result.current.printerSize).not.toBe(initialPrinterSize);
    expect(result.current.printerSize).toEqual({ x: 300, y: 300, z: 300 });
  });

  it('should handle null drawer size gracefully', () => {
    const { result } = renderHook(() =>
      useGridfinityCalculation({
        drawerSize: null,
        selectedPrinter: 'Test Printer',
        customPrinterSize: null,
        useHalfSize: false,
        preferHalfSize: false,
        numDrawers: 1,
      })
    );

    expect(result.current.result).toBeNull();
    expect(result.current.layout).toEqual([]);
  });

  it('should use default printer size for unknown printer', () => {
    const { result } = renderHook(() =>
      useGridfinityCalculation({
        drawerSize: { width: 10, height: 10 },
        selectedPrinter: 'Unknown Printer',
        customPrinterSize: null,
        useHalfSize: false,
        preferHalfSize: false,
        numDrawers: 1,
      })
    );

    expect(result.current.printerSize).toEqual({ x: 256, y: 256, z: 256 });
  });

  it('should update results when inputs change', () => {
    const { result, rerender } = renderHook(
      ({ useHalfSize }: { useHalfSize: boolean }) =>
        useGridfinityCalculation({
          drawerSize: { width: 10, height: 10 },
          selectedPrinter: 'Test Printer',
          customPrinterSize: null,
          useHalfSize,
          preferHalfSize: false,
          numDrawers: 1,
        }),
      {
        initialProps: { useHalfSize: false },
      }
    );

    expect(result.current.result?.halfSizeBins).toEqual({});

    rerender({ useHalfSize: true });
    expect(result.current.result?.halfSizeBins).toBeDefined();
  });
});