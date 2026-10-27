import { MIN_BIN_HEIGHT } from "@/utils/bins";
import { createMeshBuilder, type Mesh, type Vec3 } from "./mesh";
import {
  BIN_BASE_HEIGHT,
  BIN_GAP,
  BIN_TOP_RADIUS,
  FOOT_PROFILE,
  binWallProfile,
  type ProfilePoint,
} from "./gridfinityProfiles";
import {
  ARC_SEGMENTS,
  DOWN,
  SIDE_DIRECTIONS,
  UP,
  arc,
  midpoint,
  roundedCorners,
  type Point,
} from "./shapes";

export interface BinShape {
  columns: number;
  rows: number;
  cellSize: number;
  height: number;
}

const FOOT_TOP = FOOT_PROFILE[FOOT_PROFILE.length - 1].z;
const CORNER_INSET = BIN_GAP + BIN_TOP_RADIUS;
const INWARD: Point[] = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

const bodyRing = (width: number, depth: number, cellSize: number, inset: number): Point[] => {
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
  return roundedCorners(0, 0, width, depth, CORNER_INSET).flatMap((corner, index) => [
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

export const binMesh = ({ columns, rows, cellSize, height }: BinShape): Mesh => {
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
    center: Point
  ) => {
    lowerRing.forEach((current, index) => {
      const next = (index + 1) % lowerRing.length;
      builder.quad(
        point(current, lower.z),
        point(lowerRing[next], lower.z),
        point(upperRing[next], upper.z),
        point(upperRing[index], upper.z),
        outwardFacing(center, current, lowerRing[next], lower, upper)
      );
    });
  };
  const fan = (hub: Point, ring: Point[], z: number, facing: Vec3) => {
    ring.forEach((current, index) => {
      builder.triangle(point(hub, z), point(current, z), point(ring[(index + 1) % ring.length], z), facing);
    });
  };

  const width = columns * cellSize;
  const depth = rows * cellSize;
  const binCenter: Point = [width / 2, depth / 2];

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const x0 = column * cellSize;
      const y0 = row * cellSize;
      const cellCenter: Point = [x0 + cellSize / 2, y0 + cellSize / 2];
      const corners = roundedCorners(x0, y0, cellSize, cellSize, CORNER_INSET);
      const rings = FOOT_PROFILE.map(({ inset }) =>
        corners.flatMap((corner) => arc(corner, BIN_TOP_RADIUS - inset))
      );
      fan(cellCenter, rings[0], FOOT_PROFILE[0].z, DOWN);
      for (let band = 0; band < FOOT_PROFILE.length - 1; band += 1) {
        loft(rings[band], rings[band + 1], FOOT_PROFILE[band], FOOT_PROFILE[band + 1], cellCenter);
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

  const profile = binWallProfile(height);
  const rings = profile.map(({ inset }) => bodyRing(width, depth, cellSize, inset));
  for (let band = 0; band < profile.length - 1; band += 1) {
    loft(rings[band], rings[band + 1], profile[band], profile[band + 1], binCenter);
  }
  fan(binCenter, rings[rings.length - 1], BIN_BASE_HEIGHT, UP);

  return builder.build();
};
