import { triangleCount, triangleNormal, type Mesh, type Vec3 } from "./mesh";

const TIMESTAMP = "1980-01-01T00:00:00";
const LINE_LIMIT = 72;

const formatReal = (value: number): string => {
  const fixed = (Math.round(value * 1e6) / 1e6 + 0).toFixed(6);
  const trimmed = fixed.replace(/0+$/, "").replace(/\.$/, ".0");
  return trimmed === "-0.0" ? "0.0" : trimmed;
};

const escapeText = (value: string): string =>
  value.replace(/\p{Cc}/gu, " ").replace(/'/g, "''");

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

const normalize = (a: Vec3): Vec3 => {
  const size = length(a);
  return [a[0] / size, a[1] / size, a[2] / size];
};

const wrapLine = (line: string): string => {
  if (line.length <= LINE_LIMIT) return line;
  const lines: string[] = [];
  let rest = line;
  while (rest.length > LINE_LIMIT) {
    let cut = -1;
    let quoted = false;
    for (let index = 0; index < LINE_LIMIT; index += 1) {
      const char = rest[index];
      if (char === "'") {
        if (quoted && rest[index + 1] === "'") {
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        cut = index;
      }
    }
    const at = cut > 0 ? cut + 1 : LINE_LIMIT;
    lines.push(rest.slice(0, at));
    rest = rest.slice(at);
  }
  lines.push(rest);
  return lines.join("\n");
};

export const meshToStep = (mesh: Mesh, name: string): string => {
  if (mesh.positions.length % 3 !== 0 || mesh.triangles.length % 3 !== 0) {
    throw new Error("A STEP part needs whole vertices and triangles");
  }
  const count = triangleCount(mesh);
  if (count === 0) throw new Error("A STEP part needs at least one triangle");

  const vertexPoints: Vec3[] = [];
  const vertexSlot = new Map<string, number>();
  const slotOf = new Map<number, number>();
  for (let index = 0; index < mesh.positions.length; index += 3) {
    const point: Vec3 = [mesh.positions[index], mesh.positions[index + 1], mesh.positions[index + 2]];
    if (!point.every((value) => Number.isFinite(value))) {
      throw new Error("A STEP part needs finite coordinates");
    }
    const key = point.map(formatReal).join(",");
    let slot = vertexSlot.get(key);
    if (slot === undefined) {
      slot = vertexPoints.length;
      vertexPoints.push(point);
      vertexSlot.set(key, slot);
    }
    slotOf.set(index / 3, slot);
  }

  const faces: [number, number, number][] = [];
  for (let triangle = 0; triangle < count; triangle += 1) {
    const slots = [0, 1, 2].map((corner) => slotOf.get(mesh.triangles[triangle * 3 + corner]));
    if (slots.some((slot) => slot === undefined)) {
      throw new Error("A STEP part triangle points at a missing vertex");
    }
    const [a, b, c] = slots as [number, number, number];
    if (a === b || b === c || a === c) {
      throw new Error("A STEP part triangle collapses to a line");
    }
    const normal = triangleNormal(mesh, triangle);
    if (normal[0] === 0 && normal[1] === 0 && normal[2] === 0) {
      throw new Error("A STEP part triangle has no area");
    }
    faces.push([a, b, c]);
  }

  const edges: [number, number][] = [];
  const edgeSlot = new Map<string, number>();
  const edgeFor = (a: number, b: number): number => {
    const start = a < b ? a : b;
    const end = a < b ? b : a;
    const key = `${start},${end}`;
    let slot = edgeSlot.get(key);
    if (slot === undefined) {
      slot = edges.length;
      edges.push([start, end]);
      edgeSlot.set(key, slot);
    }
    return slot;
  };
  const directedUses = new Map<string, number>();
  for (const [a, b, c] of faces) {
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, a],
    ] as [number, number][]) {
      edgeFor(from, to);
      const key = `${from},${to}`;
      directedUses.set(key, (directedUses.get(key) ?? 0) + 1);
    }
  }
  for (const [start, end] of edges) {
    if (directedUses.get(`${start},${end}`) !== 1 || directedUses.get(`${end},${start}`) !== 1) {
      throw new Error("A STEP part needs a closed mesh with every edge shared by two triangles");
    }
  }

  const entities: string[] = [];
  const add = (body: string): number => {
    entities.push(body);
    return entities.length;
  };

  const lengthUnit = add("(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))");
  const angleUnit = add("(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))");
  const solidUnit = add("(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())");
  const uncertainty = add(
    `UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.01),#${lengthUnit},'DISTANCE_ACCURACY_VALUE','Maximum Tolerance')`
  );
  const context = add(
    `(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${uncertainty}))GLOBAL_UNIT_ASSIGNED_CONTEXT((#${lengthUnit},#${angleUnit},#${solidUnit}))REPRESENTATION_CONTEXT('Context #1','3D Context with UNIT and UNCERTAINTY'))`
  );

  const pointIds = vertexPoints.map((point) =>
    add(`CARTESIAN_POINT('',(${point.map(formatReal).join(",")}))`)
  );
  const vertexIds = pointIds.map((id) => add(`VERTEX_POINT('',#${id})`));

  const edgeIds = edges.map(([start, end]) => {
    const delta = subtract(vertexPoints[end], vertexPoints[start]);
    const direction = add(`DIRECTION('',(${normalize(delta).map(formatReal).join(",")}))`);
    const vector = add(`VECTOR('',#${direction},${formatReal(length(delta))})`);
    const line = add(`LINE('',#${pointIds[start]},#${vector})`);
    return add(`EDGE_CURVE('',#${vertexIds[start]},#${vertexIds[end]},#${line},.T.)`);
  });

  const faceIds = faces.map(([a, b, c], triangle) => {
    const normal = triangleNormal(mesh, triangle);
    const axis = add(`DIRECTION('',(${normal.map(formatReal).join(",")}))`);
    const ref = add(
      `DIRECTION('',(${normalize(subtract(vertexPoints[b], vertexPoints[a])).map(formatReal).join(",")}))`
    );
    const placement = add(`AXIS2_PLACEMENT_3D('',#${pointIds[a]},#${axis},#${ref})`);
    const plane = add(`PLANE('',#${placement})`);
    const oriented = (
      [
        [a, b],
        [b, c],
        [c, a],
      ] as [number, number][]
    ).map(([from, to]) => {
      const slot = edgeFor(from, to);
      const orientation = edges[slot][0] === from ? ".T." : ".F.";
      return add(`ORIENTED_EDGE('',*,*,#${edgeIds[slot]},${orientation})`);
    });
    const loop = add(`EDGE_LOOP('',(${oriented.map((id) => `#${id}`).join(",")}))`);
    const bound = add(`FACE_OUTER_BOUND('',#${loop},.T.)`);
    return add(`ADVANCED_FACE('',(#${bound}),#${plane},.T.)`);
  });

  const productName = escapeText(name);
  const shell = add(`CLOSED_SHELL('',(${faceIds.map((id) => `#${id}`).join(",")}))`);
  const solid = add(`MANIFOLD_SOLID_BREP('${productName}',#${shell})`);
  const representation = add(`ADVANCED_BREP_SHAPE_REPRESENTATION('',(#${solid}),#${context})`);
  const appContext = add("APPLICATION_CONTEXT('mechanical design')");
  add(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2001,#${appContext})`);
  const productContext = add(`PRODUCT_CONTEXT('',#${appContext},'mechanical')`);
  const product = add(`PRODUCT('${productName}','${productName}','',(#${productContext}))`);
  const formation = add(`PRODUCT_FORMATION_WITH_SPECIFIED_SOURCE('','',#${product},.MADE.)`);
  const property = add(`PROPERTY_DEFINITION('shape','',#${formation})`);
  add(`SHAPE_DEFINITION_REPRESENTATION(#${property},#${representation})`);

  const lines = [
    "ISO-10303-21;",
    "HEADER;",
    "FILE_DESCRIPTION(('Gridfinity Layout faceted STEP export'),'2;1');",
    `FILE_NAME('${productName}.step','${TIMESTAMP}',(''),(''),'Gridfinity Layout','Gridfinity Layout','');`,
    "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 }'));",
    "ENDSEC;",
    "DATA;",
    ...entities.map((body, index) => `#${index + 1}=${body};`),
    "ENDSEC;",
    "END-ISO-10303-21;",
    "",
  ];
  return lines.map(wrapLine).join("\n");
};
