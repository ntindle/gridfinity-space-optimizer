import { describe, it, expect } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { createPrintFiles, type ExportRequest } from './exportFiles';
import type { Bin, PrinterSize } from '@/types';

const A1: PrinterSize = { x: 256, y: 256, z: 256 };
const drawerSize = { width: 22.5, height: 16.5 };

const request = (overrides: Partial<ExportRequest> = {}): ExportRequest => ({
  layout: calculateGrids(drawerSize, A1, false, false).layout,
  bins: [],
  numDrawers: 1,
  drawerSize,
  useMm: false,
  printerName: 'Bambu Lab A1',
  printerSize: A1,
  ...overrides,
});

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

describe('createPrintFiles', () => {
  it('bundles an STL per part, 3MF plates, and a README for the example drawer', () => {
    const bundle = createPrintFiles(request());
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
    const plates = Object.entries(files(createPrintFiles(request()))).filter(([name]) =>
      name.endsWith('.3mf')
    );
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

  it('adds the bins you placed, as their own files and plates', () => {
    const bundle = createPrintFiles(
      request({
        bins: [
          bin({ id: 'a' }),
          bin({ id: 'b', x: 84, width: 42, depth: 84 }),
          bin({ id: 'c', x: 168, width: 42, height: 3, label: 'Screws' }),
        ],
        numDrawers: 3,
      })
    );
    const entries = files(bundle);
    const names = Object.keys(entries);
    expect(bundle.filename).toBe('gridfinity-22.5x16.5in-x3.zip');
    expect(names).toContain('stl/bin-2x1-6u-x6.stl');
    expect(names).toContain('stl/bin-1x1-3u-x3.stl');
    expect(names).toContain('stl/baseplate-6x6-x6.stl');
    expect(names.some((name) => /^3mf\/plate-\d+-bins/.test(name))).toBe(true);
    const readme = strFromU8(entries['README.txt']);
    expect(readme).toContain('Parts for 3 identical drawers.');
    expect(readme).toMatch(/6\s+Bin 2 × 1 · 6u\s+83\.5 × 41\.5 × 45\.55 mm\s+stl\/bin-2x1-6u-x6\.stl/);
    expect(readme).toContain('Bins follow the Gridfinity spec');
  });

  it('gives bins on half-size baseplates half-grid feet', () => {
    const halfLayout = calculateGrids(drawerSize, A1, true, false).layout;
    const bundle = createPrintFiles(
      request({ layout: halfLayout, bins: [bin({ width: 63, depth: 21, height: 2 })] })
    );
    const names = Object.keys(files(bundle));
    expect(names).toContain('stl/bin-1.5x0.5-2u-half-grid-x1.stl');
    expect(names).toContain('stl/half-size-baseplate-12x12-x2.stl');
  });

  it('leaves out bins that do not fit and says so', () => {
    const bundle = createPrintFiles(
      request({ bins: [bin({ id: 'off', x: 546 }), bin({ id: 'ok' })] })
    );
    expect(bundle.skippedBins).toBe(1);
    expect(strFromU8(files(bundle)['README.txt'])).toContain('1 bin that doesn\'t fit the grid or the printer was left out.');
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
