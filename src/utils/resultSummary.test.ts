import { describe, it, expect } from 'vitest';
import { countResult, summaryParts } from './resultSummary';
import type { CalculationResultWithDrawers } from '@/hooks/useGridfinityCalculation';

const makeResult = (
  overrides: Partial<CalculationResultWithDrawers> = {},
): CalculationResultWithDrawers => ({
  baseplates: { '6x6': 2, '1x6': 1 },
  halfSizeBins: { '2x2': 4 },
  spacers: { '25.5mm x 252mm': 1, '252mm x 41.1mm': 2 },
  numDrawers: 1,
  ...overrides,
});

describe('resultSummary', () => {
  it('totals every group and multiplies by the drawer count', () => {
    expect(countResult(makeResult({ numDrawers: 3 }))).toEqual({
      baseplates: 9,
      bins: 0,
      spacers: 9,
    });
  });

  it('only counts half-size bins when half-size bins are in use', () => {
    expect(countResult(makeResult(), false, true).bins).toBe(4);
    expect(countResult(makeResult(), true, false)).toEqual({
      baseplates: 0,
      bins: 4,
      spacers: 3,
    });
  });

  it('builds pluralized parts and skips empty counts', () => {
    expect(summaryParts({ baseplates: 1, bins: 0, spacers: 2 })).toEqual([
      '1 baseplate',
      '2 spacers',
    ]);
    expect(summaryParts({ baseplates: 0, bins: 8, spacers: 1 }, 'half-size bin')).toEqual([
      '8 half-size bins',
      '1 spacer',
    ]);
    expect(summaryParts({ baseplates: 0, bins: 0, spacers: 0 })).toEqual([]);
  });
});
