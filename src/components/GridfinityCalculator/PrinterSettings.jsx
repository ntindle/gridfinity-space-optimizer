import React, { useState } from "react";
import { Check, ChevronsUpDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { printerSizes } from "../../lib/utils";
import { formatBuildVolume } from "../../services/unitConversion";
import CustomPrinterDialog from "./CustomPrinterDialog";

const PrinterSettings = ({ 
  selectedPrinter, 
  setSelectedPrinter, 
  printerSize, 
  setPrinterSize,
  useMm 
}) => {
  const [open, setOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const printers = [
    ...Object.keys(printerSizes).map((printer) => ({
      value: printer,
      label: printer,
    })),
    { value: "custom", label: "Custom Printer" },
  ];

  const handleSelect = (value) => {
    if (value === "custom") {
      setCustomDialogOpen(true);
    } else {
      setSelectedPrinter(value);
      setPrinterSize(printerSizes[value]);
    }
    setOpen(false);
  };

  const handleCustomConfirm = (customDimensions) => {
    setSelectedPrinter("Custom Printer");
    setPrinterSize(customDimensions);
  };

  // Get formatted bed size string using the service
  const getBedSizeDisplay = () => {
    return formatBuildVolume(printerSize, useMm);
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">Printer Settings</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="printerModel">Printer Model</Label>
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="flex-1 justify-between"
                >
                  {selectedPrinter || "Select printer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search printer..." />
                  <CommandList>
                    <CommandEmpty>No printer found.</CommandEmpty>
                    <CommandGroup>
                      {printers
                        .sort((a, b) => {
                          // Keep "Custom Printer" at the bottom
                          if (a.value === "custom") return 1;
                          if (b.value === "custom") return -1;
                          return a.label.localeCompare(b.label);
                        })
                        .map((printer) => (
                          <CommandItem
                            key={printer.value}
                            value={printer.value}
                            onSelect={() => handleSelect(printer.value)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPrinter === printer.label
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {printer.label}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Custom Settings Button */}
            {selectedPrinter === "Custom Printer" && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCustomDialogOpen(true)}
                title="Edit custom dimensions"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Display printer bed size */}
        {printerSize && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Build Volume: {getBedSizeDisplay()}
            </div>
            
            {/* Visual preview of build volume */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center">
                <div 
                  className="border-2 border-gray-300 bg-white relative"
                  style={{
                    width: Math.min(150, Math.max(40, printerSize.x / 2)),
                    height: Math.min(150, Math.max(40, printerSize.y / 2)),
                  }}
                  title={`Build volume: ${getBedSizeDisplay()}`}
                >
                  <div 
                    className="absolute bottom-1 right-1 border-t-2 border-l-2 border-gray-400"
                    style={{
                      width: '20%',
                      height: Math.min(30, Math.max(10, (printerSize.z || printerSize.x) / 10)),
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                    {useMm ? `${printerSize.x}×${printerSize.y}` : 
                     `${(printerSize.x/25.4).toFixed(1)}×${(printerSize.y/25.4).toFixed(1)}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Printer Dialog */}
      <CustomPrinterDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onConfirm={handleCustomConfirm}
        useMm={useMm}
      />
    </div>
  );
};

export default PrinterSettings;