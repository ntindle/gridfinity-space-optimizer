import {
  BIN_HEIGHT_UNIT_MM,
  DIVIDER_THICKNESS_MM,
  LABEL_TAB_ABOVE_LIP_MM,
  LABEL_TAB_FUSE_MM,
  LABEL_TAB_MAX_WIDTH_MM,
  LABEL_TAB_SIDE_MARGIN_MM,
  LABEL_TAB_THICKNESS_MM,
  MAGNET_HOLE_DEPTH_MM,
  MAGNET_HOLE_DIAMETER_MM,
  MIN_BIN_HEIGHT,
  SCREW_HOLE_DIAMETER_MM,
  SCOOP_SPAN_END_FRACTION,
  SCOOP_SPAN_START_FRACTION,
  STACKING_LIP_HEIGHT_MM,
} from "@/utils/bins";
import { unitMath } from "@/services/unitMath";
import { createMeshBuilder, type Mesh, type Vec3 } from "./mesh";
import {
  BIN_BASE_HEIGHT,
  BIN_GAP,
  BIN_TOP_RADIUS,
  FOOT_PROFILE,
  binWallProfile,
  scoopTopZMm,
  type ProfilePoint,
} from "./gridfinityProfiles";
import {
  ARC_SEGMENTS,
  DOWN,
  SIDE_DIRECTIONS,
  UP,
  arc,
  magnetHoleRing,
  midpoint,
  roundedCorners,
  screwHoleRing,
  toward,
  type Point,
} from "./shapes";

export interface BinShape {
  columns: number;
  rows: number;
  cellSize: number;
  height: number;
  labelTab?: boolean;
  dividerCount?: number;
  dividerPositions?: number[];
  magnetHoles?: boolean;
  screwHoles?: boolean;
  scoop?: boolean;
}

export const labelTabWidthMm = (columns: number, cellSize: number): number => {
  const outerWidth = columns * cellSize - 2 * BIN_GAP;
  return Math.min(outerWidth - 2 * LABEL_TAB_SIDE_MARGIN_MM, LABEL_TAB_MAX_WIDTH_MM);
};

const labelTabBox = (
  builder: ReturnType<typeof createMeshBuilder>,
  columns: number,
  cellSize: number,
  height: number
): void => {
  const width = columns * cellSize;
  const outerWidth = width - 2 * BIN_GAP;
  const tabWidth = labelTabWidthMm(columns, cellSize);
  const x0 = (outerWidth - tabWidth) / 2;
  const x1 = x0 + tabWidth;
  const y0 = -LABEL_TAB_THICKNESS_MM;
  const y1 = 0;
  const lipTop = height * BIN_HEIGHT_UNIT_MM + STACKING_LIP_HEIGHT_MM;
  const z0 = lipTop - LABEL_TAB_FUSE_MM;
  const z1 = lipTop + LABEL_TAB_ABOVE_LIP_MM;
  const point = (x: number, y: number, z: number): Vec3 => [x, y, z];
  builder.quad(point(x0, y0, z0), point(x1, y0, z0), point(x1, y0, z1), point(x0, y0, z1), [0, -1, 0]);
  builder.quad(point(x1, y1, z0), point(x0, y1, z0), point(x0, y1, z1), point(x1, y1, z1), [0, 1, 0]);
  builder.quad(point(x0, y1, z0), point(x0, y0, z0), point(x0, y0, z1), point(x0, y1, z1), [-1, 0, 0]);
  builder.quad(point(x1, y0, z0), point(x1, y1, z0), point(x1, y1, z1), point(x1, y0, z1), [1, 0, 0]);
  builder.quad(point(x0, y1, z0), point(x1, y1, z0), point(x1, y0, z0), point(x0, y0, z0), DOWN);
  builder.quad(point(x0, y0, z1), point(x1, y0, z1), point(x1, y1, z1), point(x0, y1, z1), UP);
};

