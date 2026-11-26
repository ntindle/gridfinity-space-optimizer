import { describe, it, expect } from 'vitest';
import {
  BASEPLATE_HEIGHT,
  baseplateMesh,
  spacerMesh,
} from './gridfinityMesh';
import { baseplateVolumeMm3 } from '@/utils/partVolumes';
import type { BaseplateConnectors } from '@/utils/export/gridfinityProfiles';
import { meshBounds, meshVolume, triangleCount, type Mesh } from './mesh';

const edgeProblems = (mesh: Mesh): string[] => {
  const directed = new Map<string, number>();
  for (let t = 0; t < mesh.triangles.length; t += 3) {
    const [a, b, c] = mesh.triangles.slice(t, t + 3);
    for (const [from, to] of [[a, b], [b, c], [c, a]]) {
      const key = `${from}>${to}`;
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
  }
  const problems: string[] = [];
  for (const [key, count] of directed) {
    const [from, to] = key.split('>');
    if (count !== 1) problems.push(`${key} used ${count} times`);
    if (directed.get(`${to}>${from}`) !== 1) problems.push(`${key} has no opposite edge`);
  }
  return problems;
};

describe('baseplateMesh', () => {
  it.each([
    [1, 1, 42],
    [3, 2, 42],
    [1, 4, 42],
    [2, 5, 21],
    [1, 1, 21],
  ])('builds a closed, outward-facing %i × %i plate on a %i mm grid', (columns, rows, cellSize) => {
    const mesh = baseplateMesh(columns, rows, cellSize);
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshVolume(mesh)).toBeGreaterThan(0);
  });

  it.each([
    [1, 1, 42],
    [3, 2, 42],
    [2, 5, 21],
  ])('matches the Gridfinity profile volume for %i × %i on %i mm', (columns, rows, cellSize) => {
    const volume = meshVolume(baseplateMesh(columns, rows, cellSize));
    const expected = baseplateVolumeMm3(columns, rows, cellSize);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it('is a thin frame: about 1.4 cm³ of plastic for one 42 mm cell', () => {
    expect(meshVolume(baseplateMesh(1, 1, 42))).toBeCloseTo(1382, -1);
  });

  it('spans exactly the plate footprint and the 5 mm baseplate height', () => {
    expect(meshBounds(baseplateMesh(3, 2, 42))).toEqual({
      min: [0, 0, 0],
      max: [126, 84, BASEPLATE_HEIGHT],
    });
    expect(meshBounds(baseplateMesh(2, 5, 21))).toEqual({
      min: [0, 0, 0],
      max: [42, 105, BASEPLATE_HEIGHT],
    });
  });

  it('grows with the number of cells, not with the plate size alone', () => {
    const one = triangleCount(baseplateMesh(1, 1, 42));
    const six = triangleCount(baseplateMesh(3, 2, 42));
    expect(six).toBeGreaterThan(5 * one);
    expect(six).toBeLessThan(7 * one);
  });

  it('rejects plates that are not whole cells', () => {
    expect(() => baseplateMesh(0, 2, 42)).toThrow(/whole number of cells/);
    expect(() => baseplateMesh(1.5, 2, 42)).toThrow(/whole number of cells/);
    expect(() => baseplateMesh(1, 1, 8)).toThrow(/too small/);
  });
});

describe('baseplateMesh connectors', () => {
  const cases: [number, number, number, BaseplateConnectors][] = [
    [3, 2, 42, { right: 'tab' }],
    [3, 2, 42, { left: 'recess' }],
    [3, 2, 42, { right: 'tab', left: 'recess', top: 'tab', bottom: 'recess' }],
    [1, 1, 42, { right: 'tab', left: 'recess', top: 'tab', bottom: 'recess' }],
    [2, 5, 21, { right: 'tab', left: 'recess' }],
    [1, 1, 21, { right: 'tab', bottom: 'recess' }],
    [4, 2, 42, { top: 'recess' }],
    [2, 4, 42, { left: 'tab' }],
    [4, 3, 42, { right: 'tab', left: 'recess', top: 'tab', bottom: 'recess' }],
  ];

  it.each(cases)(
    'builds a closed %i × %i plate with connectors on a %i mm grid',
    (columns, rows, cellSize, connectors) => {
      const mesh = baseplateMesh(columns, rows, cellSize, connectors);
      expect(edgeProblems(mesh)).toEqual([]);
      expect(meshVolume(mesh)).toBeGreaterThan(0);
    }
  );

  it.each(cases)(
    'matches the analytic connector volume for %i × %i on %i mm',
    (columns, rows, cellSize, connectors) => {
      const volume = meshVolume(baseplateMesh(columns, rows, cellSize, connectors));
      const expected = baseplateVolumeMm3(columns, rows, cellSize, connectors);
      expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
    }
  );

  it('extends the footprint by the tab protrusion and never by a recess', () => {
    expect(meshBounds(baseplateMesh(3, 2, 42, { right: 'tab' }))).toEqual({
      min: [0, 0, 0],
      max: [128, 84, BASEPLATE_HEIGHT],
    });
    expect(meshBounds(baseplateMesh(3, 2, 42, { left: 'recess' }))).toEqual({
      min: [0, 0, 0],
      max: [126, 84, BASEPLATE_HEIGHT],
    });
    expect(meshBounds(baseplateMesh(2, 4, 42, { left: 'tab' }))).toEqual({
      min: [-2, 0, 0],
      max: [84, 168, BASEPLATE_HEIGHT],
    });
  });

  it('cuts the recess 2 mm into the frame and the tab 2 mm out', () => {
    const recessed = baseplateMesh(3, 2, 42, { left: 'recess' });
    const recessXs = recessed.positions.filter((_, index) => index % 3 === 0);
    expect(Math.min(...recessXs)).toBe(0);
    expect(recessXs).toContain(2);
    const tabbed = baseplateMesh(3, 2, 42, { right: 'tab' });
    const tabXs = tabbed.positions.filter((_, index) => index % 3 === 0);
    expect(Math.max(...tabXs)).toBe(128);
  });

  it('leaves the plain mesh untouched when no connectors are given', () => {
    const plain = baseplateMesh(3, 2, 42);
    const empty = baseplateMesh(3, 2, 42, {});
    expect(triangleCount(empty)).toBe(triangleCount(plain));
    expect(meshVolume(empty)).toBe(meshVolume(plain));
  });
});

describe('baseplateMesh extensions', () => {
  it.each([
    [2, 2, 42, 23.4, 0],
    [3, 1, 42, 0, 12.5],
    [2, 3, 42, 23.4, 41.1],
    [1, 1, 42, 2, 0],
    [2, 5, 21, 4.5, 9],
    [1, 2, 42, 39, 39],
  ])(
    'builds a closed %i × %i plate with +%f/+%f mm edges on a %i mm grid',
    (columns, rows, cellSize, extendRight, extendBottom) => {
      const mesh = baseplateMesh(columns, rows, cellSize, undefined, extendRight, extendBottom);
      expect(edgeProblems(mesh)).toEqual([]);
      expect(meshVolume(mesh)).toBeGreaterThan(0);
      const bounds = meshBounds(mesh);
      expect(bounds.min).toEqual([0, 0, 0]);
      expect(bounds.max[0]).toBeCloseTo(columns * cellSize + extendRight, 6);
      expect(bounds.max[1]).toBeCloseTo(rows * cellSize + extendBottom, 6);
      expect(bounds.max[2]).toBe(BASEPLATE_HEIGHT);
    }
  );

  it.each([
    [2, 2, 42, 23.4, 0],
    [2, 3, 42, 23.4, 41.1],
    [2, 5, 21, 4.5, 9],
  ])(
    'matches the analytic volume for %i × %i with extensions',
    (columns, rows, cellSize, extendRight, extendBottom) => {
      const volume = meshVolume(
        baseplateMesh(columns, rows, cellSize, undefined, extendRight, extendBottom)
      );
      const expected = baseplateVolumeMm3(
        columns,
        rows,
        cellSize,
        undefined,
        extendRight,
        extendBottom
      );
      expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
    }
  );

  it('keeps internal connectors closed beside an extension', () => {
    const mesh = baseplateMesh(2, 2, 42, { left: 'recess', bottom: 'recess' }, 23.4, 0);
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshVolume(mesh)).toBeGreaterThan(0);
  });

  it('rejects connectors on an extended edge', () => {
    expect(() => baseplateMesh(2, 2, 42, { right: 'tab' }, 10, 0)).toThrow(/extended edge/);
    expect(() => baseplateMesh(2, 2, 42, { top: 'tab' }, 0, 10)).toThrow(/extended edge/);
  });
});

describe('spacerMesh', () => {
  it('is a closed box with the exact spacer volume', () => {
    const mesh = spacerMesh(25.5, 252);
    expect(edgeProblems(mesh)).toEqual([]);
    expect(triangleCount(mesh)).toBe(12);
    expect(meshVolume(mesh)).toBeCloseTo(25.5 * 252 * BASEPLATE_HEIGHT, 6);
    expect(meshBounds(mesh)).toEqual({ min: [0, 0, 0], max: [25.5, 252, BASEPLATE_HEIGHT] });
  });

  it('rejects empty spacers', () => {
    expect(() => spacerMesh(0, 10)).toThrow(/positive/);
  });
});
