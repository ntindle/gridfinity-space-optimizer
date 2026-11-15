import { useState, useMemo } from 'react';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { printerSizes } from '@/lib/utils';
import type { DrawerSize, PrinterSize, GridfinityResult, LayoutItem } from '@/types';

export interface CalculationInput {
  drawerSize: DrawerSize | null;
  selectedPrinter: string;
  customPrinterSize?: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
  preferUniformBaseplates: boolean;
  numDrawers: number;
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
    
    return calculateGrids(
      drawerSize,
      printerSize,
      useHalfSize,
      preferHalfSize,
      preferUniformBaseplates
    );
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize, preferUniformBaseplates]);

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