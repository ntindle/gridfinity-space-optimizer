import React, { useId } from "react";
import { Switch } from "@/components/ui/switch";
import Stepper from "@/components/Stepper";
import { MAX_DIVIDER_COUNT } from "@/utils/bins";
import { cn } from "@/lib/utils";

interface BinOptionsProps {
  useHalfSize: boolean;
  setUseHalfSize: (value: boolean) => void;
  preferHalfSize: boolean;
  setPreferHalfSize: (value: boolean) => void;
  preferUniformBaseplates: boolean;
  setPreferUniformBaseplates: (value: boolean) => void;
  labelTabs: boolean;
  setLabelTabs: (value: boolean) => void;
  dividerCount: number;
  setDividerCount: (value: number) => void;
  lids: boolean;
  setLids: (value: boolean) => void;
}

const BinOptions: React.FC<BinOptionsProps> = ({
  useHalfSize,
  setUseHalfSize,
  preferHalfSize,
  setPreferHalfSize,
  preferUniformBaseplates,
  setPreferUniformBaseplates,
  labelTabs,
  setLabelTabs,
  dividerCount,
  setDividerCount,
  lids,
  setLids,
}) => {
  return (
    <div className="-my-1 divide-y divide-border/70">
      <OptionRow
        id="use-half-size"
        title="Half-size grid"
        description="Lay out on a 21 × 21 mm grid instead of 42 × 42 mm. Bins get 21 mm feet."
        checked={useHalfSize}
        onCheckedChange={(checked) => {
          setUseHalfSize(checked);
          if (checked) setPreferHalfSize(false);
        }}
      />
      <OptionRow
        id="prefer-half-size"
        title="Fill gaps with half-size baseplates"
        description="Where a spacer would go, use 21 mm baseplate strips that half-size bins fit in."
        checked={preferHalfSize}
        onCheckedChange={(checked) => {
          setPreferHalfSize(checked);
          if (checked) setUseHalfSize(false);
        }}
      />
      <OptionRow
        id="prefer-uniform-baseplates"
        title="Uniform baseplates"
        description={
          useHalfSize
            ? "Not used with a half-size grid."
            : "Prefer fewer different baseplate sizes."
        }
        checked={preferUniformBaseplates && !useHalfSize}
        disabled={useHalfSize}
        onCheckedChange={setPreferUniformBaseplates}
      />
      <OptionRow
        id="label-tabs"
        title="Label tabs on bins"
        description="Printed bins get a raised tab above the stacking lip for a stuck-on label. Another bin cannot stack on top of a tabbed bin."
        checked={labelTabs}
        onCheckedChange={setLabelTabs}
      />
      <div className="relative flex items-start justify-between gap-4 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">Dividers in bins</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every printed bin gets evenly spaced dividers down its long side, from the bin floor up to the top of the bin units, below the stacking lip so bins still stack.
          </p>
        </div>
        <Stepper
          label="Dividers in bins"
          value={String(dividerCount)}
          canDecrease={dividerCount > 0}
          canIncrease={dividerCount < MAX_DIVIDER_COUNT}
          onDecrease={() => setDividerCount(dividerCount - 1)}
          onIncrease={() => setDividerCount(dividerCount + 1)}
          decreaseLabel="Fewer dividers"
          increaseLabel="More dividers"
        />
      </div>
      <OptionRow
        id="lids"
        title="Lids for bins"
        description="Every printed bin gets a flat 3 mm cover lid that sits on the stacking lip. Lids have no snap lip, hinge, or handle."
        checked={lids}
        onCheckedChange={setLids}
      />
    </div>
  );
};

interface OptionRowProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const OptionRow: React.FC<OptionRowProps> = ({
  id,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}) => {
  const descriptionId = useId();
  return (
    <div className="relative flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium after:absolute after:inset-0 after:content-['']",
            disabled ? "text-muted-foreground" : "cursor-pointer"
          )}
        >
          {title}
        </label>
        <p
          id={descriptionId}
          className="mt-0.5 text-[13px] leading-snug text-muted-foreground"
        >
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-describedby={descriptionId}
        className="relative z-10 mt-0.5"
      />
    </div>
  );
};

export default BinOptions;
