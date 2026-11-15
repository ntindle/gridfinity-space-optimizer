import React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countResult, summaryParts } from "@/utils/resultSummary";
import { scrollBehavior } from "@/utils/motion";
import type { CalculationResultWithDrawers } from "@/hooks/useGridfinityCalculation";

interface MobileResultsBarProps {
  result: CalculationResultWithDrawers;
  binCount?: number;
}

const MobileResultsBar: React.FC<MobileResultsBarProps> = ({ result, binCount = 0 }) => {
  const parts = summaryParts(countResult(result, binCount));
  const summary = parts.length > 0 ? parts.join(" · ") : "Layout ready";

  const scrollToResults = () => {
    document
      .getElementById("calculator-results")
      ?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  };

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-4 md:hidden print:hidden">
      <div className="flex items-center justify-between gap-3 border-t border-border bg-background/85 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.18)] backdrop-blur-xl backdrop-saturate-150">
        <p
          className="min-w-0 flex-1 truncate text-sm font-medium tabular-nums"
          aria-live="polite"
        >
          {summary}
        </p>
        <Button
          type="button"
          size="sm"
          className="min-h-11 shrink-0"
          onClick={scrollToResults}
        >
          View results
          <ArrowDown />
        </Button>
      </div>
    </div>
  );
};

export default MobileResultsBar;
