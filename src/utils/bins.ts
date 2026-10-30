import { unitMath } from "@/services/unitMath";
import { FULL_GRID_SIZE, HALF_GRID_SIZE } from "@/utils/gridfinityUtils";
import type { Bin, GridCell, LayoutItem } from "@/types";

export const BIN_HEIGHT_UNIT_MM = 7;
export const LABEL_TAB_THICKNESS_MM = 1.2;
export const LABEL_TAB_ABOVE_LIP_MM = 12;
export const LABEL_TAB_FUSE_MM = 8;
export const LABEL_TAB_MAX_WIDTH_MM = 36;
export const DIVIDER_THICKNESS_MM = 1.2;
export const LABEL_TAB_SIDE_MARGIN_MM = 3;
export const MIN_BIN_HEIGHT = 2;
export const MAX_BIN_HEIGHT = 20;
export const DEFAULT_BIN_HEIGHT = 3;
export const BIN_CLEARANCE_MM = 0.5;
export const STACKING_LIP_FILLET_RADIUS = 0.6;
export const STACKING_LIP_HEIGHT_MM = unitMath.subtract(
  4.4,
  unitMath.multiply(STACKING_LIP_FILLET_RADIUS, unitMath.sqrt(2))
);
export const MAX_LABEL_LENGTH = 60;

export type CellIndex = Map<string, GridCell>;

export type BinIssue = "off-grid" | "overlap" | "too-big" | "too-tall";

