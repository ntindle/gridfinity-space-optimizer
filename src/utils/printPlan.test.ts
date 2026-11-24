import { describe, it, expect } from 'vitest';
import { BIN_HEIGHT_UNIT_MM, STACKING_LIP_HEIGHT_MM } from './bins';
import { FOOT_PROFILE, binWallProfile, connectorProtrusion } from './export/gridfinityProfiles';
import { baseplateMesh, spacerMesh } from './export/gridfinityMesh';
import { meshBounds } from './export/mesh';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { collectPrintParts } from '@/utils/printParts';
import {
  PLATE_GAP_MM,
  STACK_GAP_MM,
  findPlateProblems,
  planPlates,
  plateStackDepth,
  stackCapacityMm,
  stackPitchMm,
  usableBed,
  type PlanPart,
  type Plate,
} from './printPlan';
import type { DrawerSize, PrinterSize } from '@/types';

const A1: PrinterSize = { x: 256, y: 256, z: 256 };

const totals = (plates: Plate[]) => {
  const counts: Record<string, number> = {};
  for (const plate of plates) {
    for (const { key, count } of plate.parts) {
      counts[key] = (counts[key] ?? 0) + count * plate.copies;
    }
  }
  return counts;
};

const prints = (plates: Plate[]) => plates.reduce((sum, plate) => sum + plate.copies, 0);

const expectValid = (plates: Plate[], printer: PrinterSize) => {
  for (const plate of plates) {
    expect(findPlateProblems(plate, printer)).toEqual([]);
    expect(plate.parts.reduce((sum, part) => sum + part.count, 0)).toBe(plate.placements.length);
  }
};

describe('usableBed', () => {
  it('removes exclusion zones from the bed', () => {
    expect(usableBed({ x: 256, y: 256, z: 256, exclusionZone: { left: 20, front: 10, back: 6 } })).toEqual({
      x: 20,
      y: 10,
      width: 236,
      depth: 240,
    });
  });
});

