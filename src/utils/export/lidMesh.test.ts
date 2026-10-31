import { describe, it, expect } from 'vitest';
import { lidMesh } from './lidMesh';
import { meshBounds, meshVolume, triangleCount } from './mesh';
import { LID_THICKNESS_MM } from '@/utils/bins';

describe('lidMesh', () => {
  it.each([
    [83.5, 41.5],
    [167.5, 125.5],
    [41.5, 41.5],
  ])('builds a %s × %s mm flat plate', (width, depth) => {
    const mesh = lidMesh(width, depth);
    expect(triangleCount(mesh)).toBe(12);
    const bounds = meshBounds(mesh);
    expect(bounds.min).toEqual([0, 0, 0]);
    expect(bounds.max).toEqual([width, depth, LID_THICKNESS_MM]);
    expect(meshVolume(mesh)).toBeCloseTo(width * depth * LID_THICKNESS_MM, 6);
  });

  it('is a closed solid with positive signed volume', () => {
    const mesh = lidMesh(83.5, 41.5);
    expect(meshVolume(mesh)).toBeGreaterThan(0);
    expect(mesh.triangles.length % 3).toBe(0);
  });

  it('rejects non-positive footprints', () => {
    expect(() => lidMesh(0, 41.5)).toThrow();
    expect(() => lidMesh(83.5, -1)).toThrow();
  });
});