export interface BinLimits {
  width: number;
  depth: number;
  height?: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export interface BinGroup {
  key: string;
  width: number;
  depth: number;
  height: number;
  cellSize: number;
  bins: Bin[];
}

const cellKey = (x: number, y: number): string => `${x},${y}`;

const cellSizeOf = (item: LayoutItem): number =>
  item.type === "half-size" ? HALF_GRID_SIZE : FULL_GRID_SIZE;

export const createBinId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `bin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const byPosition = (a: GridCell, b: GridCell): number => {
  if (a.y !== b.y) return a.y < b.y ? -1 : 1;
  if (a.x !== b.x) return a.x < b.x ? -1 : 1;
  return 0;
};

const steps = (start: number, count: number, size: number): number[] =>
  Array.from({ length: count }, (_, step) => unitMath.add(start, unitMath.multiply(step, size)));

const cellCache = new WeakMap<LayoutItem[], GridCell[]>();

export const gridCells = (layout: LayoutItem[]): GridCell[] => {
  const cached = cellCache.get(layout);
  if (cached) return cached;
  const cells: GridCell[] = [];
  for (const item of layout) {
    if (item.type === "spacer") continue;
    const size = cellSizeOf(item);
    const xs = steps(item.pixelX, unitMath.round(unitMath.divide(item.pixelWidth, size), 0), size);
    const ys = steps(item.pixelY, unitMath.round(unitMath.divide(item.pixelHeight, size), 0), size);
    for (const y of ys) {
      for (const x of xs) cells.push({ x, y, size });
    }
  }
  cells.sort(byPosition);
  cellCache.set(layout, cells);
  return cells;
};

const indexCache = new WeakMap<GridCell[], CellIndex>();

export const indexCells = (cells: GridCell[]): CellIndex => {
  const cached = indexCache.get(cells);
  if (cached) return cached;
  const index: CellIndex = new Map(cells.map((cell) => [cellKey(cell.x, cell.y), cell]));
  indexCache.set(cells, index);
  return index;
};

export const cellAt = (index: CellIndex, x: number, y: number): GridCell | null => {
  for (const size of [FULL_GRID_SIZE, HALF_GRID_SIZE]) {
    const cell = index.get(
      cellKey(
        unitMath.multiply(unitMath.floor(unitMath.divide(x, size)), size),
        unitMath.multiply(unitMath.floor(unitMath.divide(y, size)), size)
      )
    );
    if (cell && cell.size === size) return cell;
  }
  return null;
};

export const tileSize = (index: CellIndex, rect: Rect): number | null => {
  const origin = index.get(cellKey(rect.x, rect.y));
  if (!origin) return null;
  const columns = unitMath.divide(rect.width, origin.size);
  const rows = unitMath.divide(rect.depth, origin.size);
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1) return null;
  const xs = steps(rect.x, columns, origin.size);
  for (const y of steps(rect.y, rows, origin.size)) {
    for (const x of xs) {
      const cell = index.get(cellKey(x, y));
      if (!cell || cell.size !== origin.size) return null;
    }
  }
  return origin.size;
};

interface Edges {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const edgesOf = (rect: Rect): Edges => ({
  left: rect.x,
  top: rect.y,
  right: unitMath.add(rect.x, rect.width),
  bottom: unitMath.add(rect.y, rect.depth),
});

const edgeCache = new WeakMap<Bin, Edges>();

const binEdges = (bin: Bin): Edges => {
  const cached = edgeCache.get(bin);
  if (cached) return cached;
  const edges = edgesOf(bin);
  edgeCache.set(bin, edges);
  return edges;
};

const edgesOverlap = (a: Edges, b: Edges): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

export const overlaps = (a: Rect, b: Rect): boolean => edgesOverlap(edgesOf(a), edgesOf(b));

const tileCache = new WeakMap<CellIndex, WeakMap<Bin, number | null>>();

const binTileSize = (index: CellIndex, bin: Bin): number | null => {
  let sizes = tileCache.get(index);
  if (!sizes) {
    sizes = new WeakMap();
    tileCache.set(index, sizes);
  }
  if (sizes.has(bin)) return sizes.get(bin) ?? null;
  const size = tileSize(index, bin);
  sizes.set(bin, size);
  return size;
};

const covered = (bins: Bin[], x: number, y: number): boolean =>
  bins.some((bin) => {
    const edges = binEdges(bin);
    return x >= edges.left && x < edges.right && y >= edges.top && y < edges.bottom;
  });

export const canPlace = (
  rect: Rect,
  index: CellIndex,
  bins: Bin[],
  ignoreId?: string
): boolean => {
  if (tileSize(index, rect) === null) return false;
  const edges = edgesOf(rect);
  return !bins.some((other) => other.id !== ignoreId && edgesOverlap(binEdges(other), edges));
};

const roomOn = (bed: { width: number; depth: number }) => ({
  width: unitMath.add(bed.width, BIN_CLEARANCE_MM),
  depth: unitMath.add(bed.depth, BIN_CLEARANCE_MM),
});

const fitsRoom = (rect: Pick<Rect, "width" | "depth">, room: { width: number; depth: number }) =>
  (rect.width <= room.width && rect.depth <= room.depth) ||
  (rect.depth <= room.width && rect.width <= room.depth);

export const fitsBed = (
  rect: Pick<Rect, "width" | "depth">,
  bed: { width: number; depth: number }
): boolean => fitsRoom(rect, roomOn(bed));

export const binIssues = (
  bins: Bin[],
  index: CellIndex,
  limits?: BinLimits
): Map<string, BinIssue> => {
  const issues = new Map<string, BinIssue>();
  const placed: Edges[] = [];
  const room = limits ? roomOn(limits) : null;
  for (const bin of bins) {
    const edges = binEdges(bin);
    if (binTileSize(index, bin) === null) {
      issues.set(bin.id, "off-grid");
    } else if (room && !fitsRoom(bin, room)) {
      issues.set(bin.id, "too-big");
    } else if (limits?.height !== undefined && bin.height > limits.height) {
      issues.set(bin.id, "too-tall");
    } else if (placed.some((other) => edgesOverlap(other, edges))) {
      issues.set(bin.id, "overlap");
    } else {
      placed.push(edges);
    }
  }
  return issues;
};

export const findFreeSpot = (
  cells: GridCell[],
  index: CellIndex,
  bins: Bin[],
  width: number,
  depth: number
): { x: number; y: number } | null => {
  for (const cell of cells) {
    if (covered(bins, cell.x, cell.y)) continue;
    if (canPlace({ x: cell.x, y: cell.y, width, depth }, index, bins)) {
      return { x: cell.x, y: cell.y };
    }
  }
  return null;
};

export const binStep = (bin: Rect, index: CellIndex, fallback: number = FULL_GRID_SIZE): number =>
  tileSize(index, bin) ?? fallback;

export const placeBin = (
  bin: Bin,
  rect: Rect,
  index: CellIndex,
  bins: Bin[],
  limits?: BinLimits
): Bin | null =>
  canPlace(rect, index, bins, bin.id) && (!limits || fitsBed(rect, limits))
    ? { ...bin, ...rect }
    : null;

export const fillEmpty = (
  cells: GridCell[],
  index: CellIndex,
  bins: Bin[],
  template: Pick<Bin, "width" | "depth" | "height" | "label">,
  makeId: () => string = createBinId
): Bin[] => {
  const added: Bin[] = [];
  const taken = [...bins];
  for (const cell of cells) {
    if (covered(taken, cell.x, cell.y)) continue;
    const rect = { x: cell.x, y: cell.y, width: template.width, depth: template.depth };
    if (canPlace(rect, index, taken)) {
      const bin = { ...template, ...rect, id: makeId() };
      added.push(bin);
      taken.push(bin);
    }
  }
  return added;
};

const nearest = (value: number, step: number): number =>
  unitMath.multiply(unitMath.round(unitMath.divide(value, step), 0), step);

export const snapMove = (
  index: CellIndex,
  bins: Bin[],
  bin: Bin,
  x: number,
  y: number
): Rect & { valid: boolean } => {
  const preferred = tileSize(index, bin) ?? FULL_GRID_SIZE;
  const steps = preferred === HALF_GRID_SIZE ? [HALF_GRID_SIZE] : [FULL_GRID_SIZE, HALF_GRID_SIZE];
  const candidates = steps.map((step) => ({
    x: nearest(x, step),
    y: nearest(y, step),
    width: bin.width,
    depth: bin.depth,
  }));
  const fitting = candidates.find((rect) => canPlace(rect, index, bins, bin.id));
  return fitting ? { ...fitting, valid: true } : { ...candidates[0], valid: false };
};

export const snapResize = (
  index: CellIndex,
  bins: Bin[],
  bin: Bin,
  width: number,
  depth: number
): Rect & { valid: boolean } => {
  const step = tileSize(index, bin) ?? FULL_GRID_SIZE;
  const rect = {
    x: bin.x,
    y: bin.y,
    width: unitMath.max(step, nearest(width, step)),
    depth: unitMath.max(step, nearest(depth, step)),
  };
  return { ...rect, valid: canPlace(rect, index, bins, bin.id) };
};

export const spanRect = (from: GridCell, to: GridCell): Rect => {
  const x = unitMath.min(from.x, to.x);
  const y = unitMath.min(from.y, to.y);
  return {
    x,
    y,
    width: unitMath.subtract(unitMath.max(unitMath.add(from.x, from.size), unitMath.add(to.x, to.size)), x),
    depth: unitMath.subtract(unitMath.max(unitMath.add(from.y, from.size), unitMath.add(to.y, to.size)), y),
  };
};

export const formatUnits = (mm: number): string =>
  String(unitMath.round(unitMath.divide(mm, FULL_GRID_SIZE), 2));

export const binSizeLabel = (bin: Pick<Bin, "width" | "depth">): string =>
  `${formatUnits(bin.width)} × ${formatUnits(bin.depth)}`;

export const binTotalHeight = (height: number): number =>
  unitMath.add(unitMath.multiply(height, BIN_HEIGHT_UNIT_MM), STACKING_LIP_HEIGHT_MM);

export const binOuterSize = (bin: Pick<Bin, "width" | "depth" | "height">) => ({
  width: unitMath.subtract(bin.width, BIN_CLEARANCE_MM),
  depth: unitMath.subtract(bin.depth, BIN_CLEARANCE_MM),
  height: binTotalHeight(bin.height),
});

export const maxBinHeight = (printerZ: number): number =>
  unitMath.min(
    MAX_BIN_HEIGHT,
    unitMath.floor(
      unitMath.divide(unitMath.subtract(printerZ, STACKING_LIP_HEIGHT_MM), BIN_HEIGHT_UNIT_MM)
    )
  );

export const groupBins = (
  bins: Bin[],
  index: CellIndex,
  limits?: BinLimits
): BinGroup[] => {
  const issues = binIssues(bins, index, limits);
  const groups = new Map<string, BinGroup>();
  for (const bin of bins) {
    if (issues.has(bin.id)) continue;
    const cellSize = binTileSize(index, bin) ?? FULL_GRID_SIZE;
    const width = unitMath.max(bin.width, bin.depth);
    const depth = unitMath.min(bin.width, bin.depth);
    const key = `bin:${cellSize}:${width}x${depth}x${bin.height}`;
    const group = groups.get(key);
    if (group) {
      group.bins.push(bin);
    } else {
      groups.set(key, { key, width, depth, height: bin.height, cellSize, bins: [bin] });
    }
  }
  return [...groups.values()].sort(
    (a, b) =>
      unitMath.subtract(unitMath.multiply(b.width, b.depth), unitMath.multiply(a.width, a.depth)) ||
      unitMath.subtract(b.height, a.height) ||
      a.key.localeCompare(b.key)
  );
};

const isNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const sanitizeBins = (value: unknown): Bin[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const bins: Bin[] = [];
  for (const candidate of value) {
    if (typeof candidate !== "object" || candidate === null) continue;
    const raw = candidate as Record<string, unknown>;
    if (!isNonNegative(raw.x) || !isNonNegative(raw.y)) continue;
    if (!isNonNegative(raw.width) || !isNonNegative(raw.depth) || raw.width === 0 || raw.depth === 0) continue;
    const height =
      typeof raw.height === "number" && Number.isFinite(raw.height)
        ? unitMath.min(MAX_BIN_HEIGHT, unitMath.max(MIN_BIN_HEIGHT, unitMath.round(raw.height, 0)))
        : DEFAULT_BIN_HEIGHT;
    let id = typeof raw.id === "string" && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : createBinId();
    if (seen.has(id)) id = createBinId();
    seen.add(id);
    bins.push({
      id,
      x: raw.x,
      y: raw.y,
      width: raw.width,
      depth: raw.depth,
      height,
      label: typeof raw.label === "string" ? raw.label.slice(0, MAX_LABEL_LENGTH) : "",
    });
  }
  return bins;
};