describe('planPlates', () => {
  it('puts small parts on one plate', () => {
    const parts: PlanPart[] = [
      { key: 'a', width: 42, depth: 42, count: 3 },
      { key: 'b', width: 84, depth: 42, count: 2 },
    ];
    const plates = planPlates(parts, A1);
    expect(plates).toHaveLength(1);
    expect(plates[0].copies).toBe(1);
    expect(totals(plates)).toEqual({ a: 3, b: 2 });
    expectValid(plates, A1);
  });

  it('prints one plate several times when the parts are identical', () => {
    const plates = planPlates([{ key: 'plate', width: 252, depth: 252, count: 3 }], A1);
    expect(plates).toEqual([
      {
        copies: 3,
        parts: [{ key: 'plate', count: 1 }],
        placements: [{ key: 'plate', x: 2, y: 2, width: 252, depth: 252, rotated: false, z: 0 }],
      },
    ]);
  });

  it('fills a plate before starting the next one', () => {
    const plates = planPlates([{ key: 'half', width: 252, depth: 126, count: 5 }], A1);
    expect(plates.map((plate) => [plate.copies, plate.placements.length])).toEqual([
      [2, 2],
      [1, 1],
    ]);
    expect(totals(plates)).toEqual({ half: 5 });
    expectValid(plates, A1);
  });

  it('fits a part exactly as big as the printable area', () => {
    const printer = { x: 252, y: 252, z: 200 };
    const plates = planPlates([{ key: 'max', width: 252, depth: 252, count: 1 }], printer);
    expect(plates[0].placements[0]).toMatchObject({ x: 0, y: 0 });
    expectValid(plates, printer);
  });

  it('refuses a part bigger than the bed', () => {
    expect(() => planPlates([{ key: 'huge', width: 300, depth: 42, count: 1 }], A1)).toThrow(
      /larger than the printer bed/
    );
  });

  it('keeps parts inside the bed minus its exclusion zones, centered', () => {
    const printer: PrinterSize = { x: 256, y: 256, z: 256, exclusionZone: { left: 40, front: 16 } };
    const plates = planPlates([{ key: 'p', width: 168, depth: 168, count: 1 }], printer);
    expect(plates[0].placements[0]).toMatchObject({ x: 64, y: 52 });
    expectValid(plates, printer);
  });

  it('turns a part a quarter turn when that is the only way it fits', () => {
    const printer = { x: 300, y: 200, z: 200 };
    const plates = planPlates([{ key: 'tall', width: 150, depth: 250, count: 1 }], printer);
    expect(plates[0].placements[0]).toMatchObject({ rotated: true, width: 250, depth: 150 });
    expectValid(plates, printer);
  });

  it('keeps 3 mm between parts', () => {
    const plates = planPlates([{ key: 's', width: 41.1, depth: 252, count: 6 }], A1);
    expectValid(plates, A1);
    const xs = plates[0].placements.map((item) => item.x).sort((a, b) => a - b);
    expect(xs[1] - xs[0]).toBeCloseTo(41.1 + PLATE_GAP_MM, 6);
  });

  it('reports parts that overlap or leave the bed', () => {
    expect(
      findPlateProblems(
        {
          placements: [
            { key: 'a', x: 0, y: 0, width: 100, depth: 100, rotated: false },
            { key: 'b', x: 101, y: 0, width: 100, depth: 100, rotated: false },
            { key: 'c', x: 200, y: 200, width: 100, depth: 100, rotated: false },
          ],
        },
        A1
      )
    ).toEqual(['a and b are closer than 3 mm', 'c sits outside the printable area']);
  });

  it('is deterministic', () => {
    const parts: PlanPart[] = [
      { key: 'x', width: 42, depth: 252, count: 2 },
      { key: 'y', width: 25.5, depth: 41.1, count: 4 },
      { key: 'z', width: 252, depth: 41.1, count: 3 },
    ];
    expect(planPlates(parts, A1)).toEqual(planPlates(parts, A1));
  });

  it('skips parts with no copies and plans nothing for an empty list', () => {
    expect(planPlates([{ key: 'none', width: 42, depth: 42, count: 0 }], A1)).toEqual([]);
    expect(planPlates([], A1)).toEqual([]);
  });

  it('plans the 22.5 × 16.5 in example drawer on 4 prints', () => {
    const parts: PlanPart[] = [
      { key: 'baseplate 6x6', width: 252, depth: 252, count: 2 },
      { key: 'baseplate 6x3', width: 252, depth: 126, count: 2 },
      { key: 'baseplate 1x6', width: 42, depth: 252, count: 1 },
      { key: 'baseplate 1x3', width: 42, depth: 126, count: 1 },
      { key: 'spacer 25.5x252', width: 25.5, depth: 252, count: 1 },
      { key: 'spacer 25.5x126', width: 25.5, depth: 126, count: 1 },
      { key: 'spacer 252x41.1', width: 252, depth: 41.1, count: 2 },
      { key: 'spacer 42x41.1', width: 42, depth: 41.1, count: 1 },
      { key: 'spacer 25.5x41.1', width: 25.5, depth: 41.1, count: 1 },
    ];
    const plates = planPlates(parts, A1);
    expect(prints(plates)).toBe(4);
    expect(totals(plates)).toEqual(
      Object.fromEntries(parts.map((part) => [part.key, part.count]))
    );
    expectValid(plates, A1);
  });

  it('plans a drawer whose remainder strip is one ulp short of its nominal size', () => {
    const parts: PlanPart[] = [
      {
        key: 'bin:42:42x42x3',
        width: 41.5,
        depth: 41.5,
        height: 3 * BIN_HEIGHT_UNIT_MM + STACKING_LIP_HEIGHT_MM,
        stackable: true,
        count: 42,
      },
      { key: 'baseplate:252x252', width: 252, depth: 252, count: 2 },
      { key: 'spacer:40.1x252', width: 40.1, depth: 252, count: 2 },
      { key: 'spacer:252x19.2', width: 252, depth: 19.1999999999999, count: 1 },
      { key: 'spacer:40.1x19.2', width: 40.1, depth: 19.1999999999999, count: 1 },
    ];
    const flat = planPlates(parts, A1, { stackBins: false });
    expect(flat).toHaveLength(4);
    expect(prints(flat)).toBe(5);
    expect(totals(flat)).toEqual(
      Object.fromEntries(parts.map((part) => [part.key, part.count]))
    );
    expectValid(flat, A1);
    const stacked = planPlates(parts, A1, { stackBins: true });
    expect(stacked).toHaveLength(2);
    expect(prints(stacked)).toBe(3);
    expect(totals(stacked)).toEqual(
      Object.fromEntries(parts.map((part) => [part.key, part.count]))
    );
    expectValid(stacked, A1);
  });

  it('forgives a sub-nanometre gap shortfall from centring but still reports a real one', () => {
    expect(
      findPlateProblems(
        {
          placements: [
            { key: 'a', x: 94.75000000000006, y: 2, width: 19.1999999999999, depth: 252, rotated: true },
            { key: 'b', x: 116.94999999999995, y: 2, width: 41.5, depth: 41.5, rotated: false },
          ],
        },
        A1
      )
    ).toEqual([]);
    expect(
      findPlateProblems(
        {
          placements: [
            { key: 'a', x: 0, y: 0, width: 100, depth: 100, rotated: false },
            { key: 'b', x: 102, y: 0, width: 100, depth: 100, rotated: false },
          ],
        },
        A1
      )
    ).toEqual(['a and b are closer than 3 mm']);
  });

  it('scales to many drawers without producing a plate per part', () => {
    const plates = planPlates(
      [
        { key: 'big', width: 252, depth: 252, count: 200 },
        { key: 'strip', width: 252, depth: 41.1, count: 200 },
      ],
      A1
    );
    expect(plates.length).toBeLessThanOrEqual(3);
    expect(totals(plates)).toEqual({ big: 200, strip: 200 });
    expectValid(plates, A1);
  });
});

