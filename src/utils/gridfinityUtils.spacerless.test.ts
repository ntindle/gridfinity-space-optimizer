import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';
import { applyObstacles } from './obstacles';
import { collectPrintParts } from './printParts';
import { gridCells } from './bins';
import type { DrawerSize, PrinterSize } from '@/types';

const printer: PrinterSize = { x: 256, y: 256, z: 256 };
const inches = (mm: number): number => mm / 25.4;

const spacerless = (drawer: DrawerSize, overrides: Partial<PrinterSize> = {}) =>
  calculateGrids(drawer, { ...printer, ...overrides }, false, false, false, true);

describe('spacerless fitting', () => {
  it('extends edge baseplates instead of emitting spacers', () => {
    const result = spacerless({ width: 22.5, height: 16.5 });
    expect(result.spacers).toEqual({});
    expect(result.layout.some((item) => item.type === 'spacer')).toBe(false);
    const right = result.layout.filter((item) => (item.extendRightMm ?? 0) > 0);
    const bottom = result.layout.filter((item) => (item.extendBottomMm ?? 0) > 0);
    expect(right.length).toBeGreaterThan(0);
    expect(bottom.length).toBeGreaterThan(0);
    for (const item of right) {
      expect(item.extendRightMm).toBeCloseTo(25.5, 6);
      expect(item.pixelX + item.pixelWidth).toBeCloseTo(571.5, 6);
      expect(item.pixelWidth).toBeCloseTo(item.width * 42 + 25.5, 6);
    }
    for (const item of bottom) {
      expect(item.extendBottomMm).toBeCloseTo(41.1, 6);
      expect(item.pixelY + item.pixelHeight).toBeCloseTo(419.1, 6);
    }
    const corner = result.layout.find(
      (item) => (item.extendRightMm ?? 0) > 0 && (item.extendBottomMm ?? 0) > 0
    );
    expect(corner).toBeDefined();
    expect(Object.keys(result.baseplates).some((key) => key.includes('+25.5+41.1'))).toBe(true);
  });

  it('keeps whole-cell placement unchanged', () => {
    const drawer = { width: 22.5, height: 16.5 };
    const plain = calculateGrids(drawer, printer, false, false, false, false);
    const extended = spacerless(drawer);
    expect(gridCells(extended.layout)).toEqual(gridCells(plain.layout));
  });

  it('leaves an exact-fit axis untouched', () => {
    const result = spacerless({ width: inches(504), height: inches(462) });
    expect(result.spacers).toEqual({});
    expect(result.layout.every((item) => item.extendRightMm === undefined)).toBe(true);
    expect(result.layout.every((item) => item.extendBottomMm === undefined)).toBe(true);
  });

  it('narrows the edge column so extended pieces fit the bed', () => {
    const result = spacerless({ width: inches(545), height: inches(420) });
    expect(result.spacers).toEqual({});
    for (const item of result.layout) {
      expect(item.pixelWidth).toBeLessThanOrEqual(256 + 1e-9);
      expect(item.pixelHeight).toBeLessThanOrEqual(256 + 1e-9);
    }
    const right = result.layout.filter((item) => (item.extendRightMm ?? 0) > 0);
    expect(right.length).toBeGreaterThan(0);
    for (const item of right) {
      expect(item.width).toBe(5);
      expect(item.pixelWidth).toBeCloseTo(5 * 42 + 41, 6);
    }
    const totalCells = result.layout.reduce((sum, item) => sum + item.width * item.height, 0);
    expect(totalCells).toBe(12 * 10);
  });

  it('falls back to a spacer when the bed cannot reserve the remainder', () => {
    const result = spacerless({ width: inches(502), height: inches(420) }, { x: 50 });
    expect(result.layout.some((item) => item.type === 'spacer')).toBe(true);
    expect(result.layout.every((item) => item.extendRightMm === undefined)).toBe(true);
    expect(Object.keys(result.spacers).length).toBeGreaterThan(0);
  });

  it('works on the half-size grid', () => {
    const result = calculateGrids(
      { width: 22.5, height: 16.5 },
      printer,
      true,
      false,
      false,
      true
    );
    expect(result.spacers).toEqual({});
    const right = result.layout.filter((item) => (item.extendRightMm ?? 0) > 0);
    expect(right.length).toBeGreaterThan(0);
    for (const item of right) {
      expect(item.extendRightMm).toBeCloseTo(4.5, 6);
      expect(item.pixelWidth).toBeCloseTo(item.width * 21 + 4.5, 6);
    }
    const totalCells = result.layout.reduce((sum, item) => sum + item.width * item.height, 0);
    expect(totalCells).toBe(27 * 19);
  });

  it('bypasses half-size gap filling while on', () => {
    const result = calculateGrids(
      { width: 22.5, height: 16.5 },
      printer,
      false,
      true,
      false,
      true
    );
    expect(result.layout.some((item) => item.type === 'half-size')).toBe(false);
    expect(result.layout.some((item) => item.type === 'spacer')).toBe(false);
  });

  it('clips extensions at obstacle-blocked cells', () => {
    const base = spacerless({ width: 22.5, height: 16.5 });
    const result = applyObstacles(
      base,
      [{ id: 'obs-1', x: 546, y: 0, width: 25.5, depth: 84 }],
      42
    );
    for (const item of result.layout) {
      const overlapsX = item.pixelX < 571.5 && item.pixelX + item.pixelWidth > 546;
      const overlapsY = item.pixelY < 84 && item.pixelY + item.pixelHeight > 0;
      expect(overlapsX && overlapsY).toBe(false);
    }
    const { parts } = collectPrintParts({
      layout: result.layout,
      bins: [],
      numDrawers: 1,
      printerSize: printer,
      connectors: true,
    });
    for (const part of parts) {
      if ((part.gridGeometry?.extendRightMm ?? 0) > 0) {
        expect(part.gridGeometry?.connectors?.right).toBeUndefined();
      }
    }
    const obstacleFacing = parts.find(
      (part) =>
        part.gridGeometry?.columns === 5 &&
        part.gridGeometry?.rows === 4 &&
        part.gridGeometry?.extendRightMm === undefined
    );
    expect(obstacleFacing).toBeDefined();
    expect(obstacleFacing?.gridGeometry?.connectors?.right).toBeUndefined();
    const clipped = result.layout.filter(
      (item) => item.pixelY < 84 && item.pixelX + item.pixelWidth <= 546 + 1e-9
    );
    expect(clipped.length).toBeGreaterThan(0);
    expect(clipped.every((item) => item.extendRightMm === undefined)).toBe(true);
  });

  it('labels extended parts with cells and extension', () => {
    const result = spacerless({ width: 22.5, height: 16.5 });
    const { parts } = collectPrintParts({
      layout: result.layout,
      bins: [],
      numDrawers: 1,
      printerSize: printer,
    });
    expect(parts.some((part) => part.kind === 'spacer')).toBe(false);
    const extended = parts.filter(
      (part) => (part.gridGeometry?.extendRightMm ?? 0) > 0
    );
    expect(extended.length).toBeGreaterThan(0);
    for (const part of extended) {
      expect(part.label).toContain('+25.5 mm right edge');
      expect(part.gridGeometry?.columns).toBe(5);
      expect(part.width).toBeCloseTo(5 * 42 + 25.5, 6);
      expect(part.stem).toContain('25.5mm-right-edge');
    }
  });
});
