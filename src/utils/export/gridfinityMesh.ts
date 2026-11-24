import { createMeshBuilder, type Mesh } from "./mesh";
import { BASEPLATE_HEIGHT_MM } from "@/utils/printParts";
import { unitMath } from "@/services/unitMath";
import {
  BASEPLATE_CORNER_RADIUS,
  CONNECTOR_BAND_HEIGHT_MM,
  CONNECTOR_DEPTH_MM,
  CONNECTOR_PROTRUSION_MM,
  POCKET_PROFILE,
  connectorWidthsMm,
  type BaseplateConnectorKind,
  type BaseplateConnectors,
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

interface EdgeFrame {
  origin: Point;
  tangent: Point;
  inward: Point;
  length: number;
  cells: number;
}

interface ConnectorFrame {
  edge: keyof BaseplateConnectors;
  kind: BaseplateConnectorKind;
  frame: EdgeFrame;
  center: number;
  neck: number;
  head: number;
  depth: number;
  cell: number;
  side: number;
}

type MeshBuilder = ReturnType<typeof createMeshBuilder>;

const framePoint = (frame: EdgeFrame, u: number, v: number): Point => [
  unitMath.add(
    unitMath.add(frame.origin[0], unitMath.multiply(frame.tangent[0], u)),
    unitMath.multiply(frame.inward[0], v)
  ),
  unitMath.add(
    unitMath.add(frame.origin[1], unitMath.multiply(frame.tangent[1], u)),
    unitMath.multiply(frame.inward[1], v)
  ),
];

const frameU = (frame: EdgeFrame, point: Point): number =>
  unitMath.add(
    unitMath.multiply(unitMath.subtract(point[0], frame.origin[0]), frame.tangent[0]),
    unitMath.multiply(unitMath.subtract(point[1], frame.origin[1]), frame.tangent[1])
  );

const frameV = (frame: EdgeFrame, point: Point): number =>
  unitMath.add(
    unitMath.multiply(unitMath.subtract(point[0], frame.origin[0]), frame.inward[0]),
    unitMath.multiply(unitMath.subtract(point[1], frame.origin[1]), frame.inward[1])
  );

const connectorFrames = (
  width: number,
  depth: number,
  columns: number,
  rows: number,
  cellSize: number,
  connectors: BaseplateConnectors
): ConnectorFrame[] => {
  const middle = (count: number): number =>
    unitMath.floor(unitMath.divide(unitMath.subtract(count, 1), 2));
  const specs: {
    edge: keyof BaseplateConnectors;
    kind: BaseplateConnectorKind | undefined;
    frame: EdgeFrame;
    side: number;
  }[] = [
    {
      edge: "bottom",
      kind: connectors.bottom,
      frame: { origin: [0, 0], tangent: [1, 0], inward: [0, 1], length: width, cells: columns },
      side: 0,
    },
    {
      edge: "right",
      kind: connectors.right,
      frame: { origin: [width, 0], tangent: [0, 1], inward: [-1, 0], length: depth, cells: rows },
      side: 1,
    },
    {
      edge: "top",
      kind: connectors.top,
      frame: { origin: [width, depth], tangent: [-1, 0], inward: [0, -1], length: width, cells: columns },
      side: 2,
    },
    {
      edge: "left",
      kind: connectors.left,
      frame: { origin: [0, depth], tangent: [0, -1], inward: [1, 0], length: depth, cells: rows },
      side: 3,
    },
  ];
  return specs.flatMap(({ edge, kind, frame, side }) => {
    if (kind === undefined) return [];
    const cell = middle(frame.cells);
    const along = unitMath.multiply(unitMath.add(cell, 0.5), cellSize);
    const forward = edge === "bottom" || edge === "right";
    const center = forward ? along : unitMath.subtract(frame.length, along);
    const { neck, head } = connectorWidthsMm(cellSize, kind);
    const depthValue = kind === "tab" ? -CONNECTOR_PROTRUSION_MM : CONNECTOR_DEPTH_MM;
    return [{ edge, kind, frame, center, neck, head, depth: depthValue, cell, side }];
  });
};

const connectorPoints = (connector: ConnectorFrame): Point[] => [
  framePoint(connector.frame, unitMath.subtract(connector.center, unitMath.divide(connector.neck, 2)), 0),
  framePoint(connector.frame, unitMath.subtract(connector.center, unitMath.divide(connector.head, 2)), connector.depth),
  framePoint(connector.frame, unitMath.add(connector.center, unitMath.divide(connector.head, 2)), connector.depth),
  framePoint(connector.frame, unitMath.add(connector.center, unitMath.divide(connector.neck, 2)), 0),
];

const insertConnectorPoints = (
  points: Point[],
  connector: ConnectorFrame,
  withHead: boolean
): Point[] => {
  const detour = connectorPoints(connector);
  const insert = withHead ? detour : [detour[0], detour[3]];
  const onLine = (point: Point): boolean => Math.abs(frameV(connector.frame, point)) < 1e-9;
  const index = points.findIndex((point, i) => {
    const next = points[(i + 1) % points.length];
    if (!onLine(point) || !onLine(next)) return false;
    const u = frameU(connector.frame, point);
    const nextU = frameU(connector.frame, next);
    return (
      (u < connector.center && connector.center < nextU) ||
      (nextU < connector.center && connector.center < u)
    );
  });
  if (index < 0) throw new Error("Baseplate connector has no seam to sit on");
  return [...points.slice(0, index + 1), ...insert, ...points.slice(index + 1)];
};

const rimBand = (builder: MeshBuilder, points: Point[], z0: number, z1: number): void => {
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const dx = unitMath.subtract(next[0], point[0]);
    const dy = unitMath.subtract(next[1], point[1]);
    builder.quad(at(point, z0), at(next, z0), at(next, z1), at(point, z1), [dy, -dx, 0]);
  });
};

