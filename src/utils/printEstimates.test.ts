import { describe, it, expect } from 'vitest';
import { baseplateMesh, spacerMesh } from './export/gridfinityMesh';
import { binMesh } from './export/binMesh';
import { meshVolume } from './export/mesh';
import {
  baseplateVolumeMm3,
  binVolumeMm3,
  estimatePrint,
  formatEstimateCost,
  formatEstimateDuration,
  formatEstimateGrams,
  partVolumeMm3,
  spacerVolumeMm3,
} from './partVolumes';
import type { PrintPartSummary } from './printParts';

const relativeError = (actual: number, expected: number): number =>
  Math.abs(actual - expected) / expected;

const baseplatePart = (
  columns: number,
  rows: number,
  cellSize: number,
  count: number
): PrintPartSummary => ({
  key: `baseplate-${columns}x${rows}`,
  kind: 'baseplate',
  swatch: 'baseplate',
  label: `Baseplate ${columns} × ${rows}`,
  stem: `baseplate-${columns}x${rows}`,
  width: columns * cellSize,
  depth: rows * cellSize,
  height: 5,
  count,
  gridGeometry: { columns, rows, cellSize },
});

const binPart = (
  columns: number,
  rows: number,
  cellSize: number,
  height: number,
  count: number
): PrintPartSummary => ({
  key: `bin-${columns}x${rows}-${height}u`,
  kind: 'bin',
  swatch: 'bin',
  label: `Bin ${columns} × ${rows} · ${height}u`,
  stem: `bin-${columns}x${rows}-${height}u`,
  width: columns * cellSize - 0.5,
  depth: rows * cellSize - 0.5,
  height: height * 7 + 4.4,
  count,
  binGeometry: { columns, rows, cellSize, height },
});

const spacerPart = (width: number, depth: number, count: number): PrintPartSummary => ({
  key: `spacer-${width}x${depth}`,
  kind: 'spacer',
  swatch: 'spacer',
  label: `Spacer ${width} × ${depth} mm`,
  stem: `spacer-${width}x${depth}`,
  width,
  depth,
  height: 5,
  count,
});

describe('baseplateVolumeMm3', () => {
  it.each([
    [1, 1, 42],
    [3, 2, 42],
    [1, 4, 42],
    [2, 5, 21],
    [1, 1, 21],
  ])('matches the mesh volume for a %i × %i plate on a %i mm grid', (columns, rows, cellSize) => {
    const volume = baseplateVolumeMm3(columns, rows, cellSize);
    const mesh = meshVolume(baseplateMesh(columns, rows, cellSize));
    expect(relativeError(volume, mesh)).toBeLessThan(1e-6);
  });

  it('is about 1.4 cm³ of plastic for one 42 mm cell', () => {
    expect(baseplateVolumeMm3(1, 1, 42)).toBeCloseTo(1382, -1);
  });
});

describe('binVolumeMm3', () => {
  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
    [1, 1, 21, 2],
  ])('matches the mesh volume for a %i × %i bin on %i mm cells, %iu tall', (columns, rows, cellSize, height) => {
    const volume = binVolumeMm3(columns, rows, cellSize, height);
    const mesh = meshVolume(binMesh({ columns, rows, cellSize, height }));
    expect(relativeError(volume, mesh)).toBeLessThan(1e-6);
  });
});

describe('spacerVolumeMm3', () => {
  it('is the box volume and matches the mesh', () => {
    expect(spacerVolumeMm3(25.5, 252, 5)).toBeCloseTo(25.5 * 252 * 5, 6);
    expect(spacerVolumeMm3(25.5, 252, 5)).toBeCloseTo(
      meshVolume(spacerMesh(25.5, 252)),
      6
    );
  });
});

describe('partVolumeMm3', () => {
  it('dispatches on the part kind and its geometry', () => {
    expect(partVolumeMm3(baseplatePart(3, 2, 42, 1))).toBeCloseTo(
      baseplateVolumeMm3(3, 2, 42),
      6
    );
    expect(partVolumeMm3(binPart(2, 1, 42, 6, 1))).toBeCloseTo(
      binVolumeMm3(2, 1, 42, 6),
      6
    );
    expect(partVolumeMm3(spacerPart(25.5, 252, 1))).toBeCloseTo(25.5 * 252 * 5, 6);
  });
});

describe('estimatePrint', () => {
  it('is zero for an empty print', () => {
    expect(estimatePrint([])).toEqual({ volumeMm3: 0, grams: 0, minutes: 0, costUsd: 0 });
  });

  it('turns volume into grams, time, and cost with the stated assumptions', () => {
    const parts = [baseplatePart(1, 1, 42, 2), spacerPart(25.5, 252, 1)];
    const estimate = estimatePrint(parts);
    const volume = 2 * baseplateVolumeMm3(1, 1, 42) + 25.5 * 252 * 5;
    expect(estimate.volumeMm3).toBeCloseTo(volume, 6);
    expect(estimate.grams).toBeCloseTo((volume * 1.24) / 1000, 6);
    expect(estimate.minutes).toBeCloseTo(volume / (8 * 60), 6);
    expect(estimate.costUsd).toBeCloseTo(((volume * 1.24) / 1000) * (20 / 1000), 6);
  });

  it('multiplies each part by its count', () => {
    const single = estimatePrint([baseplatePart(1, 1, 42, 1)]);
    const triple = estimatePrint([baseplatePart(1, 1, 42, 3)]);
    expect(triple.grams).toBeCloseTo(single.grams * 3, 6);
    expect(triple.minutes).toBeCloseTo(single.minutes * 3, 6);
    expect(triple.costUsd).toBeCloseTo(single.costUsd * 3, 6);
  });
});

describe('estimate formatting', () => {
  it('formats durations in minutes, then hours and minutes', () => {
    expect(formatEstimateDuration(45)).toBe('45 min');
    expect(formatEstimateDuration(60)).toBe('1 h 0 min');
    expect(formatEstimateDuration(65)).toBe('1 h 5 min');
    expect(formatEstimateDuration(370)).toBe('6 h 10 min');
  });

  it('formats grams as whole grams', () => {
    expect(formatEstimateGrams(180.4)).toBe('180 g');
    expect(formatEstimateGrams(1.7)).toBe('2 g');
  });

  it('formats cost as dollars and cents', () => {
    expect(formatEstimateCost(4.7)).toBe('$4.70');
    expect(formatEstimateCost(0)).toBe('$0.00');
    expect(formatEstimateCost(12.05)).toBe('$12.05');
    expect(formatEstimateCost(0.865)).toBe('$0.87');
  });
});
