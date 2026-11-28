import { describe, it, expect } from 'vitest';
import { meshToStep } from './step';
import { spacerMesh } from './gridfinityMesh';
import { triangleCount } from './mesh';

const countOf = (text: string, pattern: RegExp): number => (text.match(pattern) ?? []).length;

type Point = [number, number, number];

const logicalEntities = (text: string): Map<number, string> => {
  const entities = new Map<number, string>();
  let current = '';
  for (const line of text.split('\n')) {
    current += line;
    if (line.endsWith(';')) {
      const match = current.match(/^#(\d+)=(.*);$/);
      if (match) entities.set(Number(match[1]), match[2]);
      current = '';
    }
  }
  return entities;
};

const refsOf = (body: string): number[] =>
  [...body.matchAll(/#(\d+)/g)].map((match) => Number(match[1]));

const chainedFaceVertices = (text: string): Point[][] => {
  const entities = logicalEntities(text);
  const pointOf = (vertexId: number): Point => {
    const pointId = refsOf(entities.get(vertexId) ?? '')[0];
    const coords = (entities.get(pointId) ?? '').match(/\(([-0-9.,]+)\)\)$/);
    if (!coords) throw new Error(`Vertex ${vertexId} has no point`);
    return coords[1].split(',').map(Number) as Point;
  };
  const directedEdge = (orientedId: number): [number, number] => {
    const match = (entities.get(orientedId) ?? '').match(
      /ORIENTED_EDGE\('',\*,\*,#(\d+),(\.[TF]\.)\)/
    );
    if (!match) throw new Error(`Oriented edge ${orientedId} is malformed`);
    const [start, end] = refsOf(entities.get(Number(match[1])) ?? '');
    return match[2] === '.T.' ? [start, end] : [end, start];
  };
  const faces: Point[][] = [];
  for (const body of entities.values()) {
    if (!body.startsWith('ADVANCED_FACE(')) continue;
    const loopId = refsOf(entities.get(refsOf(body)[0]) ?? '')[0];
    const directed = refsOf(entities.get(loopId) ?? '').map(directedEdge);
    directed.forEach((edge, index) => {
      if (edge[1] !== directed[(index + 1) % directed.length][0]) {
        throw new Error('STEP edge loop does not chain');
      }
    });
    faces.push(directed.map(([start]) => pointOf(start)));
  }
  return faces;
};

const signedVolume = (faces: Point[][]): number =>
  faces.reduce((sum, [a, b, c]) => {
    const triple =
      a[0] * (b[1] * c[2] - b[2] * c[1]) -
      a[1] * (b[0] * c[2] - b[2] * c[0]) +
      a[2] * (b[0] * c[1] - b[1] * c[0]);
    return sum + triple / 6;
  }, 0);

describe('meshToStep', () => {
  const mesh = spacerMesh(10, 20, 5);
  const step = meshToStep(mesh, 'spacer-10x20mm');

  it('writes an AP214 faceted solid B-rep with the part stem as product name', () => {
    expect(step.startsWith('ISO-10303-21;')).toBe(true);
    expect(step).toContain("FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 }'));");
    expect(step).toContain("MANIFOLD_SOLID_BREP('spacer-10x20mm'");
    expect(step).toContain('CLOSED_SHELL(');
    expect(step).toContain("PRODUCT('spacer-10x20mm','spacer-10x20mm'");
    expect(step.trimEnd().endsWith('END-ISO-10303-21;')).toBe(true);
  });

  it('writes one planar face per triangle over deduped vertices', () => {
    expect(countOf(step, /ADVANCED_FACE\(/g)).toBe(triangleCount(mesh));
    expect(countOf(step, /PLANE\(/g)).toBe(triangleCount(mesh));
    expect(countOf(step, /VERTEX_POINT\(/g)).toBe(mesh.positions.length / 3);
    expect(step).toContain("CARTESIAN_POINT('',(10.0,20.0,5.0))");
  });

  it('uses every edge twice, once in each direction', () => {
    const uses = new Map<string, string[]>();
    for (const match of step.matchAll(/ORIENTED_EDGE\('',\*,\*,#(\d+),(\.[TF]\.)\)/g)) {
      uses.set(match[1], [...(uses.get(match[1]) ?? []), match[2]]);
    }
    expect(uses.size).toBe(countOf(step, /EDGE_CURVE\(/g));
    for (const orientations of uses.values()) {
      expect([...orientations].sort()).toEqual(['.F.', '.T.']);
    }
  });

  it('declares millimetre SI units', () => {
    expect(step).toContain('SI_UNIT(.MILLI.,.METRE.)');
  });

  it('is deterministic for the same mesh and name', () => {
    expect(meshToStep(mesh, 'spacer-10x20mm')).toBe(step);
  });

  it('keeps every Part 21 line within 72 characters', () => {
    const longNamed = meshToStep(mesh, 'gridfinity-bin-2x3-6u-with-a-long-part-name');
    for (const text of [step, longNamed]) {
      const lengths = text.split('\n').map((line) => line.length);
      expect(Math.max(...lengths)).toBeLessThanOrEqual(72);
    }
    expect(longNamed.replace(/\n/g, '')).toContain(
      "FILE_NAME('gridfinity-bin-2x3-6u-with-a-long-part-name.step'"
    );
  });

  it('chains every edge loop into a positive-volume solid', () => {
    const faces = chainedFaceVertices(step);
    expect(faces).toHaveLength(triangleCount(mesh));
    expect(signedVolume(faces)).toBeGreaterThan(0);
    expect(signedVolume(faces)).toBeCloseTo(10 * 20 * 5, 4);
  });

  it('fails chaining when every oriented edge flag is flipped', () => {
    const flipped = step.replace(
      /(ORIENTED_EDGE\('',\*,\*,#\d+,)(\.[TF]\.)(\))/g,
      (_match, prefix: string, flag: string, suffix: string) =>
        `${prefix}${flag === '.T.' ? '.F.' : '.T.'}${suffix}`
    );
    expect(flipped).not.toBe(step);
    expect(() => chainedFaceVertices(flipped)).toThrow('STEP edge loop does not chain');
  });

  it('rejects an open mesh', () => {
    const open = { positions: [0, 0, 0, 10, 0, 0, 0, 10, 0], triangles: [0, 1, 2] };
    expect(() => meshToStep(open, 'open')).toThrow('needs a closed mesh');
  });

  it('rejects a mesh with a duplicated triangle', () => {
    const duplicated = {
      positions: [0, 0, 0, 10, 0, 0, 0, 10, 0],
      triangles: [0, 1, 2, 0, 1, 2],
    };
    expect(() => meshToStep(duplicated, 'duplicated')).toThrow('needs a closed mesh');
  });

  it('rejects an empty mesh', () => {
    expect(() => meshToStep({ positions: [], triangles: [] }, 'empty')).toThrow(
      'A STEP part needs at least one triangle'
    );
  });
});
