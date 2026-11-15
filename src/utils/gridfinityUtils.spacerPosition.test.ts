import { describe, it, expect } from 'vitest';
import { calculateGrids, splitSpacerIfNeeded, FULL_GRID_SIZE, HALF_GRID_SIZE } from './gridfinityUtils';
import type { LayoutItem } from '@/types';

const bambuA1 = { x: 256, y: 256, z: 256 };

describe('spacer positions and units', () => {
  it.each([
    ['full grid', false, false],
    ['half-size bins only', true, false],
    ['half-size bins in gaps', false, true],
  ])('places every piece at the grid position of its pixels (%s)', (_label, useHalfSize, preferHalfSize) => {
    const { layout } = calculateGrids({ width: 22.5, height: 16.5 }, bambuA1, useHalfSize, preferHalfSize);
    const cell = useHalfSize ? HALF_GRID_SIZE : FULL_GRID_SIZE;
    for (const item of layout) {
      expect(item.x).toBeCloseTo(item.pixelX / cell, 6);
      expect(item.y).toBeCloseTo(item.pixelY / cell, 6);
    }
  });

  it('gives split spacers their own position, not the position of the spacer they were cut from', () => {
    const parent: LayoutItem = {
      x: 13,
      y: 0,
      width: 0.61,
      height: 9,
      type: 'spacer',
      pixelX: 546,
      pixelY: 0,
      pixelWidth: 25.5,
      pixelHeight: 378,
    };
    const pieces = splitSpacerIfNeeded(parent, 252, 252);
    expect(pieces.map((piece) => [piece.x, piece.y])).toEqual([
      [13, 0],
      [13, 6],
    ]);
  });

  it('measures spacers in the same grid unit as the bins in half-size mode', () => {
    const { layout } = calculateGrids({ width: 22.5, height: 16.5 }, bambuA1, true, false);
    for (const item of layout.filter((piece) => piece.type === 'spacer')) {
      expect(item.width).toBeCloseTo(item.pixelWidth / HALF_GRID_SIZE, 2);
      expect(item.height).toBeCloseTo(item.pixelHeight / HALF_GRID_SIZE, 2);
    }
  });

  it('reports half-size-mode spacer sizes at their real size, not half of it', () => {
    const { layout, spacers } = calculateGrids({ width: 22.5, height: 16.5 }, bambuA1, true, false);
    const sizes = Object.keys(spacers).map((key) => key.match(/[\d.]+/g)!.map(Number));
    const actual = layout
      .filter((piece) => piece.type === 'spacer')
      .map((piece) => [piece.pixelWidth, piece.pixelHeight]);
    for (const [width, height] of sizes) {
      expect(
        actual.some(([w, h]) => Math.abs(w - width) < 0.25 && Math.abs(h - height) < 0.25)
      ).toBe(true);
    }
  });
});
