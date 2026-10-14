import { unitMath } from "@/services/unitMath";
import type { LayoutItem } from "@/types";

/**
 * Display details for one piece of a calculated preview layout.
 */
export interface PreviewPieceDetails {
  /** Human-readable piece type: "Baseplate" | "Half-size bin" | "Spacer". */
  typeLabel: string;
  /** Grid size, e.g. "3 × 2" (Gridfinity units, 42mm each). */
  gridLabel: string;
  /** Physical width in millimetres (from the exact pixel size, 1 decimal). */
  widthMm: number;
  /** Physical height in millimetres (from the exact pixel size, 1 decimal). */
  heightMm: number;
  /** Physical width in inches (2 decimals). */
  widthIn: number;
  /** Physical height in inches (2 decimals). */
  heightIn: number;
  /** Grid column of the piece's top-left corner (0-based, 2 decimals). */
  column: number;
  /** Grid row of the piece's top-left corner (0-based, 2 decimals). */
  row: number;
  /** How many pieces in this drawer share the same type and grid size. */
  identicalCount: number;
}

const TYPE_LABELS: Record<LayoutItem["type"], string> = {
  baseplate: "Baseplate",
  "half-size": "Half-size bin",
  spacer: "Spacer",
};

/** Stable key for grouping identical pieces: type + grid size. */
export const previewPieceKey = (item: LayoutItem): string =>
  `${item.type}:${item.width}x${item.height}`;

/** One distinct piece kind in a layout: its first item + how many match. */
export interface PreviewPieceGroup {
  item: LayoutItem;
  count: number;
}

/**
 * Group a layout's pieces by type + grid size, in first-appearance order.
 * Used to render one adequately-sized selection row per distinct piece —
 * the preview cells themselves are too small to be tap targets.
 */
export const groupPreviewPieces = (layout: LayoutItem[]): PreviewPieceGroup[] => {
  const groups = new Map<string, PreviewPieceGroup>();
  for (const item of layout) {
    const key = previewPieceKey(item);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { item, count: 1 });
    }
  }
  return [...groups.values()];
};
const formatGridNumber = (value: number): string =>
  String(unitMath.round(value, 2));

/**
 * Derive display details for one layout item. All size math goes through
 * unitMath; the pixel size is the exact physical size in mm (spacers keep
 * their exact remainder there, where the grid size is a rounded fraction).
 */
export const getPreviewPieceDetails = (
  item: LayoutItem,
  layout: LayoutItem[]
): PreviewPieceDetails => {
  const widthMm = unitMath.round(item.pixelWidth, 1);
  const heightMm = unitMath.round(item.pixelHeight, 1);
  return {
    typeLabel: TYPE_LABELS[item.type],
    gridLabel: `${formatGridNumber(item.width)} × ${formatGridNumber(item.height)}`,
    widthMm,
    heightMm,
    widthIn: unitMath.round(unitMath.convert(item.pixelWidth, "mm", "inch"), 2),
    heightIn: unitMath.round(unitMath.convert(item.pixelHeight, "mm", "inch"), 2),
    column: unitMath.round(item.x, 2),
    row: unitMath.round(item.y, 2),
    identicalCount: layout.filter(
      (other) =>
        other.type === item.type &&
        other.width === item.width &&
        other.height === item.height
    ).length,
  };
};
