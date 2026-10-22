import { printerSizes } from '@/lib/utils';
import { unitMath } from '@/services/unitMath';
import { MAX_BIN_HEIGHT, MAX_LABEL_LENGTH, MIN_BIN_HEIGHT } from '@/utils/bins';
import { HALF_GRID_SIZE } from '@/utils/gridfinityUtils';
import type { Bin, DrawerSize, PrinterSize } from '@/types';


export const SHARE_PARAM = 'share';
export const CUSTOM_PRINTER_LABEL = 'Custom Printer';
export const SHARE_VERSION = 2;
export const MAX_SHARE_PARAM_LENGTH = 16000;
export const LONG_SHARE_PARAM_LENGTH = 8000;
const MAX_SHARED_BINS = 1000;
const MAX_BIN_STEPS = 1000;

export interface ShareableSettings {
  drawerSize: DrawerSize;
  selectedPrinter: string;
  customPrinterSize: PrinterSize | null;
  useHalfSize: boolean;
  preferHalfSize: boolean;
  preferUniformBaseplates: boolean;
  numDrawers: number;
  useMm: boolean;
  bins: Bin[];
}

interface SharePayload {
  v: number;
  dw: unknown;
  dh: unknown;
  p: unknown;
  c?: unknown;
  hs?: unknown;
  ph?: unknown;
  ub?: unknown;
  n?: unknown;
  mm?: unknown;
  b?: unknown;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

export function decodeShareSettings(param: string | null | undefined): ShareableSettings | null {
  if (!param || typeof param !== 'string') return null;
  if (param.length > MAX_SHARE_PARAM_LENGTH) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(param)) return null;

  const json = base64UrlDecode(param);
  if (json === null) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const payload = raw as SharePayload;
  if (payload.v !== 1 && payload.v !== SHARE_VERSION) return null;

  if (!isFiniteNumber(payload.dw) || payload.dw <= 0 || payload.dw > 200) return null;
  if (!isFiniteNumber(payload.dh) || payload.dh <= 0 || payload.dh > 200) return null;

  if (typeof payload.p !== 'string') return null;
  const knownPrinter =
    payload.p === CUSTOM_PRINTER_LABEL ||
    Object.prototype.hasOwnProperty.call(printerSizes, payload.p);
  if (!knownPrinter) return null;

  const custom = decodeCustomPrinterSize(payload.c, payload.p);
  if (!custom.valid) return null;
  const customPrinterSize = custom.value;

  const useHalfSize = payload.hs === undefined ? false : payload.hs;
  const preferHalfSize = payload.ph === undefined ? false : payload.ph;
  const preferUniformBaseplates = payload.ub === undefined ? false : payload.ub;
  if (!isBoolean(useHalfSize) || !isBoolean(preferHalfSize) || !isBoolean(preferUniformBaseplates)) {
    return null;
  }
  if (useHalfSize && preferHalfSize) return null;

  const numDrawers = payload.n === undefined ? 1 : payload.n;
  if (!isFiniteNumber(numDrawers) || !Number.isInteger(numDrawers) || numDrawers < 1 || numDrawers > 100) {
    return null;
  }

  const useMm = payload.mm === undefined ? false : payload.mm;
  if (!isBoolean(useMm)) return null;

  const bins = payload.v === 1 ? [] : decodeBins(payload.b);
  if (bins === null) return null;

  return {
    drawerSize: { width: payload.dw, height: payload.dh },
    selectedPrinter: payload.p,
    customPrinterSize,
    useHalfSize,
    preferHalfSize,
    preferUniformBaseplates,
    numDrawers,
    useMm,
    bins,
  };
}

