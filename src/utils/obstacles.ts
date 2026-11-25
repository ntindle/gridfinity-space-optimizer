import { unitMath } from "@/services/unitMath";
import { FULL_GRID_SIZE, HALF_GRID_SIZE } from "@/utils/gridfinityUtils";
import type { GridfinityResult, LayoutItem, Obstacle } from "@/types";

export const MAX_OBSTACLES = 8;
export const OBSTACLE_BLOCK_HEIGHT_MM = 21;

const MAX_COORDINATE_MM = 10000;

export interface ObstacleRect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export const createObstacleId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `obstacle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isValidCoordinate = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= MAX_COORDINATE_MM;

const isValidSize = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0 &&
  value <= MAX_COORDINATE_MM;

export const sanitizeObstacles = (value: unknown): Obstacle[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const obstacles: Obstacle[] = [];
  for (const candidate of value) {
    if (obstacles.length >= MAX_OBSTACLES) break;
    if (typeof candidate !== "object" || candidate === null) continue;
    const raw = candidate as Record<string, unknown>;
    if (!isValidCoordinate(raw.x) || !isValidCoordinate(raw.y)) continue;
    if (!isValidSize(raw.width) || !isValidSize(raw.depth)) continue;
    let id =
      typeof raw.id === "string" && raw.id.length > 0 && raw.id.length <= 64
        ? raw.id
        : createObstacleId();
    if (seen.has(id)) id = createObstacleId();
    seen.add(id);
    obstacles.push({
      id,
      x: unitMath.round(raw.x, 2),
      y: unitMath.round(raw.y, 2),
      width: unitMath.round(raw.width, 2),
      depth: unitMath.round(raw.depth, 2),
    });
  }
  return obstacles;
};

export const validateObstacle = (
  candidate: ObstacleRect,
  drawerMm: { width: number; height: number },
  existingCount: number
): string | null => {
  const { x, y, width, depth } = candidate;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(depth)
  ) {
    return "Enter numbers for all four fields.";
  }
  if (existingCount >= MAX_OBSTACLES) {
    return `Up to ${MAX_OBSTACLES} obstacles per drawer. Delete one to add another.`;
  }
  if (x < 0 || y < 0) {
    return "Distances from the edges can't be negative.";
  }
  if (width <= 0 || depth <= 0) {
    return "Width and depth must be more than zero.";
  }
  if (unitMath.add(x, width) > drawerMm.width) {
    return "That runs past the right edge of the drawer.";
  }
  if (unitMath.add(y, depth) > drawerMm.height) {
    return "That runs past the back edge of the drawer.";
  }
  return null;
};

export const snapObstacleRect = (
  obstacle: ObstacleRect,
  cellSize: number
): ObstacleRect => {
  const x0 = unitMath.multiply(unitMath.floor(unitMath.divide(obstacle.x, cellSize)), cellSize);
  const y0 = unitMath.multiply(unitMath.floor(unitMath.divide(obstacle.y, cellSize)), cellSize);
  const x1 = unitMath.multiply(
    unitMath.ceil(unitMath.divide(unitMath.add(obstacle.x, obstacle.width), cellSize)),
    cellSize
  );
  const y1 = unitMath.multiply(
    unitMath.ceil(unitMath.divide(unitMath.add(obstacle.y, obstacle.depth), cellSize)),
    cellSize
  );
  return {
    x: x0,
    y: y0,
    width: unitMath.subtract(x1, x0),
    depth: unitMath.subtract(y1, y0),
  };
};

export const subtractRect = (rect: ObstacleRect, cut: ObstacleRect): ObstacleRect[] => {
  const rectRight = unitMath.add(rect.x, rect.width);
  const rectBottom = unitMath.add(rect.y, rect.depth);
  const cutRight = unitMath.add(cut.x, cut.width);
  const cutBottom = unitMath.add(cut.y, cut.depth);
  if (cut.x >= rectRight || cutRight <= rect.x || cut.y >= rectBottom || cutBottom <= rect.y) {
    return [rect];
  }
  const pieces: ObstacleRect[] = [];
  if (cut.x > rect.x) {
    pieces.push({
      x: rect.x,
      y: rect.y,
      width: unitMath.subtract(cut.x, rect.x),
      depth: rect.depth,
    });
  }
  if (cutRight < rectRight) {
    pieces.push({
      x: cutRight,
      y: rect.y,
      width: unitMath.subtract(rectRight, cutRight),
      depth: rect.depth,
    });
  }
  const middleX = unitMath.max(rect.x, cut.x);
  const middleWidth = unitMath.subtract(unitMath.min(rectRight, cutRight), middleX);
  if (cut.y > rect.y) {
    pieces.push({
      x: middleX,
      y: rect.y,
      width: middleWidth,
      depth: unitMath.subtract(cut.y, rect.y),
    });
  }
  if (cutBottom < rectBottom) {
    pieces.push({
      x: middleX,
      y: cutBottom,
      width: middleWidth,
      depth: unitMath.subtract(rectBottom, cutBottom),
    });
  }
  return pieces;
};

const cellSizeFor = (item: LayoutItem): number | null =>
  item.type === "baseplate"
    ? FULL_GRID_SIZE
    : item.type === "half-size"
      ? HALF_GRID_SIZE
      : null;

const scaleFor = (item: LayoutItem, gridSize: number): number =>
  item.type === "spacer" ? gridSize : unitMath.divide(item.pixelWidth, item.width);

const toLayoutItem = (
  item: LayoutItem,
  rect: ObstacleRect,
  gridSize: number
): LayoutItem => {
  const scale = scaleFor(item, gridSize);
  const width = unitMath.divide(rect.width, scale);
  const height = unitMath.divide(rect.depth, scale);
  return {
    type: item.type,
    x: unitMath.divide(rect.x, scale),
    y: unitMath.divide(rect.y, scale),
    width: item.type === "spacer" ? unitMath.round(width, 2) : width,
    height: item.type === "spacer" ? unitMath.round(height, 2) : height,
    pixelX: rect.x,
    pixelY: rect.y,
    pixelWidth: rect.width,
    pixelHeight: rect.depth,
  };
};

const subtractObstaclesFromItem = (
  item: LayoutItem,
  obstacles: Obstacle[],
  gridSize: number
): LayoutItem[] => {
  const cellSize = cellSizeFor(item);
  let rects: ObstacleRect[] = [
    { x: item.pixelX, y: item.pixelY, width: item.pixelWidth, depth: item.pixelHeight },
  ];
  for (const obstacle of obstacles) {
    const cut = cellSize === null ? obstacle : snapObstacleRect(obstacle, cellSize);
    rects = rects.flatMap((rect) => subtractRect(rect, cut));
    if (rects.length === 0) break;
  }
  return rects.map((rect) => toLayoutItem(item, rect, gridSize));
};

const countByKey = (
  layout: LayoutItem[],
  type: LayoutItem["type"],
  keyFor: (item: LayoutItem) => string
): Record<string, number> =>
  layout
    .filter((item) => item.type === type)
    .reduce<Record<string, number>>((acc, item) => {
      const key = keyFor(item);
      acc[key] = unitMath.add(acc[key] || 0, 1);
      return acc;
    }, {});

export const applyObstacles = (
  result: GridfinityResult,
  obstacles: Obstacle[],
  gridSize: number = FULL_GRID_SIZE
): GridfinityResult => {
  if (obstacles.length === 0) return result;
  const layout = result.layout.flatMap((item) =>
    subtractObstaclesFromItem(item, obstacles, gridSize)
  );
  return {
    baseplates: countByKey(layout, "baseplate", (item) => `${item.width}x${item.height}`),
    spacers: countByKey(
      layout,
      "spacer",
      (item) =>
        `${unitMath.round(unitMath.multiply(item.width, gridSize), 2)}mm x ${unitMath.round(
          unitMath.multiply(item.height, gridSize),
          2
        )}mm`
    ),
    halfSizeBins: countByKey(layout, "half-size", (item) => `${item.width}x${item.height}`),
    layout,
  };
};
