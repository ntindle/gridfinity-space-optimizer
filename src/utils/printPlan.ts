import { unitMath } from "@/services/unitMath";
import type { PrinterSize } from "@/types";

export const PLATE_GAP_MM = 3;

export interface PlanPart {
  key: string;
  width: number;
  depth: number;
  count: number;
}

export interface PlatePlacement {
  key: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotated: boolean;
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

const place = (state: PlateState, part: PlanPart, gap: number): PlateState | null => {
  const width = unitMath.add(part.width, gap);
  const depth = unitMath.add(part.depth, gap);
  const turns = part.width === part.depth ? [false] : [false, true];
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
        width: best.rotated ? part.depth : part.width,
        depth: best.rotated ? part.width : part.depth,
        rotated: best.rotated,
      },
    ],
  };
};

const fill = (state: PlateState, part: PlanPart, limit: number, gap: number) => {
  let current = state;
  let placed = 0;
  while (placed < limit) {
    const next = place(current, part, gap);
    if (!next) break;
    current = next;
    placed = unitMath.add(placed, 1);
  }
  return { state: current, placed };
};

const byFootprint = (a: PlanPart, b: PlanPart): number =>
  unitMath.subtract(unitMath.multiply(b.width, b.depth), unitMath.multiply(a.width, a.depth)) ||
  unitMath.subtract(unitMath.max(b.width, b.depth), unitMath.max(a.width, a.depth)) ||
  a.key.localeCompare(b.key);

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
        unitMath.subtract(a.x, b.x) || unitMath.subtract(a.y, b.y) || a.key.localeCompare(b.key)
    )
  );

const countParts = (placements: PlatePlacement[]): Plate["parts"] => {
  const counts = new Map<string, number>();
  for (const { key } of placements) counts.set(key, unitMath.add(counts.get(key) ?? 0, 1));
  return [...counts].map(([key, count]) => ({ key, count }));
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
      const apart =
        unitMath.add(right(item), gap) <= other.x ||
        unitMath.add(right(other), gap) <= item.x ||
        unitMath.add(top(item), gap) <= other.y ||
        unitMath.add(top(other), gap) <= item.y;
      if (!apart) problems.push(`${item.key} and ${other.key} are closer than ${gap} mm`);
    });
  });
  return problems;
};

export const planPlates = (
  parts: PlanPart[],
  printerSize: PrinterSize,
  { gap = PLATE_GAP_MM }: { gap?: number } = {}
): Plate[] => {
  const bed = usableBed(printerSize);
  const empty: PlateState = {
    free: [{ x: 0, y: 0, width: unitMath.add(bed.width, gap), depth: unitMath.add(bed.depth, gap) }],
    placements: [],
  };
  let groups: PlateGroup[] = [];

  for (const part of parts.filter((candidate) => candidate.count > 0).sort(byFootprint)) {
    let remaining = part.count;
    const next: PlateGroup[] = [];
    for (const group of groups) {
      if (remaining === 0) {
        next.push(group);
        continue;
      }
      const first = fill(group.state, part, remaining, gap);
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
        next.push({ state: fill(group.state, part, remaining, gap).state, copies: 1 });
        remaining = 0;
        untouched = unitMath.subtract(untouched, 1);
      }
      if (untouched > 0) next.push({ state: group.state, copies: untouched });
    }
    if (remaining > 0) {
      const first = fill(empty, part, remaining, gap);
      if (first.placed === 0) {
        throw new Error(`${part.key} is larger than the printer bed`);
      }
      if (first.placed === remaining) {
        next.push({ state: first.state, copies: 1 });
      } else {
        const full = unitMath.floor(unitMath.divide(remaining, first.placed));
        next.push({ state: first.state, copies: full });
        const leftover = unitMath.subtract(remaining, unitMath.multiply(full, first.placed));
        if (leftover > 0) next.push({ state: fill(empty, part, leftover, gap).state, copies: 1 });
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
