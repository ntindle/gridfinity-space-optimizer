/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  buildShareUrl,
  decodeShareSettings,
  encodeShareSettings,
  parseShareParam,
  type ShareableSettings,
} from './shareLayout';

const presetSettings: ShareableSettings = {
  drawerSize: { width: 22.5, height: 16.5 },
  selectedPrinter: 'Bambu Lab A1',
  customPrinterSize: { x: 200, y: 200, z: 200 },
  useHalfSize: false,
  preferHalfSize: false,
  preferUniformBaseplates: true,
  numDrawers: 3,
  useMm: true,
  bins: [],
};

const customSettings: ShareableSettings = {
  drawerSize: { width: 15, height: 12 },
  selectedPrinter: 'Custom Printer',
  customPrinterSize: { x: 300, y: 300, z: 300, exclusionZone: { front: 10 } },
  useHalfSize: true,
  preferHalfSize: false,
  preferUniformBaseplates: false,
  numDrawers: 1,
  useMm: false,
  bins: [],
};

function rawPayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('shareLayout', () => {
  it('round-trips preset-printer settings, dropping the unused custom size', () => {
    const decoded = decodeShareSettings(encodeShareSettings(presetSettings));
    expect(decoded).toEqual({ ...presetSettings, customPrinterSize: null });
  });

  it('round-trips custom-printer settings including the exclusion zone', () => {
    const decoded = decodeShareSettings(encodeShareSettings(customSettings));
    expect(decoded).toEqual(customSettings);
  });

  it('produces URL-safe payloads with no + / = characters', () => {
    const encoded = encodeShareSettings(customSettings);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('rejects garbage, bad JSON, and non-object payloads', () => {
    expect(decodeShareSettings(null)).toBeNull();
    expect(decodeShareSettings('')).toBeNull();
    expect(decodeShareSettings('!!!not-base64!!!')).toBeNull();
    expect(decodeShareSettings(rawPayload({ v: 1 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ v: 3, dw: 10, dh: 10, p: 'Bambu Lab A1' }))).toBeNull();
  });

  it('rejects out-of-range drawer dimensions', () => {
    const base = { v: 1, p: 'Bambu Lab A1' };
    expect(decodeShareSettings(rawPayload({ ...base, dw: 0, dh: 10 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, dw: -5, dh: 10 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, dw: 201, dh: 10 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, dw: '22.5', dh: 10 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, dw: 22.5, dh: 10 }))).not.toBeNull();
  });

  it('rejects unknown printers', () => {
    expect(
      decodeShareSettings(rawPayload({ v: 1, dw: 22.5, dh: 10, p: 'Nonexistent Printer 9000' })),
    ).toBeNull();
  });

  it('rejects prototype-chain names that `in` would accept but are not real printers', () => {
    for (const name of ['toString', '__proto__', 'constructor', 'hasOwnProperty', 'valueOf']) {
      expect(
        decodeShareSettings(rawPayload({ v: 1, dw: 22.5, dh: 10, p: name })),
      ).toBeNull();
    }
  });

  it('rejects overlong params', () => {
    expect(decodeShareSettings('A'.repeat(16001))).toBeNull();
  });

  it('normalizes contradictory half-size flags from corrupted state instead of emitting a dead link', () => {
    const encoded = encodeShareSettings({ ...presetSettings, useHalfSize: true, preferHalfSize: true });
    const decoded = decodeShareSettings(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.useHalfSize).toBe(true);
    expect(decoded?.preferHalfSize).toBe(false);
  });

  it('rejects ambiguous links with both half-size flags set', () => {
    expect(
      decodeShareSettings(
        rawPayload({ v: 1, dw: 22.5, dh: 10, p: 'Bambu Lab A1', hs: true, ph: true }),
      ),
    ).toBeNull();
  });

  it('rejects invalid drawer counts and non-boolean flags', () => {
    const base = { v: 1, dw: 22.5, dh: 10, p: 'Bambu Lab A1' };
    expect(decodeShareSettings(rawPayload({ ...base, n: 0 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, n: 1.5 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, n: 101 }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, mm: 'yes' }))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, n: 2, mm: true }))).not.toBeNull();
  });

  it('requires a valid custom size for Custom Printer links', () => {
    const base = { v: 1, dw: 22.5, dh: 10, p: 'Custom Printer' };
    expect(decodeShareSettings(rawPayload(base))).toBeNull();
    expect(decodeShareSettings(rawPayload({ ...base, c: { x: 0, y: 200, z: 200 } }))).toBeNull();
    expect(
      decodeShareSettings(
        rawPayload({ ...base, c: { x: 300, y: 300, z: 300, exclusionZone: { front: -1 } } }),
      ),
    ).toBeNull();
    expect(
      decodeShareSettings(rawPayload({ ...base, c: { x: 300, y: 300, z: 300 } })),
    ).not.toBeNull();
  });

  it('builds a share URL off origin + path, replacing any stale share param', () => {
    const url = buildShareUrl('https://gridfinitylayout.com/?share=stale', presetSettings);
    expect(url.startsWith('https://gridfinitylayout.com/?share=')).toBe(true);
    expect(url).not.toContain('stale');
    expect(parseShareParam(new URL(url).search)).toEqual({
      ...presetSettings,
      customPrinterSize: null,
    });
  });

  it('parses the share param out of a query string, ignoring other params', () => {
    const encoded = encodeShareSettings(presetSettings);
    expect(parseShareParam(`?utm_source=x&share=${encoded}`)).toEqual({
      ...presetSettings,
      customPrinterSize: null,
    });
    expect(parseShareParam('?share=garbage!!!')).toBeNull();
    expect(parseShareParam('')).toBeNull();
  });

  describe('bins (payload v2)', () => {
    const withBins: ShareableSettings = {
      ...presetSettings,
      bins: [
        { id: 'shared-1', x: 0, y: 42, width: 84, depth: 42, height: 6, label: 'Screws' },
        { id: 'shared-2', x: 546, y: 0, width: 21, depth: 21, height: 2, label: '' },
      ],
    };

    it('round-trips placed bins with their heights and labels', () => {
      expect(decodeShareSettings(encodeShareSettings(withBins))).toEqual({
        ...withBins,
        customPrinterSize: null,
      });
    });

    it('still opens v1 links, with no bins', () => {
      const decoded = decodeShareSettings(rawPayload({ v: 1, dw: 22.5, dh: 10, p: 'Bambu Lab A1' }));
      expect(decoded?.bins).toEqual([]);
    });

    it('rejects malformed bins', () => {
      const base = { v: 2, dw: 22.5, dh: 10, p: 'Bambu Lab A1' };
      expect(decodeShareSettings(rawPayload({ ...base, b: 'nope' }))).toBeNull();
      expect(decodeShareSettings(rawPayload({ ...base, b: [[0, 0, 2, 1]] }))).toBeNull();
      expect(decodeShareSettings(rawPayload({ ...base, b: [[0, 0, 0, 1, 3]] }))).toBeNull();
      expect(decodeShareSettings(rawPayload({ ...base, b: [[0, 0, 2, 1, 1]] }))).toBeNull();
      expect(decodeShareSettings(rawPayload({ ...base, b: [[-2, 0, 2, 1, 3]] }))).toBeNull();
      expect(decodeShareSettings(rawPayload({ ...base, b: [[0, 0, 2, 1, 3, 7]] }))).toBeNull();
      expect(decodeShareSettings(rawPayload({ ...base, b: [[0, 0, 2, 1, 3, 'x'.repeat(61)]] }))).toBeNull();
      expect(decodeShareSettings(rawPayload({ ...base, b: [[0, 0, 2, 1, 3]] }))?.bins).toHaveLength(1);
    });

    it('drops labels rather than making a link too long to open', () => {
      const many: ShareableSettings = {
        ...presetSettings,
        bins: Array.from({ length: 200 }, (_, index) => ({
          id: `b${index}`,
          x: (index % 20) * 42,
          y: Math.floor(index / 20) * 42,
          width: 42,
          depth: 42,
          height: 3,
          label: `A long description of what is in bin ${index}`,
        })),
      };
      const encoded = encodeShareSettings(many);
      expect(encoded.length).toBeLessThanOrEqual(8000);
      const decoded = decodeShareSettings(encoded);
      expect(decoded?.bins).toHaveLength(200);
      expect(decoded?.bins.every((bin) => bin.label === '')).toBe(true);
    });
  });
});
