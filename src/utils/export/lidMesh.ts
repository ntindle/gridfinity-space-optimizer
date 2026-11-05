import {
  LID_LIP_CLEARANCE_MM,
  LID_LIP_DEPTH_MM,
  LID_LIP_THICKNESS_MM,
  LID_THICKNESS_MM,
} from "@/utils/bins";
import {
  BIN_TOP_RADIUS,
  STACKING_LIP_INNER_INSET_MM,
} from "./gridfinityProfiles";
import { createMeshBuilder, type Mesh, type Vec3 } from "./mesh";
import { DOWN, UP, arc, roundedCorners, type Point } from "./shapes";

const ringOutline = (
  x: number,
  y: number,
  width: number,
  depth: number,
  radius: number
): Point[] =>
  roundedCorners(x, y, width, depth, radius).flatMap((corner) =>
    arc(corner, radius)
  );

const lipRing = (
  builder: ReturnType<typeof createMeshBuilder>,
  width: number,
  depth: number
): void => {
  const outerInset = STACKING_LIP_INNER_INSET_MM + LID_LIP_CLEARANCE_MM;
  const outerRadius =
    BIN_TOP_RADIUS - STACKING_LIP_INNER_INSET_MM - LID_LIP_CLEARANCE_MM;
  const innerInset = outerInset + LID_LIP_THICKNESS_MM;
  const innerRadius = outerRadius - LID_LIP_THICKNESS_MM;
  const outerWidth = width - 2 * outerInset;
  const outerDepth = depth - 2 * outerInset;
  const innerWidth = outerWidth - 2 * LID_LIP_THICKNESS_MM;
  const innerDepth = outerDepth - 2 * LID_LIP_THICKNESS_MM;
  if (innerWidth <= 0 || innerDepth <= 0) {
    throw new Error("A lid is too small for its locating lip");
  }
  const outer = ringOutline(
    outerInset,
    outerInset,
    outerWidth,
    outerDepth,
    outerRadius
  );
  const inner = ringOutline(
    innerInset,
    innerInset,
    innerWidth,
    innerDepth,
    innerRadius
  );
  const z0 = LID_THICKNESS_MM;
  const z1 = LID_THICKNESS_MM + LID_LIP_DEPTH_MM;
  const center: Point = [width / 2, depth / 2];
  const point = (outline: Point, z: number): Vec3 => [outline[0], outline[1], z];
  outer.forEach((current, index) => {
    const next = outer[(index + 1) % outer.length];
    const currentInner = inner[index];
    const followingInner = inner[(index + 1) % inner.length];
    const outerMid: Point = [
      (current[0] + next[0]) / 2,
      (current[1] + next[1]) / 2,
    ];
    const innerMid: Point = [
      (currentInner[0] + followingInner[0]) / 2,
      (currentInner[1] + followingInner[1]) / 2,
    ];
    const outward: Vec3 = [
      outerMid[0] - center[0],
      outerMid[1] - center[1],
      0,
    ];
    const inward: Vec3 = [
      center[0] - innerMid[0],
      center[1] - innerMid[1],
      0,
    ];
    builder.quad(
      point(current, z0),
      point(next, z0),
      point(next, z1),
      point(current, z1),
      outward
    );
    builder.quad(
      point(currentInner, z0),
      point(followingInner, z0),
      point(followingInner, z1),
      point(currentInner, z1),
      inward
    );
    builder.quad(
      point(current, z1),
      point(next, z1),
      point(followingInner, z1),
      point(currentInner, z1),
      UP
    );
    builder.quad(
      point(current, z0),
      point(currentInner, z0),
      point(followingInner, z0),
      point(next, z0),
      DOWN
    );
  });
};

export const lidMesh = (width: number, depth: number): Mesh => {
  if (!(width > 0) || !(depth > 0)) {
    throw new Error("A lid needs a positive width and depth");
  }
  const builder = createMeshBuilder();
  const point = (x: number, y: number, z: number): [number, number, number] => [x, y, z];
  const z0 = 0;
  const z1 = LID_THICKNESS_MM;
  builder.quad(point(0, 0, z0), point(width, 0, z0), point(width, depth, z0), point(0, depth, z0), DOWN);
  builder.quad(point(0, 0, z1), point(width, 0, z1), point(width, depth, z1), point(0, depth, z1), UP);
  builder.quad(point(0, 0, z0), point(0, depth, z0), point(0, depth, z1), point(0, 0, z1), [-1, 0, 0]);
  builder.quad(point(width, 0, z0), point(width, depth, z0), point(width, depth, z1), point(width, 0, z1), [1, 0, 0]);
  builder.quad(point(0, 0, z0), point(width, 0, z0), point(width, 0, z1), point(0, 0, z1), [0, -1, 0]);
  builder.quad(point(0, depth, z0), point(width, depth, z0), point(width, depth, z1), point(0, depth, z1), [0, 1, 0]);
  lipRing(builder, width, depth);
  return builder.build();
};