const dividerBox = (
  builder: ReturnType<typeof createMeshBuilder>,
  columns: number,
  rows: number,
  cellSize: number,
  height: number,
  center: number
): void => {
  const width = columns * cellSize;
  const depth = rows * cellSize;
  const half = DIVIDER_THICKNESS_MM / 2;
  const alongX = columns >= rows;
  const xCenter = center;
  const yCenter = center;
  const x0 = alongX ? 0 : xCenter - half;
  const x1 = alongX ? width - 2 * BIN_GAP : xCenter + half;
  const y0 = alongX ? yCenter - half : 0;
  const y1 = alongX ? yCenter + half : depth - 2 * BIN_GAP;
  const z0 = BIN_BASE_HEIGHT;
  const z1 = height * BIN_HEIGHT_UNIT_MM;
  const point = (x: number, y: number, z: number): Vec3 => [x, y, z];
  builder.quad(point(x0, y0, z0), point(x1, y0, z0), point(x1, y1, z0), point(x0, y1, z0), DOWN);
  builder.quad(point(x0, y0, z1), point(x1, y0, z1), point(x1, y1, z1), point(x0, y1, z1), UP);
  builder.quad(point(x0, y0, z0), point(x0, y1, z0), point(x0, y1, z1), point(x0, y0, z1), [-1, 0, 0]);
  builder.quad(point(x1, y0, z0), point(x1, y1, z0), point(x1, y1, z1), point(x1, y0, z1), [1, 0, 0]);
  builder.quad(point(x0, y0, z0), point(x1, y0, z0), point(x1, y0, z1), point(x0, y0, z1), [0, -1, 0]);
  builder.quad(point(x0, y1, z0), point(x1, y1, z0), point(x1, y1, z1), point(x0, y1, z1), [0, 1, 0]);
};

type MeshBuilder = ReturnType<typeof createMeshBuilder>;

const samePoint = (a: Point, b: Point): boolean =>
  Math.round(a[0] * 1e6) === Math.round(b[0] * 1e6) &&
  Math.round(a[1] * 1e6) === Math.round(b[1] * 1e6);

const triangleIsDegenerate = (a: Vec3, b: Vec3, c: Vec3): boolean => {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const cx = uy * vz - uz * vy;
  const cy = uz * vx - ux * vz;
  const cz = ux * vy - uy * vx;
  return cx * cx + cy * cy + cz * cz < 1e-12;
};

const emitQuad = (
  builder: MeshBuilder,
  a: Vec3,
  b: Vec3,
  c: Vec3,
  d: Vec3,
  facing: Vec3
): void => {
  if (!triangleIsDegenerate(a, b, c)) builder.triangle(a, b, c, facing);
  if (!triangleIsDegenerate(a, c, d)) builder.triangle(a, c, d, facing);
};

interface ScoopSpan {
  x0: number;
  x1: number;
}

const scoopSpanFor = (width: number): ScoopSpan => ({
  x0: unitMath.multiply(width, SCOOP_SPAN_START_FRACTION),
  x1: unitMath.multiply(width, SCOOP_SPAN_END_FRACTION),
});

const insertScoopPoints = (ring: Point[], span: ScoopSpan): Point[] => {
  const minY = Math.min(...ring.map((point) => point[1]));
  const start = ring.findIndex((point) => Math.abs(point[1] - minY) < 1e-9);
  if (start === -1) return ring;
  let end = start;
  while (end + 1 < ring.length && Math.abs(ring[end + 1][1] - minY) < 1e-9) end += 1;
  const front = ring.slice(start, end + 1);
  const low = front[0][0];
  const high = front[front.length - 1][0];
  const expanded: Point[] = [];
  let insertedStart = false;
  let insertedEnd = false;
  for (const point of front) {
    if (!insertedStart && span.x0 >= low && span.x0 <= high && point[0] > span.x0) {
      expanded.push([span.x0, minY], [span.x0, minY]);
      insertedStart = true;
    }
    if (!insertedEnd && span.x1 >= low && span.x1 <= high && point[0] > span.x1) {
      expanded.push([span.x1, minY], [span.x1, minY]);
      insertedEnd = true;
    }
    expanded.push(point);
  }
  if (!insertedStart && span.x0 >= low && span.x0 <= high) expanded.push([span.x0, minY], [span.x0, minY]);
  if (!insertedEnd && span.x1 >= low && span.x1 <= high) expanded.push([span.x1, minY], [span.x1, minY]);
  return [...ring.slice(0, start), ...expanded, ...ring.slice(end + 1)];
};