describe('stacking identical bins', () => {
  const bin6u: PlanPart = {
    key: 'bin 2x1 6u',
    width: 83.5,
    depth: 41.5,
    height: 45.55,
    stackable: true,
    count: 40,
  };

  it('stacks identical bins in Z instead of spreading them across plates', () => {
    const stacked = planPlates([bin6u], A1, { stackBins: true });
    const spread = planPlates([bin6u], A1);
    expect(prints(stacked)).toBe(1);
    expect(prints(spread)).toBe(4);
    expect(totals(stacked)).toEqual({ 'bin 2x1 6u': 40 });
    expectValid(stacked, A1);
    expect(stacked.every((plate) => plateStackDepth(plate) > 1)).toBe(true);
    const zs = stacked.flatMap((plate) => plate.placements.map((item) => item.z ?? 0));
    expect(zs.every((z) => Math.abs(z / stackPitchMm(bin6u.height) - Math.round(z / stackPitchMm(bin6u.height))) < 1e-9)).toBe(true);
  });

  it('caps each stack at the printer Z height', () => {
    const shortPrinter: PrinterSize = { x: 256, y: 256, z: 100 };
    expect(stackCapacityMm(bin6u.height, shortPrinter.z)).toBe(2);
    const plates = planPlates([bin6u], shortPrinter, { stackBins: true });
    expect(totals(plates)).toEqual({ 'bin 2x1 6u': 40 });
    expectValid(plates, shortPrinter);
    for (const plate of plates) {
      expect(plateStackDepth(plate)).toBeLessThanOrEqual(2);
      const top = Math.max(
        ...plate.placements.map((item) => (item.z ?? 0) + bin6u.height)
      );
      expect(top).toBeLessThanOrEqual(shortPrinter.z);
    }
  });

  it('does not stack parts without a height, parts that are not stackable, or different keys', () => {
    const plates = planPlates(
      [
        { key: 'a', width: 83.5, depth: 41.5, height: 45.55, count: 10 },
        { key: 'b', width: 83.5, depth: 41.5, height: 45.55, stackable: true, count: 10 },
        { key: 'c', width: 41.5, depth: 41.5, height: 45.55, stackable: true, count: 10 },
      ],
      A1,
      { stackBins: true }
    );
    expect(totals(plates)).toEqual({ a: 10, b: 10, c: 10 });
    expectValid(plates, A1);
    const byKey = new Map<string, number[]>();
    for (const plate of plates) {
      for (const item of plate.placements) {
        byKey.set(item.key, [...(byKey.get(item.key) ?? []), item.z ?? 0]);
      }
    }
    expect(byKey.get('a')?.every((z) => z === 0)).toBe(true);
    expect(byKey.get('b')?.some((z) => z > 0)).toBe(true);
    expect(byKey.get('c')?.some((z) => z > 0)).toBe(true);
    expect(
      plates.flatMap((plate) => plate.placements).filter((item) => (item.z ?? 0) > 0).length
    ).toBeGreaterThan(0);
  });

  it('keeps stacked plates valid and deterministic', () => {
    expect(planPlates([bin6u], A1, { stackBins: true })).toEqual(
      planPlates([bin6u], A1, { stackBins: true })
    );
  });
});

