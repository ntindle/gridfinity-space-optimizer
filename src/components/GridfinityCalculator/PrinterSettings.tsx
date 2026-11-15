import React, { useRef, useState } from "react";
import { Check, ChevronsUpDown, SlidersHorizontal } from "lucide-react";
import { cn, printerSizes } from "@/lib/utils";
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
import { unitMath } from "@/services/unitMath";
import { FULL_GRID_SIZE, HALF_GRID_SIZE } from "@/utils/gridfinityUtils";
import { formatSize } from "@/utils/format";
import type { PrinterSize } from "@/types";
import CustomPrinterDialog from "./CustomPrinterDialog";

const CUSTOM_PRINTER = "Custom Printer";

interface PrinterSettingsProps {
  selectedPrinter: string;
  setSelectedPrinter: (printer: string) => void;
  printerSize: PrinterSize;
  setPrinterSize: (size: PrinterSize) => void;
  customPrinterSize?: PrinterSize;
  useMm: boolean;
  useHalfSize?: boolean;
}

const largestPiece = (printerSize: PrinterSize, useHalfSize = false) => {
  const gridSize = useHalfSize ? HALF_GRID_SIZE : FULL_GRID_SIZE;
  const { left = 0, right = 0, front = 0, back = 0 } = printerSize.exclusionZone ?? {};
  const usableX = unitMath.subtract(printerSize.x, unitMath.add(left, right));
  const usableY = unitMath.subtract(printerSize.y, unitMath.add(front, back));
  return {
    x: unitMath.max(0, unitMath.floor(unitMath.divide(usableX, gridSize))),
    y: unitMath.max(0, unitMath.floor(unitMath.divide(usableY, gridSize))),
  };
};

const PrinterSettings: React.FC<PrinterSettingsProps> = ({
  selectedPrinter,
  setSelectedPrinter,
  printerSize,
  setPrinterSize,
  customPrinterSize,
  useMm,
  useHalfSize = false,
}) => {
  const [open, setOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const comboboxRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const openCustomDialog = (from: HTMLButtonElement | null) => {
    returnFocusRef.current = from;
    setCustomDialogOpen(true);
  };

  const printers = [
    ...Object.keys(printerSizes)
      .sort((a, b) => a.localeCompare(b))
      .map((printer) => ({
        value: printer,
        label: printer,
        size: printerSizes[printer],
      })),
    { value: "custom", label: CUSTOM_PRINTER, size: null },
  ];

  const handleSelect = (value: string) => {
    if (value === "custom") {
      openCustomDialog(comboboxRef.current);
    } else {
      setSelectedPrinter(value);
    }
    setOpen(false);
  };

  const handleCustomConfirm = (customDimensions: PrinterSize) => {
    setSelectedPrinter(CUSTOM_PRINTER);
    setPrinterSize(customDimensions);
  };

  const piece = printerSize ? largestPiece(printerSize, useHalfSize) : null;
  const hasExclusions = Object.values(printerSize?.exclusionZone ?? {}).some(
    (value) => Boolean(value)
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={comboboxRef}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={`Printer: ${selectedPrinter || "none selected"}`}
              className="min-w-0 flex-1 justify-between px-3 font-normal"
            >
              <span className="truncate">
                {selectedPrinter || "Select printer…"}
              </span>
              <ChevronsUpDown className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) min-w-64 p-0"
          >
            <Command>
              <CommandInput placeholder="Search printers…" />
              <CommandList>
                <CommandEmpty>No printer found.</CommandEmpty>
                <CommandGroup>
                  {printers.map((printer) => (
                    <CommandItem
                      key={printer.value}
                      value={printer.label}
                      keywords={printer.size ? undefined : ["custom", "own", "other"]}
                      onSelect={() => handleSelect(printer.value)}
                    >
                      <Check
                        className={cn(
                          "text-brand",
                          selectedPrinter === printer.label
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {printer.label}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {printer.size
                          ? formatSize(printer.size.x, printer.size.y, useMm)
                          : "Your own size"}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedPrinter === CUSTOM_PRINTER && (
          <Button
            variant="outline"
            size="icon"
            onClick={(event) => openCustomDialog(event.currentTarget)}
            aria-label="Edit custom printer size"
            title="Edit custom printer size"
          >
            <SlidersHorizontal />
          </Button>
        )}
      </div>

      {printerSize && piece && (
        <p className="text-[13px] text-muted-foreground tabular-nums">
          {formatSize(printerSize.x, printerSize.y, useMm)} bed
          {hasExclusions ? " minus exclusion zones" : ""} · pieces up to{" "}
          <span className="font-medium text-foreground">
            {piece.x} × {piece.y}
          </span>
        </p>
      )}

      <CustomPrinterDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onConfirm={handleCustomConfirm}
        useMm={useMm}
        initialDimensions={customPrinterSize ?? printerSize}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          (returnFocusRef.current ?? comboboxRef.current)?.focus();
        }}
      />
    </div>
  );
};

export default PrinterSettings;
