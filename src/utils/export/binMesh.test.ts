import { describe, it, expect } from 'vitest';
import {
  binMesh,
  labelTabWidthMm,
} from './binMesh';
import { binWallProfile } from './gridfinityProfiles';
import { binVolumeMm3, labelTabVolumeMm3 } from '@/utils/partVolumes';
import { meshBounds, meshVolume, type Mesh } from './mesh';
import { binTotalHeight } from '@/utils/bins';

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

describe('binMesh', () => {
  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
    [1, 1, 21, 2],
  ])('builds a closed, outward-facing %i × %i bin on %i mm cells, %iu tall', (columns, rows, cellSize, height) => {
    const mesh = binMesh({ columns, rows, cellSize, height });
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshVolume(mesh)).toBeGreaterThan(0);
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
  ])('matches the Gridfinity bin volume for %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const volume = meshVolume(binMesh({ columns, rows, cellSize, height }));
    const expected = binVolumeMm3(columns, rows, cellSize, height);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it('is 0.5 mm smaller than its grid footprint and as tall as its units plus the lip', () => {
    expect(meshBounds(binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6 }))).toEqual({
      min: [0, 0, 0],
      max: [83.5, 41.5, expect.closeTo(binTotalHeight(6), 5)],
    });
    expect(meshBounds(binMesh({ columns: 1, rows: 3, cellSize: 21, height: 2 })).max).toEqual([
      20.5,
      62.5,
      expect.closeTo(binTotalHeight(2), 5),
    ]);
  });

  it('follows the spec base: a 35.6 mm foot at the bottom widening to 41.5 mm', () => {
    const mesh = binMesh({ columns: 1, rows: 1, cellSize: 42, height: 3 });
    const bottom: number[] = [];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      if (mesh.positions[index + 2] === 0) bottom.push(mesh.positions[index]);
    }
    expect(Math.min(...bottom)).toBeCloseTo(2.95, 6);
    expect(Math.max(...bottom)).toBeCloseTo(41.5 - 2.95, 6);
  });

  it('puts the inner tip of the stacking lip 2.6 mm in from the wall at the top of the units', () => {
    const profile = binWallProfile(6);
    expect(profile).toContainEqual({ inset: 2.6, z: 42 });
    expect(profile[profile.length - 1]).toEqual({ inset: 0.95, z: 7 });
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
    [1, 1, 21, 2],
  ])('builds a closed, outward-facing tabbed %i × %i bin on %i mm cells, %iu tall', (columns, rows, cellSize, height) => {
    const mesh = binMesh({ columns, rows, cellSize, height, labelTab: true });
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshVolume(mesh)).toBeGreaterThan(meshVolume(binMesh({ columns, rows, cellSize, height })));
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
  ])('matches the Gridfinity bin volume plus the tab for %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const volume = meshVolume(binMesh({ columns, rows, cellSize, height, labelTab: true }));
    const expected = binVolumeMm3(columns, rows, cellSize, height) + labelTabVolumeMm3(columns, cellSize);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it('raises the tab above the lip and sticks it out from the front face', () => {
    const mesh = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, labelTab: true });
    const bounds = meshBounds(mesh);
    expect(bounds.min[1]).toBeCloseTo(-1.2, 6);
    expect(bounds.max[2]).toBeCloseTo(binTotalHeight(6) + 12, 5);
    expect(bounds.max[0]).toEqual(83.5);
    expect(labelTabWidthMm(2, 42)).toBe(36);
    expect(labelTabWidthMm(1, 21)).toBe(14.5);
  });

  it('rejects shapes that cannot be printed', () => {
    expect(() => binMesh({ columns: 0, rows: 1, cellSize: 42, height: 3 })).toThrow(/whole number of cells/);
    expect(() => binMesh({ columns: 1, rows: 1, cellSize: 42, height: 1 })).toThrow(/at least 2/);
    expect(() => binMesh({ columns: 1, rows: 1, cellSize: 42, height: 2.5 })).toThrow(/whole height/);
  });
});
