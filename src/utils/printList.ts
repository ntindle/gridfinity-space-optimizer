import { formatLength, formatSize, pluralize } from "@/utils/format";
import type { PrintPartSummary } from "@/utils/printParts";

export const buildPrintListText = (
  parts: PrintPartSummary[],
  options: { numDrawers: number; printerName: string; useMm: boolean }
): string => {
  const size = (part: PrintPartSummary): string =>
    `${formatSize(part.width, part.depth, options.useMm)} × ${formatLength(part.height, options.useMm)}`;
  return [
    `Print plan · ${pluralize(options.numDrawers, "drawer")} · ${options.printerName}`,
    ...parts.map((part) => `${part.count} × ${part.label} (${size(part)})`),
  ].join("\n");
};
