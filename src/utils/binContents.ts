import { groupPreviewPieces, previewPieceKey } from "@/utils/previewPieceDetails";
import type { LayoutItem } from "@/types";

export const PER_BIN_SEPARATOR = "#";

export const perBinContentsKey = (
  groupKey: string,
  binIndex: number
): string => `${groupKey}${PER_BIN_SEPARATOR}${binIndex}`;

export const getBinContents = (
  contents: Record<string, string>,
  item: LayoutItem
): string => contents[previewPieceKey(item)] ?? "";

export const getBinContentsForBin = (
  contents: Record<string, string>,
  groupKey: string,
  binIndex: number
): string =>
  contents[perBinContentsKey(groupKey, binIndex)] ?? contents[groupKey] ?? "";

export const setBinContentsForItem = (
  contents: Record<string, string>,
  item: LayoutItem,
  value: string
): Record<string, string> => {
  const next = { ...contents };
  const key = previewPieceKey(item);
  const trimmed = value.trim();
  if (trimmed === "") {
    delete next[key];
  } else {
    next[key] = trimmed;
  }
  return next;
};

export const setBinContentsForBin = (
  contents: Record<string, string>,
  groupKey: string,
  binIndex: number,
  value: string
): Record<string, string> => {
  const next = { ...contents };
  const key = perBinContentsKey(groupKey, binIndex);
  const trimmed = value.trim();
  if (trimmed === "") {
    delete next[key];
  } else {
    next[key] = trimmed;
  }
  return next;
};

export const hasPerBinContents = (
  contents: Record<string, string>,
  groupKey: string
): boolean =>
  Object.keys(contents).some((key) =>
    key.startsWith(`${groupKey}${PER_BIN_SEPARATOR}`)
  );

export const pruneBinContents = (
  contents: Record<string, string>,
  layout: LayoutItem[]
): Record<string, string> => {
  const liveKeys = new Set<string>();
  for (const group of groupPreviewPieces(layout)) {
    const groupKey = previewPieceKey(group.item);
    liveKeys.add(groupKey);
    for (let index = 0; index < group.count; index += 1) {
      liveKeys.add(perBinContentsKey(groupKey, index));
    }
  }
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(contents)) {
    if (liveKeys.has(key)) {
      next[key] = value;
    }
  }
  return next;
};
