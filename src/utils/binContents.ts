import { previewPieceKey } from "@/utils/previewPieceDetails";
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
  groupKey: string,
  binCount = Infinity
): boolean =>
  Object.keys(contents).some((key) => {
    if (!key.startsWith(`${groupKey}${PER_BIN_SEPARATOR}`)) return false;
    const index = Number(key.slice(groupKey.length + PER_BIN_SEPARATOR.length));
    return Number.isInteger(index) && index >= 0 && index < binCount;
  });
