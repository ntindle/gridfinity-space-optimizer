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
  it('counts half-size pieces as baseplates and multiplies by the drawer count', () => {
    expect(countResult(makeResult({ numDrawers: 3 }))).toEqual({
      bins: 0,
      baseplates: 21,
      spacers: 9,
    });
  });

  it('counts the bins placed in one drawer for every drawer', () => {
    expect(countResult(makeResult({ numDrawers: 2 }), 5).bins).toBe(10);
  });

  it('builds pluralized parts, bins first, and skips empty counts', () => {
    expect(summaryParts({ bins: 0, baseplates: 1, spacers: 2 })).toEqual([
      '1 baseplate',
      '2 spacers',
    ]);
    expect(summaryParts({ bins: 8, baseplates: 6, spacers: 1 })).toEqual([
      '8 bins',
      '6 baseplates',
      '1 spacer',
    ]);
    expect(summaryParts({ bins: 0, baseplates: 0, spacers: 0 })).toEqual([]);
  });
});
