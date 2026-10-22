import React, { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { unitMath } from "@/services/unitMath";
import { binOuterSize, binSizeLabel } from "@/utils/bins";
import { formatSize, pluralize } from "@/utils/format";
import { usePersistedState } from "@/hooks/usePersistedState";
import type { Bin } from "@/types";

interface BinLabelsProps {
  bins: Bin[];
  useMm: boolean;
  numDrawers: number;
}

type LabelStyle = "paper" | "cullenect" | "pred-slot";

interface LabelStyleSpec {
  id: LabelStyle;
  name: string;
  description: string;
  printClass: string;
}

const PRINT_BODY_CLASS = "print-bin-labels";
const LANDSCAPE_STYLE_ID = "bin-label-landscape";
const PORTRAIT_PRINT_WIDTH_MM = 180;
const MAX_LABELS = 2000;

const LABEL_STYLES: LabelStyleSpec[] = [
  {
    id: "paper",
    name: "Paper card",
    description: "3 × 1.25 in cut-out cards, one per bin.",
    printClass: "print-bin-labels-paper",
  },
  {
    id: "cullenect",
    name: "Cullenect 36.4 × 11 mm",
    description: "Cut to size for Cullenect snap-fit label frames.",
    printClass: "print-bin-labels-cullenect",
  },
  {
    id: "pred-slot",
    name: "Bin-width slot · 25 mm",
    description: "Full bin-width strip for front-slot label holders.",
    printClass: "print-bin-labels-pred-slot",
  },
];

const clearPrintState = () => {
  document.body.classList.remove(PRINT_BODY_CLASS);
  LABEL_STYLES.forEach((candidate) => document.body.classList.remove(candidate.printClass));
  document.getElementById(LANDSCAPE_STYLE_ID)?.remove();
};

const BinLabels: React.FC<BinLabelsProps> = ({ bins, useMm, numDrawers }) => {
  const [storedStyle, setStyle] = usePersistedState<LabelStyle>("gridfinity_labelStyle", "paper");

  useEffect(() => {
    window.addEventListener("afterprint", clearPrintState);
    return () => {
      window.removeEventListener("afterprint", clearPrintState);
      clearPrintState();
    };
  }, []);

  const spec = LABEL_STYLES.find((candidate) => candidate.id === storedStyle) ?? LABEL_STYLES[0];
  const style = spec.id;
  const totalLabels = unitMath.multiply(bins.length, numDrawers);

  if (bins.length === 0) {
    return (
      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Bin labels</h2>
        <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">
          Add bins to the drawer and a label for each one shows up here, ready to print.
        </p>
      </Card>
    );
  }

  const widestLabelMm = bins.reduce(
    (widest, bin) => unitMath.max(widest, binOuterSize(bin).width),
    0
  );

  const handlePrint = () => {
    clearPrintState();
    document.body.classList.add(PRINT_BODY_CLASS, spec.printClass);
    if (style === "pred-slot" && widestLabelMm > PORTRAIT_PRINT_WIDTH_MM) {
      const landscape = document.createElement("style");
      landscape.id = LANDSCAPE_STYLE_ID;
      landscape.textContent = "@page { size: landscape; }";
      document.head.appendChild(landscape);
    }
    if (typeof window.print === "function") {
      window.print();
    }
  };

  const cards: React.ReactNode[] = [];
  for (let copy = 0; copy < numDrawers && cards.length < MAX_LABELS; copy += 1) {
    for (const bin of bins) {
      if (cards.length >= MAX_LABELS) break;
      const key = `${bin.id}-${copy}`;
      const size = binSizeLabel(bin);
      const kind = `${size} · ${bin.height}u`;
      const outer = binOuterSize(bin);
      const physical = formatSize(outer.width, outer.depth, useMm);
      if (style === "cullenect") {
        cards.push(
          <div
            key={key}
            className="bin-label-card flex h-14 w-48 flex-col justify-center overflow-hidden border border-black bg-white px-2 text-black"
          >
            <div className="truncate text-base font-bold leading-none">{bin.label || size}</div>
            <div className="truncate text-[10px] leading-tight">
              {bin.label ? `Bin ${kind}` : `${bin.height}u bin`}
            </div>
          </div>
        );
      } else if (style === "pred-slot") {
        cards.push(
          <div
            key={key}
            style={{ "--label-w": `${outer.width}mm` } as React.CSSProperties}
            className="bin-label-card @container flex h-12 w-(--label-w) max-w-full items-center justify-between gap-2 border border-black bg-white px-2 text-black"
          >
            <div className="min-w-0 truncate text-base font-bold leading-none">{bin.label || size}</div>
            <div className="hidden shrink-0 text-xs @min-[9rem]:block">{kind}</div>
          </div>
        );
      } else {
        cards.push(
          <div
            key={key}
            className="bin-label-card flex min-h-20 w-40 flex-col justify-center border border-black bg-white p-2 text-black"
          >
            <div className="break-words text-xl font-bold leading-tight">{bin.label || size}</div>
            <div className="mt-1 text-sm">{bin.label ? `Bin ${kind}` : `${bin.height}u bin`}</div>
            <div className="text-xs">{physical}</div>
          </div>
        );
      }
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-[65ch]">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Bin labels</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pluralize(totalLabels, "label")}, one for every bin. Select a bin in the drawing and
            name what goes in it, and the name prints here. Print the sheet, cut the labels out, and
            stick one on each bin.
          </p>
        </div>
        <Button type="button" onClick={handlePrint}>
          <Printer />
          Print labels
        </Button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3" role="group" aria-label="Label style">
        {LABEL_STYLES.map((candidate) => {
          const selected = style === candidate.id;
          return (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setStyle(candidate.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                selected
                  ? "border-brand bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "bg-card hover:bg-accent/60"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-150",
                  selected ? "border-brand bg-brand" : "border-input bg-card"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-brand-foreground transition-[opacity,scale] duration-150 ease-out",
                    selected ? "opacity-100" : "scale-50 opacity-0"
                  )}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{candidate.name}</span>{" "}
                <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                  {candidate.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {totalLabels > MAX_LABELS ? (
        <p className="mt-5 rounded-md bg-muted px-3 py-2 text-[13px] text-muted-foreground">
          The sheet shows the first {MAX_LABELS.toLocaleString("en-US")} of{" "}
          {totalLabels.toLocaleString("en-US")} labels.
        </p>
      ) : null}

      <div className="mt-5 max-h-[28rem] overflow-y-auto overscroll-contain rounded-lg bg-white p-4 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] [color-scheme:light] print:max-h-none print:overflow-visible">
        <div className="bin-label-sheet flex flex-wrap gap-2" aria-hidden="true">
          {cards}
        </div>
      </div>
      <p className="sr-only">
        {pluralize(unitMath.min(totalLabels, MAX_LABELS), "label")} on the print sheet, one per bin.
      </p>
    </Card>
  );
};

export default BinLabels;