describe('stack nesting geometry', () => {
  const insetAt = (points: { inset: number; z: number }[], z: number): number => {
    for (let i = 1; i < points.length; i += 1) {
      if (z <= points[i].z) {
        const a = points[i - 1];
        const b = points[i];
        if (b.z === a.z) return b.inset;
        return a.inset + ((z - a.z) / (b.z - a.z)) * (b.inset - a.inset);
      }
    }
    return points[points.length - 1].inset;
  };

  it('nests a stacked bin foot inside the lip below with clearance everywhere', () => {
    for (const height of [2, 3, 6, 9]) {
      const bodyTop = height * BIN_HEIGHT_UNIT_MM;
      const total = bodyTop + STACKING_LIP_HEIGHT_MM;
      const pitch = stackPitchMm(total);
      expect(pitch).toBeCloseTo(bodyTop + STACK_GAP_MM, 6);
      const base = pitch;
      const profile = binWallProfile(height);
      const crest = profile.reduce((max, point) => Math.max(max, point.z), 0);
      const inner = [...profile.slice(profile.findIndex((point) => point.z === crest))]
        .reverse()
        .filter((point) => point.z >= bodyTop);
      const foot = FOOT_PROFILE.map((point) => ({ inset: point.inset, z: base + point.z }));
      expect(base + FOOT_PROFILE[FOOT_PROFILE.length - 1].z).toBeGreaterThan(total);
      let minClearance = Infinity;
      for (let z = base; z <= total; z += 0.05) {
        minClearance = Math.min(
          minClearance,
          insetAt(foot, z) - insetAt(inner, z)
        );
      }
      expect(minClearance).toBeGreaterThan(0.2);
    }
  });
});

describe('planPlates with connector tabs', () => {
  it('keeps the true tabbed mesh inside the bed', () => {
    const drawers: [string, DrawerSize][] = [
      ['9x3cells', { width: 14.8819, height: 4.9606 }],
      ['13x10cells', { width: 22.5, height: 16.5 }],
      ['15x9cells', { width: 24.8031, height: 14.8819 }],
      ['12x6cells', { width: 19.8425, height: 9.9213 }],
      ['18x6cells', { width: 29.7638, height: 9.9213 }],
    ];
    const bed = usableBed(A1);
    let worst = 0;
    for (const [, drawerSize] of drawers) {
      for (const uniform of [false, true]) {
        const layout = calculateGrids(drawerSize, A1, false, false, uniform).layout;
        const { parts } = collectPrintParts({
          layout,
          bins: [],
          numDrawers: 1,
          printerSize: A1,
          connectors: true,
        });
        const grid = parts.filter((p) => p.kind === 'baseplate' || p.kind === 'spacer');
        const plates = planPlates(
          grid.map((part) => ({
            key: part.key,
            width: part.width,
            depth: part.depth,
            height: part.height,
            count: part.count,
            protrusion: connectorProtrusion(part.gridGeometry?.connectors),
          })),
          A1,
          {}
        );
        const byKey = new Map(grid.map((p) => [p.key, p]));
        for (const plate of plates) {
          for (const pl of plate.placements) {
            const part = byKey.get(pl.key);
            if (part === undefined) throw new Error(`Missing part for ${pl.key}`);
            const mesh =
              part.kind === 'baseplate'
                ? baseplateMesh(
                    part.gridGeometry!.columns,
                    part.gridGeometry!.rows,
                    part.gridGeometry!.cellSize,
                    part.gridGeometry!.connectors
                  )
                : spacerMesh(part.width, part.depth);
            const b = meshBounds(mesh);
            const tab = connectorProtrusion(part.gridGeometry?.connectors);
            let minX: number;
            let minY: number;
            let maxX: number;
            let maxY: number;
            if (!pl.rotated) {
              const originX = pl.x + tab.left;
              const originY = pl.y + tab.bottom;
              minX = originX + b.min[0];
              maxX = originX + b.max[0];
              minY = originY + b.min[1];
              maxY = originY + b.max[1];
            } else {
              const tx = pl.x + tab.top + part.depth;
              const originY = pl.y + tab.left;
              minX = tx - b.max[1];
              maxX = tx - b.min[1];
              minY = originY + b.min[0];
              maxY = originY + b.max[0];
            }
            const over = Math.max(
              0,
              bed.x - minX,
              bed.y - minY,
              maxX - (bed.x + bed.width),
              maxY - (bed.y + bed.depth)
            );
            worst = Math.max(worst, over);
          }
        }
      }
    }
    expect(worst).toBe(0);
  });
});
