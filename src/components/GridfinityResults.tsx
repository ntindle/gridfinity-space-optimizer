import React from "react";
import type { CalculationResultWithDrawers } from "@/hooks/useGridfinityCalculation";
import { countResult, summaryParts } from "@/utils/resultSummary";
import { formatDrawerSize } from "@/utils/format";
import type { DrawerSize } from "@/types";

interface GridfinityResultsProps {
  result: CalculationResultWithDrawers;
  useMm: boolean;
  binCount?: number;
  drawerSize?: DrawerSize;
  action?: React.ReactNode;
}

const GridfinityResults: React.FC<GridfinityResultsProps> = ({
  result,
  useMm,
  binCount = 0,
  drawerSize,
  action,
}) => {
  const { numDrawers } = result;
  const counts = countResult(result, binCount);
  const parts = summaryParts(counts);
  const onlySpacers = counts.baseplates === 0 && counts.spacers > 0;

  return (
    <div id="calculator-results" className="scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium text-muted-foreground">
            Results for {numDrawers} drawer{numDrawers > 1 ? "s" : ""}
            {drawerSize ? " · " : null}
            {drawerSize ? (
              <span className="tabular-nums">
                {formatDrawerSize(drawerSize, useMm)}
              </span>
            ) : null}
          </h2>
          <p
            className="mt-1 text-xl font-semibold tracking-[-0.02em] tabular-nums text-balance sm:text-2xl"
            aria-live="polite"
          >
            {parts.length > 0 ? parts.join(" · ") : "Nothing to print yet"}
          </p>
        </div>
        {action}
      </div>
      {onlySpacers ? (
        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-[13px] text-muted-foreground">
          This drawer is smaller than one grid cell, so the whole floor is a
          spacer.
        </p>
      ) : null}
    </div>
  );
};

export default GridfinityResults;
