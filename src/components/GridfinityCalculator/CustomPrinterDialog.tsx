import { useState } from "react"
import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCustomPrinter } from "@/hooks/useCustomPrinter"
import type { PrinterSize } from "@/types"

interface CustomPrinterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: (dimensions: PrinterSize) => void
  useMm: boolean
  setUseMm?: (useMm: boolean) => void
  initialDimensions?: PrinterSize
  onCloseAutoFocus?: (event: Event) => void
}

const AXIS_HINTS: Record<"x" | "y" | "z", string> = {
  x: "Width",
  y: "Depth",
  z: "Height",
}

interface UnitFieldProps {
  id: string
  label: React.ReactNode
  unit: string
  value: string
  error?: string | null
  onChange: (value: string) => void
  onBlur?: () => void
}

const UnitField = ({ id, label, unit, value, error, onChange, onBlur }: UnitFieldProps) => (
  <div className="min-w-0 space-y-1.5">
    <Label htmlFor={id} className="text-[13px] font-medium text-muted-foreground">
      {label}
    </Label>
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="pr-10 tabular-nums"
        placeholder="0"
        onFocus={(e) => e.target.select()}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
      >
        {unit}
      </span>
    </div>
    {error && (
      <p id={`${id}-error`} className="text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
)

const CustomPrinterDialog: React.FC<CustomPrinterDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  useMm,
  initialDimensions,
  onCloseAutoFocus,
}) => {
  const {
    customDimensions,
    inputValues,
    errors,
    exclusionZoneInputs,
    exclusionZoneErrors,
    handleInputChange,
    handleExclusionZoneChange,
    validateSingleDimension,
    validateAll,
    resetToDefault,
    loadDimensions,
  } = useCustomPrinter(useMm)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && initialDimensions) {
      loadDimensions?.(initialDimensions)
    }
  }

  const unit = useMm ? "mm" : "in"

  const handleSave = () => {
    if (validateAll()) {
      if (onConfirm) {
        onConfirm(customDimensions)
      }
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[30rem]" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Custom printer</DialogTitle>
          <DialogDescription>
            Enter your print bed size. Exclusion zones shrink the usable area on each side.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
        >
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Build volume</legend>
            <div className="grid grid-cols-3 gap-3">
              {(["x", "y", "z"] as const).map((axis) => (
                <UnitField
                  key={axis}
                  id={`custom-${axis}`}
                  label={
                    <>
                      {axis.toUpperCase()}{" "}
                      <span className="sr-only">({unit})</span>{" "}
                      <span className="font-normal">· {AXIS_HINTS[axis]}</span>
                    </>
                  }
                  unit={unit}
                  value={inputValues?.[axis] || ""}
                  error={errors?.[axis]}
                  onChange={(value) => handleInputChange(axis, value)}
                  onBlur={() => validateSingleDimension(axis)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">
              Exclusion zones <span className="font-normal text-muted-foreground">(optional)</span>
            </legend>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Areas of the bed you can&apos;t print on, such as clips or a purge area. Each value
              trims that edge of the bed.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["front", "back", "left", "right"] as const).map((zone) => (
                <UnitField
                  key={zone}
                  id={`exclusion-${zone}`}
                  label={
                    <>
                      {zone.charAt(0).toUpperCase() + zone.slice(1)}{" "}
                      <span className="sr-only">({unit})</span>
                    </>
                  }
                  unit={unit}
                  value={exclusionZoneInputs?.[zone] || ""}
                  error={exclusionZoneErrors?.[zone]}
                  onChange={(value) => handleExclusionZoneChange(zone, value)}
                />
              ))}
            </div>
          </fieldset>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="ghost" onClick={resetToDefault} className="sm:-ml-2">
              Reset to default
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CustomPrinterDialog
