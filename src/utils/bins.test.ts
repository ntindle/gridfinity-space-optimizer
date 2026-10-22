import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';
import {
  MAX_BIN_HEIGHT,
  STACKING_LIP_HEIGHT_MM,
  binIssues,
  binOuterSize,
  binSizeLabel,
  binTotalHeight,
  canPlace,
  cellAt,
  fillEmpty,
  findFreeSpot,
  gridCells,
  groupBins,
  indexCells,
  maxBinHeight,
  sanitizeBins,
  snapMove,
  snapResize,
  spanRect,
  tileSize,
} from './bins';
import type { Bin } from '@/types';

const A1 = { x: 256, y: 256, z: 256 };
const fullLayout = calculateGrids({ width: 22.5, height: 16.5 }, A1, false, false).layout;
const halfLayout = calculateGrids({ width: 22.5, height: 16.5 }, A1, true, false).layout;
const gapLayout = calculateGrids({ width: 22.5, height: 16.5 }, A1, false, true).layout;

const bin = (overrides: Partial<Bin> = {}): Bin => ({
  id: 'b1',
  x: 0,
  y: 0,
  width: 42,
  depth: 42,
  height: 3,
  label: '',
  ...overrides,
});

describe('gridCells', () => {
  it('lists every 42 mm cell under the baseplates, row by row', () => {
    const cells = gridCells(fullLayout);
    expect(cells).toHaveLength(13 * 9);
    expect(cells.every((cell) => cell.size === 42)).toBe(true);
    expect(cells.slice(0, 2)).toEqual([
      { x: 0, y: 0, size: 42 },
      { x: 42, y: 0, size: 42 },
    ]);
    expect(cells[13]).toEqual({ x: 0, y: 42, size: 42 });
  });

  it('uses 21 mm cells on a half-size grid', () => {
    const cells = gridCells(halfLayout);
    expect(cells).toHaveLength(27 * 19);
    expect(new Set(cells.map((cell) => cell.size))).toEqual(new Set([21]));
  });

  it('adds 21 mm cells where half-size baseplates fill the gaps', () => {
    const sizes = gridCells(gapLayout).map((cell) => cell.size);
    expect(sizes.filter((size) => size === 42)).toHaveLength(13 * 9);
    expect(sizes.filter((size) => size === 21).length).toBeGreaterThan(0);
  });
});

describe('placing bins', () => {
  const cells = gridCells(fullLayout);
  const index = indexCells(cells);

  it('finds the cell under a point', () => {
    expect(cellAt(index, 50, 10)).toEqual({ x: 42, y: 0, size: 42 });
    expect(cellAt(index, 560, 10)).toBeNull();
  });

  it('only accepts rectangles tiled by whole cells', () => {
    expect(tileSize(index, { x: 0, y: 0, width: 84, depth: 42 })).toBe(42);
    expect(tileSize(index, { x: 21, y: 0, width: 42, depth: 42 })).toBeNull();
    expect(tileSize(index, { x: 504, y: 0, width: 84, depth: 42 })).toBeNull();
    expect(tileSize(index, { x: 0, y: 0, width: 63, depth: 42 })).toBeNull();
  });

  it('allows half-size bins on half-size cells only', () => {
    const gapIndex = indexCells(gridCells(gapLayout));
    expect(tileSize(gapIndex, { x: 546, y: 0, width: 21, depth: 42 })).toBe(21);
    expect(tileSize(gapIndex, { x: 525, y: 0, width: 42, depth: 42 })).toBeNull();
  });

  it('refuses overlaps', () => {
    const placed = [bin({ width: 84 })];
    expect(canPlace({ x: 42, y: 0, width: 42, depth: 42 }, index, placed)).toBe(false);
    expect(canPlace({ x: 84, y: 0, width: 42, depth: 42 }, index, placed)).toBe(true);
    expect(canPlace({ x: 0, y: 0, width: 84, depth: 42 }, index, placed, 'b1')).toBe(true);
  });

  it('flags bins that fall off the grid or overlap an earlier bin', () => {
    const issues = binIssues(
      [bin(), bin({ id: 'b2', x: 0 }), bin({ id: 'b3', x: 546 }), bin({ id: 'b4', x: 42 })],
      index
    );
    expect([...issues]).toEqual([
      ['b2', 'overlap'],
      ['b3', 'off-grid'],
    ]);
  });

  it('finds the first free spot, row by row', () => {
    expect(findFreeSpot(cells, index, [bin({ width: 84 })], 42, 42)).toEqual({ x: 84, y: 0 });
    expect(findFreeSpot(cells, index, [bin({ width: 546, depth: 378 })], 42, 42)).toBeNull();
  });

  it('fills the empty cells with copies of a bin', () => {
    let next = 0;
    const added = fillEmpty(
      cells,
      index,
      [bin({ width: 546, depth: 336 })],
      { width: 84, depth: 42, height: 4, label: 'Screws' },
      () => `n${(next += 1)}`
    );
    expect(added).toHaveLength(6);
    expect(added[0]).toEqual({ id: 'n1', x: 0, y: 336, width: 84, depth: 42, height: 4, label: 'Screws' });
    expect(added[added.length - 1]).toMatchObject({ x: 420, y: 336 });
  });

  it('snaps a dragged bin to the nearest cell and says whether it fits', () => {
    const others = [bin({ id: 'other', x: 126 })];
    expect(snapMove(index, others, bin(), 50, 18)).toEqual({ x: 42, y: 0, width: 42, depth: 42, valid: true });
    expect(snapMove(index, others, bin(), 120, 0)).toMatchObject({ x: 126, valid: false });
  });

  it('snaps half-size bins to the 21 mm grid', () => {
    const halfIndex = indexCells(gridCells(halfLayout));
    const small = bin({ width: 21, depth: 21 });
    expect(snapMove(halfIndex, [], small, 30, 12)).toMatchObject({ x: 21, y: 21, valid: true });
  });

  it('resizes in whole cells, never below one cell', () => {
    expect(snapResize(index, [], bin(), 100, 10)).toEqual({ x: 0, y: 0, width: 84, depth: 42, valid: true });
    expect(snapResize(index, [bin({ id: 'other', x: 84 })], bin(), 130, 42)).toMatchObject({ valid: false });
  });

  it('spans two cells in either order', () => {
    const a = { x: 84, y: 42, size: 42 };
    const b = { x: 0, y: 0, size: 42 };
    expect(spanRect(a, b)).toEqual({ x: 0, y: 0, width: 126, depth: 84 });
    expect(spanRect(b, a)).toEqual({ x: 0, y: 0, width: 126, depth: 84 });
  });
});

