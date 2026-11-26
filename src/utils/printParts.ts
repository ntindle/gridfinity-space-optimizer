import { unitMath } from "@/services/unitMath";
import { FULL_GRID_SIZE, HALF_GRID_SIZE } from "@/utils/gridfinityUtils";
import {
  BASEPLATE_HEIGHT_MM,
  connectorWidthsMm,
  type BaseplateConnectors,
} from "@/utils/export/gridfinityProfiles";
import {
  BIN_HEIGHT_UNIT_MM,
  LABEL_TAB_ABOVE_LIP_MM,
  LID_LIP_DEPTH_MM,
  LID_THICKNESS_MM,
  MAX_BIN_HEIGHT,
  STACKING_LIP_HEIGHT_MM,
  binIssues,
  binOuterSize,
  binSizeLabel,
  dividerPositionsText,
  gridCells,
  groupBins,
  indexCells,
} from "@/utils/bins";
import { usableBed } from "@/utils/printPlan";
import type { Bin, LayoutItem, PrinterSize } from "@/types";

export { BASEPLATE_HEIGHT_MM };

export type PrintPartKind = "bin" | "baseplate" | "spacer" | "lid";

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
    dividerCount?: number;
    dividerPositions?: number[];
    magnetHoles?: boolean;
    screwHoles?: boolean;
    scoop?: boolean;
    vaseMode?: boolean;
  };
  gridGeometry?: {
    columns: number;
    rows: number;
    cellSize: number;
    connectors?: BaseplateConnectors;
    extendRightMm?: number;
    extendBottomMm?: number;
  };
}

export interface CollectPrintPartsRequest {
  layout: LayoutItem[];
  bins: Bin[];
  numDrawers: number;
  printerSize: PrinterSize;
  labelTabs?: boolean;
  dividerCount?: number;
  lids?: boolean;
  magnets?: boolean;
  screws?: boolean;
  scoop?: boolean;
  vaseMode?: boolean;
  connectors?: boolean;
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
  labelTabs: boolean,
  dividerCount: number,
  lids: boolean,
  magnets: boolean,
  screws: boolean,
  scoop: boolean,
  vaseMode: boolean
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
  const groups = groupBins(bins, index, limits, dividerCount);
  const parts = groups.map((group): PrintPartSummary => {
    const half = group.cellSize === HALF_GRID_SIZE;
    const size = binSizeLabel(group);
    const label = `Bin ${size} · ${group.height}u${half ? " · half-grid feet" : ""}${
      group.dividerPositions ? ` · dividers at ${dividerPositionsText(group.dividerPositions)}` : ""
    }${magnets ? " · magnet holes" : ""}${screws ? " · screw holes" : ""}${scoop ? " · scoop" : ""}${vaseMode ? " · vase mode" : ""}`;
    const outer = binOuterSize(group);
    return {
      key: group.key,
      kind: "bin",
      swatch: "bin",
      label,
      stem: slug(
        `bin ${size} ${group.height}u${half ? " half grid" : ""}${
          group.dividerPositions ? ` dividers ${dividerPositionsText(group.dividerPositions)}` : ""
        }${magnets ? " magnets" : ""}${screws ? " screws" : ""}${scoop ? " scoop" : ""}${vaseMode ? " vase-mode" : ""}`
      ),
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
        ...(dividerCount ? { dividerCount } : {}),
        ...(group.dividerPositions ? { dividerPositions: group.dividerPositions } : {}),
        ...(magnets ? { magnetHoles: true as const } : {}),
        ...(screws ? { screwHoles: true as const } : {}),
        ...(scoop ? { scoop: true as const } : {}),
        ...(vaseMode ? { vaseMode: true as const } : {}),
      },
    };
  });
  if (!lids) return { parts, skipped };
  const lidsByFootprint = new Map<string, PrintPartSummary>();
  for (const group of groups) {
    const half = group.cellSize === HALF_GRID_SIZE;
    const size = binSizeLabel(group);
    const outer = binOuterSize(group);
    const key = `lid:${group.cellSize}:${group.width}x${group.depth}`;
    const existing = lidsByFootprint.get(key);
    const count = unitMath.multiply(group.bins.length, numDrawers);
    if (existing) {
      existing.count = unitMath.add(existing.count, count);
    } else {
      lidsByFootprint.set(key, {
        key,
        kind: "lid",
        swatch: "bin",
        label: `Lid ${size}${half ? " · half-grid" : ""}`,
        stem: slug(`lid ${size}${half ? " half-grid" : ""}`),
        width: outer.width,
        depth: outer.depth,
        height: unitMath.add(LID_THICKNESS_MM, LID_LIP_DEPTH_MM),
        count,
      });
    }
  }
  return { parts: [...parts, ...lidsByFootprint.values()], skipped };
};

const connectorSignature = (spec: BaseplateConnectors): string =>
  [
    spec.left === "recess" ? "rL" : undefined,
    spec.right === "tab" ? "tR" : undefined,
    spec.top === "tab" ? "tT" : undefined,
    spec.bottom === "recess" ? "rB" : undefined,
  ]
    .filter((code): code is string => code !== undefined)
    .join("-");