const scoopFactors = (ring: Point[], span: ScoopSpan): number[] => {
  const minY = Math.min(...ring.map((point) => point[1]));
  return ring.map((point, index) => {
    const [x, y] = point;
    if (Math.abs(y - minY) >= 1e-9) return 0;
    const prev = ring[(index - 1 + ring.length) % ring.length];
    const next = ring[(index + 1) % ring.length];
    if (samePoint(prev, point)) return x === span.x0 ? 1 : 0;
    if (samePoint(next, point)) return x === span.x0 ? 0 : 1;
    return x >= span.x0 && x < span.x1 ? 1 : 0;
  });
};

interface ScoopClamp {
  t: number[];
  top: number;
}

const scoopCrossing = (lower: ProfilePoint, upper: ProfilePoint, top: number): Point => {
  const fraction = unitMath.divide(
    unitMath.subtract(top, lower.z),
    unitMath.subtract(upper.z, lower.z)
  );
  return [
    BIN_GAP +
      unitMath.add(
        lower.inset,
        unitMath.multiply(fraction, unitMath.subtract(upper.inset, lower.inset))
      ),
    top,
  ];
};

const splitProfileAtDip = (profile: ProfilePoint[], top: number): ProfilePoint[] => {
  const split: ProfilePoint[] = [profile[0]];
  for (let index = 0; index < profile.length - 1; index += 1) {
    const lower = profile[index];
    const upper = profile[index + 1];
    if ((lower.z < top && upper.z > top) || (lower.z > top && upper.z < top)) {
      const fraction = unitMath.divide(
        unitMath.subtract(top, lower.z),
        unitMath.subtract(upper.z, lower.z)
      );
      split.push({
        inset: unitMath.add(
          lower.inset,
          unitMath.multiply(fraction, unitMath.subtract(upper.inset, lower.inset))
        ),
        z: top,
      });
    }
    split.push(upper);
  }
  return split;
};

const scoopStepPolygon = (profile: ProfilePoint[], top: number): Point[] => {
  const points: Point[] = [];
  for (let index = 0; index < profile.length - 1; index += 1) {
    const lower = profile[index];
    const upper = profile[index + 1];
    if (lower.z <= top && upper.z > top) points.push(scoopCrossing(lower, upper, top));
    if (upper.z > top) points.push([BIN_GAP + upper.inset, upper.z]);
    if (lower.z > top && upper.z <= top) points.push(scoopCrossing(lower, upper, top));
  }
  return points.filter(
    (point, index, list) => index === 0 || !samePoint(point, list[index - 1])
  );
};

const polygonSignedArea = (polygon: Point[]): number => {
  let sum = 0;
  polygon.forEach((current, index) => {
    const next = polygon[(index + 1) % polygon.length];
    sum += current[0] * next[1] - next[0] * current[1];
  });
  return sum / 2;
};

const pointInTriangleStrict = (p: Point, a: Point, b: Point, c: Point): boolean => {
  const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (d === 0) return false;
  const w0 = ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) / d;
  const w1 = ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) / d;
  const w2 = 1 - w0 - w1;
  const epsilon = 1e-9;
  return w0 > epsilon && w1 > epsilon && w2 > epsilon;
};

