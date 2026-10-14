import { describe, it, expect } from "vitest";
import { getPreviewPieceDetails, groupPreviewPieces } from "./previewPieceDetails";
import type { LayoutItem } from "@/types";

const baseplate = (overrides: Partial<LayoutItem> = {}): LayoutItem => ({
  x: 0,
  y: 0,
  width: 3,
  height: 2,
  type: "baseplate",
  pixelX: 0,
  pixelY: 0,
  pixelWidth: 126,
  pixelHeight: 84,
  ...overrides,
});

describe("getPreviewPieceDetails", () => {
  it("reports type, grid size, and physical size for a baseplate", () => {
    const layout = [baseplate()];
    const details = getPreviewPieceDetails(layout[0], layout);

    expect(details.typeLabel).toBe("Baseplate");
    expect(details.gridLabel).toBe("3 × 2");
    expect(details.widthMm).toBe(126);
    expect(details.heightMm).toBe(84);
    // 126mm / 25.4 = 4.9606…; 84mm / 25.4 = 3.3070…
    expect(details.widthIn).toBe(4.96);
    expect(details.heightIn).toBe(3.31);
    expect(details.column).toBe(0);
    expect(details.row).toBe(0);
    expect(details.identicalCount).toBe(1);
  });

  it("counts identical pieces and ignores different ones", () => {
    const layout = [
      baseplate(),
      baseplate({ x: 3, pixelX: 126 }),
      baseplate({ x: 6, pixelX: 252, width: 2, pixelWidth: 84 }),
      baseplate({ x: 0, y: 2, pixelY: 84, type: "spacer", width: 3, height: 2, pixelWidth: 126, pixelHeight: 84 }),
    ];

    // Two 3×2 baseplates, one 2×2 baseplate, one 3×2 spacer.
    expect(getPreviewPieceDetails(layout[0], layout).identicalCount).toBe(2);
    expect(getPreviewPieceDetails(layout[2], layout).identicalCount).toBe(1);
    expect(getPreviewPieceDetails(layout[3], layout).identicalCount).toBe(1);
    expect(getPreviewPieceDetails(layout[3], layout).typeLabel).toBe("Spacer");
  });

  it("labels half-size bins and fractional grid sizes without trailing zeros", () => {
    const layout = [
      baseplate({
        type: "half-size",
        x: 1.5,
        y: 0.5,
        width: 0.5,
        height: 1,
        pixelX: 63,
        pixelY: 21,
        pixelWidth: 21,
        pixelHeight: 42,
      }),
    ];
    const details = getPreviewPieceDetails(layout[0], layout);

    expect(details.typeLabel).toBe("Half-size bin");
    expect(details.gridLabel).toBe("0.5 × 1");
    expect(details.widthMm).toBe(21);
    expect(details.heightMm).toBe(42);
    expect(details.column).toBe(1.5);
    expect(details.row).toBe(0.5);
  });

  it("uses the exact pixel size for spacers, not the rounded grid size", () => {
    // A spacer whose grid size rounds to 0.5 × 2 but whose exact remainder
    // is 21.5mm wide — the panel must show 21.5mm, not 21mm.
    const layout = [
      baseplate({
        type: "spacer",
        width: 0.5,
        height: 2,
        pixelWidth: 21.5,
        pixelHeight: 84,
      }),
    ];
    const details = getPreviewPieceDetails(layout[0], layout);

    expect(details.gridLabel).toBe("0.5 × 2");
    expect(details.widthMm).toBe(21.5);
    expect(details.heightMm).toBe(84);
  });
});

describe("groupPreviewPieces", () => {
  it("groups identical pieces in first-appearance order", () => {
    const layout = [
      baseplate(),
      baseplate({ x: 3, pixelX: 126 }),
      baseplate({ x: 6, pixelX: 252, width: 2, pixelWidth: 84 }),
      baseplate({
        x: 0,
        y: 2,
        pixelY: 84,
        type: "spacer",
        width: 3,
        height: 2,
        pixelWidth: 126,
        pixelHeight: 84,
      }),
      baseplate({ x: 0, y: 4, pixelY: 168 }),
    ];

    const groups = groupPreviewPieces(layout);

    expect(groups).toHaveLength(3);
    expect(groups[0].count).toBe(3);
    expect(groups[0].item.type).toBe("baseplate");
    expect(groups[0].item.width).toBe(3);
    expect(groups[1].count).toBe(1);
    expect(groups[1].item.width).toBe(2);
    expect(groups[2].count).toBe(1);
    expect(groups[2].item.type).toBe("spacer");
    // The group representative is the FIRST matching item.
    expect(groups[0].item.x).toBe(0);
    expect(groups[0].item.y).toBe(0);
  });

  it("returns an empty list for an empty layout", () => {
    expect(groupPreviewPieces([])).toEqual([]);
  });
});
