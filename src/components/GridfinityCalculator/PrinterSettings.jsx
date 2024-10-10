import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { printerSizes } from "../../lib/utils";

const PrinterSettings = ({ selectedPrinter, setSelectedPrinter, customPrinterSize, setCustomPrinterSize }) => {
  const handlePrinterChange = (value) => {
    setSelectedPrinter(value);
  };

  const handleCustomSizeChange = (axis, value) => {
    setCustomPrinterSize(prev => ({ ...prev, [axis]: parseInt(value) || 0 }));
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">Printer Settings</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="printerModel">Printer Model</Label>
          <Select onValueChange={handlePrinterChange} value={selectedPrinter}>
            <SelectTrigger id="printerModel" className="w-full">
              <SelectValue placeholder="Select a printer" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(printerSizes).map((printer) => (
                <SelectItem key={printer} value={printer}>
                  {printer}
                </SelectItem>
              ))}
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedPrinter === "Custom" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customWidth">Custom Width (mm)</Label>
              <Input
                id="customWidth"
                type="number"
                value={customPrinterSize.x}
                onChange={(e) => handleCustomSizeChange("x", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customHeight">Custom Height (mm)</Label>
              <Input
                id="customHeight"
                type="number"
                value={customPrinterSize.y}
                onChange={(e) => handleCustomSizeChange("y", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrinterSettings;