const triangulatePolygon = (polygon: Point[]): Array<readonly [Point, Point, Point]> => {
  const order = polygonSignedArea(polygon) < 0 ? [...polygon].reverse() : [...polygon];
  const remaining = order.map((_, index) => index);
  const triangles: Array<readonly [Point, Point, Point]> = [];
  const turn = (a: Point, b: Point, c: Point): number =>
    (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
  while (remaining.length > 3) {
    let ear = -1;
    for (let index = 0; index < remaining.length; index += 1) {
      const count = remaining.length;
      const prev = order[remaining[(index - 1 + count) % count]];
      const current = order[remaining[index]];
      const next = order[remaining[(index + 1) % count]];
      if (turn(prev, current, next) <= 1e-12) continue;
      let blocked = false;
      for (const other of remaining) {
        const vertex = order[other];
        if (vertex === prev || vertex === current || vertex === next) continue;
        if (pointInTriangleStrict(vertex, prev, current, next)) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        ear = index;
        break;
      }
    }
    if (ear === -1) throw new Error("Scoop step face has no ear");
    const count = remaining.length;
    const prev = order[remaining[(ear - 1 + count) % count]];
    const current = order[remaining[ear]];
    const next = order[remaining[(ear + 1) % count]];
    triangles.push([prev, current, next]);
    remaining.splice(ear, 1);
  }
  triangles.push([order[remaining[0]], order[remaining[1]], order[remaining[2]]]);
  return triangles;
};

const toVec = ([x, y]: Point, z: number): Vec3 => [x - BIN_GAP, y - BIN_GAP, z];

const triangulateAnnulus = (
  builder: MeshBuilder,
  center: Point,
  ring: Point[],
  hole: Point[],
  holeRadius: number,
  z: number,
  facing: Vec3
): void => {
  const angleOf = (p: Point): number => Math.atan2(p[1] - center[1], p[0] - center[0]);
  const start = angleOf(ring[0]);
  const unwrap = (a: number): number => {
    let value = a - start;
    while (value < 0) value += 2 * Math.PI;
    while (value >= 2 * Math.PI) value -= 2 * Math.PI;
    return start + value;
  };
  const ringAngles = ring.map((p) => unwrap(angleOf(p)));
  const orderedHole = hole
    .map(([hx, hy]): Point => [center[0] + hx, center[1] + hy])
    .map((p) => ({ p, a: unwrap(angleOf(p)) }))
    .sort((x, y) => x.a - y.a);
  const holePoints = orderedHole.map((entry) => entry.p);
  const holeAngles = orderedHole.map((entry) => entry.a);
  const atRing = (index: number): Point => ring[index % ring.length];
  const atHole = (index: number): Point => holePoints[index % holePoints.length];
  const segmentClear = (from: Point, to: Point): boolean => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const lengthSq = dx * dx + dy * dy;
    const t = Math.max(
      0,
      Math.min(1, ((center[0] - from[0]) * dx + (center[1] - from[1]) * dy) / lengthSq)
    );
    const closestX = from[0] + t * dx;
    const closestY = from[1] + t * dy;
    const distSq = (closestX - center[0]) ** 2 + (closestY - center[1]) ** 2;
    return distSq >= (holeRadius - 1e-9) ** 2;
  };
  let i = 0;
  let j = 0;
  while (i < ring.length || j < holePoints.length) {
    const nextRing =
      i < ring.length - 1
        ? ringAngles[i + 1]
        : i === ring.length - 1
          ? start + 2 * Math.PI
          : Infinity;
    const nextHole =
      j < holePoints.length - 1
        ? holeAngles[j + 1]
        : j === holePoints.length - 1
          ? start + 2 * Math.PI
          : Infinity;
    const holeClear = j < holePoints.length && segmentClear(atRing(i), atHole(j + 1));
    const ringClear = i < ring.length && segmentClear(atRing(i + 1), atHole(j));
    if (j >= holePoints.length || (ringClear && (!holeClear || nextRing <= nextHole))) {
      const a = toVec(atRing(i), z);
      const b = toVec(atRing(i + 1), z);
      const c = toVec(atHole(j), z);
      if (!triangleIsDegenerate(a, b, c)) builder.triangle(a, b, c, facing);
      i += 1;
    } else {
      const a = toVec(atRing(i), z);
      const b = toVec(atHole(j), z);
      const c = toVec(atHole(j + 1), z);
      if (!triangleIsDegenerate(a, b, c)) builder.triangle(a, b, c, facing);
      j += 1;
    }
  }
};

const holeWall = (
  builder: MeshBuilder,
  center: Point,
  ring: Point[],
  z0: number,
  z1: number
): void => {
  ring.forEach((current, index) => {
    const next = ring[(index + 1) % ring.length];
    builder.quad(
      toVec(current, z0),
      toVec(current, z1),
      toVec(next, z1),
      toVec(next, z0),
      toward(midpoint(current, next), center)
    );
  });
};

const screwHoleWall = (builder: MeshBuilder, center: Point, z0: number, z1: number): void => {
  const ring = screwHoleRing().map(([hx, hy]): Point => [center[0] + hx, center[1] + hy]);
  holeWall(builder, center, ring, z0, z1);
};

