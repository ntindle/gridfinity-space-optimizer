import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { printerSizes } from "../../utils/gridfinityUtils";

const PrinterSettings = ({ printerSize, setPrinterSize }) => {
  const [selectedPrinter, setSelectedPrinter] = useState("Bambu Lab A1");
  const [customSize, setCustomSize] = useState({ x: 0, y: 0 });

  const handlePrinterChange = (value) => {
    setSelectedPrinter(value);
    if (value === "Custom") {
      setPrinterSize(customSize);
    } else {
      setPrinterSize(printerSizes[value]);
    }
  };

  const handleCustomSizeChange = (axis, value) => {
    const newCustomSize = { ...customSize, [axis]: parseInt(value) };
    setCustomSize(newCustomSize);
    if (selectedPrinter === "Custom") {
      setPrinterSize(newCustomSize);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Printer Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="printerModel">Printer Model</Label>
            <Select onValueChange={handlePrinterChange} value={selectedPrinter}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a printer" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(printerSizes).map((printer) => (
                  <SelectItem key={printer} value={printer}>
                    {printer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPrinter === "Custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customWidth">Custom Width (mm)</Label>
                <Input
                  id="customWidth"
                  type="number"
                  value={customSize.x}
                  onChange={(e) => handleCustomSizeChange("x", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customHeight">Custom Height (mm)</Label>
                <Input
                  id="customHeight"
                  type="number"
                  value={customSize.y}
                  onChange={(e) => handleCustomSizeChange("y", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrinterSettings;