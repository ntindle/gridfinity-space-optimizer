export type Vec3 = readonly [number, number, number];

export interface Mesh {
  positions: number[];
  triangles: number[];
}

const PRECISION = 1e6;

const snap = (value: number): number => Math.round(value * PRECISION) / PRECISION + 0;

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

export const createMeshBuilder = () => {
  const positions: number[] = [];
  const triangles: number[] = [];
  const lookup = new Map<string, number>();

  const vertex = (point: Vec3): number => {
    const x = snap(point[0]);
    const y = snap(point[1]);
    const z = snap(point[2]);
    const key = `${x},${y},${z}`;
    const existing = lookup.get(key);
    if (existing !== undefined) return existing;
    const id = positions.length / 3;
    positions.push(x, y, z);
    lookup.set(key, id);
    return id;
  };

  const triangle = (a: Vec3, b: Vec3, c: Vec3, facing: Vec3): void => {
    const normal = cross(subtract(b, a), subtract(c, a));
    const alignment = dot(normal, facing);
    if (Math.abs(alignment) <= 1e-9 * length(normal) * length(facing) || length(normal) < 1e-9) {
      throw new Error("Mesh triangle is degenerate or has no clear facing");
    }
    const ids = alignment > 0 ? [vertex(a), vertex(b), vertex(c)] : [vertex(a), vertex(c), vertex(b)];
    if (ids[0] === ids[1] || ids[1] === ids[2] || ids[0] === ids[2]) {
      throw new Error("Mesh triangle collapses after snapping");
    }
    triangles.push(ids[0], ids[1], ids[2]);
  };

  const quad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3, facing: Vec3): void => {
    triangle(a, b, c, facing);
    triangle(a, c, d, facing);
  };

  const build = (): Mesh => ({ positions, triangles });

  return { triangle, quad, build };
};

export const triangleCount = (mesh: Mesh): number => mesh.triangles.length / 3;

export const meshCorner = (mesh: Mesh, triangle: number, corner: number): Vec3 => {
  const index = mesh.triangles[triangle * 3 + corner] * 3;
  return [mesh.positions[index], mesh.positions[index + 1], mesh.positions[index + 2]];
};

export const triangleNormal = (mesh: Mesh, triangle: number): Vec3 => {
  const a = meshCorner(mesh, triangle, 0);
  const normal = cross(
    subtract(meshCorner(mesh, triangle, 1), a),
    subtract(meshCorner(mesh, triangle, 2), a)
  );
  const size = length(normal);
  return size > 0 ? [normal[0] / size, normal[1] / size, normal[2] / size] : [0, 0, 0];
};

export const meshBounds = (mesh: Mesh): { min: Vec3; max: Vec3 } => {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < mesh.positions.length; index += 1) {
    const axis = index % 3;
    min[axis] = Math.min(min[axis], mesh.positions[index]);
    max[axis] = Math.max(max[axis], mesh.positions[index]);
  }
  return { min: [min[0], min[1], min[2]], max: [max[0], max[1], max[2]] };
};

export const meshVolume = (mesh: Mesh): number => {
  let volume = 0;
  for (let triangle = 0; triangle < triangleCount(mesh); triangle += 1) {
    volume += dot(
      meshCorner(mesh, triangle, 0),
      cross(meshCorner(mesh, triangle, 1), meshCorner(mesh, triangle, 2))
    );
  }
  return volume / 6;
};