const magnetPocket = (
  builder: MeshBuilder,
  center: Point,
  ring: Point[],
  hole: Point[],
  depth: number,
  screwHoles: boolean
): void => {
  const orderedHole = hole
    .map(([hx, hy]): Point => [center[0] + hx, center[1] + hy])
    .map((p) => ({ p, a: Math.atan2(p[1] - center[1], p[0] - center[0]) }))
    .sort((x, y) => x.a - y.a);
  const holePoints = orderedHole.map((entry) => entry.p);
  triangulateAnnulus(builder, center, ring, hole, MAGNET_HOLE_DIAMETER_MM / 2, 0, DOWN);
  holeWall(builder, center, holePoints, 0, depth);
  if (screwHoles) {
    triangulateAnnulus(
      builder,
      center,
      holePoints,
      screwHoleRing(),
      SCREW_HOLE_DIAMETER_MM / 2,
      depth,
      DOWN
    );
    screwHoleWall(builder, center, depth, BIN_BASE_HEIGHT);
    return;
  }
  holePoints.forEach((current, index) => {
    builder.triangle(
      toVec(center, depth),
      toVec(current, depth),
      toVec(holePoints[(index + 1) % holePoints.length], depth),
      DOWN
    );
  });
};

const pointInTriangle = (p: Point, a: Point, b: Point, c: Point): boolean => {
  const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  const w0 = ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) / d;
  const w1 = ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) / d;
  const w2 = 1 - w0 - w1;
  const epsilon = 1e-9;
  return w0 >= -epsilon && w1 >= -epsilon && w2 >= -epsilon;
};

const subdivideEdge = (from: Point, to: Point, maxStep: number): Point[] => {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const steps = Math.max(1, Math.ceil(length / maxStep));
  return Array.from({ length: steps + 1 }, (_, step): Point => [
    from[0] + ((to[0] - from[0]) * step) / steps,
    from[1] + ((to[1] - from[1]) * step) / steps,
  ]);
};

const distanceToSegment = (p: Point, a: Point, b: Point): number => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};

const distanceToTriangle = (p: Point, a: Point, b: Point, c: Point): number => {
  if (pointInTriangle(p, a, b, c)) return 0;
  return Math.min(
    distanceToSegment(p, a, b),
    distanceToSegment(p, b, c),
    distanceToSegment(p, c, a)
  );
};

const FOOT_TOP = FOOT_PROFILE[FOOT_PROFILE.length - 1].z;
const CORNER_INSET = BIN_GAP + BIN_TOP_RADIUS;
const INWARD: Point[] = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

const bodyRing = (width: number, depth: number, cellSize: number, inset: number, scoopSpan?: ScoopSpan): Point[] => {
  const offset = BIN_GAP + inset;
  const columns = Math.round(width / cellSize);
  const rows = Math.round(depth / cellSize);
  const seams = (count: number, place: (step: number) => Point) =>
    Array.from({ length: count - 1 }, (_, index) => place(index + 1));
  const sides: Point[][] = [
    seams(columns, (step) => [step * cellSize, offset]),
    seams(rows, (step) => [width - offset, step * cellSize]),
    seams(columns, (step) => [width - step * cellSize, depth - offset]),
    seams(rows, (step) => [offset, depth - step * cellSize]),
  ];
  const ring = roundedCorners(0, 0, width, depth, CORNER_INSET).flatMap((corner, index) => [
    ...arc(corner, BIN_TOP_RADIUS - inset),
    ...sides[index].flatMap(([x, y]): Point[] => {
      const [dx, dy] = SIDE_DIRECTIONS[index];
      return [
        [x - CORNER_INSET * dx, y - CORNER_INSET * dy],
        [x, y],
        [x + CORNER_INSET * dx, y + CORNER_INSET * dy],
      ];
    }),
  ]);
  return scoopSpan === undefined ? ring : insertScoopPoints(ring, scoopSpan);
};

const outwardFacing = (center: Point, a: Point, b: Point, lower: ProfilePoint, upper: ProfilePoint): Vec3 => {
  const [mx, my] = midpoint(a, b);
  const length = Math.hypot(mx - center[0], my - center[1]) || 1;
  const radial = upper.z - lower.z;
  return [
    (radial * (mx - center[0])) / length,
    (radial * (my - center[1])) / length,
    upper.inset - lower.inset,
  ];
};

