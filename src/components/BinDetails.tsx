import React, { useId } from "react";
import { Copy, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/Stepper";
import BinContentsInput from "@/components/BinContentsInput";
import { unitMath } from "@/services/unitMath";
import { formatLength, formatSize } from "@/utils/format";
import {
  MIN_BIN_HEIGHT,
  binOuterSize,
  binSizeLabel,
  formatUnits,
  type BinIssue,
} from "@/utils/bins";
import type { Bin } from "@/types";

const ISSUE_TEXT: Record<BinIssue, string> = {
  "off-grid": "This bin no longer sits on whole grid cells. Move it or delete it.",
  overlap: "This bin overlaps another bin. Move it or make it smaller.",
  "too-big": "This bin is bigger than the printer bed. Make it smaller to print it.",
  "too-tall": "This bin is taller than the printer can print. Lower it.",
};

interface BinDetailsProps {
  bin: Bin;
  issue?: BinIssue;
  step: number;
  maxHeight: number;
  useMm: boolean;
  canResize: (width: number, depth: number) => boolean;
  onChange: (bin: Bin) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const BinDetails: React.FC<BinDetailsProps> = ({
  bin,
  issue,
  step,
  maxHeight,
  useMm,
  canResize,
  onChange,
  onDuplicate,
  onDelete,
  onClose,
}) => {
  const titleId = useId();
  const outer = binOuterSize(bin);
  const wider = unitMath.add(bin.width, step);
  const narrower = unitMath.subtract(bin.width, step);
  const deeper = unitMath.add(bin.depth, step);
  const shallower = unitMath.subtract(bin.depth, step);

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-lg border bg-muted/50 px-3 pb-4 pt-3 duration-200 ease-out animate-in fade-in-0 slide-in-from-top-1 motion-reduce:slide-in-from-top-0 sm:px-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h4 id={titleId} className="text-[13px] font-semibold tabular-nums">
          Bin {binSizeLabel(bin)} · {bin.height}u
        </h4>
        <button
          type="button"
          onClick={onClose}
          aria-label="Done with this bin"
          title="Done"
          className="-mr-1 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11"
        >
          <X className="size-4" />
        </button>
      </div>
      {issue ? (
        <p className="mt-1 text-[13px] text-destructive">{ISSUE_TEXT[issue]}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
        <Stepper
          label="Width"
          value={formatUnits(bin.width)}
          canDecrease={narrower >= step && canResize(narrower, bin.depth)}
          canIncrease={canResize(wider, bin.depth)}
          onDecrease={() => onChange({ ...bin, width: narrower })}
          onIncrease={() => onChange({ ...bin, width: wider })}
          decreaseLabel="Narrower"
          increaseLabel="Wider"
        />
        <Stepper
          label="Depth"
          value={formatUnits(bin.depth)}
          canDecrease={shallower >= step && canResize(bin.width, shallower)}
          canIncrease={canResize(bin.width, deeper)}
          onDecrease={() => onChange({ ...bin, depth: shallower })}
          onIncrease={() => onChange({ ...bin, depth: deeper })}
          decreaseLabel="Shallower"
          increaseLabel="Deeper"
        />
        <Stepper
          label="Height"
          value={`${bin.height}u`}
          canDecrease={bin.height > MIN_BIN_HEIGHT}
          canIncrease={bin.height < maxHeight}
          onDecrease={() => onChange({ ...bin, height: unitMath.subtract(bin.height, 1) })}
          onIncrease={() => onChange({ ...bin, height: unitMath.add(bin.height, 1) })}
          decreaseLabel="Lower"
          increaseLabel="Taller"
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground tabular-nums">
        {formatSize(outer.width, outer.depth, useMm)} · {formatLength(outer.height, useMm)} tall
        with the stacking lip
      </p>
      <div className="mt-3">
        <BinContentsInput
          value={bin.label}
          inputId={`bin-contents-${bin.id}`}
          hint="Printed on this bin's label."
          onCommit={(label) => onChange({ ...bin, label })}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
          <Copy />
          Duplicate
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </section>
  );
};

export default BinDetails;
