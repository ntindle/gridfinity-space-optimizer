import { useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { parseDecimal } from "@/utils/format";
import { unitMath } from "@/services/unitMath";
import {
  DEFAULT_ESTIMATE_SETTINGS,
  ESTIMATE_MATERIALS,
  MAX_EFFECTIVE_FLOW_MM3_PER_S,
  MAX_FILAMENT_PRICE_USD_PER_KG,
  MIN_EFFECTIVE_FLOW_MM3_PER_S,
  MIN_FILAMENT_PRICE_USD_PER_KG,
  type EstimateMaterial,
  type EstimateSettings as EstimateSettingsValues,
} from "@/utils/partVolumes";

interface EstimateSettingsProps {
  settings: EstimateSettingsValues;
  onChange: (settings: EstimateSettingsValues) => void;
}

const EstimateSettings = ({ settings, onChange }: EstimateSettingsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Estimate settings"
          title="Estimate settings"
        >
          <SlidersHorizontal />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="space-y-4 max-md:[&_input]:h-11">
          <p className="text-sm font-medium">Estimate settings</p>
          <div className="space-y-1.5">
            <span className="text-[13px] font-medium text-muted-foreground">
              Material
            </span>
            <SegmentedControl
              aria-label="Filament material"
              value={settings.material}
              onValueChange={(material: EstimateMaterial) =>
                onChange({ ...settings, material })
              }
              options={ESTIMATE_MATERIALS.map((material) => ({
                value: material,
                label: material,
              }))}
            />
          </div>
          <NumberField
            id="estimate-price"
            label="Filament price"
            unit="$/kg"
            unitName="dollars per kilogram"
            value={settings.priceUsdPerKg}
            min={MIN_FILAMENT_PRICE_USD_PER_KG}
            max={MAX_FILAMENT_PRICE_USD_PER_KG}
            onCommit={(priceUsdPerKg) => onChange({ ...settings, priceUsdPerKg })}
          />
          <NumberField
            id="estimate-flow"
            label="Print speed"
            unit="mm³/s"
            unitName="cubic millimetres per second"
            value={settings.flowMm3PerS}
            min={MIN_EFFECTIVE_FLOW_MM3_PER_S}
            max={MAX_EFFECTIVE_FLOW_MM3_PER_S}
            onCommit={(flowMm3PerS) => onChange({ ...settings, flowMm3PerS })}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                settings.material === DEFAULT_ESTIMATE_SETTINGS.material &&
                settings.priceUsdPerKg === DEFAULT_ESTIMATE_SETTINGS.priceUsdPerKg &&
                settings.flowMm3PerS === DEFAULT_ESTIMATE_SETTINGS.flowMm3PerS
              }
              onClick={() => onChange(DEFAULT_ESTIMATE_SETTINGS)}
            >
              Reset to defaults
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  unitName: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}

const NumberField = ({ id, label, unit, unitName, value, min, max, onCommit }: NumberFieldProps) => {
  const errorId = useId();
  const [local, setLocal] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(String(value));
    setError(null);
  }

  const commit = (text: string) => {
    const parsed = parseDecimal(text);
    if (text.trim() === "" || isNaN(parsed)) {
      setError("Enter a number");
      setLocal(String(value));
      return;
    }
    setError(null);
    onCommit(unitMath.max(min, unitMath.min(parsed, max)));
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-muted-foreground">
        {label} <span className="sr-only">({unitName})</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={local}
          onChange={(e) => {
            setLocal(e.target.value);
            if (error) setError(null);
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
          }}
          onFocus={(e) => e.target.select()}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="pr-16 tabular-nums"
          placeholder={String(value)}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
        >
          {unit}
        </span>
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default EstimateSettings;
