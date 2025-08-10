import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

const PrinterSettings = ({ selectedPrinter, setSelectedPrinter, printerSize, useMm }) => {
  const [open, setOpen] = React.useState(false);

  const printers = [
    ...Object.keys(printerSizes).map((printer) => ({
      value: printer,
      label: printer,
    })),
    { value: "custom", label: "Custom" },
  ];

  const handleSelect = (value) => {
    setSelectedPrinter(value);
    setOpen(false);
  };

  // Format dimensions based on unit preference
  const formatDimension = (mm) => {
    if (useMm) {
      return `${mm}mm`;
    } else {
      const inches = (mm / 25.4).toFixed(1);
      return `${inches}"`;
    }
  };

  // Get formatted bed size string
  const getBedSizeDisplay = () => {
    if (!printerSize) return '';
    
    const x = formatDimension(printerSize.x);
    const y = formatDimension(printerSize.y);
    const z = formatDimension(printerSize.z || printerSize.x); // Some printers might not have z defined
    
    return `${x} × ${y} × ${z}`;
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">Printer Settings</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="printerModel">Printer Model</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
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
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((printer) => (
                        <CommandItem
                          key={printer.value}
                          value={printer.value}
                          onSelect={() => handleSelect(printer.value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPrinter === printer.value
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
        </div>
        
        {/* Display printer bed size */}
        {printerSize && (
          <div className="text-sm text-muted-foreground">
            Build Volume: {getBedSizeDisplay()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrinterSettings;