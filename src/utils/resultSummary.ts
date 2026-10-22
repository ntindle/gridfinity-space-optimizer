import { unitMath } from "@/services/unitMath";
import type { CalculationResultWithDrawers } from "@/hooks/useGridfinityCalculation";

export interface ResultCounts {
  baseplates: number;
  bins: number;
  spacers: number;
}

const totalFor = (groups: Record<string, number>): number =>
  Object.values(groups).reduce(
    (sum, count) => unitMath.add(sum, count),
    0
  );

export const countResult = (
  result: CalculationResultWithDrawers,
  useHalfSize?: boolean,
  preferHalfSize?: boolean
): ResultCounts => {
  const { baseplates, halfSizeBins, spacers, numDrawers } = result;
  const scaled = (groups: Record<string, number>): number =>
    unitMath.multiply(totalFor(groups), numDrawers);

  return {
    baseplates: useHalfSize ? 0 : scaled(baseplates),
    bins: useHalfSize || preferHalfSize ? scaled(halfSizeBins ?? {}) : 0,
    spacers: scaled(spacers),
  };
};

export const summaryParts = (
  counts: ResultCounts,
  binNoun = "bin"
): string[] => {
  const parts: string[] = [];
  const add = (count: number, noun: string) => {
    if (count > 0) parts.push(`${count} ${noun}${count === 1 ? "" : "s"}`);
  };
  add(counts.baseplates, "baseplate");
  add(counts.bins, binNoun);
  add(counts.spacers, "spacer");
  return parts;
};
