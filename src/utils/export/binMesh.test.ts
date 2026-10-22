import { describe, it, expect } from 'vitest';
import {
  BIN_BASE_HEIGHT,
  BIN_GAP,
  BIN_TOP_RADIUS,
  FOOT_PROFILE,
  binMesh,
  binWallProfile,
} from './binMesh';
import { meshBounds, meshVolume, type Mesh } from './mesh';
import { binTotalHeight } from '@/utils/bins';

const ARC_SEGMENTS = 8;
const cornerLoss = 4 - 2 * ARC_SEGMENTS * Math.sin(Math.PI / (2 * ARC_SEGMENTS));

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

const roundedArea = (width: number, depth: number, radius: number) =>
  width * depth - cornerLoss * radius * radius;

const footVolume = (cellSize: number): number => {
  const area = (inset: number) =>
    roundedArea(cellSize - 2 * BIN_GAP - 2 * inset, cellSize - 2 * BIN_GAP - 2 * inset, BIN_TOP_RADIUS - inset);
  let volume = 0;
  for (let band = 0; band < FOOT_PROFILE.length - 1; band += 1) {
    const lower = FOOT_PROFILE[band];
    const upper = FOOT_PROFILE[band + 1];
    volume +=
      ((upper.z - lower.z) / 6) *
      (area(lower.inset) + 4 * area((lower.inset + upper.inset) / 2) + area(upper.inset));
  }
  return volume;
};

const expectedBinVolume = (columns: number, rows: number, cellSize: number, height: number): number => {
  const a = columns * cellSize - 2 * BIN_GAP;
  const b = rows * cellSize - 2 * BIN_GAP;
  const feet = columns * rows * footVolume(cellSize);
  const bridge = roundedArea(a, b, BIN_TOP_RADIUS) * (BIN_BASE_HEIGHT - FOOT_PROFILE[FOOT_PROFILE.length - 1].z);
  const polygon = binWallProfile(height).map((point, index) =>
    index === 0 ? { ...point, z: BIN_BASE_HEIGHT } : point
  );
  let area = 0;
  let moment = 0;
  polygon.forEach((current, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const crossing = current.inset * next.z - next.inset * current.z;
    area += crossing / 2;
    moment += ((current.inset + next.inset) * crossing) / 6;
  });
  const perimeterAtWall = 2 * a + 2 * b - 2 * cornerLoss * BIN_TOP_RADIUS;
  const perimeterSlope = 2 * cornerLoss - 8;
  const walls = Math.abs(perimeterAtWall * area + perimeterSlope * moment);
  return feet + bridge + walls;
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
    const expected = expectedBinVolume(columns, rows, cellSize, height);
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

  it('rejects shapes that cannot be printed', () => {
    expect(() => binMesh({ columns: 0, rows: 1, cellSize: 42, height: 3 })).toThrow(/whole number of cells/);
    expect(() => binMesh({ columns: 1, rows: 1, cellSize: 42, height: 1 })).toThrow(/at least 2/);
    expect(() => binMesh({ columns: 1, rows: 1, cellSize: 42, height: 2.5 })).toThrow(/whole height/);
  });
});
