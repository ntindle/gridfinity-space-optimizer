"use client"

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
import { Switch } from "@/components/ui/switch"
import { useCustomPrinter } from "@/hooks/useCustomPrinter"
import type { PrinterSize } from "@/types"

interface CustomPrinterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: (dimensions: PrinterSize) => void
  useMm: boolean
  setUseMm?: (useMm: boolean) => void
}

const CustomPrinterDialog: React.FC<CustomPrinterDialogProps> = ({ open, onOpenChange, onConfirm, useMm }) => {
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
  } = useCustomPrinter(useMm)

  const handleSave = () => {
    if (validateAll()) {
      if (onConfirm) {
        onConfirm(customDimensions)
      }
      onOpenChange(false)
    }
  }

  const handleInputBlur = (axis: "x" | "y" | "z") => {
    validateSingleDimension(axis)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Custom Printer Settings</DialogTitle>
          <DialogDescription>Configure your custom 3D printer dimensions and exclusion zones.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">


          {/* Printer Dimensions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Printer Dimensions</h4>
            <div className="grid grid-cols-3 gap-4">
              {(["x", "y", "z"] as const).map((axis) => (
                <div key={axis} className="space-y-2">
                  <Label htmlFor={`custom-${axis}`}>
                    {axis.toUpperCase()} ({useMm ? "mm" : "in"})
                  </Label>
                  <Input
                    id={`custom-${axis}`}
                    type="text"
                    inputMode="decimal"
                    value={inputValues?.[axis] || ""}
                    onChange={(e) => handleInputChange(axis, e.target.value)}
                    onBlur={() => handleInputBlur(axis)}
                    className={errors?.[axis] ? "border-red-500" : ""}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  />
                  {errors?.[axis] && <p className="text-sm text-red-500">{errors[axis]}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Exclusion Zones */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Exclusion Zones (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              {(["front", "back", "left", "right"] as const).map((zone) => (
                <div key={zone} className="space-y-2">
                  <Label htmlFor={`exclusion-${zone}`}>
                    {zone.charAt(0).toUpperCase() + zone.slice(1)} ({useMm ? "mm" : "in"})
                  </Label>
                  <Input
                    id={`exclusion-${zone}`}
                    type="text"
                    inputMode="decimal"
                    value={exclusionZoneInputs?.[zone] || ""}
                    onChange={(e) => handleExclusionZoneChange(zone, e.target.value)}
                    className={exclusionZoneErrors?.[zone] ? "border-red-500" : ""}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  />
                  {exclusionZoneErrors?.[zone] && <p className="text-sm text-red-500">{exclusionZoneErrors[zone]}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={resetToDefault}>
            Reset to Default
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CustomPrinterDialog
