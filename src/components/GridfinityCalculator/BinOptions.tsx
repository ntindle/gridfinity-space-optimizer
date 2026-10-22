import React, { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface BinOptionsProps {
  useHalfSize: boolean;
  setUseHalfSize: (value: boolean) => void;
  preferHalfSize: boolean;
  setPreferHalfSize: (value: boolean) => void;
  preferUniformBaseplates: boolean;
  setPreferUniformBaseplates: (value: boolean) => void;
}

const BinOptions: React.FC<BinOptionsProps> = ({
  useHalfSize,
  setUseHalfSize,
  preferHalfSize,
  setPreferHalfSize,
  preferUniformBaseplates,
  setPreferUniformBaseplates,
}) => {
  return (
    <div className="-my-1 divide-y divide-border/70">
      <OptionRow
        id="use-half-size"
        title="Half-size bins only"
        description="Lay out on a 21 × 21 mm grid instead of 42 × 42 mm."
        checked={useHalfSize}
        onCheckedChange={(checked) => {
          setUseHalfSize(checked);
          if (checked) setPreferHalfSize(false);
        }}
      />
      <OptionRow
        id="prefer-half-size"
        title="Fill gaps with half-size bins"
        description="Where a spacer would go, use 21 mm bins that fit."
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
            ? "Not used with half-size bins only."
            : "Prefer fewer different baseplate sizes."
        }
        checked={preferUniformBaseplates && !useHalfSize}
        disabled={useHalfSize}
        onCheckedChange={setPreferUniformBaseplates}
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

const OptionRow: React.FC<OptionRowProps> = ({
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
