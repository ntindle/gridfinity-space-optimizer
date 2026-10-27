import type { Vec3 } from "./mesh";
import { ARC_SEGMENTS } from "./gridfinityProfiles";

export { ARC_SEGMENTS };

export type Point = readonly [number, number];

export interface Corner {
  vertex: Point;
  center: Point;
  startAngle: number;
}

export const UP: Vec3 = [0, 0, 1];
export const DOWN: Vec3 = [0, 0, -1];

const QUARTER_TURNS: Point[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

export const direction = (degrees: number): Point => {
  if (degrees % 90 === 0) return QUARTER_TURNS[(((degrees / 90) % 4) + 4) % 4];
  const radians = (degrees * Math.PI) / 180;
  return [Math.cos(radians), Math.sin(radians)];
};

export const arc = (corner: Corner, radius: number): Point[] =>
  Array.from({ length: ARC_SEGMENTS + 1 }, (_, step) => {
    const [dx, dy] = direction(corner.startAngle + (90 * step) / ARC_SEGMENTS);
    return [corner.center[0] + radius * dx, corner.center[1] + radius * dy];
  });

export const at = (point: Point, z: number): Vec3 => [point[0], point[1], z];

export const toward = (from: Point, to: Point): Vec3 => [to[0] - from[0], to[1] - from[1], 0];

export const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export const roundedCorners = (
  x: number,
  y: number,
  width: number,
  depth: number,
  inset: number
): Corner[] => [
  { vertex: [x, y], center: [x + inset, y + inset], startAngle: 180 },
  { vertex: [x + width, y], center: [x + width - inset, y + inset], startAngle: 270 },
  { vertex: [x + width, y + depth], center: [x + width - inset, y + depth - inset], startAngle: 0 },
  { vertex: [x, y + depth], center: [x + inset, y + depth - inset], startAngle: 90 },
];

export const SIDE_DIRECTIONS: Point[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
