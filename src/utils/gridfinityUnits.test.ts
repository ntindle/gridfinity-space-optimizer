import { describe, it, expect } from 'vitest';
import { calculateGrids } from './gridfinityUtils';

describe('unit conventions', () => {
  it('treats DrawerSize as inches', () => {
    const result = calculateGrids({ width: 1, height: 1 }, { x: 1000, y: 1000, z: 1000 }, false, false);
    expect(result.layout).toHaveLength(1);
    expect(result.layout[0].pixelWidth).toBeCloseTo(25.4, 10);
    expect(result.layout[0].pixelHeight).toBeCloseTo(25.4, 10);
    expect(result.spacers).toHaveProperty('25.2mm x 25.2mm');
  });

  it('treats PrinterSize exclusion zones as millimeters', () => {
    const plain = calculateGrids({ width: 12, height: 12 }, { x: 256, y: 256, z: 256 }, false, false);
    const excluded = calculateGrids(
      { width: 12, height: 12 },
      { x: 256, y: 256, z: 256, exclusionZone: { left: 25.4, right: 0, front: 0, back: 0 } },
      false,
      false,
    );
    expect(plain.baseplates).toHaveProperty('6x6');
    expect(excluded.baseplates).toHaveProperty('5x6');
    expect(excluded.baseplates).not.toHaveProperty('6x6');
  });
});
