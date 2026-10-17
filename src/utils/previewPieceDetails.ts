import { unitMath } from "@/services/unitMath";
import type { LayoutItem } from "@/types";

export interface PreviewPieceDetails {
  typeLabel: string;
  gridLabel: string;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  column: number;
  row: number;
  identicalCount: number;
}

const TYPE_LABELS: Record<LayoutItem["type"], string> = {
  baseplate: "Baseplate",
  "half-size": "Half-size bin",
  spacer: "Spacer",
};

export const previewPieceKey = (item: LayoutItem): string =>
  `${item.type}:${item.width}x${item.height}`;

export interface PreviewPieceGroup {
  item: LayoutItem;
  count: number;
}

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
