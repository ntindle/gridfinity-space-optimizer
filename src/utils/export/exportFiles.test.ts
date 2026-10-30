import { describe, it, expect } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { calculateGrids } from '@/utils/gridfinityUtils';
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
    expect(names.filter((name) => name.startsWith('3mf/'))).toEqual([
      '3mf/plate-1-baseplates-x2.3mf',
      '3mf/plate-2-baseplates.3mf',
      '3mf/plate-3-baseplates.3mf',
    ]);
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
      request({ bins: [bin({ id: 'a' }), bin({ id: 'b', x: 84 })], dividers: true })
    );
    expect(divided.parts).toBe(base.parts);
    expect(divided.plates).toBe(base.plates);
    expect(strFromU8(files(divided)['README.txt'])).toContain('Dividers:');
    expect(strFromU8(files(base)['README.txt'])).not.toContain('Dividers:');
    expect(Object.keys(files(divided))).toContain('stl/bin-2x1-6u-x2.stl');
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

  it('is byte-for-byte deterministic', () => {
    const bins = [bin({ id: 'a' })];
    expect(createPrintFiles(request({ bins })).data).toEqual(createPrintFiles(request({ bins })).data);
  });
});