export const binMesh = ({ columns, rows, cellSize, height, labelTab, dividerCount, dividerPositions, magnetHoles, screwHoles, scoop }: BinShape): Mesh => {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1) {
    throw new Error("A bin needs a whole number of cells");
  }
  if (cellSize <= 2 * CORNER_INSET) throw new Error("Bin cells are too small for the Gridfinity base");
  if (!Number.isInteger(height) || height < MIN_BIN_HEIGHT) {
    throw new Error(`A bin needs a whole height of at least ${MIN_BIN_HEIGHT} units`);
  }

  const builder = createMeshBuilder();
  const point = ([x, y]: Point, z: number): Vec3 => [x - BIN_GAP, y - BIN_GAP, z];
  const loft = (
    lowerRing: Point[],
    upperRing: Point[],
    lower: ProfilePoint,
    upper: ProfilePoint,
    center: Point,
    scoopClamp?: ScoopClamp
  ) => {
    lowerRing.forEach((current, index) => {
      const next = (index + 1) % lowerRing.length;
      if (scoopClamp !== undefined) {
        const step =
          scoopClamp.t[index] !== scoopClamp.t[next] && samePoint(current, lowerRing[next]);
        if (step) return;
        const aboveDip =
          scoopClamp.t[index] === 1 &&
          scoopClamp.t[next] === 1 &&
          unitMath.min(lower.z, upper.z) >= scoopClamp.top;
        if (aboveDip) return;
      }
      const clamped = (ringIndex: number, z: number): number =>
        scoopClamp !== undefined && scoopClamp.t[ringIndex] === 1
          ? unitMath.min(z, scoopClamp.top)
          : z;
      emitQuad(
        builder,
        point(current, clamped(index, lower.z)),
        point(lowerRing[next], clamped(next, lower.z)),
        point(upperRing[next], clamped(next, upper.z)),
        point(upperRing[index], clamped(index, upper.z)),
        outwardFacing(center, current, lowerRing[next], lower, upper)
      );
    });
  };
  const fan = (hub: Point, ring: Point[], z: number, facing: Vec3) => {
    ring.forEach((current, index) => {
      const a = point(hub, z);
      const b = point(current, z);
      const c = point(ring[(index + 1) % ring.length], z);
      if (!triangleIsDegenerate(a, b, c)) builder.triangle(a, b, c, facing);
    });
  };

  const width = columns * cellSize;
  const depth = rows * cellSize;
  const binCenter: Point = [width / 2, depth / 2];
  const scoopSpan = scoop === true ? scoopSpanFor(width) : undefined;

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const x0 = column * cellSize;
      const y0 = row * cellSize;
      const cellCenter: Point = [x0 + cellSize / 2, y0 + cellSize / 2];
      const corners = roundedCorners(x0, y0, cellSize, cellSize, CORNER_INSET);
      const rings = FOOT_PROFILE.map(({ inset }) =>
        corners.flatMap((corner) => arc(corner, BIN_TOP_RADIUS - inset))
      );
      const footRings =
        scoopSpan === undefined || row !== 0
          ? rings
          : rings.map((ring) => insertScoopPoints(ring, scoopSpan));
      const isCornerCell =
        (column === 0 || column === columns - 1) && (row === 0 || row === rows - 1);
      if (magnetHoles && isCornerCell) {
        magnetPocket(builder, cellCenter, footRings[0], magnetHoleRing(), MAGNET_HOLE_DEPTH_MM, screwHoles === true);
      } else if (screwHoles && isCornerCell) {
        triangulateAnnulus(
          builder,
          cellCenter,
          footRings[0],
          screwHoleRing(),
          SCREW_HOLE_DIAMETER_MM / 2,
          FOOT_PROFILE[0].z,
          DOWN
        );
        screwHoleWall(builder, cellCenter, FOOT_PROFILE[0].z, BIN_BASE_HEIGHT);
      } else {
        fan(cellCenter, footRings[0], FOOT_PROFILE[0].z, DOWN);
      }
      for (let band = 0; band < FOOT_PROFILE.length - 1; band += 1) {
        loft(footRings[band], footRings[band + 1], FOOT_PROFILE[band], FOOT_PROFILE[band + 1], cellCenter);
      }

      const boundary = [row === 0, column === columns - 1, row === rows - 1, column === 0];
      const footTop = corners.map((corner) => arc(corner, BIN_TOP_RADIUS));
      const onSide = ([x, y]: Point, side: number): Point => {
        if (side === 0) return [x, y0];
        if (side === 1) return [x0 + cellSize, y];
        if (side === 2) return [x, y0 + cellSize];
        return [x0, y];
      };

      corners.forEach((corner, index) => {
        const incoming = (index + 3) % 4;
        const outgoing = index;
        if (boundary[incoming] && boundary[outgoing]) return;
        const hub: Point = [
          corner.vertex[0] +
            BIN_GAP * ((boundary[incoming] ? INWARD[incoming][0] : 0) + (boundary[outgoing] ? INWARD[outgoing][0] : 0)),
          corner.vertex[1] +
            BIN_GAP * ((boundary[incoming] ? INWARD[incoming][1] : 0) + (boundary[outgoing] ? INWARD[outgoing][1] : 0)),
        ];
        const edge = footTop[index];
        if (!boundary[incoming]) {
          builder.triangle(point(hub, FOOT_TOP), point(onSide(edge[0], incoming), FOOT_TOP), point(edge[0], FOOT_TOP), DOWN);
        }
        for (let step = 0; step < ARC_SEGMENTS; step += 1) {
          builder.triangle(point(hub, FOOT_TOP), point(edge[step], FOOT_TOP), point(edge[step + 1], FOOT_TOP), DOWN);
        }
        if (!boundary[outgoing]) {
          builder.triangle(
            point(hub, FOOT_TOP),
            point(edge[ARC_SEGMENTS], FOOT_TOP),
            point(onSide(edge[ARC_SEGMENTS], outgoing), FOOT_TOP),
            DOWN
          );
        }
      });

      for (let side = 0; side < 4; side += 1) {
        if (boundary[side]) continue;
        const from = footTop[side][ARC_SEGMENTS];
        const to = footTop[(side + 1) % 4][0];
        builder.quad(
          point(onSide(from, side), FOOT_TOP),
          point(onSide(to, side), FOOT_TOP),
          point(to, FOOT_TOP),
          point(from, FOOT_TOP),
          DOWN
        );
      }
    }
  }

  const baseProfile = binWallProfile(height);
  const profile =
    scoopSpan === undefined ? baseProfile : splitProfileAtDip(baseProfile, scoopTopZMm(height));
  const rings = profile.map(({ inset }) => bodyRing(width, depth, cellSize, inset, scoopSpan));
  const scoopClamp =
    scoopSpan === undefined
      ? undefined
      : { t: scoopFactors(rings[0], scoopSpan), top: scoopTopZMm(height) };
  for (let band = 0; band < profile.length - 1; band += 1) {
    loft(rings[band], rings[band + 1], profile[band], profile[band + 1], binCenter, scoopClamp);
  }
  if (scoopSpan !== undefined && scoopClamp !== undefined) {
    const polygon = scoopStepPolygon(profile, scoopClamp.top);
    if (polygon.length >= 3) {
      const faces: Array<{ x: number; facing: Vec3 }> = [
        { x: scoopSpan.x0, facing: [1, 0, 0] },
        { x: scoopSpan.x1, facing: [-1, 0, 0] },
      ];
      faces.forEach(({ x, facing }) => {
        triangulatePolygon(polygon).forEach(([a, b, c]) => {
          builder.triangle(
            point([x, a[0]], a[1]),
            point([x, b[0]], b[1]),
            point([x, c[0]], c[1]),
            facing
          );
        });
      });
      const rimLow = Math.min(polygon[0][0], polygon[polygon.length - 1][0]);
      const rimHigh = Math.max(polygon[0][0], polygon[polygon.length - 1][0]);
      rings[0].forEach((current, index) => {
        const next = (index + 1) % rings[0].length;
        if (scoopClamp.t[index] !== 1 || scoopClamp.t[next] !== 1) return;
        builder.quad(
          point([current[0], rimLow], scoopClamp.top),
          point([rings[0][next][0], rimLow], scoopClamp.top),
          point([rings[0][next][0], rimHigh], scoopClamp.top),
          point([current[0], rimHigh], scoopClamp.top),
          UP
        );
      });
    }
  }
  const floorRing = rings[rings.length - 1].filter(
    (point, index, ring) => index === 0 || !samePoint(point, ring[index - 1])
  );
  if (screwHoles) {
    const holeCenters: Point[] = [];
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        if ((column === 0 || column === columns - 1) && (row === 0 || row === rows - 1)) {
          holeCenters.push([column * cellSize + cellSize / 2, row * cellSize + cellSize / 2]);
        }
      }
    }
    if (columns === 1 && rows === 1) {
      triangulateAnnulus(
        builder,
        binCenter,
        floorRing,
        screwHoleRing(),
        SCREW_HOLE_DIAMETER_MM / 2,
        BIN_BASE_HEIGHT,
        UP
      );
    } else {
      const replaced = new Set<number>();
      const count = floorRing.length;
      const at = (index: number): number => ((index % count) + count) % count;
      for (const holeCenter of holeCenters) {
        const hit = new Set<number>();
        floorRing.forEach((_, index) => {
          if (
            distanceToTriangle(
              holeCenter,
              binCenter,
              floorRing[index],
              floorRing[(index + 1) % count]
            ) <
            SCREW_HOLE_DIAMETER_MM / 2 + 1e-6
          ) {
            hit.add(index);
          }
        });
        if (hit.size === 0) continue;
        let start = [...hit][0];
        while (hit.has(at(start - 1))) start = at(start - 1);
        let end = start;
        while (hit.has(at(end + 1))) end = at(end + 1);
        const runVertices: Point[] = [];
        for (let step = 0; step <= hit.size; step += 1) {
          runVertices.push(floorRing[at(start + step)]);
        }
        const firstEdge = subdivideEdge(binCenter, runVertices[0], 0.25);
        const lastEdge = subdivideEdge(binCenter, runVertices[runVertices.length - 1], 0.25);
        const ring = [
          ...firstEdge,
          ...runVertices.slice(1, -1),
          ...lastEdge.slice(1),
        ].sort(
          (p, q) =>
            Math.atan2(p[1] - holeCenter[1], p[0] - holeCenter[0]) -
            Math.atan2(q[1] - holeCenter[1], q[0] - holeCenter[0])
        );
        triangulateAnnulus(
          builder,
          holeCenter,
          ring,
          screwHoleRing(),
          SCREW_HOLE_DIAMETER_MM / 2,
          BIN_BASE_HEIGHT,
          UP
        );
        hit.forEach((index) => replaced.add(index));
        const before = at(start - 1);
        if (!replaced.has(before)) {
          firstEdge.forEach((current, step) => {
            if (step === firstEdge.length - 1) return;
            builder.triangle(
              point(floorRing[before], BIN_BASE_HEIGHT),
              point(current, BIN_BASE_HEIGHT),
              point(firstEdge[step + 1], BIN_BASE_HEIGHT),
              UP
            );
          });
          replaced.add(before);
        }
        const after = at(end + 1);
        if (!replaced.has(after)) {
          lastEdge.forEach((current, step) => {
            if (step === lastEdge.length - 1) return;
            builder.triangle(
              point(floorRing[at(end + 2)], BIN_BASE_HEIGHT),
              point(current, BIN_BASE_HEIGHT),
              point(lastEdge[step + 1], BIN_BASE_HEIGHT),
              UP
            );
          });
          replaced.add(after);
        }
      }
      floorRing.forEach((current, index) => {
        if (replaced.has(index)) return;
        builder.triangle(
          point(binCenter, BIN_BASE_HEIGHT),
          point(current, BIN_BASE_HEIGHT),
          point(floorRing[(index + 1) % floorRing.length], BIN_BASE_HEIGHT),
          UP
        );
      });
    }
  } else {
    fan(binCenter, floorRing, BIN_BASE_HEIGHT, UP);
  }

  if (labelTab) labelTabBox(builder, columns, cellSize, height);
  if (dividerCount) {
    const alongX = columns >= rows;
    const span = (alongX ? depth : width) - 2 * BIN_GAP;
    const positions =
      dividerPositions && dividerPositions.length === dividerCount ? dividerPositions : null;
    for (let index = 0; index < dividerCount; index += 1) {
      const fraction = positions
        ? positions[index]
        : unitMath.divide(index + 1, dividerCount + 1);
      dividerBox(builder, columns, rows, cellSize, height, unitMath.multiply(span, fraction));
    }
  }

  return builder.build();
};
