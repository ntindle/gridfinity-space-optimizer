import { describe, it, expect } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { createThreeMf, modelXml, quarterTurn, translation } from './threeMf';
import { spacerMesh } from './gridfinityMesh';

const box = spacerMesh(10, 20, 5);

const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

describe('createThreeMf', () => {
  const file = createThreeMf({
    title: 'Plate 1',
    objects: [{ name: 'Spacer <10 × 20> & "co"', mesh: box }],
    items: [
      { object: 0, transform: translation(5, 6) },
      { object: 0, transform: quarterTurn(40, 6) },
    ],
  });
  const entries = unzipSync(file);

  it('is a 3MF package: content types, relationships, and one model', () => {
    expect(Object.keys(entries)).toEqual(['[Content_Types].xml', '_rels/.rels', '3D/3dmodel.model']);
    expect(strFromU8(entries['_rels/.rels'])).toContain('Target="/3D/3dmodel.model"');
    expect(strFromU8(entries['[Content_Types].xml'])).toContain(
      'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'
    );
  });

  it('writes a well-formed millimetre model with escaped names', () => {
    const doc = parse(strFromU8(entries['3D/3dmodel.model']));
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    const model = doc.documentElement;
    expect(model.getAttribute('unit')).toBe('millimeter');
    const object = doc.getElementsByTagName('object')[0];
    expect(object.getAttribute('name')).toBe('Spacer <10 × 20> & "co"');
    expect(doc.getElementsByTagName('vertex')).toHaveLength(8);
    expect(doc.getElementsByTagName('triangle')).toHaveLength(12);
  });

  it('places each copy with a row-vector transform', () => {
    const items = [...parse(strFromU8(entries['3D/3dmodel.model'])).getElementsByTagName('item')];
    expect(items.map((item) => [item.getAttribute('objectid'), item.getAttribute('transform')])).toEqual([
      ['1', '1 0 0 0 1 0 0 0 1 5 6 0'],
      ['1', '0 1 0 -1 0 0 0 0 1 40 6 0'],
    ]);
  });

  it('is byte-for-byte deterministic', () => {
    const again = createThreeMf({
      title: 'Plate 1',
      objects: [{ name: 'Spacer <10 × 20> & "co"', mesh: box }],
      items: [
        { object: 0, transform: translation(5, 6) },
        { object: 0, transform: quarterTurn(40, 6) },
      ],
    });
    expect(again).toEqual(file);
  });

  it('refuses empty plates and dangling items', () => {
    expect(() => modelXml({ title: 'x', objects: [], items: [] })).toThrow(/at least one part/);
    expect(() =>
      modelXml({ title: 'x', objects: [], items: [{ object: 0, transform: translation(0, 0) }] })
    ).toThrow(/missing object/);
  });
});
