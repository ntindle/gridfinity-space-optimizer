import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ClipboardCopy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PieceSwatch from "@/components/PieceSwatch";
import { OptionRow } from "@/components/GridfinityCalculator/BinOptions";
import { unitMath } from "@/services/unitMath";
import { formatSize, pluralize } from "@/utils/format";
import {
  collectPrintParts,
  TEST_FIT_BASEPLATE_KEY,
  testFitParts,
  type PrintPartSummary,
} from "@/utils/printParts";
import { buildPrintListText } from "@/utils/printList";
import { planPlates, usableBed, type Plate } from "@/utils/printPlan";
import type { Bin, LayoutItem, PrinterSize } from "@/types";

interface PrintPlanCardProps {
  layout: LayoutItem[];
  bins: Bin[];
  numDrawers: number;
  useMm: boolean;
  printerName: string;
  printerSize: PrinterSize;
  testFit: boolean;
  onTestFitChange: (value: boolean) => void;
}

const copyViaFallback = (text: string): boolean => {
  if (typeof document.execCommand !== "function") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
};

interface PlateRowProps {
  label: string;
  plate: Plate;
  byKey: Map<string, PrintPartSummary>;
}

const PlateRow: React.FC<PlateRowProps> = ({ label, plate, byKey }) => {
  const plateParts = plate.parts.reduce(
    (sum, item) => unitMath.add(sum, item.count),
    0
  );
  return (
    <li className="flex min-h-14 items-center gap-3 rounded-md border border-border/70 px-3 py-2">
      <span className="w-16 shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">
        {label}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
        {plate.parts.map(({ key, count }) => {
          const part = byKey.get(key);
          if (!part) return null;
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 text-[13px] tabular-nums"
            >
              <PieceSwatch type={part.swatch} />
              {count} × {part.label}
            </span>
          );
        })}
      </span>
      <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
        {pluralize(plateParts, "part")}
        {plate.copies > 1 ? ` · print ${plate.copies} times` : null}
      </span>
    </li>
  );
};

const PrintPlanCard: React.FC<PrintPlanCardProps> = ({
  layout,
  bins,
  numDrawers,
  useMm,
  printerName,
  printerSize,
  testFit,
  onTestFitChange,
}) => {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const { parts } = useMemo(
    () =>
      collectPrintParts({
        layout,
        bins,
        numDrawers,
        printerSize,
      }),
    [layout, bins, numDrawers, printerSize]
  );
  const plates: Plate[] = useMemo(
    () =>
      planPlates(
        parts.map(({ key, width, depth, count }) => ({ key, width, depth, count })),
        printerSize
      ),
    [parts, printerSize]
  );
  const testParts = useMemo(
    () => (testFit ? testFitParts(parts) : []),
    [testFit, parts]
  );
  const testPlate: Plate | null = useMemo(
    () =>
      testParts.length > 0
        ? planPlates(
            testParts.map(({ key, width, depth, count }) => ({
              key,
              width,
              depth,
              count,
            })),
            printerSize
          )[0] ?? null
        : null,
    [testParts, printerSize]
  );
  const testBaseplate = testParts.find((part) => part.key === TEST_FIT_BASEPLATE_KEY);
  const copyParts = useMemo(() => {
    if (!testFit) return parts;
    const merged = new Map(parts.map((part) => [part.key, part]));
    for (const testPart of testParts) {
      const existing = merged.get(testPart.key);
      merged.set(
        testPart.key,
        existing
          ? { ...existing, count: unitMath.add(existing.count, testPart.count) }
          : testPart
      );
    }
    return [...merged.values()];
  }, [testFit, parts, testParts]);
  const byKey = useMemo(
    () =>
      new Map(
        [...parts, ...(testBaseplate ? [testBaseplate] : [])].map((part) => [
          part.key,
          part,
        ])
      ),
    [parts, testBaseplate]
  );
  const bed = usableBed(printerSize);
  const testPartCount = testParts.reduce(
    (sum, part) => unitMath.add(sum, part.count),
    0
  );
  const totalParts = unitMath.add(
    parts.reduce((sum, part) => unitMath.add(sum, part.count), 0),
    testPartCount
  );
  const plateCount = unitMath.add(plates.length, testPlate ? 1 : 0);

  if (parts.length === 0) return null;

  const handleCopy = async () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("idle");
    const text = buildPrintListText(copyParts, { numDrawers, printerName, useMm });
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setStatus("copied");
      } else if (copyViaFallback(text)) {
        setStatus("copied");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus(copyViaFallback(text) ? "copied" : "error");
    }
    resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-[-0.01em]">Print plan</h3>
          <p className="mt-1 text-[13px] tabular-nums text-muted-foreground">
            {pluralize(totalParts, "part")} on {pluralize(plateCount, "plate")} for{" "}
            {pluralize(numDrawers, "drawer")} · {printerName} (
            {formatSize(bed.width, bed.depth, true)})
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {status === "copied" ? (
            <Check />
          ) : status === "error" ? (
            <TriangleAlert />
          ) : (
            <ClipboardCopy />
          )}
          {status === "copied" ? "Copied" : status === "error" ? "Copy failed" : "Copy list"}
        </Button>
      </div>
      <div className="mt-4 rounded-md border border-border/70 px-3">
        <OptionRow
          id="test-fit-first"
          title="Test fit first"
          description="Print one corner (1 × 1 baseplate + edge spacer) before the rest."
          checked={testFit}
          onCheckedChange={onTestFitChange}
        />
      </div>
      <ol className="mt-4 space-y-2">
        {testPlate ? (
          <PlateRow label="Test fit" plate={testPlate} byKey={byKey} />
        ) : null}
        {plates.map((plate, index) => (
          <PlateRow
            key={index}
            label={plates.length > 1 ? `Plate ${unitMath.add(index, 1)}` : "Plate"}
            plate={plate}
            byKey={byKey}
          />
        ))}
      </ol>
    </Card>
  );
};

export default PrintPlanCard;
