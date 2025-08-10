import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useCustomPrinter } from "@/hooks/useCustomPrinter";

const CustomPrinterDialog = ({ open, onOpenChange, onConfirm, useMm }) => {
  const {
    customDimensions,
    inputValues,
    errors,
    handleInputChange,
    validateAll,
    resetToDefault,
  } = useCustomPrinter(useMm);

  const handleConfirm = () => {
    if (validateAll()) {
      onConfirm(customDimensions);
      onOpenChange(false);
    }
  };

  const unit = useMm ? 'mm' : 'inches';
  const unitSymbol = useMm ? 'mm' : '"';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Custom Printer Dimensions</DialogTitle>
          <DialogDescription>
            Enter your 3D printer&apos;s build volume in {unit}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* X Dimension */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="x-dimension" className="text-right">
              X ({unitSymbol})
            </Label>
            <div className="col-span-3">
              <Input
                id="x-dimension"
                type="number"
                step={useMm ? "1" : "0.1"}
                min="0"
                value={inputValues.x}
                onChange={(e) => handleInputChange('x', e.target.value)}
                className={errors.x ? "border-red-500" : ""}
              />
              {errors.x && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.x}</span>
                </div>
              )}
            </div>
          </div>

          {/* Y Dimension */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="y-dimension" className="text-right">
              Y ({unitSymbol})
            </Label>
            <div className="col-span-3">
              <Input
                id="y-dimension"
                type="number"
                step={useMm ? "1" : "0.1"}
                min="0"
                value={inputValues.y}
                onChange={(e) => handleInputChange('y', e.target.value)}
                className={errors.y ? "border-red-500" : ""}
              />
              {errors.y && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.y}</span>
                </div>
              )}
            </div>
          </div>

          {/* Z Dimension */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="z-dimension" className="text-right">
              Z ({unitSymbol})
            </Label>
            <div className="col-span-3">
              <Input
                id="z-dimension"
                type="number"
                step={useMm ? "1" : "0.1"}
                min="0"
                value={inputValues.z}
                onChange={(e) => handleInputChange('z', e.target.value)}
                className={errors.z ? "border-red-500" : ""}
              />
              {errors.z && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.z}</span>
                </div>
              )}
            </div>
          </div>

          {/* Visual Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Preview:</div>
            <div className="flex items-center justify-center">
              <div 
                className="border-2 border-gray-300 bg-white"
                style={{
                  width: Math.min(200, Math.max(50, customDimensions.x / 2)),
                  height: Math.min(200, Math.max(50, customDimensions.y / 2)),
                  position: 'relative',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                  {inputValues.x} × {inputValues.y} × {inputValues.z} {unitSymbol}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetToDefault}>
            Reset to Default
          </Button>
          <Button onClick={handleConfirm}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPrinterDialog;