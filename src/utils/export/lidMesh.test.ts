import { describe, it, expect } from 'vitest';
import { lidMesh } from './lidMesh';
import { meshBounds, meshVolume, triangleCount } from './mesh';
import { LID_LIP_DEPTH_MM, LID_THICKNESS_MM } from '@/utils/bins';
import { lidVolumeMm3 } from '@/utils/partVolumes';

describe('lidMesh', () => {
  it.each([
    [83.5, 41.5],
    [167.5, 125.5],
    [41.5, 41.5],
  ])('builds a %s × %s mm cover plate with a locating lip', (width, depth) => {
    const mesh = lidMesh(width, depth);
    expect(triangleCount(mesh)).toBe(300);
    const bounds = meshBounds(mesh);
    expect(bounds.min).toEqual([0, 0, 0]);
    expect(bounds.max).toEqual([width, depth, LID_THICKNESS_MM + LID_LIP_DEPTH_MM]);
    expect(
      Math.abs(meshVolume(mesh) - lidVolumeMm3(width, depth)) /
        lidVolumeMm3(width, depth)
    ).toBeLessThan(1e-6);
  });

  it('fits the smallest half-grid bin', () => {
    const mesh = lidMesh(20.5, 20.5);
    expect(triangleCount(mesh)).toBe(300);
    expect(meshBounds(mesh).max).toEqual([20.5, 20.5, LID_THICKNESS_MM + LID_LIP_DEPTH_MM]);
    expect(
      Math.abs(meshVolume(mesh) - lidVolumeMm3(20.5, 20.5)) /
        lidVolumeMm3(20.5, 20.5)
    ).toBeLessThan(1e-6);
  });

  it('sizes the lip to nest inside the bin mouth with clearance', () => {
    const mesh = lidMesh(83.5, 41.5);
    const lipXs: number[] = [];
    const lipYs: number[] = [];
    for (let index = 0; index < mesh.positions.length; index += 3) {
      if (mesh.positions[index + 2] > LID_THICKNESS_MM) {
        lipXs.push(mesh.positions[index]);
        lipYs.push(mesh.positions[index + 1]);
      }
    }
    expect(Math.min(...lipXs)).toBeCloseTo(2.1, 6);
    expect(Math.max(...lipXs)).toBeCloseTo(83.5 - 2.1, 6);
    expect(Math.min(...lipYs)).toBeCloseTo(2.1, 6);
    expect(Math.max(...lipYs)).toBeCloseTo(41.5 - 2.1, 6);
  });

  it('pins the lip volume against the analytic rounded-ring area', () => {
    expect(lidVolumeMm3(83.5, 41.5)).toBeCloseTo(11075.4151, 4);
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

  it('rejects a footprint too small for the lip', () => {
    expect(() => lidMesh(6, 41.5)).toThrow();
    expect(() => lidMesh(83.5, 6)).toThrow();
  });
});
