import { describe, it, expect } from 'vitest';
import {
  binMesh,
  labelTabWidthMm,
} from './binMesh';
import { binWallProfile, BIN_BASE_HEIGHT } from './gridfinityProfiles';
import { binVolumeMm3, dividerVolumeMm3, labelTabVolumeMm3, magnetPocketVolumeMm3, screwHoleVolumeMm3 } from '@/utils/partVolumes';
import { meshBounds, meshVolume, type Mesh } from './mesh';
import { binTotalHeight, MAGNET_HOLE_DEPTH_MM, MAGNET_HOLE_DIAMETER_MM, SCREW_HOLE_DIAMETER_MM, magnetHoleCount, screwHoleCount } from '@/utils/bins';
import { HOLE_SEGMENTS } from './shapes';

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

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
  ])('builds a closed, outward-facing divided %i × %i bin on %i mm cells, %iu tall', (columns, rows, cellSize, height) => {
    const mesh = binMesh({ columns, rows, cellSize, height, dividerCount: 1 });
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshVolume(mesh)).toBeGreaterThan(meshVolume(binMesh({ columns, rows, cellSize, height })));
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
  ])('matches the Gridfinity bin volume plus the divider for %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const volume = meshVolume(binMesh({ columns, rows, cellSize, height, dividerCount: 1 }));
    const expected = binVolumeMm3(columns, rows, cellSize, height) + dividerVolumeMm3(columns, rows, cellSize, height);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it('runs the divider down the long side, below the stacking lip, inside the footprint', () => {
    const alongX = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, dividerCount: 1 });
    expect(meshBounds(alongX)).toEqual({
      min: [0, 0, 0],
      max: [83.5, 41.5, expect.closeTo(binTotalHeight(6), 5)],
    });
    const topVertices = new Set<string>();
    for (let index = 0; index < alongX.positions.length; index += 3) {
      if (alongX.positions[index + 2] === 42) {
        topVertices.add(`${alongX.positions[index]},${alongX.positions[index + 1]}`);
      }
    }
    expect(topVertices.has('0,20.15')).toBe(true);
    expect(topVertices.has('83.5,21.35')).toBe(true);
    const alongY = binMesh({ columns: 1, rows: 2, cellSize: 42, height: 6, dividerCount: 1 });
    const alongYVertices = new Set<string>();
    for (let index = 0; index < alongY.positions.length; index += 3) {
      if (alongY.positions[index + 2] === 42) {
        alongYVertices.add(`${alongY.positions[index]},${alongY.positions[index + 1]}`);
      }
    }
    expect(alongYVertices.has('20.15,0')).toBe(true);
    expect(alongYVertices.has('21.35,83.5')).toBe(true);
    expect(dividerVolumeMm3(2, 1, 42, 6)).toBeCloseTo(83.5 * 1.2 * (42 - 7), 6);
  });

  it('places two dividers at even thirds and adds twice the divider volume', () => {
    const mesh = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, dividerCount: 2 });
    expect(edgeProblems(mesh)).toEqual([]);
    const volume = meshVolume(mesh);
    const expected = binVolumeMm3(2, 1, 42, 6) + 2 * dividerVolumeMm3(2, 1, 42, 6);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
    const span = 42 - 2 * 0.25;
    const yEdges: number[] = [];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      if (mesh.positions[index] === 0 && mesh.positions[index + 2] === 42) {
        yEdges.push(mesh.positions[index + 1]);
      }
    }
    for (const third of [1, 2]) {
      const center = (span * third) / 3;
      expect(yEdges.some((y) => Math.abs(y - (center - 0.6)) < 1e-6)).toBe(true);
      expect(yEdges.some((y) => Math.abs(y - (center + 0.6)) < 1e-6)).toBe(true);
    }
  });

  it('places a divider at a custom position without changing its volume', () => {
    const mesh = binMesh({
      columns: 2,
      rows: 1,
      cellSize: 42,
      height: 6,
      dividerCount: 1,
      dividerPositions: [0.25],
    });
    expect(edgeProblems(mesh)).toEqual([]);
    const volume = meshVolume(mesh);
    const expected = binVolumeMm3(2, 1, 42, 6) + dividerVolumeMm3(2, 1, 42, 6);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
    const span = 42 - 2 * 0.25;
    const center = span * 0.25;
    const yEdges: number[] = [];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      if (mesh.positions[index] === 0 && mesh.positions[index + 2] === 42) {
        yEdges.push(mesh.positions[index + 1]);
      }
    }
    expect(yEdges.some((y) => Math.abs(y - (center - 0.6)) < 1e-6)).toBe(true);
    expect(yEdges.some((y) => Math.abs(y - (center + 0.6)) < 1e-6)).toBe(true);
    expect(yEdges.some((y) => Math.abs(y - (span * 0.5 - 0.6)) < 1e-6)).toBe(false);
  });

  it('places two dividers at custom positions and adds twice the divider volume', () => {
    const mesh = binMesh({
      columns: 2,
      rows: 1,
      cellSize: 42,
      height: 6,
      dividerCount: 2,
      dividerPositions: [0.25, 0.75],
    });
    expect(edgeProblems(mesh)).toEqual([]);
    const volume = meshVolume(mesh);
    const expected = binVolumeMm3(2, 1, 42, 6) + 2 * dividerVolumeMm3(2, 1, 42, 6);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
    const span = 42 - 2 * 0.25;
    const yEdges: number[] = [];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      if (mesh.positions[index] === 0 && mesh.positions[index + 2] === 42) {
        yEdges.push(mesh.positions[index + 1]);
      }
    }
    for (const fraction of [0.25, 0.75]) {
      const center = span * fraction;
      expect(yEdges.some((y) => Math.abs(y - (center - 0.6)) < 1e-6)).toBe(true);
      expect(yEdges.some((y) => Math.abs(y - (center + 0.6)) < 1e-6)).toBe(true);
    }
  });

  it('falls back to even spacing when positions do not match the count', () => {
    const mesh = binMesh({
      columns: 2,
      rows: 1,
      cellSize: 42,
      height: 6,
      dividerCount: 2,
      dividerPositions: [0.25],
    });
    const even = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, dividerCount: 2 });
    expect(meshVolume(mesh)).toBeCloseTo(meshVolume(even), 6);
    expect(mesh.positions).toEqual(even.positions);
    expect(mesh.triangles).toEqual(even.triangles);
  });

  it('builds an undivided bin when the divider count is zero', () => {
    const mesh = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, dividerCount: 0 });
    expect(meshVolume(mesh)).toBeCloseTo(meshVolume(binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6 })), 6);
  });

  it('builds a closed tabbed and divided bin', () => {
    const mesh = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, labelTab: true, dividerCount: 1 });
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshBounds(mesh).max[2]).toBeCloseTo(binTotalHeight(6) + 12, 5);
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
    [1, 1, 21, 2],
  ])('builds a closed, outward-facing magnet %i × %i bin on %i mm cells, %iu tall', (columns, rows, cellSize, height) => {
    const mesh = binMesh({ columns, rows, cellSize, height, magnetHoles: true });
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshVolume(mesh)).toBeLessThan(meshVolume(binMesh({ columns, rows, cellSize, height })));
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
  ])('matches the Gridfinity bin volume minus the magnet pockets for %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const volume = meshVolume(binMesh({ columns, rows, cellSize, height, magnetHoles: true }));
    const expected =
      binVolumeMm3(columns, rows, cellSize, height) -
      magnetHoleCount(columns, rows) * magnetPocketVolumeMm3();
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
    [1, 1, 21, 2],
  ])('covers the bin bottom exactly once for magnet %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const bottomArea = (mesh: Mesh): number => {
      let area = 0;
      for (let t = 0; t < mesh.triangles.length; t += 3) {
        const [a, b, c] = mesh.triangles.slice(t, t + 3);
        const [ax, ay, az] = [mesh.positions[a * 3], mesh.positions[a * 3 + 1], mesh.positions[a * 3 + 2]];
        const [bx, by, bz] = [mesh.positions[b * 3], mesh.positions[b * 3 + 1], mesh.positions[b * 3 + 2]];
        const [cx, cy, cz] = [mesh.positions[c * 3], mesh.positions[c * 3 + 1], mesh.positions[c * 3 + 2]];
        if (az === 0 && bz === 0 && cz === 0) {
          area += ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
        }
      }
      return area;
    };
    const holeArea =
      (HOLE_SEGMENTS / 2) *
      (MAGNET_HOLE_DIAMETER_MM / 2) ** 2 *
      Math.sin((2 * Math.PI) / HOLE_SEGMENTS);
    const plain = bottomArea(binMesh({ columns, rows, cellSize, height }));
    const magnet = bottomArea(binMesh({ columns, rows, cellSize, height, magnetHoles: true }));
    const expected = plain + magnetHoleCount(columns, rows) * holeArea;
    expect(Math.abs(magnet - expected) / Math.abs(expected)).toBeLessThan(1e-6);
  });

  it('cuts one pocket per corner cell, centered under the cell, 2 mm deep', () => {
    const mesh = binMesh({ columns: 3, rows: 2, cellSize: 42, height: 6, magnetHoles: true });
    const pocketFloor: [number, number][] = [];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      if (mesh.positions[index + 2] === 2) {
        pocketFloor.push([mesh.positions[index], mesh.positions[index + 1]]);
      }
    }
    const near = (x: number, y: number) =>
      pocketFloor.some(([px, py]) => Math.hypot(px - x, py - y) < 3.1);
    expect(near(20.75, 20.75)).toBe(true);
    expect(near(104.75, 20.75)).toBe(true);
    expect(near(20.75, 62.75)).toBe(true);
    expect(near(104.75, 62.75)).toBe(true);
    expect(near(62.75, 20.75)).toBe(false);
    expect(near(62.75, 62.75)).toBe(false);
    expect(meshBounds(mesh)).toEqual({
      min: [0, 0, 0],
      max: [125.5, 83.5, expect.closeTo(binTotalHeight(6), 5)],
    });
  });

  it('builds a closed magnet bin with a tab and a divider', () => {
    const mesh = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, labelTab: true, dividerCount: 1, magnetHoles: true });
    expect(edgeProblems(mesh)).toEqual([]);
    const volume = meshVolume(mesh);
    const expected =
      binVolumeMm3(2, 1, 42, 6) +
      labelTabVolumeMm3(2, 42) +
      dividerVolumeMm3(2, 1, 42, 6) -
      magnetHoleCount(2, 1) * magnetPocketVolumeMm3();
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it('cuts a pocket just under the faceted cylinder volume', () => {
    const pocket = magnetPocketVolumeMm3();
    expect(pocket).toBeGreaterThan(59.5);
    expect(pocket).toBeLessThan(Math.PI * 3.1 * 3.1 * 2);
    expect(magnetHoleCount(1, 1)).toBe(1);
    expect(magnetHoleCount(2, 1)).toBe(2);
    expect(magnetHoleCount(4, 3)).toBe(4);
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [2, 2, 42, 3],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
    [1, 1, 21, 2],
  ])('builds a closed, outward-facing screw-hole %i × %i bin on %i mm cells, %iu tall', (columns, rows, cellSize, height) => {
    const mesh = binMesh({ columns, rows, cellSize, height, screwHoles: true });
    expect(edgeProblems(mesh)).toEqual([]);
    expect(meshVolume(mesh)).toBeLessThan(meshVolume(binMesh({ columns, rows, cellSize, height })));
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [2, 2, 42, 3],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
  ])('matches the Gridfinity bin volume minus the screw holes for %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const volume = meshVolume(binMesh({ columns, rows, cellSize, height, screwHoles: true }));
    const expected =
      binVolumeMm3(columns, rows, cellSize, height) -
      screwHoleCount(columns, rows) * screwHoleVolumeMm3(BIN_BASE_HEIGHT);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [2, 2, 42, 3],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
  ])('matches the Gridfinity bin volume minus pockets and screw holes for %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const volume = meshVolume(binMesh({ columns, rows, cellSize, height, magnetHoles: true, screwHoles: true }));
    const expected =
      binVolumeMm3(columns, rows, cellSize, height) -
      magnetHoleCount(columns, rows) * magnetPocketVolumeMm3() -
      screwHoleCount(columns, rows) * screwHoleVolumeMm3(BIN_BASE_HEIGHT - MAGNET_HOLE_DEPTH_MM);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it.each([
    [1, 1, 42, 3],
    [2, 1, 42, 6],
    [3, 2, 42, 2],
    [2, 3, 21, 4],
    [1, 1, 21, 2],
  ])('covers the bin floor exactly once for screw %i × %i on %i mm, %iu', (columns, rows, cellSize, height) => {
    const floorArea = (mesh: Mesh): number => {
      let area = 0;
      for (let t = 0; t < mesh.triangles.length; t += 3) {
        const [a, b, c] = mesh.triangles.slice(t, t + 3);
        const [ax, ay, az] = [mesh.positions[a * 3], mesh.positions[a * 3 + 1], mesh.positions[a * 3 + 2]];
        const [bx, by, bz] = [mesh.positions[b * 3], mesh.positions[b * 3 + 1], mesh.positions[b * 3 + 2]];
        const [cx, cy, cz] = [mesh.positions[c * 3], mesh.positions[c * 3 + 1], mesh.positions[c * 3 + 2]];
        if (az === BIN_BASE_HEIGHT && bz === BIN_BASE_HEIGHT && cz === BIN_BASE_HEIGHT) {
          area += ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
        }
      }
      return area;
    };
    const holeArea =
      (HOLE_SEGMENTS / 2) *
      (SCREW_HOLE_DIAMETER_MM / 2) ** 2 *
      Math.sin((2 * Math.PI) / HOLE_SEGMENTS);
    const plain = floorArea(binMesh({ columns, rows, cellSize, height }));
    const screwed = floorArea(binMesh({ columns, rows, cellSize, height, screwHoles: true }));
    const expected = plain - screwHoleCount(columns, rows) * holeArea;
    expect(Math.abs(screwed - expected) / Math.abs(expected)).toBeLessThan(1e-6);
  });

  it('cuts one screw hole per corner cell, through the floor', () => {
    const mesh = binMesh({ columns: 3, rows: 2, cellSize: 42, height: 6, screwHoles: true });
    const floor: [number, number][] = [];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      if (mesh.positions[index + 2] === BIN_BASE_HEIGHT) {
        floor.push([mesh.positions[index], mesh.positions[index + 1]]);
      }
    }
    const near = (x: number, y: number) =>
      floor.some(([px, py]) => Math.hypot(px - x, py - y) < 1.61);
    expect(near(20.75, 20.75)).toBe(true);
    expect(near(104.75, 20.75)).toBe(true);
    expect(near(20.75, 62.75)).toBe(true);
    expect(near(104.75, 62.75)).toBe(true);
    expect(near(62.75, 20.75)).toBe(false);
    expect(near(62.75, 62.75)).toBe(false);
    expect(meshBounds(mesh)).toEqual({
      min: [0, 0, 0],
      max: [125.5, 83.5, expect.closeTo(binTotalHeight(6), 5)],
    });
  });

  it('builds a closed screw bin with a tab, a divider, and magnets', () => {
    const mesh = binMesh({ columns: 2, rows: 1, cellSize: 42, height: 6, labelTab: true, dividerCount: 1, magnetHoles: true, screwHoles: true });
    expect(edgeProblems(mesh)).toEqual([]);
    const volume = meshVolume(mesh);
    const expected =
      binVolumeMm3(2, 1, 42, 6) +
      labelTabVolumeMm3(2, 42) +
      dividerVolumeMm3(2, 1, 42, 6) -
      magnetHoleCount(2, 1) * magnetPocketVolumeMm3() -
      screwHoleCount(2, 1) * screwHoleVolumeMm3(BIN_BASE_HEIGHT - MAGNET_HOLE_DEPTH_MM);
    expect(Math.abs(volume - expected) / expected).toBeLessThan(1e-6);
  });

  it('cuts a screw hole just under the faceted cylinder volume', () => {
    const hole = screwHoleVolumeMm3(BIN_BASE_HEIGHT);
    expect(hole).toBeGreaterThan(55);
    expect(hole).toBeLessThan(Math.PI * 1.6 * 1.6 * BIN_BASE_HEIGHT);
    expect(screwHoleVolumeMm3(BIN_BASE_HEIGHT - MAGNET_HOLE_DEPTH_MM)).toBeCloseTo(
      screwHoleVolumeMm3(BIN_BASE_HEIGHT) * 5 / 7,
      6
    );
    expect(screwHoleCount(1, 1)).toBe(1);
    expect(screwHoleCount(2, 1)).toBe(2);
    expect(screwHoleCount(4, 3)).toBe(4);
  });

  it('rejects shapes that cannot be printed', () => {
    expect(() => binMesh({ columns: 0, rows: 1, cellSize: 42, height: 3 })).toThrow(/whole number of cells/);
    expect(() => binMesh({ columns: 1, rows: 1, cellSize: 42, height: 1 })).toThrow(/at least 2/);
    expect(() => binMesh({ columns: 1, rows: 1, cellSize: 42, height: 2.5 })).toThrow(/whole height/);
  });
});
