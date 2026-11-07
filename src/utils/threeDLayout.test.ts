/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { boxForPointerClick, buildThreeDBoxes } from "./threeDLayout";
import { STACKING_LIP_HEIGHT_MM } from "@/utils/bins";
import type { Bin, LayoutItem } from "@/types";

const layout: LayoutItem[] = [
  {
    x: 0,
    y: 0,
    width: 3,
    height: 2,
    type: "baseplate",
    pixelX: 0,
    pixelY: 0,
    pixelWidth: 126,
    pixelHeight: 84,
  },
  {
    x: 3,
    y: 0,
    width: 3,
    height: 2,
    type: "half-size",
    pixelX: 126,
    pixelY: 0,
    pixelWidth: 126,
    pixelHeight: 84,
  },
  {
    x: 0,
    y: 2,
    width: 6,
    height: 0.5,
    type: "spacer",
    pixelX: 0,
    pixelY: 84,
    pixelWidth: 252,
    pixelHeight: 21,
  },
];

const bins: Bin[] = [
  { id: "b1", x: 0, y: 0, width: 84, depth: 42, height: 3, label: "Screws" },
  { id: "b2", x: 84, y: 42, width: 42, depth: 42, height: 6, label: "" },
];

const drawerMm = { width: 252, height: 105 };

describe("buildThreeDBoxes", () => {
  it("centers plates on the drawer and gives them the baseplate height", () => {
    const boxes = buildThreeDBoxes(layout, [], drawerMm);
    expect(boxes).toHaveLength(3);
    expect(boxes[0]).toMatchObject({
      key: "baseplate:3x2",
      kind: "baseplate",
      binId: null,
      centerX: -63,
      centerZ: -10.5,
      width: 126,
      depth: 84,
      baseY: 0,
      height: 5,
    });
    expect(boxes[1]).toMatchObject({ kind: "half-size", centerX: 63, height: 5 });
    expect(boxes[2]).toMatchObject({
      kind: "spacer",
      centerX: 0,
      centerZ: 42,
      width: 252,
      depth: 21,
      height: 5,
    });
  });

  it("stacks bins on the baseplates at unit height plus the lip", () => {
    const boxes = buildThreeDBoxes(layout, bins, drawerMm);
    const binBoxes = boxes.filter((box) => box.kind === "bin");
    expect(binBoxes).toHaveLength(2);
    expect(binBoxes[0]).toMatchObject({
      key: "bin:b1",
      binId: "b1",
      centerX: -84,
      centerZ: -31.5,
      width: 84,
      depth: 42,
      baseY: 5,
    });
    expect(binBoxes[0].height).toBeCloseTo(21 + STACKING_LIP_HEIGHT_MM, 9);
    expect(binBoxes[1].height).toBeCloseTo(42 + STACKING_LIP_HEIGHT_MM, 9);
    expect(binBoxes[1].height - binBoxes[0].height).toBeCloseTo(21, 9);
  });

  it("uses the bin group key when one is known", () => {
    const boxes = buildThreeDBoxes(layout, bins, drawerMm, new Map([["b1", "bin:2x1-3u"]]));
    expect(boxes.find((box) => box.binId === "b1")?.key).toBe("bin:2x1-3u");
    expect(boxes.find((box) => box.binId === "b2")?.key).toBe("bin:b2");
  });

  it("returns no boxes for an empty layout", () => {
    expect(buildThreeDBoxes([], [], drawerMm)).toEqual([]);
  });
});

describe("boxForPointerClick", () => {
  it("returns the box for a click with no pointer travel", () => {
    const boxes = buildThreeDBoxes(layout, bins, drawerMm);
    const binBoxes = boxes.filter((box) => box.kind === "bin");
    expect(boxForPointerClick(binBoxes, 0, 0)?.binId).toBe("b1");
    expect(boxForPointerClick(binBoxes, 0, undefined)?.binId).toBe("b1");
  });

  it("ignores clicks after an orbit drag", () => {
    const boxes = buildThreeDBoxes(layout, bins, drawerMm);
    const binBoxes = boxes.filter((box) => box.kind === "bin");
    expect(boxForPointerClick(binBoxes, 0, 220)).toBeNull();
    expect(boxForPointerClick(binBoxes, 0, 6)).toBeNull();
    expect(boxForPointerClick(binBoxes, 0, 5)?.binId).toBe("b1");
  });

  it("returns null without an instance", () => {
    const boxes = buildThreeDBoxes(layout, bins, drawerMm);
    expect(boxForPointerClick(boxes, undefined, 0)).toBeNull();
  });
});
