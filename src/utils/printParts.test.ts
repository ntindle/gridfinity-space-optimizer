import { describe, it, expect } from 'vitest';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { collectPrintParts, TEST_FIT_BASEPLATE_KEY, testFitParts } from './printParts';
import type { PrintPartSummary } from './printParts';
import type { Bin, DrawerSize, PrinterSize } from '@/types';

const A1: PrinterSize = { x: 256, y: 256, z: 256 };
const drawer: DrawerSize = { width: 8, height: 4 };
const layout = calculateGrids(drawer, A1, false, false).layout;

const bin = (overrides: Partial<Bin>): Bin => ({
  id: 'b',
  x: 0,
  y: 0,
  width: 84,
  depth: 42,
  height: 6,
  label: '',
  ...overrides,
});

describe('collectPrintParts', () => {
  it('groups identical baseplates and multiplies counts by the drawer count', () => {
    const one = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    const two = collectPrintParts({ layout, bins: [], numDrawers: 2, printerSize: A1 });
    expect(one.skippedBins).toBe(0);
    expect(one.parts.length).toBeGreaterThan(0);
    expect(two.parts).toHaveLength(one.parts.length);
    for (const part of two.parts) {
      const single = one.parts.find((candidate) => candidate.key === part.key);
      expect(part.count).toBe((single?.count ?? 0) * 2);
    }
    const baseplates = one.parts.filter((part) => part.kind === 'baseplate');
    expect(baseplates.length).toBeGreaterThan(0);
    expect(baseplates[0].swatch === 'baseplate' || baseplates[0].swatch === 'half-size').toBe(true);
    expect(baseplates[0].height).toBe(5);
  });

  it('labels spacers with their millimetre size', () => {
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    const spacers = parts.filter((part) => part.kind === 'spacer');
    expect(spacers.length).toBeGreaterThan(0);
    for (const spacer of spacers) {
      expect(spacer.label).toMatch(/^Spacer [\d.]+ × [\d.]+ mm$/);
      expect(spacer.swatch).toBe('spacer');
    }
  });

  it('lists bins first with their spec label, stem, and height', () => {
    const { parts, skippedBins } = collectPrintParts({
      layout,
      bins: [bin({ id: 'one', label: 'Screws' })],
      numDrawers: 1,
      printerSize: A1,
    });
    expect(skippedBins).toBe(0);
    expect(parts[0].kind).toBe('bin');
    expect(parts[0].label).toBe('Bin 2 × 1 · 6u');
    expect(parts[0].stem).toBe('bin-2x1-6u');
    expect(parts[0].swatch).toBe('bin');
    expect(parts[0].binGeometry).toEqual({ columns: 2, rows: 1, cellSize: 42, height: 6 });
  });

  it('leaves out bins that do not fit and counts them as skipped', () => {
    const { parts, skippedBins } = collectPrintParts({
      layout,
      bins: [bin({ id: 'far', x: 10_000, y: 10_000 })],
      numDrawers: 1,
      printerSize: A1,
    });
    expect(skippedBins).toBe(1);
    expect(parts.some((part) => part.kind === 'bin')).toBe(false);
  });

  it('groups identical bins into one part with a multiplied count', () => {
    const { parts, skippedBins } = collectPrintParts({
      layout,
      bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 }), bin({ id: 'c', y: 42, height: 3 })],
      numDrawers: 3,
      printerSize: A1,
    });
    expect(skippedBins).toBe(0);
    const summaries = parts.filter((part) => part.kind === 'bin');
    expect(summaries).toHaveLength(2);
    expect(summaries[0].count).toBe(6);
    expect(summaries[0].label).toBe('Bin 2 × 1 · 6u');
    expect(summaries[1].count).toBe(3);
    expect(summaries[1].label).toBe('Bin 2 × 1 · 3u');
  });
});

describe('testFitParts', () => {
  const baseplate = (overrides: Partial<PrintPartSummary> = {}): PrintPartSummary => ({
    key: 'baseplate:84x84',
    kind: 'baseplate',
    swatch: 'baseplate',
    label: 'Baseplate 2 × 2',
    stem: 'baseplate-2x2',
    width: 84,
    depth: 84,
    height: 5,
    count: 2,
    gridGeometry: { columns: 2, rows: 2, cellSize: 42 },
    ...overrides,
  });
  const spacer = (overrides: Partial<PrintPartSummary> = {}): PrintPartSummary => ({
    key: 'spacer:252x41.1',
    kind: 'spacer',
    swatch: 'spacer',
    label: 'Spacer 252 × 41.1 mm',
    stem: 'spacer-252x41.1mm',
    width: 252,
    depth: 41.1,
    height: 5,
    count: 4,
    ...overrides,
  });

  it('returns a 1 × 1 baseplate with spec geometry', () => {
    const [part] = testFitParts([]);
    expect(part.key).toBe(TEST_FIT_BASEPLATE_KEY);
    expect(part.kind).toBe('baseplate');
    expect(part.label).toBe('Baseplate 1 × 1');
    expect(part.width).toBe(42);
    expect(part.depth).toBe(42);
    expect(part.height).toBe(5);
    expect(part.count).toBe(1);
    expect(part.gridGeometry).toEqual({ columns: 1, rows: 1, cellSize: 42 });
  });

  it('adds one edge spacer, the first spacer by key', () => {
    const wide = spacer({ key: 'spacer:252x41.1', count: 4 });
    const narrow = spacer({
      key: 'spacer:35.2x101.6',
      label: 'Spacer 35.2 × 101.6 mm',
      stem: 'spacer-35.2x101.6mm',
      width: 35.2,
      depth: 101.6,
      count: 2,
    });
    const parts = testFitParts([baseplate(), narrow, wide]);
    expect(parts).toHaveLength(2);
    expect(parts[1].key).toBe('spacer:252x41.1');
    expect(parts[1].count).toBe(1);
    expect(parts[1].width).toBe(252);
    expect(parts[1].depth).toBe(41.1);
  });

  it('returns only the baseplate when the layout has no spacer', () => {
    expect(testFitParts([baseplate()])).toHaveLength(1);
  });

  it('does not change the layout spacer count', () => {
    const original = spacer({ count: 4 });
    testFitParts([baseplate(), original]);
    expect(original.count).toBe(4);
  });
});
