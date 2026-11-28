import { describe, it, expect } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { binTotalHeight } from '@/utils/bins';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { stackPitchMm, usableBed } from '@/utils/printPlan';
import { createPrintFiles, type ExportRequest } from './exportFiles';
import type { Bin, DrawerSize, PrinterSize } from '@/types';

const A1: PrinterSize = { x: 256, y: 256, z: 256 };
const smallDrawer: DrawerSize = { width: 8, height: 4 };
const exampleDrawer: DrawerSize = { width: 22.5, height: 16.5 };
const HEAVY_TIMEOUT = 30_000;

const request = (overrides: Partial<ExportRequest> = {}): ExportRequest => {
  const drawerSize = overrides.drawerSize ?? smallDrawer;
  return {
    layout: calculateGrids(drawerSize, A1, false, false).layout,
    bins: [],
    numDrawers: 1,
    drawerSize,
    useMm: false,
    printerName: 'Bambu Lab A1',
    printerSize: A1,
    ...overrides,
  };
};

const bin = (overrides: Partial<Bin>): Bin => ({
  id: 'b',
  x: 0,
  y: 0,
  width: 84,
  depth: 42,
  height: 6,
  label: '',
  ...overrides,
});

const files = (bundle: { data: Uint8Array }) => unzipSync(bundle.data);

const model = (plate: Uint8Array) =>
  new DOMParser().parseFromString(
    strFromU8(unzipSync(plate)['3D/3dmodel.model']),
    'application/xml'
  );

