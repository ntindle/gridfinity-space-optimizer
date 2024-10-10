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

const PrinterSettings = ({ selectedPrinter, setSelectedPrinter }) => {
  const [open, setOpen] = React.useState(false);

  const printers = Object.keys(printerSizes).map((printer) => ({
    value: printer,
    label: printer,
  }));

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
                id="printerModel"
              >
                {selectedPrinter
                  ? printers.find(
                      (printer) => printer.value === selectedPrinter
                    )?.label
                  : "Select a printer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search printer..." />
                <CommandList>
                  <CommandEmpty>No printer found.</CommandEmpty>
                  <CommandGroup>
                    {printers.map((printer) => (
                      <CommandItem
                        key={printer.value}
                        value={printer.value}
                        onSelect={(currentValue) => {
                          if (currentValue !== selectedPrinter) {
                            setSelectedPrinter(currentValue);
                          }
                          setOpen(false);
                        }}
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
      </div>
    </div>
  );
};

export default PrinterSettings;
