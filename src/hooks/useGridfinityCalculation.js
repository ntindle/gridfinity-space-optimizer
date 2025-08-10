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
  useHalfSize,
  preferHalfSize,
  numDrawers,
}) => {
  const [result, setResult] = useState(null);
  const [layout, setLayout] = useState([]);

  // Get printer size from selected printer
  const printerSize = useMemo(() => {
    if (selectedPrinter === 'custom') {
      // Default custom size - will be made configurable in Phase 3
      return { x: 200, y: 200, z: 200 };
    }
    return printerSizes[selectedPrinter] || { x: 256, y: 256, z: 256 };
  }, [selectedPrinter]);

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