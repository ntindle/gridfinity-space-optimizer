import { describe, it, expect } from 'vitest';
import {
  countPrintJobs,
  MAX_STACK_LAYERS,
  maxStackLayers,
  planPlateStack,
} from './stackPlan';
import type { PrintPartSummary } from './printParts';
import type { Plate } from './printPlan';

const part = (key: string, kind: PrintPartSummary['kind'], height: number): PrintPartSummary => ({
  key,
  kind,
  swatch: kind === 'bin' || kind === 'lid' ? 'bin' : kind === 'spacer' ? 'spacer' : 'baseplate',
  label: key,
  stem: key,
  width: 42,
  depth: 42,
  height,
  count: 1,
});

const byKey = new Map(
  [part('plate', 'baseplate', 5), part('spacer', 'spacer', 5), part('bin', 'bin', 26.4)].map(
    (p) => [p.key, p]
  )
);

const plate = (copies: number, keys: string[]): Plate => ({
  copies,
  parts: keys.map((key) => ({ key, count: 1 })),
  placements: [],
});

describe('maxStackLayers', () => {
  it('fits n parts plus n − 1 gaps under the Z limit minus the margin', () => {
    expect(maxStackLayers(5, 25)).toBe(3);
  });

  it('caps tall printers at the practical limit', () => {
    expect(maxStackLayers(5, 256)).toBe(MAX_STACK_LAYERS);
  });

  it('never goes below one layer', () => {
    expect(maxStackLayers(5, 6)).toBe(1);
  });
});

describe('planPlateStack', () => {
  it('stacks repeated flat plates and balances the stacks', () => {
    expect(planPlateStack(plate(12, ['plate', 'spacer']), byKey, 256)).toEqual({ layers: 6, jobs: 2 });
    expect(planPlateStack(plate(4, ['plate']), byKey, 256)).toEqual({ layers: 4, jobs: 1 });
  });

  it('skips single plates, plates with bins, and printers too short to stack', () => {
    expect(planPlateStack(plate(1, ['plate']), byKey, 256)).toBeNull();
    expect(planPlateStack(plate(4, ['plate', 'bin']), byKey, 256)).toBeNull();
    expect(planPlateStack(plate(4, ['plate']), byKey, 12)).toBeNull();
  });
});

describe('countPrintJobs', () => {
  it('counts copies, or stacks when stacking', () => {
    const plates = [plate(12, ['plate']), plate(3, ['bin']), plate(1, ['spacer'])];
    expect(countPrintJobs(plates, byKey, 256, false)).toBe(16);
    expect(countPrintJobs(plates, byKey, 256, true)).toBe(6);
  });
});
