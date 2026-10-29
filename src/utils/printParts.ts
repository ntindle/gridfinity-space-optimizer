import { unitMath } from "@/services/unitMath";
import { FULL_GRID_SIZE, HALF_GRID_SIZE } from "@/utils/gridfinityUtils";
import {
  BIN_HEIGHT_UNIT_MM,
  LABEL_TAB_ABOVE_LIP_MM,
  MAX_BIN_HEIGHT,
  STACKING_LIP_HEIGHT_MM,
  binIssues,
  binOuterSize,
  binSizeLabel,
  gridCells,
  groupBins,
  indexCells,
} from "@/utils/bins";
import { usableBed } from "@/utils/printPlan";
import type { Bin, LayoutItem, PrinterSize } from "@/types";

export const BASEPLATE_HEIGHT_MM = 5;

export type PrintPartKind = "bin" | "baseplate" | "spacer";

export interface PrintPartSummary {
  key: string;
  kind: PrintPartKind;
  swatch: LayoutItem["type"] | "bin";
  label: string;
  stem: string;
  width: number;
  depth: number;
  height: number;
  count: number;
  binGeometry?: {
    columns: number;
    rows: number;
    cellSize: number;
    height: number;
    labelTab?: boolean;
  };
  gridGeometry?: { columns: number; rows: number; cellSize: number };
}

export interface CollectPrintPartsRequest {
  layout: LayoutItem[];
  bins: Bin[];
  numDrawers: number;
  printerSize: PrinterSize;
  labelTabs?: boolean;
}

export const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\s*×\s*/g, "x")
    .replace(/(\d)\s+(mm|in)\b/g, "$1$2")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

const trim = (value: number): string => String(unitMath.round(value, 2));

const binParts = (
  layout: LayoutItem[],
  bins: Bin[],
  numDrawers: number,
  printerSize: PrinterSize,
  labelTabs: boolean
): { parts: PrintPartSummary[]; skipped: number } => {
  const index = indexCells(gridCells(layout));
  const bed = usableBed(printerSize);
  const tabAllowance = labelTabs ? LABEL_TAB_ABOVE_LIP_MM : 0;
  const maxUnits = unitMath.min(
    MAX_BIN_HEIGHT,
    unitMath.floor(
      unitMath.divide(
        unitMath.subtract(
          unitMath.subtract(printerSize.z, STACKING_LIP_HEIGHT_MM),
          tabAllowance
        ),
        BIN_HEIGHT_UNIT_MM
      )
    )
  );
  const limits = { ...bed, height: maxUnits };
  const skipped = binIssues(bins, index, limits).size;
  const parts = groupBins(bins, index, limits).map((group): PrintPartSummary => {
    const half = group.cellSize === HALF_GRID_SIZE;
    const size = binSizeLabel(group);
    const label = `Bin ${size} · ${group.height}u${half ? " · half-grid feet" : ""}`;
    const outer = binOuterSize(group);
    return {
      key: group.key,
      kind: "bin",
      swatch: "bin",
      label,
      stem: slug(`bin ${size} ${group.height}u${half ? " half grid" : ""}`),
      width: outer.width,
      depth: outer.depth,
      height: unitMath.add(outer.height, tabAllowance),
      count: unitMath.multiply(group.bins.length, numDrawers),
      binGeometry: {
        columns: unitMath.round(unitMath.divide(group.width, group.cellSize), 0),
        rows: unitMath.round(unitMath.divide(group.depth, group.cellSize), 0),
        cellSize: group.cellSize,
        height: group.height,
        ...(labelTabs ? { labelTab: true as const } : {}),
      },
    };
  });
  return { parts, skipped };
};

const gridParts = (
  layout: LayoutItem[],
  numDrawers: number
): PrintPartSummary[] => {
  const groups = new Map<string, { item: LayoutItem; count: number }>();
  for (const item of layout) {
    const key = `${item.type}:${unitMath.round(item.pixelWidth, 2)}x${unitMath.round(item.pixelHeight, 2)}`;
    const group = groups.get(key);
    if (group) {
      group.count = unitMath.add(group.count, 1);
    } else {
      groups.set(key, { item, count: 1 });
    }
  }
  return [...groups].map(([key, { item, count }]): PrintPartSummary => {
    const width = item.pixelWidth;
    const depth = item.pixelHeight;
    const total = unitMath.multiply(count, numDrawers);
    if (item.type === "spacer") {
      const label = `Spacer ${trim(width)} × ${trim(depth)} mm`;
      return {
        key,
        kind: "spacer",
        swatch: "spacer",
        label,
        stem: slug(label),
        width,
        depth,
        height: BASEPLATE_HEIGHT_MM,
        count: total,
      };
    }
    const cellSize = item.type === "half-size" ? HALF_GRID_SIZE : FULL_GRID_SIZE;
    const columns = unitMath.round(unitMath.divide(width, cellSize), 0);
    const rows = unitMath.round(unitMath.divide(depth, cellSize), 0);
    const label = `${item.type === "half-size" ? "Half-size baseplate" : "Baseplate"} ${columns} × ${rows}`;
    return {
      key,
      kind: "baseplate",
      swatch: item.type,
      label,
      stem: slug(label),
      width,
      depth,
      height: BASEPLATE_HEIGHT_MM,
      count: total,
      gridGeometry: { columns, rows, cellSize },
    };
  });
};

export const collectPrintParts = (
  request: CollectPrintPartsRequest
): { parts: PrintPartSummary[]; skippedBins: number } => {
  const { parts: bins, skipped } = binParts(
    request.layout,
    request.bins,
    request.numDrawers,
    request.printerSize,
    request.labelTabs === true
  );
  const grid = gridParts(request.layout, request.numDrawers);
  return { parts: [...bins, ...grid], skippedBins: skipped };
};

export const TEST_FIT_BASEPLATE_KEY = "test-fit:baseplate-1x1";

export const testFitParts = (parts: PrintPartSummary[]): PrintPartSummary[] => {
  const baseplate: PrintPartSummary = {
    key: TEST_FIT_BASEPLATE_KEY,
    kind: "baseplate",
    swatch: "baseplate",
    label: "Baseplate 1 × 1",
    stem: "baseplate-1x1",
    width: FULL_GRID_SIZE,
    depth: FULL_GRID_SIZE,
    height: BASEPLATE_HEIGHT_MM,
    count: 1,
    gridGeometry: { columns: 1, rows: 1, cellSize: FULL_GRID_SIZE },
  };
  const spacer = parts
    .filter((part) => part.kind === "spacer")
    .sort((a, b) => a.key.localeCompare(b.key))[0];
  return spacer ? [baseplate, { ...spacer, count: 1 }] : [baseplate];
};

export const mergeTestFitParts = (
  parts: PrintPartSummary[],
  testParts: PrintPartSummary[]
): PrintPartSummary[] => {
  const merged = new Map(parts.map((part) => [part.stem, part]));
  for (const testPart of testParts) {
    const existing = merged.get(testPart.stem);
    merged.set(
      testPart.stem,
      existing
        ? { ...existing, count: unitMath.add(existing.count, testPart.count) }
        : testPart
    );
  }
  return [...merged.values()];
};
