import { describe, it, expect } from 'vitest';
import { meshToStl } from './stl';
import { spacerMesh } from './gridfinityMesh';
import { triangleCount } from './mesh';

const read = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

describe('meshToStl', () => {
  const mesh = spacerMesh(10, 20, 5);
  const stl = meshToStl(mesh, 'Spacer 10 × 20 mm');

  it('writes a binary STL: 80-byte header, count, 50 bytes per triangle', () => {
    expect(stl.byteLength).toBe(84 + 50 * triangleCount(mesh));
    expect(read(stl).getUint32(80, true)).toBe(12);
  });

  it('names the part in an ASCII header that does not look like ASCII STL', () => {
    const header = new TextDecoder().decode(stl.slice(0, 80)).trimEnd();
    expect(header).toBe('Gridfinity Layout: Spacer 10 x 20 mm');
    expect(header.startsWith('solid')).toBe(false);
  });

  it('stores unit normals and the mesh corners as little-endian floats', () => {
    const view = read(stl);
    const xs: number[] = [];
    for (let triangle = 0; triangle < 12; triangle += 1) {
      const offset = 84 + triangle * 50;
      const normal = [0, 1, 2].map((axis) => view.getFloat32(offset + axis * 4, true));
      expect(Math.hypot(...normal)).toBeCloseTo(1, 5);
      for (let corner = 0; corner < 3; corner += 1) {
        xs.push(view.getFloat32(offset + 12 + corner * 12, true));
      }
      expect(view.getUint16(offset + 48, true)).toBe(0);
    }
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(10);
  });
});
