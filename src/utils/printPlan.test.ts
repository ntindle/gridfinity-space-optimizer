import { describe, it, expect } from 'vitest';
import {
  PLATE_GAP_MM,
  findPlateProblems,
  planPlates,
  usableBed,
  type PlanPart,
  type Plate,
} from './printPlan';
import type { PrinterSize } from '@/types';

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
        placements: [{ key: 'plate', x: 2, y: 2, width: 252, depth: 252, rotated: false }],
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
