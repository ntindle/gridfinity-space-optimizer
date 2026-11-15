import React from "react";
import { Minus, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { unitMath } from "@/services/unitMath";

const MIN_DRAWERS = 1;
const MAX_DRAWERS = 100;

interface DrawerOptionsProps {
  numDrawers: number;
  setNumDrawers: (count: number) => void;
}

const stepButton =
  "grid size-8 shrink-0 place-items-center text-muted-foreground transition-[color,background-color,scale] duration-150 ease-out hover:bg-accent hover:text-foreground active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 focus-visible:z-10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11 motion-reduce:active:scale-100";

const DrawerOptions: React.FC<DrawerOptionsProps> = ({ numDrawers, setNumDrawers }) => {
  const [localValue, setLocalValue] = React.useState(String(numDrawers || 1));
  const [prevNumDrawers, setPrevNumDrawers] = React.useState(numDrawers);

  if (numDrawers !== prevNumDrawers) {
    setPrevNumDrawers(numDrawers);
    setLocalValue(String(numDrawers || 1));
  }

  const commit = (count: number) => {
    const clamped = unitMath.min(MAX_DRAWERS, unitMath.max(MIN_DRAWERS, count));
    setNumDrawers(clamped);
    setLocalValue(String(clamped));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    const parsedValue = parseInt(value, 10);
    if (/^\d+$/.test(value.trim()) && parsedValue >= MIN_DRAWERS && parsedValue <= MAX_DRAWERS) {
      setNumDrawers(parsedValue);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed < MIN_DRAWERS) {
      setLocalValue(String(numDrawers || 1));
    } else {
      commit(parsed);
    }
  };

  const current = numDrawers || 1;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor="numDrawers" className="text-sm font-medium">
          Identical drawers
        </Label>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
          Multiplies every part and label.
        </p>
      </div>
      <div className="flex shrink-0 items-center overflow-hidden rounded-md border border-input bg-card shadow-xs">
        <button
          type="button"
          className={stepButton}
          aria-label="One fewer drawer"
          disabled={current <= MIN_DRAWERS}
          onClick={() => commit(unitMath.subtract(current, 1))}
        >
          <Minus className="size-3.5" />
        </button>
        <input
          id="numDrawers"
          type="text"
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleBlur();
          }}
          onFocus={(e) => e.target.select()}
          className="h-8 w-10 border-x border-input bg-transparent text-center text-base tabular-nums outline-hidden focus-visible:bg-brand-soft pointer-coarse:h-11 md:pointer-fine:text-sm"
          placeholder="1"
        />
        <button
          type="button"
          className={stepButton}
          aria-label="One more drawer"
          disabled={current >= MAX_DRAWERS}
          onClick={() => commit(unitMath.add(current, 1))}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DrawerOptions;