describe('createPrintFiles', { timeout: HEAVY_TIMEOUT }, () => {
  it('bundles an STL per part, 3MF plates, and a README for the example drawer', () => {
    const bundle = createPrintFiles(request({ drawerSize: exampleDrawer }));
    expect(bundle.filename).toBe('gridfinity-22.5x16.5in.zip');
    expect(bundle).toMatchObject({ parts: 9, plates: 3, prints: 4, skippedBins: 0 });
    const names = Object.keys(files(bundle));
    expect(names[0]).toBe('README.txt');
    expect(names).toContain('stl/baseplate-6x6-x2.stl');
    expect(names).toContain('stl/spacer-25.5x252mm-x1.stl');
    expect(names.filter((name) => name.startsWith('stl/'))).toHaveLength(9);
    expect(names).toContain('step/baseplate-6x6-x2.step');
    expect(names.filter((name) => name.startsWith('step/'))).toHaveLength(9);
    expect(names.filter((name) => name.startsWith('3mf/'))).toEqual([
      '3mf/plate-1-baseplates-x2.3mf',
      '3mf/plate-2-baseplates.3mf',
      '3mf/plate-3-baseplates.3mf',
    ]);
  });

  it('bundles a to-scale SVG plan of the drawer and documents it in the README', () => {
    const bundle = createPrintFiles(request({ bins: [bin({ id: 'a', label: 'Screws' })] }));
    const entries = files(bundle);
    expect(Object.keys(entries)).toContain('layout.svg');
    const svg = strFromU8(entries['layout.svg']);
    expect(svg).toContain('viewBox="0 0 203.2 101.6"');
    expect(svg).toContain('width="203.2mm"');
    expect(svg).toContain('<rect x="0" y="0" width="84" height="42" fill="#dbeafe"');
    expect(svg).toContain('>Screws</text>');
    expect(strFromU8(entries['README.txt'])).toContain('Layout plan: layout.svg');
  });

  it('bundles a millimetre DXF plan of the drawer next to the SVG plan', () => {
    const bundle = createPrintFiles(request({ bins: [bin({ id: 'a', label: 'Screws' })] }));
    const entries = files(bundle);
    expect(Object.keys(entries)).toContain('layout.dxf');
    const dxf = strFromU8(entries['layout.dxf']);
    expect(dxf).toContain('  9\n$INSUNITS\n 70\n4');
    expect(dxf).toContain('  8\nBIN\n 90\n4\n 70\n1\n 10\n0\n 20\n59.6\n 10\n84\n 20\n59.6\n 10\n84\n 20\n101.6\n 10\n0\n 20\n101.6');
    expect(dxf).toContain('  0\nTEXT\n  8\nBIN\n 10\n42\n 20\n80.6\n 40\n6\n  1\nScrews');
    expect(strFromU8(entries['README.txt'])).toContain('layout.svg and layout.dxf');
  });

  it('bundles a faceted STEP file per part mirroring the STL names', () => {
    const bundle = createPrintFiles(request({ bins: [bin({ id: 'a', label: 'Screws' })] }));
    const entries = files(bundle);
    const names = Object.keys(entries);
    const stlNames = names.filter((name) => name.startsWith('stl/'));
    const stepNames = names.filter((name) => name.startsWith('step/'));
    expect(stepNames).toEqual(
      stlNames.map((name) => name.replace('stl/', 'step/').replace('.stl', '.step'))
    );
    const step = strFromU8(entries[stepNames[0]]);
    const stem = stepNames[0].replace('step/', '').replace(/-x\d+\.step$/, '');
    expect(step).toContain("FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 }'));");
    expect(step).toContain(`MANIFOLD_SOLID_BREP('${stem}'`);
    expect(step).toContain('SI_UNIT(.MILLI.,.METRE.)');
    expect(strFromU8(entries['README.txt'])).toContain('STEP files: the step/ folder');
  });

  it('lays each plate out inside the printer bed', () => {
    const bundle = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const plates = Object.entries(files(bundle)).filter(([name]) => name.endsWith('.3mf'));
    expect(plates.length).toBeGreaterThan(1);
    for (const [, plate] of plates) {
      const doc = model(plate);
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
      for (const item of doc.getElementsByTagName('item')) {
        const values = (item.getAttribute('transform') ?? '').split(' ').map(Number);
        expect(values).toHaveLength(12);
        expect(values[9]).toBeGreaterThanOrEqual(0);
        expect(values[9]).toBeLessThanOrEqual(256);
        expect(values[10]).toBeGreaterThanOrEqual(0);
        expect(values[10]).toBeLessThanOrEqual(256);
      }
    }
  });

  it('stores the finished 3MF plates in the zip instead of compressing them twice', () => {
    const bundle = createPrintFiles(request());
    const plate = Object.keys(files(bundle)).find((name) => name.endsWith('.3mf')) ?? '';
    const view = new DataView(bundle.data.buffer, bundle.data.byteOffset, bundle.data.byteLength);
    let offset = 0;
    const methods: Record<string, number> = {};
    while (view.getUint32(offset, true) === 0x04034b50) {
      const method = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const nameLength = view.getUint16(offset + 26, true);
      const extraLength = view.getUint16(offset + 28, true);
      const name = strFromU8(bundle.data.slice(offset + 30, offset + 30 + nameLength));
      methods[name] = method;
      offset += 30 + nameLength + extraLength + compressedSize;
    }
    expect(methods[plate]).toBe(0);
    expect(methods['README.txt']).toBe(8);
  });

  it('adds the bins you placed, as their own files and plates', () => {
    const bundle = createPrintFiles(
      request({
        bins: [
          bin({ id: 'a' }),
          bin({ id: 'b', x: 84, width: 42, depth: 84 }),
          bin({ id: 'c', x: 126, width: 42, height: 3, label: 'Screws' }),
        ],
        numDrawers: 3,
      })
    );
    const entries = files(bundle);
    const names = Object.keys(entries);
    expect(bundle.filename).toBe('gridfinity-8x4in-x3.zip');
    expect(names).toContain('stl/bin-2x1-6u-x6.stl');
    expect(names).toContain('stl/bin-1x1-3u-x3.stl');
    expect(names).toContain('stl/baseplate-4x2-x3.stl');
    expect(names.some((name) => /^3mf\/plate-\d+-bins/.test(name))).toBe(true);
    const readme = strFromU8(entries['README.txt']);
    expect(readme).toContain('Parts for 3 identical drawers.');
    expect(readme).toMatch(/6\s+Bin 2 × 1 · 6u\s+83\.5 × 41\.5 × 45\.55 mm\s+stl\/bin-2x1-6u-x6\.stl/);
    expect(readme).toContain('Bins follow the Gridfinity spec');
  });

  it('gives bins on half-size baseplates half-grid feet', () => {
    const halfLayout = calculateGrids(smallDrawer, A1, true, false).layout;
    const bundle = createPrintFiles(
      request({ layout: halfLayout, bins: [bin({ width: 63, depth: 21, height: 2 })] })
    );
    const names = Object.keys(files(bundle));
    expect(names).toContain('stl/bin-1.5x0.5-2u-half-grid-x1.stl');
    expect(names).toContain('stl/half-size-baseplate-9x4-x1.stl');
  });

  it('adds the test-fit pieces to the zip when test fit is on', () => {
    const base = createPrintFiles(request());
    const bundle = createPrintFiles(request({ testFit: true }));
    const names = Object.keys(files(bundle));
    expect(bundle.parts).toBe(base.parts + 1);
    expect(bundle.plates).toBe(base.plates + 1);
    expect(bundle.prints).toBe(base.prints + 1);
    expect(names).toContain('stl/baseplate-1x1-x1.stl');
    expect(names).toContain('3mf/plate-0-test-fit.3mf');
    expect(new Set(names).size).toBe(names.length);
    const readme = strFromU8(files(bundle)['README.txt']);
    expect(readme).toContain('Test fit first:');
    expect(readme).toContain('3mf/plate-0-test-fit.3mf');
    const plateLines = readme
      .split('\n')
      .filter((line) => line.trim().startsWith('3mf/'));
    expect(plateLines[0]).toContain('plate-0-test-fit.3mf');
    expect(plateLines[0]).toContain('1 × Baseplate 1 × 1');
    expect(plateLines[0]).toContain('Spacer');
  });

  it('packs only the test pieces onto the test-fit plate', () => {
    const bundle = createPrintFiles(request({ testFit: true }));
    const plate = files(bundle)['3mf/plate-0-test-fit.3mf'];
    expect(plate).toBeDefined();
    const doc = model(plate);
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.getElementsByTagName('object')).toHaveLength(2);
    expect(doc.getElementsByTagName('item')).toHaveLength(2);
    const names = [...doc.getElementsByTagName('object')].map((object) =>
      object.getAttribute('name')
    );
    expect(names).toContain('Baseplate 1 × 1');
  });

  it('counts the test pieces with the layout pieces instead of duplicating the STL', () => {
    const layout = [
      {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        type: 'baseplate' as const,
        pixelX: 0,
        pixelY: 0,
        pixelWidth: 42,
        pixelHeight: 42,
      },
      {
        x: 1,
        y: 0,
        width: 1,
        height: 1,
        type: 'spacer' as const,
        pixelX: 42,
        pixelY: 0,
        pixelWidth: 10,
        pixelHeight: 42,
      },
    ];
    const base = createPrintFiles(request({ layout }));
    const bundle = createPrintFiles(request({ layout, testFit: true }));
    const names = Object.keys(files(bundle));
    expect(bundle.parts).toBe(base.parts);
    expect(bundle.plates).toBe(base.plates + 1);
    expect(names).toContain('stl/baseplate-1x1-x2.stl');
    expect(names).toContain('stl/spacer-10x42mm-x2.stl');
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('3mf/plate-0-test-fit.3mf');
    const readme = strFromU8(files(bundle)['README.txt']);
    expect(readme).toMatch(/2\s+Baseplate 1 × 1\s+42 × 42 × 5 mm\s+stl\/baseplate-1x1-x2\.stl/);
  });

  it('adds the tab note and keeps the same parts when label tabs are on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const tabbed = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], labelTabs: true })
    );
    expect(tabbed.parts).toBe(base.parts);
    expect(tabbed.plates).toBe(base.plates);
    expect(strFromU8(files(tabbed)['README.txt'])).toContain('Label tabs:');
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Label tabs:');
    expect(Object.keys(files(tabbed))).toContain('stl/bin-2x1-6u-x2.stl');
  });

  it('adds the divider note and keeps the same parts when dividers are on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const divided = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], dividerCount: 2 })
    );
    expect(divided.parts).toBe(base.parts);
    expect(divided.plates).toBe(base.plates);
    expect(strFromU8(files(divided)['README.txt'])).toContain('Dividers:');
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Dividers:');
    expect(Object.keys(files(divided))).toContain('stl/bin-2x1-6u-x2.stl');
  });

  it('splits the bin STL and notes custom positions when dividers move off center', () => {
    const base = createPrintFiles(
      request({
        bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })],
        dividerCount: 1,
      })
    );
    const divided = createPrintFiles(
      request({
        bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84, dividerPositions: [0.25] })],
        dividerCount: 1,
      })
    );
    expect(divided.parts).toBe(base.parts + 1);
    const names = Object.keys(files(divided));
    expect(names).toContain('stl/bin-2x1-6u-x1.stl');
    expect(names).toContain('stl/bin-2x1-6u-dividers-25-x1.stl');
    const readme = strFromU8(files(divided)['README.txt']);
    expect(readme).toContain('Dividers:');
    expect(readme).toContain('custom positions');
    expect(readme).toContain('piece details panel');
  });

  it('uses connector stems and documents the dovetail when connectors are on', () => {
    const base = createPrintFiles(request({ drawerSize: exampleDrawer }));
    const connected = createPrintFiles(request({ drawerSize: exampleDrawer, connectors: true }));
    expect(connected.parts).toBeGreaterThan(base.parts);
    expect(connected.plates).toBeGreaterThanOrEqual(base.plates);
    const names = Object.keys(files(connected));
    expect(names).toContain('stl/baseplate-6x6-connectors-tr-tt-x1.stl');
    expect(names).toContain('stl/baseplate-6x6-connectors-rl-tr-tt-x1.stl');
    expect(names).not.toContain('stl/baseplate-6x6-x2.stl');
    const readme = strFromU8(files(connected)['README.txt']);
    expect(readme).toContain('Baseplate connectors:');
    expect(readme).toContain('dovetail tab');
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Baseplate connectors:');
  });

  it('keeps tabbed baseplates and bins inside the bed in the emitted 3MF', () => {
    const drawerSize: DrawerSize = { width: 14.8819, height: 4.9606 };
    const bundle = createPrintFiles(
      request({
        drawerSize,
        layout: calculateGrids(drawerSize, A1, false, false, true).layout,
        bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })],
        connectors: true,
      })
    );
    const entries = files(bundle);
    const names = Object.keys(entries);
    expect(names.some((name) => name.startsWith('stl/bin-'))).toBe(true);
    expect(names.some((name) => name.includes('connectors'))).toBe(true);
    const bed = usableBed(A1);
    const plates = Object.entries(entries).filter(([name]) => name.endsWith('.3mf'));
    expect(plates.length).toBeGreaterThan(0);
    for (const [, plate] of plates) {
      const doc = model(plate);
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
      const bounds = new Map<
        number,
        { minX: number; minY: number; maxX: number; maxY: number }
      >();
      for (const object of doc.getElementsByTagName('object')) {
        const id = Number(object.getAttribute('id'));
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const vertex of object.getElementsByTagName('vertex')) {
          const x = Number(vertex.getAttribute('x'));
          const y = Number(vertex.getAttribute('y'));
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        bounds.set(id, { minX, minY, maxX, maxY });
      }
      for (const item of doc.getElementsByTagName('item')) {
        const objectId = Number(item.getAttribute('objectid'));
        const v = (item.getAttribute('transform') ?? '').split(' ').map(Number);
        expect(v).toHaveLength(12);
        const b = bounds.get(objectId);
        if (b === undefined) throw new Error(`Missing object ${objectId}`);
        const corners = [
          [b.minX, b.minY],
          [b.minX, b.maxY],
          [b.maxX, b.minY],
          [b.maxX, b.maxY],
        ].map(([x, y]) => [v[0] * x + v[3] * y + v[9], v[1] * x + v[4] * y + v[10]]);
        const xs = corners.map((corner) => corner[0]);
        const ys = corners.map((corner) => corner[1]);
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(bed.x - 1e-6);
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(bed.y - 1e-6);
        expect(Math.max(...xs)).toBeLessThanOrEqual(bed.x + bed.width + 1e-6);
        expect(Math.max(...ys)).toBeLessThanOrEqual(bed.y + bed.depth + 1e-6);
      }
    }
  });

  it('uses the magnets stem and documents the pocket when magnets are on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const magnet = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], magnets: true })
    );
    expect(magnet.parts).toBe(base.parts);
    expect(magnet.plates).toBe(base.plates);
    const names = Object.keys(files(magnet));
    expect(names).toContain('stl/bin-2x1-6u-magnets-x2.stl');
    expect(names).not.toContain('stl/bin-2x1-6u-x2.stl');
    const readme = strFromU8(files(magnet)['README.txt']);
    expect(readme).toContain('Ø6.2 × 2 mm magnet pocket');
    expect(readme).toMatch(/2\s+Bin 2 × 1 · 6u · magnet holes\s+83\.5 × 41\.5 × 45\.55 mm\s+stl\/bin-2x1-6u-magnets-x2\.stl/);
    expect(strFromU8(files(base)['README.txt'])).toContain('no magnet holes');
  });

  it('uses the screws stem and documents the hole when screws are on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const screwed = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], screws: true })
    );
    expect(screwed.parts).toBe(base.parts);
    expect(screwed.plates).toBe(base.plates);
    const names = Object.keys(files(screwed));
    expect(names).toContain('stl/bin-2x1-6u-screws-x2.stl');
    expect(names).not.toContain('stl/bin-2x1-6u-x2.stl');
    const readme = strFromU8(files(screwed)['README.txt']);
    expect(readme).toContain('Ø3.2 mm hole through the floor');
    expect(readme).toMatch(/2\s+Bin 2 × 1 · 6u · screw holes\s+83\.5 × 41\.5 × 45\.55 mm\s+stl\/bin-2x1-6u-screws-x2\.stl/);
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Screw holes:');
  });

  it('uses the scoop stem and documents the dip when scoop is on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const scooped = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], scoop: true })
    );
    expect(scooped.parts).toBe(base.parts);
    expect(scooped.plates).toBe(base.plates);
    const names = Object.keys(files(scooped));
    expect(names).toContain('stl/bin-2x1-6u-scoop-x2.stl');
    expect(names).not.toContain('stl/bin-2x1-6u-x2.stl');
    const readme = strFromU8(files(scooped)['README.txt']);
    expect(readme).toContain('dips to half its height over the middle half of the front');
    expect(readme).toMatch(/2\s+Bin 2 × 1 · 6u · scoop\s+83\.5 × 41\.5 × 45\.55 mm\s+stl\/bin-2x1-6u-scoop-x2\.stl/);
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Scoop:');
  });

  it('uses the vase-mode stem and documents the single wall when vase mode is on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const vased = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], vaseMode: true })
    );
    expect(vased.parts).toBe(base.parts);
    expect(vased.plates).toBe(base.plates);
    const names = Object.keys(files(vased));
    expect(names).toContain('stl/bin-2x1-6u-vase-mode-x2.stl');
    expect(names).not.toContain('stl/bin-2x1-6u-x2.stl');
    const readme = strFromU8(files(vased)['README.txt']);
    expect(readme).toContain('single 0.45 mm wall');
    expect(readme).toContain('spiralize/vase mode on');
    expect(readme).toMatch(/2\s+Bin 2 × 1 · 6u · vase mode\s+83\.5 × 41\.5 × 45\.55 mm\s+stl\/bin-2x1-6u-vase-mode-x2\.stl/);
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Vase mode:');
  });

  it('uses the magnets and screws stem and notes the hole through the pocket floor when both are on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const both = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], magnets: true, screws: true })
    );
    expect(both.parts).toBe(base.parts);
    expect(both.plates).toBe(base.plates);
    const names = Object.keys(files(both));
    expect(names).toContain('stl/bin-2x1-6u-magnets-screws-x2.stl');
    const readme = strFromU8(files(both)['README.txt']);
    expect(readme).toContain('hole passes through the magnet pocket floor');
    expect(readme).toMatch(/2\s+Bin 2 × 1 · 6u · magnet holes · screw holes\s+83\.5 × 41\.5 × 45\.55 mm\s+stl\/bin-2x1-6u-magnets-screws-x2\.stl/);
  });

  it('adds the lid STL, its own 3MF lid plate, and the lid note when lids are on', () => {
    const base = createPrintFiles(request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })] }));
    const lidded = createPrintFiles(
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], lids: true })
    );
    expect(lidded.parts).toBe(base.parts + 1);
    expect(lidded.plates).toBe(base.plates + 1);
    const names = Object.keys(files(lidded));
    expect(names).toContain('stl/lid-2x1-x2.stl');
    expect(names.filter((name) => name.startsWith('3mf/') && name.includes('-lids'))).toHaveLength(1);
    const readme = strFromU8(files(lidded)['README.txt']);
    expect(readme).toContain('Lids:');
    expect(readme).toMatch(/2\s+Lid 2 × 1\s+83\.5 × 41\.5 × 5.5 mm\s+stl\/lid-2x1-x2\.stl/);
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Lids:');
    const lidPlate = Object.entries(files(lidded)).find(
      ([name]) => name.startsWith('3mf/') && name.includes('-lids')
    );
    expect(lidPlate).toBeDefined();
    const doc = model(lidPlate![1]);
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.getElementsByTagName('item').length).toBeGreaterThan(0);
  });

  it('leaves the zip unchanged when test fit is off', () => {
    const bundle = createPrintFiles(request({ testFit: false }));
    const names = Object.keys(files(bundle));
    expect(names).not.toContain('3mf/plate-0-test-fit.3mf');
    expect(names).not.toContain('stl/baseplate-1x1-x1.stl');
    expect(strFromU8(files(bundle)['README.txt'])).not.toContain('Test fit first:');
  });

  it('leaves out bins that do not fit and says so', () => {
    const bundle = createPrintFiles(request({ bins: [bin({ id: 'off', x: 168 }), bin({ id: 'ok' })] }));
    expect(bundle.skippedBins).toBe(1);
    expect(strFromU8(files(bundle)['README.txt'])).toContain(
      "1 bin that doesn't fit the grid or the printer was left out."
    );
  });

  it('leaves out bins taller than the printer can print', () => {
    const bundle = createPrintFiles(
      request({
        bins: [bin({ id: 'tall', height: 20 }), bin({ id: 'ok', x: 84, height: 6 })],
        printerSize: { x: 256, y: 256, z: 100 },
        printerName: 'Tiny',
      })
    );
    expect(bundle.skippedBins).toBe(1);
    expect(Object.keys(files(bundle))).toContain('stl/bin-2x1-6u-x1.stl');
  });

  it('refuses to export an empty layout', () => {
    expect(() => createPrintFiles(request({ layout: [] }))).toThrow(/nothing to print/);
  });

  it('stacks identical bins in the 3MF plates when stack bins is on', () => {
    const bins = [
      bin({ id: 'a' }),
      bin({ id: 'b', x: 84 }),
      bin({ id: 'c', y: 42 }),
      bin({ id: 'd', x: 84, y: 42 }),
    ];
    const stacked = createPrintFiles(
      request({ bins, numDrawers: 10, stackBins: true })
    );
    const base = createPrintFiles(request({ bins, numDrawers: 10 }));
    expect(stacked.parts).toBe(base.parts);
    expect(stacked.plates).toBe(base.plates);
    expect(stacked.prints).toBeLessThan(base.prints);
    expect(stacked.prints).toBe(5);
    expect(base.prints).toBe(8);
    expect(Object.keys(files(base))).toContain('3mf/plate-4-bins-x4.3mf');
    expect(Object.keys(files(stacked))).toContain('3mf/plate-4-bins.3mf');
    const stlNames = Object.keys(files(stacked)).filter((name) => name.startsWith('stl/'));
    expect(stlNames).toEqual(Object.keys(files(base)).filter((name) => name.startsWith('stl/')));
    const pitch = stackPitchMm(binTotalHeight(6));
    const binPlates = Object.entries(files(stacked)).filter(
      ([name]) => name.startsWith('3mf/') && name.includes('-bins')
    );
    expect(binPlates).toHaveLength(1);
    const transforms: number[][] = [];
    for (const [, plate] of binPlates) {
      const doc = model(plate);
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
      for (const item of doc.getElementsByTagName('item')) {
        transforms.push((item.getAttribute('transform') ?? '').split(' ').map(Number));
      }
    }
    expect(transforms).toHaveLength(40);
    const zs = transforms.map((values) => values[11]);
    expect(zs.some((z) => z > 0)).toBe(true);
    expect(Math.max(...zs) + binTotalHeight(6)).toBeLessThanOrEqual(A1.z);
    for (const z of zs) {
      expect(Math.abs(z / pitch - Math.round(z / pitch))).toBeLessThan(1e-6);
    }
    const readme = strFromU8(files(stacked)['README.txt']);
    expect(readme).toContain('Stacked bins:');
    expect(readme).toContain('stacks up to 5 high');
    expect(readme).toContain('0.4 mm separation gap');
  });

  it('does not stack bins when label tabs are on', () => {
    const bins = [
      bin({ id: 'a' }),
      bin({ id: 'b', x: 84 }),
      bin({ id: 'c', y: 42 }),
      bin({ id: 'd', x: 84, y: 42 }),
    ];
    const stacked = createPrintFiles(
      request({ bins, numDrawers: 10, stackBins: true, labelTabs: true })
    );
    const tabbed = createPrintFiles(request({ bins, numDrawers: 10, labelTabs: true }));
    expect(stacked.plates).toBe(tabbed.plates);
    expect(stacked.prints).toBe(tabbed.prints);    const binPlates = Object.entries(files(stacked)).filter(
      ([name]) => name.startsWith('3mf/') && name.includes('-bins')
    );
    for (const [, plate] of binPlates) {
      const doc = model(plate);
      for (const item of doc.getElementsByTagName('item')) {
        const values = (item.getAttribute('transform') ?? '').split(' ').map(Number);
        expect(values[11]).toBe(0);
      }
    }
    expect(strFromU8(files(stacked)['README.txt'])).not.toContain('Stacked bins:');
  });

  it('is byte-for-byte deterministic', () => {
    const bins = [bin({ id: 'a' })];
    expect(createPrintFiles(request({ bins })).data).toEqual(createPrintFiles(request({ bins })).data);
  });
});

describe('createPrintFiles obstacles', { timeout: HEAVY_TIMEOUT }, () => {
  it('shows obstacles in the plans and notes them in the README', () => {
    const bundle = createPrintFiles(
      request({
        obstacles: [{ id: 'o1', x: 42, y: 0, width: 42, depth: 42 }],
      })
    );
    const entries = files(bundle);
    expect(strFromU8(entries['layout.svg'])).toContain('>Obstacle</text>');
    expect(strFromU8(entries['layout.dxf'])).toContain('OBSTACLE');
    expect(strFromU8(entries['README.txt'])).toContain('Drawer obstacles: 1 keep-out area');
  });
});
