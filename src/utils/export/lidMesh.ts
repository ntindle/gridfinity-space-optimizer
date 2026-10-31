import { LID_THICKNESS_MM } from "@/utils/bins";
import { createMeshBuilder, type Mesh } from "./mesh";
import { DOWN, UP } from "./shapes";

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
  return builder.build();
};
