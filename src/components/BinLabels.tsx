import React, { useEffect, useMemo, useState } from "react";
import { unitMath } from "@/services/unitMath";
import {
  getPreviewPieceDetails,
  groupPreviewPieces,
  previewPieceKey,
} from "@/utils/previewPieceDetails";
import type { LayoutItem } from "@/types/gridfinity";

interface BinLabelsProps {
  layout: LayoutItem[];
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

const styleSpec = (style: LabelStyle): LabelStyleSpec =>
  LABEL_STYLES.find((candidate) => candidate.id === style) ?? LABEL_STYLES[0];

const BinLabels: React.FC<BinLabelsProps> = ({ layout, useMm, numDrawers }) => {
  const [style, setStyle] = useState<LabelStyle>("paper");
  const spec = styleSpec(style);

  const groups = useMemo(
    () =>
      groupPreviewPieces(layout).filter(
        (group) =>
          group.item.type === "baseplate" || group.item.type === "half-size"
      ),
    [layout]
  );

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove(PRINT_BODY_CLASS);
      LABEL_STYLES.forEach((candidate) =>
        document.body.classList.remove(candidate.printClass)
      );
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove(PRINT_BODY_CLASS);
      LABEL_STYLES.forEach((candidate) =>
        document.body.classList.remove(candidate.printClass)
      );
    };
  }, []);

  if (groups.length === 0) {
    return null;
  }

  const handlePrint = () => {
    document.body.classList.add(PRINT_BODY_CLASS, spec.printClass);
    if (typeof window.print === "function") {
      window.print();
    }
  };

  const cards: React.ReactNode[] = [];
  groups.forEach((group) => {
    const details = getPreviewPieceDetails(group.item, layout);
    const total = unitMath.multiply(group.count, numDrawers);
    const physical = useMm
      ? `${details.widthMm} mm × ${details.heightMm} mm`
      : `${details.widthIn}″ × ${details.heightIn}″`;
    for (let index = 0; index < total; index += 1) {
      const key = `${previewPieceKey(group.item)}-${index}`;
      if (style === "cullenect") {
        cards.push(
          <div
            key={key}
            className="bin-label-card flex w-48 h-14 flex-col justify-center overflow-hidden border border-black bg-white px-2 text-black"
          >
            <div className="text-base font-bold leading-none">
              {details.gridLabel}
            </div>
            <div className="truncate text-[10px] leading-tight">
              {details.typeLabel}
            </div>
          </div>
        );
      } else if (style === "pred-slot") {
        cards.push(
          <div
            key={key}
            style={{ "--label-w": `${details.widthMm}mm` } as React.CSSProperties}
            className="bin-label-card flex h-12 w-full items-center justify-between gap-2 border border-black bg-white px-3 text-black"
          >
            <div className="text-base font-bold leading-none">
              {details.gridLabel}
            </div>
            <div className="truncate text-sm">{details.typeLabel}</div>
            <div className="shrink-0 text-xs">{physical}</div>
          </div>
        );
      } else {
        cards.push(
          <div
            key={key}
            className="bin-label-card flex w-40 min-h-20 flex-col justify-center border border-black bg-white p-2 text-black"
          >
            <div className="text-2xl font-bold leading-none">
              {details.gridLabel}
            </div>
            <div className="mt-1 text-sm">{details.typeLabel}</div>
            <div className="text-xs">{physical}</div>
          </div>
        );
      }
    }
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Bin labels</h3>
        <button
          type="button"
          onClick={handlePrint}
          className="min-h-12 px-4 py-3 text-sm border rounded-lg"
        >
          Print labels
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        One label per bin. Print the sheet, cut the labels out, and stick one on
        each bin.
      </p>
      <div
        className="mb-2 flex flex-wrap gap-2"
        role="group"
        aria-label="Label style"
      >
        {LABEL_STYLES.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            aria-pressed={style === candidate.id}
            onClick={() => setStyle(candidate.id)}
            className={`min-h-12 px-4 py-3 text-sm border rounded-lg ${
              style === candidate.id
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-900"
            }`}
          >
            {candidate.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600 mb-2">{spec.description}</p>
      <div className="bin-label-sheet flex flex-wrap gap-2">{cards}</div>
    </div>
  );
};

export default BinLabels;
