import React, { useEffect, useMemo, useState } from "react";
import { getColor, INCH_TO_MM } from "@/utils/gridfinityUtils";
import {
  getPreviewPieceDetails,
  groupPreviewPieces,
  previewPieceKey,
} from "@/utils/previewPieceDetails";
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    setSelectedKey(null);
  }, [layout]);

  const groups = useMemo(() => groupPreviewPieces(layout), [layout]);
  const selectedGroup = groups.find(
    (group) => previewPieceKey(group.item) === selectedKey
  );
  const selectedDetails = selectedGroup
    ? getPreviewPieceDetails(selectedGroup.item, layout)
    : null;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold">Visual Preview</h3>
      <p className="text-sm text-gray-600 mb-2">
        Select a piece below to see its size and details. Matching pieces
        highlight in the preview.
      </p>
      <div
        className="w-full relative border-2 border-black overflow-hidden"
        style={{
          paddingBottom: `${(drawerSize.height / drawerSize.width) * 100}%`,
        }}
      >
        <div className="absolute inset-0">
          {layout.map((item, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center border border-black text-xs md:text-sm overflow-hidden whitespace-nowrap"
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
                boxShadow:
                  selectedKey !== null &&
                  previewPieceKey(item) === selectedKey
                    ? "inset 0 0 0 3px #000"
                    : undefined,
              }}
            >
              {item.type === "baseplate" || item.type === "half-size"
                ? `${item.width}x${item.height}`
                : "Spacer"}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-base font-semibold">Pieces in this drawer</h4>
        <ul className="mt-2 space-y-2">
          {groups.map((group) => {
            const key = previewPieceKey(group.item);
            const details = getPreviewPieceDetails(group.item, layout);
            const selected = selectedKey === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedKey(selected ? null : key)}
                  className="w-full min-h-12 px-4 py-3 text-left border rounded-lg"
                >
                  {details.typeLabel} {details.gridLabel} — {group.count} in
                  this drawer
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {selectedDetails && selectedGroup && (
        <div className="mt-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-base font-semibold">Piece details</h4>
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              className="min-h-12 px-4 py-3 text-sm border rounded-lg"
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
              {selectedGroup.count > 1
                ? `First at column ${selectedDetails.column}, row ${selectedDetails.row}`
                : `Column ${selectedDetails.column}, row ${selectedDetails.row}`}
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
