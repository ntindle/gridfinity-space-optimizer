import React from "react";
import { Button } from "@/components/ui/button";
import { unitMath } from "@/services/unitMath";
import type { CalculationResultWithDrawers } from "@/hooks/useGridfinityCalculation";

interface MobileResultsBarProps {
  result: CalculationResultWithDrawers;
  useHalfSize?: boolean;
  preferHalfSize?: boolean;
}

const totalFor = (groups: Record<string, number>): number =>
  Object.values(groups).reduce(
    (sum, count) => unitMath.add(sum, count),
    0
  );

const MobileResultsBar: React.FC<MobileResultsBarProps> = ({
  result,
  useHalfSize,
  preferHalfSize,
}) => {
  const { baseplates, halfSizeBins, spacers, numDrawers } = result;

  const scaled = (groups: Record<string, number>): number =>
    unitMath.multiply(totalFor(groups), numDrawers);

  const parts: string[] = [];
  const baseplateCount = scaled(baseplates);
  if (!useHalfSize && baseplateCount > 0) {
    parts.push(
      `${baseplateCount} baseplate${baseplateCount === 1 ? "" : "s"}`
    );
  }
  const binCount = scaled(halfSizeBins ?? {});
  if ((useHalfSize || preferHalfSize) && binCount > 0) {
    parts.push(`${binCount} bin${binCount === 1 ? "" : "s"}`);
  }
  const spacerCount = scaled(spacers);
  if (spacerCount > 0) {
    parts.push(`${spacerCount} spacer${spacerCount === 1 ? "" : "s"}`);
  }
  const summary = parts.length > 0 ? parts.join(" · ") : "Layout ready";

  const scrollToResults = () => {
    document
      .getElementById("calculator-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky bottom-0 z-20 md:hidden print:hidden">
      <div className="flex items-center justify-between gap-3 border-t bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur">
        <p
          className="min-w-0 flex-1 truncate text-sm font-medium"
          aria-live="polite"
        >
          {summary}
        </p>
        <Button
          type="button"
          size="sm"
          className="min-h-[48px] shrink-0"
          onClick={scrollToResults}
        >
          View results
        </Button>
      </div>
    </div>
  );
};

export default MobileResultsBar;
