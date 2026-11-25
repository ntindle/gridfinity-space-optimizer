import { useState, useMemo } from 'react';
import { calculateGrids, FULL_GRID_SIZE, HALF_GRID_SIZE } from '@/utils/gridfinityUtils';
import { applyObstacles } from '@/utils/obstacles';
import { printerSizes } from '@/lib/utils';
import type { DrawerSize, Obstacle, PrinterSize, GridfinityResult, LayoutItem } from '@/types';

export interface CalculationInput {
  drawerSize: DrawerSize | null;
  selectedPrinter: string;
  customPrinterSize?: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
  preferUniformBaseplates: boolean;
  numDrawers: number;
  obstacles?: Obstacle[];
}

export interface CalculationResultWithDrawers extends Omit<GridfinityResult, 'layout'> {
  numDrawers: number;
}

export interface CalculationOutput {
  result: CalculationResultWithDrawers | null;
  layout: LayoutItem[];
  printerSize: PrinterSize;
  isCalculating: boolean;
}

export const useGridfinityCalculation = ({
  drawerSize,
  selectedPrinter,
  customPrinterSize,
  useHalfSize,
  preferHalfSize,
  preferUniformBaseplates,
  numDrawers,
  obstacles,
}: CalculationInput): CalculationOutput => {
  const [result, setResult] = useState<CalculationResultWithDrawers | null>(null);
  const [layout, setLayout] = useState<LayoutItem[]>([]);

  const printerSize = useMemo<PrinterSize>(() => {
    if (selectedPrinter === 'Custom Printer' && customPrinterSize) {
      return customPrinterSize;
    }
    return Object.prototype.hasOwnProperty.call(printerSizes, selectedPrinter)
      ? printerSizes[selectedPrinter]
      : { x: 256, y: 256, z: 256 };
  }, [selectedPrinter, customPrinterSize]);

  const calculationResult = useMemo<GridfinityResult | null>(() => {
    if (!drawerSize || !printerSize) return null;

    return applyObstacles(
      calculateGrids(
        drawerSize,
        printerSize,
        useHalfSize,
        preferHalfSize,
        preferUniformBaseplates
      ),
      obstacles ?? [],
      useHalfSize ? HALF_GRID_SIZE : FULL_GRID_SIZE
    );
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize, preferUniformBaseplates, obstacles]);

  const [prevSynced, setPrevSynced] = useState<{
    calculationResult: GridfinityResult | null;
    numDrawers: number;
  }>({ calculationResult: null, numDrawers });

  if (
    calculationResult !== prevSynced.calculationResult ||
    numDrawers !== prevSynced.numDrawers
  ) {
    setPrevSynced({ calculationResult, numDrawers });
    if (calculationResult) {
      const { baseplates, spacers, halfSizeBins, layout } = calculationResult;
      setResult({ baseplates, spacers, halfSizeBins, numDrawers });
      setLayout(layout);
    }
  }

  return {
    result,
    layout,
    printerSize,
    isCalculating: false,
  };
};