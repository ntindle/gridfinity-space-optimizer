import { describe, it, expect } from 'vitest';
import { calculateGrids, fillSpacerWithHalfSizeBins } from './gridfinityUtils';
import type { LayoutItem } from '@/types';

const bambuA1 = { x: 256, y: 256, z: 256 };

describe('calculateGrids edge cases', () => {
  it('returns an empty layout instead of hanging when exclusion zones leave less than one grid cell', () => {
    const tinyBed = { x: 100, y: 100, z: 100, exclusionZone: { left: 30, right: 30 } };
    const result = calculateGrids({ width: 22.5, height: 16.5 }, tinyBed, false, false);
    expect(result.layout).toEqual([]);
    expect(result.baseplates).toEqual({});
  });

  it('returns an empty layout when exclusion zones exceed the bed', () => {
    const negativeBed = { x: 100, y: 100, z: 100, exclusionZone: { front: 80, back: 80 } };
    const result = calculateGrids({ width: 22.5, height: 16.5 }, negativeBed, true, false);
    expect(result.layout).toEqual([]);
  });

  it.each([
    [40, 3],
    [2, 20],
  ])('still lays out baseplates with uniform sizes on for a %s × %s in drawer', (width, height) => {
    const plain = calculateGrids({ width, height }, bambuA1, false, false, false);
    const uniform = calculateGrids({ width, height }, bambuA1, false, false, true);
    const count = (layout: LayoutItem[]) => layout.filter((item) => item.type === 'baseplate').length;
    expect(count(plain.layout)).toBeGreaterThan(0);
    expect(count(uniform.layout)).toBeGreaterThan(0);
    const area = (layout: LayoutItem[]) =>
      layout
        .filter((item) => item.type === 'baseplate')
        .reduce((sum, item) => sum + item.pixelWidth * item.pixelHeight, 0);
    expect(area(uniform.layout)).toBe(area(plain.layout));
  });

  it('never creates a zero-size spacer when filling gaps with half-size bins', () => {
    const result = calculateGrids({ width: 18.25, height: 14.75 }, bambuA1, false, true);
    for (const item of result.layout) {
      expect(item.pixelWidth).toBeGreaterThan(0);
      expect(item.pixelHeight).toBeGreaterThan(0);
    }
    expect(Object.keys(result.spacers).some((key) => key.startsWith('0mm'))).toBe(false);
  });

  it('covers a spacer narrower than a half-size bin with a single remainder strip', () => {
    const spacer: LayoutItem = {
      x: 0,
      y: 0,
      width: 0.42,
      height: 2.14,
      type: 'spacer',
      pixelX: 0,
      pixelY: 0,
      pixelWidth: 17.64,
      pixelHeight: 90,
    };
    const { halfSizeBins, remainingSpacers } = fillSpacerWithHalfSizeBins(spacer);
    expect(halfSizeBins).toHaveLength(0);
    expect(remainingSpacers).toHaveLength(1);
    expect(remainingSpacers[0].pixelWidth).toBe(17.64);
    expect(remainingSpacers[0].pixelHeight).toBe(90);
  });
});
