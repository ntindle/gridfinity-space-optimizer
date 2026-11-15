import { createMeshBuilder, type Mesh } from "./mesh";
import { BASEPLATE_HEIGHT_MM } from "@/utils/printParts";
import {
  BASEPLATE_CORNER_RADIUS,
  POCKET_PROFILE,
} from "./gridfinityProfiles";
import {
  ARC_SEGMENTS,
  DOWN,
  SIDE_DIRECTIONS,
  UP,
  arc,
  at,
  midpoint,
  roundedCorners,
  toward,
  type Point,
} from "./shapes";

export const BASEPLATE_HEIGHT = BASEPLATE_HEIGHT_MM;

const outline = (width: number, depth: number, cellSize: number): Point[] => {
  const r = BASEPLATE_CORNER_RADIUS;
  const columns = Math.round(width / cellSize);
  const rows = Math.round(depth / cellSize);
  const seams = (count: number, place: (step: number) => Point) =>
    Array.from({ length: count - 1 }, (_, index) => place(index + 1));
  const edges: Point[][] = [
    seams(columns, (step) => [step * cellSize, 0]),
    seams(rows, (step) => [width, step * cellSize]),
    seams(columns, (step) => [width - step * cellSize, depth]),
    seams(rows, (step) => [0, depth - step * cellSize]),
  ];
  return roundedCorners(0, 0, width, depth, r).flatMap((corner, index) => [
    ...arc(corner, r),
    ...edges[index].flatMap(([x, y]): Point[] => {
      const [dx, dy] = SIDE_DIRECTIONS[index];
      return [
        [x - r * dx, y - r * dy],
        [x, y],
        [x + r * dx, y + r * dy],
      ];
    }),
  ]);
};

export const baseplateMesh = (columns: number, rows: number, cellSize: number): Mesh => {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1) {
    throw new Error("A baseplate needs a whole number of cells");
  }
  if (cellSize <= 2 * BASEPLATE_CORNER_RADIUS) {
    throw new Error("Baseplate cells are too small for the Gridfinity profile");
  }

  const builder = createMeshBuilder();
  const width = columns * cellSize;
  const depth = rows * cellSize;
  const top = BASEPLATE_HEIGHT;
  const isPlateCorner = ([x, y]: Point) => (x === 0 || x === width) && (y === 0 || y === depth);

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const x = column * cellSize;
      const y = row * cellSize;
      const center: Point = [x + cellSize / 2, y + cellSize / 2];
      const corners = roundedCorners(x, y, cellSize, cellSize, BASEPLATE_CORNER_RADIUS);
      const rings = POCKET_PROFILE.map(({ inset }) =>
        corners.map((corner) => arc(corner, BASEPLATE_CORNER_RADIUS - inset))
      );
      const edge = corners.map((corner) => arc(corner, BASEPLATE_CORNER_RADIUS));

      for (let band = 0; band < POCKET_PROFILE.length - 1; band += 1) {
        const lower = rings[band].flat();
        const upper = rings[band + 1].flat();
        const lowerZ = POCKET_PROFILE[band].z;
        const upperZ = POCKET_PROFILE[band + 1].z;
        lower.forEach((point, index) => {
          const next = (index + 1) % lower.length;
          builder.quad(
            at(point, lowerZ),
            at(lower[next], lowerZ),
            at(upper[next], upperZ),
            at(upper[index], upperZ),
            toward(midpoint(point, lower[next]), center)
          );
        });
      }

      const pocketFloor = rings[0];
      corners.forEach((corner, index) => {
        const inner = pocketFloor[index];
        const outer = edge[index];
        const following = (index + 1) % corners.length;
        if (isPlateCorner(corner.vertex)) {
          for (let step = 0; step < ARC_SEGMENTS; step += 1) {
            builder.quad(
              at(outer[step], 0),
              at(outer[step + 1], 0),
              at(inner[step + 1], 0),
              at(inner[step], 0),
              DOWN
            );
          }
        } else {
          builder.triangle(at(corner.vertex, 0), at(outer[0], 0), at(inner[0], 0), DOWN);
          for (let step = 0; step < ARC_SEGMENTS; step += 1) {
            builder.triangle(at(corner.vertex, 0), at(inner[step], 0), at(inner[step + 1], 0), DOWN);
            builder.triangle(at(corner.vertex, top), at(outer[step], top), at(outer[step + 1], top), UP);
          }
          builder.triangle(
            at(corner.vertex, 0),
            at(inner[ARC_SEGMENTS], 0),
            at(outer[ARC_SEGMENTS], 0),
            DOWN
          );
        }
        builder.quad(
          at(outer[ARC_SEGMENTS], 0),
          at(edge[following][0], 0),
          at(pocketFloor[following][0], 0),
          at(inner[ARC_SEGMENTS], 0),
          DOWN
        );
      });
    }
  }

  const rim = outline(width, depth, cellSize);
  const plateCenter: Point = [width / 2, depth / 2];
  rim.forEach((point, index) => {
    const next = rim[(index + 1) % rim.length];
    builder.quad(
      at(point, 0),
      at(next, 0),
      at(next, top),
      at(point, top),
      toward(plateCenter, midpoint(point, next))
    );
  });

  return builder.build();
};

export const spacerMesh = (width: number, depth: number, height: number = BASEPLATE_HEIGHT): Mesh => {
  if (!(width > 0) || !(depth > 0) || !(height > 0)) {
    throw new Error("A spacer needs a positive width, depth, and height");
  }
  const builder = createMeshBuilder();
  const corners: Point[] = [
    [0, 0],
    [width, 0],
    [width, depth],
    [0, depth],
  ];
  const center: Point = [width / 2, depth / 2];
  builder.quad(at(corners[0], 0), at(corners[1], 0), at(corners[2], 0), at(corners[3], 0), DOWN);
  builder.quad(
    at(corners[0], height),
    at(corners[1], height),
    at(corners[2], height),
    at(corners[3], height),
    UP
  );
  corners.forEach((corner, index) => {
    const next = corners[(index + 1) % corners.length];
    builder.quad(
      at(corner, 0),
      at(next, 0),
      at(next, height),
      at(corner, height),
      toward(center, midpoint(corner, next))
    );
  });
  return builder.build();
};
