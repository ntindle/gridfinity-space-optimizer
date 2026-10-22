import { unitMath } from "@/services/unitMath";
import type { CalculationResultWithDrawers } from "@/hooks/useGridfinityCalculation";

export interface ResultCounts {
  bins: number;
  baseplates: number;
  spacers: number;
}

const totalFor = (groups: Record<string, number>): number =>
  Object.values(groups).reduce((sum, count) => unitMath.add(sum, count), 0);

export const countResult = (
  result: CalculationResultWithDrawers,
  binCount = 0
): ResultCounts => {
  const { baseplates, halfSizeBins, spacers, numDrawers } = result;
  const scaled = (groups: Record<string, number>): number =>
    unitMath.multiply(totalFor(groups), numDrawers);

  return {
    bins: unitMath.multiply(binCount, numDrawers),
    baseplates: unitMath.add(scaled(baseplates), scaled(halfSizeBins ?? {})),
    spacers: scaled(spacers),
  };
};

export const summaryParts = (counts: ResultCounts): string[] => {
  const parts: string[] = [];
  const add = (count: number, noun: string) => {
    if (count > 0) parts.push(`${count} ${noun}${count === 1 ? "" : "s"}`);
  };
  add(counts.bins, "bin");
  add(counts.baseplates, "baseplate");
  add(counts.spacers, "spacer");
  return parts;
};
