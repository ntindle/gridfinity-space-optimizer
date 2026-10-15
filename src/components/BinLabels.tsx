import React, { useEffect, useMemo } from "react";
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

const PRINT_BODY_CLASS = "print-bin-labels";

const BinLabels: React.FC<BinLabelsProps> = ({ layout, useMm, numDrawers }) => {
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
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove(PRINT_BODY_CLASS);
    };
  }, []);

  if (groups.length === 0) {
    return null;
  }

  const handlePrint = () => {
    document.body.classList.add(PRINT_BODY_CLASS);
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
      cards.push(
        <div
          key={`${previewPieceKey(group.item)}-${index}`}
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
      <div className="bin-label-sheet flex flex-wrap gap-2">{cards}</div>
    </div>
  );
};

export default BinLabels;