const connectorsFor = (
  item: LayoutItem,
  layout: LayoutItem[],
  enabled: boolean
): BaseplateConnectors | undefined => {
  if (!enabled || item.type === "spacer") return undefined;
  const cellSize = item.type === "half-size" ? HALF_GRID_SIZE : FULL_GRID_SIZE;
  const tabHead = connectorWidthsMm(cellSize, "tab").head;
  const recessHead = connectorWidthsMm(cellSize, "recess").head;
  const span = (start: number, size: number, head: number) => {
    const center = unitMath.add(start, unitMath.divide(size, 2));
    return {
      from: unitMath.subtract(center, unitMath.divide(head, 2)),
      to: unitMath.add(center, unitMath.divide(head, 2)),
    };
  };
  const engages = (tab: { from: number; to: number }, recess: { from: number; to: number }): boolean =>
    tab.from >= unitMath.subtract(recess.from, 0.001) &&
    tab.to <= unitMath.add(recess.to, 0.001);
  const cellWidth = (piece: LayoutItem): number =>
    unitMath.subtract(piece.pixelWidth, piece.extendRightMm ?? 0);
  const cellHeight = (piece: LayoutItem): number =>
    unitMath.subtract(piece.pixelHeight, piece.extendBottomMm ?? 0);
  const neighbour = (edge: "left" | "right" | "top" | "bottom"): boolean =>
    layout.some((other) => {
      if (other === item || other.type !== item.type) return false;
      if (edge === "left" || edge === "right") {
        const adjacent =
          edge === "left"
            ? unitMath.add(other.pixelX, other.pixelWidth) === item.pixelX
            : other.pixelX === unitMath.add(item.pixelX, item.pixelWidth);
        if (!adjacent) return false;
        const own = span(item.pixelY, cellHeight(item), edge === "left" ? recessHead : tabHead);
        const theirs = span(other.pixelY, cellHeight(other), edge === "left" ? tabHead : recessHead);
        return edge === "left" ? engages(theirs, own) : engages(own, theirs);
      }
      const adjacent =
        edge === "bottom"
          ? unitMath.add(other.pixelY, other.pixelHeight) === item.pixelY
          : other.pixelY === unitMath.add(item.pixelY, item.pixelHeight);
      if (!adjacent) return false;
      const own = span(item.pixelX, cellWidth(item), edge === "bottom" ? recessHead : tabHead);
      const theirs = span(other.pixelX, cellWidth(other), edge === "bottom" ? tabHead : recessHead);
      return edge === "bottom" ? engages(theirs, own) : engages(own, theirs);
    });
  const spec: BaseplateConnectors = {};
  if (neighbour("left")) spec.left = "recess";
  if (neighbour("right")) spec.right = "tab";
  if (neighbour("top")) spec.top = "tab";
  if (neighbour("bottom")) spec.bottom = "recess";
  return Object.keys(spec).length > 0 ? spec : undefined;
};

const gridParts = (
  layout: LayoutItem[],
  numDrawers: number,
  connectors: boolean
): PrintPartSummary[] => {
  const groups = new Map<
    string,
    { item: LayoutItem; count: number; connectors?: BaseplateConnectors }
  >();
  for (const item of layout) {
    const spec = connectorsFor(item, layout, connectors);
    const signature = spec === undefined ? "" : connectorSignature(spec);
    const key = `${item.type}:${unitMath.round(item.pixelWidth, 2)}x${unitMath.round(item.pixelHeight, 2)}${signature === "" ? "" : `:conn:${signature}`}`;
    const group = groups.get(key);
    if (group) {
      group.count = unitMath.add(group.count, 1);
    } else {
      groups.set(key, { item, count: 1, connectors: spec });
    }
  }
  return [...groups].map(([key, { item, count, connectors: spec }]): PrintPartSummary => {
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
    const extendRightMm = item.extendRightMm ?? 0;
    const extendBottomMm = item.extendBottomMm ?? 0;
    const columns = unitMath.round(
      unitMath.divide(unitMath.subtract(width, extendRightMm), cellSize),
      0
    );
    const rows = unitMath.round(
      unitMath.divide(unitMath.subtract(depth, extendBottomMm), cellSize),
      0
    );
    const extensionLabel = [
      extendRightMm > 0 ? `+${trim(extendRightMm)} mm right edge` : undefined,
      extendBottomMm > 0 ? `+${trim(extendBottomMm)} mm bottom edge` : undefined,
    ]
      .filter((segment): segment is string => segment !== undefined)
      .map((segment) => ` · ${segment}`)
      .join("");
    const label = `${item.type === "half-size" ? "Half-size baseplate" : "Baseplate"} ${columns} × ${rows}${extensionLabel}${spec === undefined ? "" : " · connectors"}`;
    return {
      key,
      kind: "baseplate",
      swatch: item.type,
      label,
      stem:
        spec === undefined
          ? slug(label)
          : `${slug(label)}-${connectorSignature(spec).toLowerCase()}`,
      width,
      depth,
      height: BASEPLATE_HEIGHT_MM,
      count: total,
      gridGeometry: {
        columns,
        rows,
        cellSize,
        connectors: spec,
        ...(extendRightMm > 0 ? { extendRightMm } : {}),
        ...(extendBottomMm > 0 ? { extendBottomMm } : {}),
      },
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
    request.labelTabs === true,
    request.dividerCount ?? 0,
    request.lids === true,
    request.magnets === true,
    request.screws === true,
    request.scoop === true,
    request.vaseMode === true
  );
  const grid = gridParts(request.layout, request.numDrawers, request.connectors === true);
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
