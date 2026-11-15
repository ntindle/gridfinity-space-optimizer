import React from "react";
import { Minus, Plus } from "lucide-react";

interface StepperProps {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
  decreaseLabel: string;
  increaseLabel: string;
}

const stepButton =
  "grid size-8 shrink-0 place-items-center text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-accent hover:text-foreground active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 focus-visible:z-10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11 motion-reduce:active:scale-100";

const Stepper: React.FC<StepperProps> = ({
  label,
  value,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
  decreaseLabel,
  increaseLabel,
}) => (
  <div role="group" aria-label={label} className="min-w-0">
    <span aria-hidden="true" className="block text-[13px] font-medium text-muted-foreground">
      {label}
    </span>
    <div className="mt-1.5 flex w-fit items-center overflow-hidden rounded-md border border-input bg-card shadow-xs">
      <button
        type="button"
        className={stepButton}
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={onDecrease}
      >
        <Minus className="size-3.5" />
      </button>
      <span
        aria-live="polite"
        className="grid h-8 min-w-11 place-items-center border-x border-input px-1.5 text-sm font-medium tabular-nums pointer-coarse:h-11"
      >
        {value}
      </span>
      <button
        type="button"
        className={stepButton}
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={onIncrease}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  </div>
);

export default Stepper;
