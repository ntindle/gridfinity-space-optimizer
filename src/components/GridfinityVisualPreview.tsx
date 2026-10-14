import React, { useEffect, useState } from "react";
import { getColor, INCH_TO_MM } from "@/utils/gridfinityUtils";
import { getPreviewPieceDetails } from "@/utils/previewPieceDetails";
import type { LayoutItem, DrawerSize } from "@/types";

interface GridfinityVisualPreviewProps {
  layout: LayoutItem[];
  drawerSize: DrawerSize;
  useMm: boolean;
}

const GridfinityVisualPreview: React.FC<GridfinityVisualPreviewProps> = ({
  layout,
  drawerSize,
  useMm,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // A new layout means the old selection may point at a different piece —
  // clear it so the details panel never describes the wrong cell.
  useEffect(() => {
    setSelectedIndex(null);
  }, [layout]);

  const selectedItem =
    selectedIndex !== null ? layout[selectedIndex] : undefined;
  const selectedDetails =
    selectedItem !== undefined
      ? getPreviewPieceDetails(selectedItem, layout)
      : null;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold">Visual Preview</h3>
      <p className="text-sm text-gray-600 mb-2">
        Select a piece to see its size and details.
      </p>
      <div
        className="w-full relative border-2 border-black overflow-hidden"
        style={{
          paddingBottom: `${(drawerSize.height / drawerSize.width) * 100}%`,
        }}
      >
        <div className="absolute inset-0">
          {layout.map((item, index) => {
            const selected = selectedIndex === index;
            return (
              <button
                key={index}
                type="button"
                aria-pressed={selected}
                aria-label={`${item.type === "baseplate" ? "Baseplate" : item.type === "half-size" ? "Half-size bin" : "Spacer"} ${item.width}x${item.height}, select for details`}
                onClick={() =>
                  setSelectedIndex(selected ? null : index)
                }
                className="absolute flex items-center justify-center border border-black text-xs md:text-sm overflow-hidden whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                style={{
                  left: `${(item.pixelX / INCH_TO_MM / drawerSize.width) * 100}%`,
                  top: `${(item.pixelY / INCH_TO_MM / drawerSize.height) * 100}%`,
                  width: `${
                    (item.pixelWidth / INCH_TO_MM / drawerSize.width) * 100
                  }%`,
                  height: `${
                    (item.pixelHeight / INCH_TO_MM / drawerSize.height) * 100
                  }%`,
                  backgroundColor: getColor(item.type, index),
                  boxShadow: selected
                    ? "inset 0 0 0 3px #000"
                    : undefined,
                }}
              >
                {item.type === "baseplate" || item.type === "half-size"
                  ? `${item.width}x${item.height}`
                  : "Spacer"}
              </button>
            );
          })}
        </div>
      </div>
      {selectedDetails && (
        <div className="mt-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-base font-semibold">Piece details</h4>
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="text-sm underline underline-offset-2"
            >
              Clear selection
            </button>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-gray-600">Type</dt>
            <dd>{selectedDetails.typeLabel}</dd>
            <dt className="text-gray-600">Grid size</dt>
            <dd>{selectedDetails.gridLabel}</dd>
            <dt className="text-gray-600">Physical size</dt>
            <dd>
              {useMm
                ? `${selectedDetails.widthMm} mm × ${selectedDetails.heightMm} mm (${selectedDetails.widthIn}″ × ${selectedDetails.heightIn}″)`
                : `${selectedDetails.widthIn}″ × ${selectedDetails.heightIn}″ (${selectedDetails.widthMm} mm × ${selectedDetails.heightMm} mm)`}
            </dd>
            <dt className="text-gray-600">Position</dt>
            <dd>
              Column {selectedDetails.column}, row {selectedDetails.row}
            </dd>
            <dt className="text-gray-600">Identical pieces</dt>
            <dd>{selectedDetails.identicalCount} in this drawer</dd>
          </dl>
        </div>
      )}
    </div>
  );
};

export default GridfinityVisualPreview;
