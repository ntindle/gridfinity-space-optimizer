import { useState, useEffect, useMemo } from 'react';
import { calculateGrids } from '../utils/gridfinityUtils';
import { printerSizes } from '../lib/utils';

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
  numDrawers,
}) => {
  const [result, setResult] = useState(null);
  const [layout, setLayout] = useState([]);

  // Get printer size from selected printer or custom dimensions
  const printerSize = useMemo(() => {
    if (selectedPrinter === 'Custom Printer' && customPrinterSize) {
      return customPrinterSize;
    }
    return printerSizes[selectedPrinter] || { x: 256, y: 256, z: 256 };
  }, [selectedPrinter, customPrinterSize]);

  // Memoize the calculation to avoid unnecessary recalculations
  const calculationResult = useMemo(() => {
    if (!drawerSize || !printerSize) return null;
    
    return calculateGrids(
      drawerSize,
      printerSize,
      useHalfSize,
      preferHalfSize
    );
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize]);

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