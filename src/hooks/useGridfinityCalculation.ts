import { useState, useEffect, useMemo } from 'react';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { printerSizes } from '@/lib/utils';
import type { DrawerSize, PrinterSize, GridfinityResult, LayoutItem } from '@/types';

/**
 * Input parameters for the calculation hook
 */
export interface CalculationInput {
  drawerSize: DrawerSize | null;
  selectedPrinter: string;
  customPrinterSize?: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
  preferUniformBaseplates: boolean;
  numDrawers: number;
}

/**
 * Extended result with drawer count
 */
export interface CalculationResultWithDrawers extends Omit<GridfinityResult, 'layout'> {
  numDrawers: number;
}

/**
 * Return type for the calculation hook
 */
export interface CalculationOutput {
  result: CalculationResultWithDrawers | null;
  layout: LayoutItem[];
  printerSize: PrinterSize;
  isCalculating: boolean;
}

/**
 * Custom hook for Gridfinity calculation logic
 * Encapsulates the calculation and memoizes results for performance
 */
export const useGridfinityCalculation = ({
  drawerSize,
  selectedPrinter,
  customPrinterSize,
  useHalfSize,
  preferHalfSize,
  preferUniformBaseplates,
  numDrawers,
}: CalculationInput): CalculationOutput => {
  const [result, setResult] = useState<CalculationResultWithDrawers | null>(null);
  const [layout, setLayout] = useState<LayoutItem[]>([]);

  // Get printer size from selected printer or custom dimensions
  const printerSize = useMemo<PrinterSize>(() => {
    if (selectedPrinter === 'Custom Printer' && customPrinterSize) {
      return customPrinterSize;
    }
    return printerSizes[selectedPrinter] || { x: 256, y: 256, z: 256 };
  }, [selectedPrinter, customPrinterSize]);

  // Memoize the calculation to avoid unnecessary recalculations
  const calculationResult = useMemo<GridfinityResult | null>(() => {
    if (!drawerSize || !printerSize) return null;
    
    return calculateGrids(
      drawerSize,
      printerSize,
      useHalfSize,
      preferHalfSize,
      preferUniformBaseplates
    );
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize, preferUniformBaseplates]);

  // Update state when calculation changes
  useEffect(() => {
    if (calculationResult) {
      const { baseplates, spacers, halfSizeBins, layout } = calculationResult;
      setResult({ baseplates, spacers, halfSizeBins, numDrawers });
      setLayout(layout);
    }
  }, [calculationResult, numDrawers]);

  return {
    result,
    layout,
    printerSize,
    isCalculating: false, // For future loading state
  };
};