describe('bin sizes', () => {
  it('names a bin by its grid units', () => {
    expect(binSizeLabel({ width: 84, depth: 42 })).toBe('2 × 1');
    expect(binSizeLabel({ width: 21, depth: 42 })).toBe('0.5 × 1');
  });

  it('adds the stacking lip to the 7 mm units', () => {
    expect(STACKING_LIP_HEIGHT_MM).toBeCloseTo(3.5515, 4);
    expect(binTotalHeight(3)).toBeCloseTo(24.5515, 4);
    expect(binOuterSize({ width: 84, depth: 42, height: 6 })).toEqual({
      width: 83.5,
      depth: 41.5,
      height: binTotalHeight(6),
    });
  });

  it('caps the height by the printer and by the drawer-friendly maximum', () => {
    expect(maxBinHeight(256)).toBe(MAX_BIN_HEIGHT);
    expect(maxBinHeight(50)).toBe(6);
  });
});

describe('groupBins', () => {
  const index = indexCells(gridCells(fullLayout));

  it('treats a turned bin as the same part and skips bins with problems', () => {
    const groups = groupBins(
      [
        bin({ id: 'a', width: 84 }),
        bin({ id: 'b', x: 84, depth: 84 }),
        bin({ id: 'c', x: 126, height: 6 }),
        bin({ id: 'd', x: 546 }),
      ],
      index
    );
    expect(groups.map((group) => [group.key, group.bins.map((item) => item.id)])).toEqual([
      ['bin:42:84x42x3', ['a', 'b']],
      ['bin:42:42x42x6', ['c']],
    ]);
  });
});

describe('sanitizeBins', () => {
  it('keeps valid bins and repairs what it can', () => {
    const bins = sanitizeBins([
      bin({ id: 'keep', label: 'x'.repeat(500) }),
      bin({ id: 'keep', x: 42, height: 99 }),
      { id: 'bad', x: -1, y: 0, width: 42, depth: 42 },
      { x: 0, y: 0, width: 0, depth: 42 },
      'nope',
      null,
    ]);
    expect(bins).toHaveLength(2);
    expect(bins[0].label).toHaveLength(60);
    expect(bins[1].id).not.toBe('keep');
    expect(bins[1].height).toBe(MAX_BIN_HEIGHT);
    expect(sanitizeBins('nope')).toEqual([]);
  });
});
