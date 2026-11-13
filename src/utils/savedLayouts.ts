import { sanitizeBins, sanitizeDividerCount } from "@/utils/bins";
import { formatDrawerSize } from "@/utils/format";
import {
  sanitizeEstimateSettings,
  type EstimateSettings,
} from "@/utils/partVolumes";
import type { Bin, DrawerSize, PrinterSize } from "@/types";

export const SAVED_LAYOUTS_KEY = "gridfinity_savedLayouts";

export interface SavedLayoutSnapshot {
  drawerSize: DrawerSize;
  selectedPrinter: string;
  useHalfSize: boolean;
  preferHalfSize: boolean;
  preferUniformBaseplates: boolean;
  numDrawers: number;
  useMm: boolean;
  customPrinterSize: PrinterSize;
  bins: Bin[];
  testFit: boolean;
  labelTabs: boolean;
  dividerCount: number;
  lids: boolean;
  magnets: boolean;
  screws: boolean;
  scoop: boolean;
  estimateSettings: EstimateSettings;
}

export interface SavedLayout {
  id: string;
  name: string;
  createdAt: string;
  snapshot: SavedLayoutSnapshot;
}

export const createSavedLayoutId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isDrawerSize = (value: unknown): value is DrawerSize => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isFiniteNumber(record.width) && isFiniteNumber(record.height);
};

const isPrinterSize = (value: unknown): value is PrinterSize => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isFiniteNumber(record.x) && isFiniteNumber(record.y) && isFiniteNumber(record.z)
  );
};

const isSnapshot = (value: unknown): value is SavedLayoutSnapshot => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isDrawerSize(record.drawerSize) &&
    typeof record.selectedPrinter === "string" &&
    typeof record.useHalfSize === "boolean" &&
    typeof record.preferHalfSize === "boolean" &&
    typeof record.preferUniformBaseplates === "boolean" &&
    isFiniteNumber(record.numDrawers) &&
    typeof record.useMm === "boolean" &&
    isPrinterSize(record.customPrinterSize) &&
    Array.isArray(record.bins) &&
    typeof record.testFit === "boolean" &&
    typeof record.labelTabs === "boolean" &&
    (isFiniteNumber(record.dividerCount) ||
      typeof record.dividers === "boolean" ||
      isFiniteNumber(record.dividers)) &&
    typeof record.lids === "boolean"
  );
};

const sanitizePrinterSize = (value: unknown): PrinterSize | null => {
  if (!isPrinterSize(value)) return null;
  const printer: PrinterSize = { x: value.x, y: value.y, z: value.z };
  const zone = (value as unknown as Record<string, unknown>).exclusionZone;
  if (typeof zone === "object" && zone !== null && !Array.isArray(zone)) {
    const record = zone as Record<string, unknown>;
    const parsed: NonNullable<PrinterSize["exclusionZone"]> = {};
    for (const side of ["front", "back", "left", "right"] as const) {
      const sideValue = record[side];
      if (isFiniteNumber(sideValue) && sideValue >= 0 && sideValue <= 1000) {
        parsed[side] = sideValue;
      }
    }
    printer.exclusionZone = parsed;
  }
  return printer;
};

const sanitizeSnapshot = (value: unknown): SavedLayoutSnapshot | null => {
  if (!isSnapshot(value)) return null;
  const printerSize = sanitizePrinterSize(value.customPrinterSize);
  if (printerSize === null) return null;
  return {
    drawerSize: value.drawerSize,
    selectedPrinter: value.selectedPrinter,
    useHalfSize: value.useHalfSize,
    preferHalfSize: value.preferHalfSize,
    preferUniformBaseplates: value.preferUniformBaseplates,
    numDrawers: value.numDrawers,
    useMm: value.useMm,
    customPrinterSize: printerSize,
    bins: sanitizeBins(value.bins),
    testFit: value.testFit,
    labelTabs: value.labelTabs,
    dividerCount: sanitizeDividerCount(
      isFiniteNumber(value.dividerCount)
        ? value.dividerCount
        : (value as unknown as Record<string, unknown>).dividers
    ),
    lids: value.lids,
    magnets: typeof value.magnets === "boolean" ? value.magnets : false,
    screws: typeof value.screws === "boolean" ? value.screws : false,
    scoop: typeof value.scoop === "boolean" ? value.scoop : false,
    estimateSettings: sanitizeEstimateSettings(value.estimateSettings),
  };
};

const parseSavedLayout = (value: unknown): SavedLayout | null => {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    record.id.length === 0 ||
    typeof record.name !== "string" ||
    record.name.length === 0 ||
    typeof record.createdAt !== "string" ||
    Number.isNaN(Date.parse(record.createdAt))
  ) {
    return null;
  }
  const snapshot = sanitizeSnapshot(record.snapshot);
  if (snapshot === null) return null;
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    snapshot,
  };
};

export const parseSavedLayouts = (raw: string | null): SavedLayout[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const layouts: SavedLayout[] = [];
    for (const candidate of parsed) {
      const layout = parseSavedLayout(candidate);
      if (layout !== null) layouts.push(layout);
    }
    return layouts;
  } catch {
    return [];
  }
};

export const serializeSavedLayouts = (layouts: SavedLayout[]): string =>
  JSON.stringify(layouts);

export const upsertSavedLayout = (
  layouts: SavedLayout[],
  entry: SavedLayout
): SavedLayout[] => {
  const index = layouts.findIndex((layout) => layout.name === entry.name);
  if (index === -1) return [...layouts, entry];
  return layouts.map((layout, i) => (i === index ? entry : layout));
};

export const removeSavedLayout = (
  layouts: SavedLayout[],
  id: string
): SavedLayout[] => layouts.filter((layout) => layout.id !== id);

export const defaultSavedLayoutName = (snapshot: SavedLayoutSnapshot): string =>
  `${formatDrawerSize(snapshot.drawerSize, snapshot.useMm)} layout`;
