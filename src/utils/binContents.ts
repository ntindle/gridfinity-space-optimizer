import { groupPreviewPieces, previewPieceKey } from "@/utils/previewPieceDetails";
import type { LayoutItem } from "@/types";

export const getBinContents = (
  contents: Record<string, string>,
  item: LayoutItem
): string => contents[previewPieceKey(item)] ?? "";

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

export const pruneBinContents = (
  contents: Record<string, string>,
  layout: LayoutItem[]
): Record<string, string> => {
  const liveKeys = new Set(
    groupPreviewPieces(layout).map((group) => previewPieceKey(group.item))
  );
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(contents)) {
    if (liveKeys.has(key)) {
      next[key] = value;
    }
  }
  return next;
};
