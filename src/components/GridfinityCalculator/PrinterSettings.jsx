import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { printerSizes } from "../../lib/utils";

const PrinterSettings = ({ selectedPrinter, setSelectedPrinter }) => {
  const handlePrinterChange = (value) => {
    setSelectedPrinter(value);
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
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PrinterSettings;
