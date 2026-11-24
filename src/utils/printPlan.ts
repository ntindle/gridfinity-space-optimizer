import { unitMath } from "@/services/unitMath";
import { STACKING_LIP_HEIGHT_MM } from "@/utils/bins";
import type { PrinterSize } from "@/types";

export const PLATE_GAP_MM = 3;

export const PLATE_GAP_EPSILON_MM = 0.000000001;

export const STACK_GAP_MM = 0.4;

export const stackPitchMm = (height: number): number =>
  unitMath.add(
    unitMath.subtract(height, STACKING_LIP_HEIGHT_MM),
    STACK_GAP_MM
  );

export const stackCapacityMm = (height: number, printerZ: number): number =>
  unitMath.max(
    1,
    unitMath.add(
      unitMath.floor(
        unitMath.divide(unitMath.subtract(printerZ, height), stackPitchMm(height))
      ),
      1
    )
  );

export interface PartProtrusion {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface PlanPart {
  key: string;
  width: number;
  depth: number;
  height?: number;
  stackable?: boolean;
  count: number;
  protrusion?: PartProtrusion;
}

export interface PlatePlacement {
  key: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotated: boolean;
  z?: number;
}

export interface Plate {
  copies: number;
  parts: { key: string; count: number }[];
  placements: PlatePlacement[];
}

export interface BedArea {
  x: number;
  y: number;
  width: number;
  depth: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

interface PlateState {
  free: Rect[];
  placements: PlatePlacement[];
}

interface PlateGroup {
  state: PlateState;
  copies: number;
}

export const usableBed = (printerSize: PrinterSize): BedArea => {
  const { left = 0, right = 0, front = 0, back = 0 } = printerSize.exclusionZone ?? {};
  return {
    x: left,
    y: front,
    width: unitMath.subtract(printerSize.x, unitMath.add(left, right)),
    depth: unitMath.subtract(printerSize.y, unitMath.add(front, back)),
  };
};

export const placementMeshOrigin = (
  placement: PlatePlacement,
  protrusion: PartProtrusion = {}
): { x: number; y: number } => {
  const left = protrusion.left ?? 0;
  const top = protrusion.top ?? 0;
  const bottom = protrusion.bottom ?? 0;
  return placement.rotated
    ? { x: unitMath.add(placement.x, top), y: unitMath.add(placement.y, left) }
    : { x: unitMath.add(placement.x, left), y: unitMath.add(placement.y, bottom) };
};

const right = (rect: Rect) => unitMath.add(rect.x, rect.width);
const top = (rect: Rect) => unitMath.add(rect.y, rect.depth);

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < right(b) && b.x < right(a) && a.y < top(b) && b.y < top(a);

const contains = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x && inner.y >= outer.y && right(inner) <= right(outer) && top(inner) <= top(outer);

const splitFree = (free: Rect[], used: Rect): Rect[] => {
  const pieces: Rect[] = [];
  for (const rect of free) {
    if (!overlaps(rect, used)) {
      pieces.push(rect);
      continue;
    }
    if (used.x > rect.x) {
      pieces.push({ ...rect, width: unitMath.subtract(used.x, rect.x) });
    }
    if (right(used) < right(rect)) {
      pieces.push({ ...rect, x: right(used), width: unitMath.subtract(right(rect), right(used)) });
    }
    if (used.y > rect.y) {
      pieces.push({ ...rect, depth: unitMath.subtract(used.y, rect.y) });
    }
    if (top(used) < top(rect)) {
      pieces.push({ ...rect, y: top(used), depth: unitMath.subtract(top(rect), top(used)) });
    }
  }
  return pieces.filter(
    (rect, index) =>
      !pieces.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          contains(other, rect) &&
          (!contains(rect, other) || otherIndex < index)
      )
  );
};

interface StackConfig {
  pitch: number;
  capacity: number;
}

const trueFootprint = (part: PlanPart): { width: number; depth: number } => {
  const protrusion = part.protrusion ?? {};
  return {
    width: unitMath.add(
      unitMath.add(part.width, protrusion.left ?? 0),
      protrusion.right ?? 0
    ),
    depth: unitMath.add(
      unitMath.add(part.depth, protrusion.top ?? 0),
      protrusion.bottom ?? 0
    ),
  };
};

const place = (
  state: PlateState,
  part: PlanPart,
  gap: number,
  stack: StackConfig | null
): PlateState | null => {
  if (stack) {
    const footprints = new Map<
      string,
      { item: PlatePlacement; count: number; topZ: number }
    >();
    for (const item of state.placements) {
      if (item.key !== part.key) continue;
      const id = `${item.x}|${item.y}|${item.width}|${item.depth}|${item.rotated}`;
      const existing = footprints.get(id);
      if (existing) {
        existing.count = unitMath.add(existing.count, 1);
        existing.topZ = unitMath.max(existing.topZ, item.z ?? 0);
      } else {
        footprints.set(id, { item, count: 1, topZ: item.z ?? 0 });
      }
    }
    let best: { item: PlatePlacement; count: number; topZ: number } | null = null;
    for (const entry of footprints.values()) {
      if (entry.count >= stack.capacity) continue;
      if (!best || entry.count > best.count) best = entry;
    }
    if (best) {
      return {
        free: state.free,
        placements: [
          ...state.placements,
          {
            key: part.key,
            x: best.item.x,
            y: best.item.y,
            width: best.item.width,
            depth: best.item.depth,
            rotated: best.item.rotated,
            z: unitMath.add(best.topZ, stack.pitch),
          },
        ],
      };
    }
  }
  const { width: trueWidth, depth: trueDepth } = trueFootprint(part);
  const width = unitMath.add(trueWidth, gap);
  const depth = unitMath.add(trueDepth, gap);
  const turns = trueWidth === trueDepth ? [false] : [false, true];
  let best: { rect: Rect; rotated: boolean; short: number; long: number } | null = null;
  for (const free of state.free) {
    for (const rotated of turns) {
      const footprintWidth = rotated ? depth : width;
      const footprintDepth = rotated ? width : depth;
      if (footprintWidth > free.width || footprintDepth > free.depth) continue;
      const slackX = unitMath.subtract(free.width, footprintWidth);
      const slackY = unitMath.subtract(free.depth, footprintDepth);
      const short = unitMath.min(slackX, slackY);
      const long = unitMath.max(slackX, slackY);
      if (!best || short < best.short || (short === best.short && long < best.long)) {
        best = {
          rect: { x: free.x, y: free.y, width: footprintWidth, depth: footprintDepth },
          rotated,
          short,
          long,
        };
      }
    }
  }
  if (!best) return null;
  return {
    free: splitFree(state.free, best.rect),
    placements: [
      ...state.placements,
      {
        key: part.key,
        x: best.rect.x,
        y: best.rect.y,
        width: best.rotated ? trueDepth : trueWidth,
        depth: best.rotated ? trueWidth : trueDepth,
        rotated: best.rotated,
        z: 0,
      },
    ],
  };
};

const fill = (
  state: PlateState,
  part: PlanPart,
  limit: number,
  gap: number,
  stack: StackConfig | null
) => {
  let current = state;
  let placed = 0;
  while (placed < limit) {
    const next = place(current, part, gap, stack);
    if (!next) break;
    current = next;
    placed = unitMath.add(placed, 1);
  }
  return { state: current, placed };
};

const byFootprint = (a: PlanPart, b: PlanPart): number => {
  const ea = trueFootprint(a);
  const eb = trueFootprint(b);
  return (
    unitMath.subtract(unitMath.multiply(eb.width, eb.depth), unitMath.multiply(ea.width, ea.depth)) ||
    unitMath.subtract(unitMath.max(eb.width, eb.depth), unitMath.max(ea.width, ea.depth)) ||
    a.key.localeCompare(b.key)
  );
};

const center = (placements: PlatePlacement[], bed: BedArea): PlatePlacement[] => {
  const minX = placements.reduce((value, item) => unitMath.min(value, item.x), Infinity);
  const minY = placements.reduce((value, item) => unitMath.min(value, item.y), Infinity);
  const maxX = placements.reduce((value, item) => unitMath.max(value, right(item)), -Infinity);
  const maxY = placements.reduce((value, item) => unitMath.max(value, top(item)), -Infinity);
  const shiftX = unitMath.add(
    unitMath.subtract(bed.x, minX),
    unitMath.divide(unitMath.subtract(bed.width, unitMath.subtract(maxX, minX)), 2)
  );
  const shiftY = unitMath.add(
    unitMath.subtract(bed.y, minY),
    unitMath.divide(unitMath.subtract(bed.depth, unitMath.subtract(maxY, minY)), 2)
  );
  return placements.map((item) => ({
    ...item,
    x: unitMath.add(item.x, shiftX),
    y: unitMath.add(item.y, shiftY),
  }));
};

const signature = (placements: PlatePlacement[]): string =>
  JSON.stringify(
    [...placements].sort(
      (a, b) =>
        unitMath.subtract(a.x, b.x) ||
        unitMath.subtract(a.y, b.y) ||
        unitMath.subtract(a.z ?? 0, b.z ?? 0) ||
        a.key.localeCompare(b.key)
    )
  );

const countParts = (placements: PlatePlacement[]): Plate["parts"] => {
  const counts = new Map<string, number>();
  for (const { key } of placements) counts.set(key, unitMath.add(counts.get(key) ?? 0, 1));
  return [...counts].map(([key, count]) => ({ key, count }));
};

export const plateStackDepth = (plate: Pick<Plate, "placements">): number => {
  const counts = new Map<string, number>();
  let max = 0;
  for (const item of plate.placements) {
    const id = `${item.x}|${item.y}|${item.key}`;
    const count = unitMath.add(counts.get(id) ?? 0, 1);
    counts.set(id, count);
    max = unitMath.max(max, count);
  }
  return max;
};

export const findPlateProblems = (
  plate: Pick<Plate, "placements">,
  printerSize: PrinterSize,
  gap: number = PLATE_GAP_MM
): string[] => {
  const bed = usableBed(printerSize);
  const problems: string[] = [];
  plate.placements.forEach((item, index) => {
    if (!contains(bed, item)) problems.push(`${item.key} sits outside the printable area`);
    plate.placements.slice(index + 1).forEach((other) => {
      if ((item.z ?? 0) !== (other.z ?? 0)) return;
      const apart =
        unitMath.subtract(unitMath.add(right(item), gap), PLATE_GAP_EPSILON_MM) <= other.x ||
        unitMath.subtract(unitMath.add(right(other), gap), PLATE_GAP_EPSILON_MM) <= item.x ||
        unitMath.subtract(unitMath.add(top(item), gap), PLATE_GAP_EPSILON_MM) <= other.y ||
        unitMath.subtract(unitMath.add(top(other), gap), PLATE_GAP_EPSILON_MM) <= item.y;
      if (!apart) problems.push(`${item.key} and ${other.key} are closer than ${gap} mm`);
    });
  });
  return problems;
};

export const planPlates = (
  parts: PlanPart[],
  printerSize: PrinterSize,
  { gap = PLATE_GAP_MM, stackBins = false }: { gap?: number; stackBins?: boolean } = {}
): Plate[] => {
  const bed = usableBed(printerSize);
  const empty: PlateState = {
    free: [{ x: 0, y: 0, width: unitMath.add(bed.width, gap), depth: unitMath.add(bed.depth, gap) }],
    placements: [],
  };
  let groups: PlateGroup[] = [];

  for (const part of parts.filter((candidate) => candidate.count > 0).sort(byFootprint)) {
    let remaining = part.count;
    const stack: StackConfig | null =
      stackBins && part.stackable === true && part.height !== undefined
        ? {
            pitch: stackPitchMm(part.height),
            capacity: stackCapacityMm(part.height, printerSize.z),
          }
        : null;
    const next: PlateGroup[] = [];
    for (const group of groups) {
      if (remaining === 0) {
        next.push(group);
        continue;
      }
      const first = fill(group.state, part, remaining, gap, stack);
      if (first.placed === 0) {
        next.push(group);
        continue;
      }
      if (first.placed === remaining) {
        next.push({ state: first.state, copies: 1 });
        if (group.copies > 1) next.push({ state: group.state, copies: unitMath.subtract(group.copies, 1) });
        remaining = 0;
        continue;
      }
      const full = unitMath.min(group.copies, unitMath.floor(unitMath.divide(remaining, first.placed)));
      next.push({ state: first.state, copies: full });
      remaining = unitMath.subtract(remaining, unitMath.multiply(full, first.placed));
      let untouched = unitMath.subtract(group.copies, full);
      if (untouched > 0 && remaining > 0) {
        next.push({ state: fill(group.state, part, remaining, gap, stack).state, copies: 1 });
        remaining = 0;
        untouched = unitMath.subtract(untouched, 1);
      }
      if (untouched > 0) next.push({ state: group.state, copies: untouched });
    }
    if (remaining > 0) {
      const first = fill(empty, part, remaining, gap, stack);
      if (first.placed === 0) {
        throw new Error(`${part.key} is larger than the printer bed`);
      }
      if (first.placed === remaining) {
        next.push({ state: first.state, copies: 1 });
      } else {
        const full = unitMath.floor(unitMath.divide(remaining, first.placed));
        next.push({ state: first.state, copies: full });
        const leftover = unitMath.subtract(remaining, unitMath.multiply(full, first.placed));
        if (leftover > 0) next.push({ state: fill(empty, part, leftover, gap, stack).state, copies: 1 });
      }
    }
    groups = next;
  }

  const merged = new Map<string, Plate>();
  for (const group of groups) {
    const placements = center(group.state.placements, bed);
    const key = signature(placements);
    const existing = merged.get(key);
    if (existing) {
      existing.copies = unitMath.add(existing.copies, group.copies);
    } else {
      merged.set(key, { copies: group.copies, parts: countParts(placements), placements });
    }
  }
  const plates = [...merged.values()];
  for (const plate of plates) {
    const problems = findPlateProblems(plate, printerSize, gap);
    if (problems.length > 0) throw new Error(problems[0]);
  }
  return plates;
};