const SIDE_TANGENTS: Point[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

const SIDE_INWARDS: Point[] = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

const buildFloorStrip = (
  builder: MeshBuilder,
  origin: Point,
  tangent: Point,
  inward: Point,
  cellSize: number,
  kind: BaseplateConnectorKind
): void => {
  const r = BASEPLATE_CORNER_RADIUS;
  const inset = POCKET_PROFILE[0].inset;
  const { neck, head } = connectorWidthsMm(cellSize, kind);
  const center = unitMath.divide(cellSize, 2);
  const depth = kind === "tab" ? -CONNECTOR_PROTRUSION_MM : CONNECTOR_DEPTH_MM;
  const o1: Point = [r, 0];
  const o2: Point = [unitMath.subtract(cellSize, r), 0];
  const f1: Point = [r, inset];
  const f2: Point = [unitMath.subtract(cellSize, r), inset];
  const p1: Point = [unitMath.subtract(center, unitMath.divide(neck, 2)), 0];
  const p2: Point = [unitMath.subtract(center, unitMath.divide(head, 2)), depth];
  const p3: Point = [unitMath.add(center, unitMath.divide(head, 2)), depth];
  const p4: Point = [unitMath.add(center, unitMath.divide(neck, 2)), 0];
  const n1: Point = [p1[0], inset];
  const n4: Point = [p4[0], inset];
  const point = ([u, v]: Point): Point => [
    unitMath.add(
      unitMath.add(origin[0], unitMath.multiply(tangent[0], u)),
      unitMath.multiply(inward[0], v)
    ),
    unitMath.add(
      unitMath.add(origin[1], unitMath.multiply(tangent[1], u)),
      unitMath.multiply(inward[1], v)
    ),
  ];
  const triangles: Point[][] =
    kind === "tab"
      ? [
          [o1, p1, n1],
          [o1, n1, f1],
          [p1, p4, n4],
          [p1, n4, n1],
          [p4, o2, f2],
          [p4, f2, n4],
        ]
      : [
          [o1, p1, p2],
          [o1, p2, f1],
          [p2, n1, f1],
          [p2, p3, n4],
          [p2, n4, n1],
          [p3, p4, o2],
          [p3, o2, f2],
          [p3, f2, n4],
        ];
  for (const [a, b, c] of triangles) {
    builder.triangle(at(point(a), 0), at(point(b), 0), at(point(c), 0), DOWN);
  }
};

export const baseplateMesh = (
  columns: number,
  rows: number,
  cellSize: number,
  connectors?: BaseplateConnectors
): Mesh => {
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
  const frames =
    connectors === undefined
      ? []
      : connectorFrames(width, depth, columns, rows, cellSize, connectors);
  const stripKinds = new Map<string, BaseplateConnectorKind>();
  for (const frame of frames) {
    const column = frame.edge === "right" ? columns - 1 : frame.edge === "left" ? 0 : frame.cell;
    const row = frame.edge === "top" ? rows - 1 : frame.edge === "bottom" ? 0 : frame.cell;
    stripKinds.set(`${column},${row},${frame.side}`, frame.kind);
  }

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

      const ringWithNeck = (band: number): Point[] => {
        let flat = rings[band].flat();
        const inset = POCKET_PROFILE[band].inset;
        const sides = [2, 1, 0, 3].filter(
          (candidate) => stripKinds.get(`${column},${row},${candidate}`) !== undefined
        );
        for (const side of sides) {
          const sideKind = stripKinds.get(`${column},${row},${side}`);
          if (sideKind === undefined) continue;
          const { neck } = connectorWidthsMm(cellSize, sideKind);
          const centerU = unitMath.divide(cellSize, 2);
          const origin = corners[side].vertex;
          const tangent = SIDE_TANGENTS[side];
          const inward = SIDE_INWARDS[side];
          const neckPoint = (u: number): Point => [
            unitMath.add(
              unitMath.add(origin[0], unitMath.multiply(tangent[0], u)),
              unitMath.multiply(inward[0], inset)
            ),
            unitMath.add(
              unitMath.add(origin[1], unitMath.multiply(tangent[1], u)),
              unitMath.multiply(inward[1], inset)
            ),
          ];
          const p1 = neckPoint(unitMath.subtract(centerU, unitMath.divide(neck, 2)));
          const p4 = neckPoint(unitMath.add(centerU, unitMath.divide(neck, 2)));
          const at = side === 3 ? 0 : (side + 1) * (ARC_SEGMENTS + 1);
          flat = [...flat.slice(0, at), p1, p4, ...flat.slice(at)];
        }
        return flat;
      };

      for (let band = 0; band < POCKET_PROFILE.length - 1; band += 1) {
        const lower = ringWithNeck(band);
        const upper = ringWithNeck(band + 1);
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
        const stripKind = stripKinds.get(`${column},${row},${index}`);
        if (stripKind === undefined) {
          builder.quad(
            at(outer[ARC_SEGMENTS], 0),
            at(edge[following][0], 0),
            at(pocketFloor[following][0], 0),
            at(inner[ARC_SEGMENTS], 0),
            DOWN
          );
        } else {
          buildFloorStrip(
            builder,
            corner.vertex,
            SIDE_TANGENTS[index],
            SIDE_INWARDS[index],
            cellSize,
            stripKind
          );
        }
      });
    }
  }

  const baseRim = outline(width, depth, cellSize);
  if (frames.length === 0) {
    const rim = baseRim;
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
  } else {
    let straight = baseRim;
    let detoured = baseRim;
    for (const frame of frames) {
      straight = insertConnectorPoints(straight, frame, false);
      detoured = insertConnectorPoints(detoured, frame, true);
    }
    rimBand(builder, detoured, 0, CONNECTOR_BAND_HEIGHT_MM);
    rimBand(builder, straight, CONNECTOR_BAND_HEIGHT_MM, top);
    for (const frame of frames) {
      const [p1, p2, p3, p4] = connectorPoints(frame);
      const ledgeFacing = frame.kind === "tab" ? UP : DOWN;
      builder.triangle(
        at(p1, CONNECTOR_BAND_HEIGHT_MM),
        at(p2, CONNECTOR_BAND_HEIGHT_MM),
        at(p3, CONNECTOR_BAND_HEIGHT_MM),
        ledgeFacing
      );
      builder.triangle(
        at(p1, CONNECTOR_BAND_HEIGHT_MM),
        at(p3, CONNECTOR_BAND_HEIGHT_MM),
        at(p4, CONNECTOR_BAND_HEIGHT_MM),
        ledgeFacing
      );
      if (frame.kind === "tab") {
        builder.triangle(at(p1, 0), at(p2, 0), at(p3, 0), DOWN);
        builder.triangle(at(p1, 0), at(p3, 0), at(p4, 0), DOWN);
      }
    }
  }

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
