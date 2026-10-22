import { describe, it, expect } from 'vitest';
import {
  BASEPLATE_CORNER_RADIUS,
  BASEPLATE_HEIGHT,
  POCKET_PROFILE,
  baseplateMesh,
  spacerMesh,
} from './gridfinityMesh';
import { meshBounds, meshVolume, triangleCount, type Mesh } from './mesh';

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

const pocketArea = (cellSize: number, inset: number): number => {
  const side = cellSize - 2 * inset;
  const radius = BASEPLATE_CORNER_RADIUS - inset;
  return side * side - cornerLoss * radius * radius;
};

const pocketVolume = (cellSize: number): number => {
  let volume = 0;
  for (let band = 0; band < POCKET_PROFILE.length - 1; band += 1) {
    const lower = POCKET_PROFILE[band];
    const upper = POCKET_PROFILE[band + 1];
    const middle = (lower.inset + upper.inset) / 2;
    volume +=
      ((upper.z - lower.z) / 6) *
      (pocketArea(cellSize, lower.inset) +
        4 * pocketArea(cellSize, middle) +
        pocketArea(cellSize, upper.inset));
  }
  return volume;
};

const expectedBaseplateVolume = (columns: number, rows: number, cellSize: number): number => {
  const outlineArea =
    columns * cellSize * rows * cellSize -
    cornerLoss * BASEPLATE_CORNER_RADIUS * BASEPLATE_CORNER_RADIUS;
  return outlineArea * BASEPLATE_HEIGHT - columns * rows * pocketVolume(cellSize);
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
    const expected = expectedBaseplateVolume(columns, rows, cellSize);
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