const isStep = (value: unknown, min: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= MAX_BIN_STEPS;

function decodeBins(raw: unknown): Bin[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > MAX_SHARED_BINS) return null;
  const bins: Bin[] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length < 5 || entry.length > 6) return null;
    const [x, y, width, depth, height, label = ''] = entry as unknown[];
    if (!isStep(x, 0) || !isStep(y, 0) || !isStep(width, 1) || !isStep(depth, 1)) return null;
    if (typeof height !== 'number' || !Number.isInteger(height)) return null;
    if (height < MIN_BIN_HEIGHT || height > MAX_BIN_HEIGHT) return null;
    if (typeof label !== 'string' || label.length > MAX_LABEL_LENGTH) return null;
    bins.push({
      id: `shared-${unitMath.add(bins.length, 1)}`,
      x: unitMath.multiply(x, HALF_GRID_SIZE),
      y: unitMath.multiply(y, HALF_GRID_SIZE),
      width: unitMath.multiply(width, HALF_GRID_SIZE),
      depth: unitMath.multiply(depth, HALF_GRID_SIZE),
      height,
      label,
    });
  }
  return bins;
}

const encodeBins = (bins: Bin[], withLabels: boolean): unknown[] =>
  bins.map((bin) => {
    const steps = [bin.x, bin.y, bin.width, bin.depth].map((value) =>
      unitMath.round(unitMath.divide(value, HALF_GRID_SIZE), 0)
    );
    return withLabels && bin.label ? [...steps, bin.height, bin.label] : [...steps, bin.height];
  });

function decodeCustomPrinterSize(
  c: unknown,
  printer: string,
): { valid: true; value: PrinterSize | null } | { valid: false; value: null } {
  if (printer !== CUSTOM_PRINTER_LABEL) return { valid: true, value: null };
  if (typeof c !== 'object' || c === null || Array.isArray(c)) return { valid: false, value: null };
  const size = c as { x?: unknown; y?: unknown; z?: unknown; exclusionZone?: unknown };
  if (!isFiniteNumber(size.x) || size.x <= 0 || size.x > 2000) return { valid: false, value: null };
  if (!isFiniteNumber(size.y) || size.y <= 0 || size.y > 2000) return { valid: false, value: null };
  if (!isFiniteNumber(size.z) || size.z <= 0 || size.z > 2000) return { valid: false, value: null };

  const result: PrinterSize = { x: size.x, y: size.y, z: size.z };
  if (size.exclusionZone !== undefined) {
    const zone = size.exclusionZone;
    if (typeof zone !== 'object' || zone === null || Array.isArray(zone)) return { valid: false, value: null };
    const z = zone as Record<string, unknown>;
    const parsed: PrinterSize['exclusionZone'] = {};
    for (const side of ['front', 'back', 'left', 'right'] as const) {
      const value = z[side];
      if (value === undefined) continue;
      if (!isFiniteNumber(value) || value < 0 || value > 1000) return { valid: false, value: null };
      parsed[side] = value;
    }
    result.exclusionZone = parsed;
  }
  return { valid: true, value: result };
}

export function encodeShareSettings(settings: ShareableSettings): string {
  const useHalfSize = settings.useHalfSize;
  const preferHalfSize = settings.useHalfSize ? false : settings.preferHalfSize;
  const payload: Record<string, unknown> = {
    v: SHARE_VERSION,
    dw: settings.drawerSize.width,
    dh: settings.drawerSize.height,
    p: settings.selectedPrinter,
    hs: useHalfSize,
    ph: preferHalfSize,
    ub: settings.preferUniformBaseplates,
    n: settings.numDrawers,
    mm: settings.useMm,
  };
  if (settings.selectedPrinter === CUSTOM_PRINTER_LABEL && settings.customPrinterSize) {
    payload.c = settings.customPrinterSize;
  }
  if (settings.bins.length > 0) {
    payload.b = encodeBins(settings.bins, true);
    const encoded = base64UrlEncode(JSON.stringify(payload));
    if (encoded.length <= LONG_SHARE_PARAM_LENGTH) return encoded;
    payload.b = encodeBins(settings.bins, false);
  }
  return base64UrlEncode(JSON.stringify(payload));
}

export function buildShareUrl(baseUrl: string, settings: ShareableSettings): string {
  const url = new URL(baseUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set(SHARE_PARAM, encodeShareSettings(settings));
  return url.toString();
}

export function parseShareParam(search: string): ShareableSettings | null {
  try {
    const params = new URLSearchParams(search);
    return decodeShareSettings(params.get(SHARE_PARAM));
  } catch {
    return null;
  }
}

function base64UrlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(encoded: string): string | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
