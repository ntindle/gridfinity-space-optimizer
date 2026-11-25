import { describe, expect, it } from "vitest";
import { calculateGrids } from "@/utils/gridfinityUtils";
import {
  MAX_OBSTACLES,
  applyObstacles,
  sanitizeObstacles,
  snapObstacleRect,
  subtractRect,
  validateObstacle,
} from "@/utils/obstacles";
import { binIssues, canPlace, findFreeSpot, gridCells, indexCells } from "@/utils/bins";
import { collectPrintParts } from "@/utils/printParts";
import type { Bin, Obstacle } from "@/types";

const PRINTER = { x: 256, y: 256, z: 256 };
const DRAWER = { width: 15, height: 12 };

const obstacle = (overrides: Partial<Obstacle>): Obstacle => ({
  id: "o1",
  x: 42,
  y: 42,
  width: 42,
  depth: 42,
  ...overrides,
});

const baseResult = () => calculateGrids(DRAWER, PRINTER, false, false);

const cellKeys = (layout: ReturnType<typeof baseResult>["layout"]): Set<string> =>
  new Set(gridCells(layout).map((cell) => `${cell.x},${cell.y}`));

describe("snapObstacleRect", () => {
  it("snaps a partial-cell obstacle outward to whole cells", () => {
    expect(snapObstacleRect({ x: 50, y: 10, width: 20, depth: 90 }, 42)).toEqual({
      x: 42,
      y: 0,
      width: 42,
      depth: 126,
    });
  });

  it("does not over-snap an obstacle aligned to cell boundaries", () => {
    expect(snapObstacleRect({ x: 42, y: 84, width: 42, depth: 42 }, 42)).toEqual({
      x: 42,
      y: 84,
      width: 42,
      depth: 42,
    });
  });

  it("snaps to the 21 mm half-size grid", () => {
    expect(snapObstacleRect({ x: 10, y: 10, width: 10, depth: 10 }, 21)).toEqual({
      x: 0,
      y: 0,
      width: 21,
      depth: 21,
    });
  });
});

describe("subtractRect", () => {
  const rect = { x: 0, y: 0, width: 126, depth: 84 };

  it("returns the rect untouched when the cut misses", () => {
    expect(subtractRect(rect, { x: 200, y: 0, width: 42, depth: 42 })).toEqual([rect]);
  });

  it("returns nothing when the cut covers the rect", () => {
    expect(subtractRect(rect, { x: 0, y: 0, width: 126, depth: 84 })).toEqual([]);
  });

  it("splits around a middle cut into four pieces", () => {
    const pieces = subtractRect(rect, { x: 42, y: 21, width: 42, depth: 42 });
    expect(pieces).toEqual([
      { x: 0, y: 0, width: 42, depth: 84 },
      { x: 84, y: 0, width: 42, depth: 84 },
      { x: 42, y: 0, width: 42, depth: 21 },
      { x: 42, y: 63, width: 42, depth: 21 },
    ]);
  });

  it("trims a corner cut into two pieces", () => {
    const pieces = subtractRect(rect, { x: 84, y: 42, width: 42, depth: 42 });
    expect(pieces).toEqual([
      { x: 0, y: 0, width: 84, depth: 84 },
      { x: 84, y: 0, width: 42, depth: 42 },
    ]);
  });
});

describe("applyObstacles", () => {
  it("blocks the cells an obstacle intersects and recomputes counts", () => {
    const result = applyObstacles(baseResult(), [obstacle({})]);
    const cells = cellKeys(result.layout);
    expect(cells.has("42,42")).toBe(false);
    expect(cells.has("0,42")).toBe(true);
    expect(cells.has("42,0")).toBe(true);
    expect(cells.size).toBe(62);
    const counted = Object.entries(result.baseplates).reduce((sum, [key, count]) => {
      const [w, h] = key.split("x").map(Number);
      return sum + w * h * count;
    }, 0);
    expect(counted).toBe(62);
  });

  it("removes every piece when an obstacle covers the whole drawer", () => {
    const result = applyObstacles(baseResult(), [
      obstacle({ x: 0, y: 0, width: 381, depth: 304.8 }),
    ]);
    expect(result.layout).toEqual([]);
    expect(result.baseplates).toEqual({});
    expect(result.spacers).toEqual({});
  });

  it("trims spacers by the raw obstacle rect", () => {
    const result = applyObstacles(baseResult(), [
      obstacle({ x: 370, y: 0, width: 11, depth: 42 }),
    ]);
    const spacers = result.layout.filter((item) => item.type === "spacer");
    const rightSpacer = spacers.find((item) => item.pixelX === 378);
    expect(rightSpacer?.pixelY).toBe(42);
    expect(rightSpacer?.pixelHeight).toBe(210);
    expect(
      spacers.some((item) => item.pixelX === 378 && item.pixelY === 252 && item.pixelHeight === 42)
    ).toBe(true);
    expect(cellKeys(result.layout).has("336,0")).toBe(false);
  });

  it("blocks half-size cells on the 21 mm grid with half-size bins on", () => {
    const half = calculateGrids(DRAWER, PRINTER, true, false);
    const result = applyObstacles(
      half,
      [obstacle({ x: 10, y: 10, width: 10, depth: 10 })],
      21
    );
    const cells = cellKeys(result.layout);
    expect(cells.has("0,0")).toBe(false);
    expect(cells.has("21,0")).toBe(true);
    expect(cells.has("0,21")).toBe(true);
  });

  it("blocks half-size gap bins while leaving the leftover spacer", () => {
    const wide = calculateGrids({ width: 16, height: 12 }, PRINTER, false, true);
    const result = applyObstacles(wide, [
      obstacle({ x: 378, y: 0, width: 21, depth: 42 }),
    ]);
    const cells = cellKeys(result.layout);
    expect(cells.has("378,0")).toBe(false);
    expect(cells.has("378,21")).toBe(false);
    expect(cells.has("378,42")).toBe(true);
    const spacers = result.layout.filter((item) => item.type === "spacer");
    expect(spacers.some((item) => item.pixelX === 399)).toBe(true);
  });

  it("applies multiple obstacles", () => {
    const result = applyObstacles(baseResult(), [
      obstacle({ id: "a", x: 0, y: 0 }),
      obstacle({ id: "b", x: 336, y: 252 }),
    ]);
    const cells = cellKeys(result.layout);
    expect(cells.has("0,0")).toBe(false);
    expect(cells.has("336,252")).toBe(false);
    expect(cells.size).toBe(61);
  });

  it("leaves the layout untouched for an obstacle outside the drawer", () => {
    const before = baseResult();
    const result = applyObstacles(before, [
      obstacle({ x: 1000, y: 1000, width: 42, depth: 42 }),
    ]);
    expect(result.layout).toEqual(before.layout);
    expect(result.baseplates).toEqual(before.baseplates);
  });

  it("returns the result unchanged with no obstacles", () => {
    const before = baseResult();
    expect(applyObstacles(before, [])).toBe(before);
  });
});

describe("placement against obstacles", () => {
  const result = applyObstacles(baseResult(), [obstacle({})]);
  const cells = gridCells(result.layout);
  const index = indexCells(cells);

  it("refuses to place a bin into a blocked cell", () => {
    expect(canPlace({ x: 42, y: 42, width: 42, depth: 42 }, index, [])).toBe(false);
    expect(canPlace({ x: 0, y: 0, width: 42, depth: 42 }, index, [])).toBe(true);
    expect(canPlace({ x: 0, y: 42, width: 84, depth: 42 }, index, [])).toBe(false);
  });

  it("flags an existing bin overlapping an obstacle as off-grid", () => {
    const bins: Bin[] = [
      { id: "hit", x: 42, y: 42, width: 42, depth: 42, height: 3, label: "" },
      { id: "clear", x: 0, y: 0, width: 42, depth: 42, height: 3, label: "" },
    ];
    const issues = binIssues(bins, index);
    expect(issues.get("hit")).toBe("off-grid");
    expect(issues.has("clear")).toBe(false);
  });

  it("finds free spots outside blocked cells", () => {
    const spot = findFreeSpot(cells, index, [], 42, 42);
    expect(spot).toEqual({ x: 0, y: 0 });
  });
});

describe("print parts against obstacles", () => {
  it("excludes blocked area and skips overlapping bins", () => {
    const result = applyObstacles(baseResult(), [obstacle({})]);
    const bins: Bin[] = [
      { id: "hit", x: 42, y: 42, width: 42, depth: 42, height: 3, label: "" },
    ];
    const { parts, skippedBins } = collectPrintParts({
      layout: result.layout,
      bins,
      numDrawers: 1,
      printerSize: PRINTER,
    });
    const plateArea = parts
      .filter((part) => part.kind === "baseplate")
      .reduce((sum, part) => sum + part.width * part.depth * part.count, 0);
    expect(plateArea).toBe(62 * 42 * 42);
    expect(skippedBins).toBe(1);
    expect(parts.some((part) => part.kind === "bin")).toBe(false);
  });

  it("puts no connector tab or recess on an obstacle-facing edge", () => {
    const blocked = applyObstacles(baseResult(), [
      obstacle({ x: 252, y: 0, width: 42, depth: 42 }),
    ]);
    const { parts } = collectPrintParts({
      layout: blocked.layout,
      bins: [],
      numDrawers: 1,
      printerSize: PRINTER,
      connectors: true,
    });
    const plates = parts.filter((part) => part.kind === "baseplate");
    const strip = plates.find(
      (part) => part.gridGeometry?.columns === 2 && part.gridGeometry?.rows === 1
    );
    expect(strip?.gridGeometry?.connectors?.left).toBeUndefined();
    const big = plates.find(
      (part) => part.gridGeometry?.columns === 6 && part.gridGeometry?.rows === 6
    );
    expect(big?.gridGeometry?.connectors?.right).toBeUndefined();
    const clear = collectPrintParts({
      layout: baseResult().layout,
      bins: [],
      numDrawers: 1,
      printerSize: PRINTER,
      connectors: true,
    });
    expect(
      clear.parts.some((part) => part.gridGeometry?.connectors?.right === "tab")
    ).toBe(true);
  });

  it("keeps connectors where the seam still aligns past an obstacle", () => {
    const blocked = applyObstacles(baseResult(), [
      obstacle({ x: 252, y: 252, width: 126, depth: 42 }),
    ]);
    const { parts } = collectPrintParts({
      layout: blocked.layout,
      bins: [],
      numDrawers: 1,
      printerSize: PRINTER,
      connectors: true,
    });
    const big = parts.find(
      (part) => part.gridGeometry?.columns === 6 && part.gridGeometry?.rows === 6
    );
    expect(big?.gridGeometry?.connectors?.right).toBe("tab");
  });
});

describe("sanitizeObstacles", () => {
  it("keeps valid obstacles and rounds to hundredths", () => {
    expect(
      sanitizeObstacles([{ id: "a", x: 1.005, y: 2, width: 42, depth: 21 }])
    ).toEqual([{ id: "a", x: 1.01, y: 2, width: 42, depth: 21 }]);
  });

  it("drops junk and caps the list", () => {
    const junk = [
      null,
      "nope",
      { x: -1, y: 0, width: 42, depth: 42 },
      { x: 0, y: 0, width: 0, depth: 42 },
      { x: 0, y: 0, width: Number.NaN, depth: 42 },
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `o${i}`,
        x: i,
        y: 0,
        width: 42,
        depth: 42,
      })),
    ];
    const cleaned = sanitizeObstacles(junk);
    expect(cleaned).toHaveLength(MAX_OBSTACLES);
    expect(cleaned[0].id).toBe("o0");
  });

  it("replaces duplicate ids and non-array input", () => {
    const cleaned = sanitizeObstacles([
      { id: "same", x: 0, y: 0, width: 42, depth: 42 },
      { id: "same", x: 42, y: 0, width: 42, depth: 42 },
    ]);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0].id).not.toBe(cleaned[1].id);
    expect(sanitizeObstacles(undefined)).toEqual([]);
    expect(sanitizeObstacles("[]")).toEqual([]);
  });
});

describe("validateObstacle", () => {
  const drawerMm = { width: 381, height: 304.8 };

  it("accepts an obstacle inside the drawer", () => {
    expect(validateObstacle({ x: 0, y: 0, width: 381, depth: 304.8 }, drawerMm, 0)).toBeNull();
  });

  it("rejects bad numbers, negatives, and empty sizes", () => {
    expect(validateObstacle({ x: Number.NaN, y: 0, width: 42, depth: 42 }, drawerMm, 0)).toMatch(/numbers/);
    expect(validateObstacle({ x: -1, y: 0, width: 42, depth: 42 }, drawerMm, 0)).toMatch(/negative/);
    expect(validateObstacle({ x: 0, y: 0, width: 0, depth: 42 }, drawerMm, 0)).toMatch(/more than zero/);
  });

  it("rejects obstacles running past the drawer edges", () => {
    expect(validateObstacle({ x: 340, y: 0, width: 42, depth: 42 }, drawerMm, 0)).toMatch(/right edge/);
    expect(validateObstacle({ x: 0, y: 270, width: 42, depth: 42 }, drawerMm, 0)).toMatch(/back edge/);
  });

  it("rejects additions past the cap", () => {
    expect(
      validateObstacle({ x: 0, y: 0, width: 42, depth: 42 }, drawerMm, MAX_OBSTACLES)
    ).toMatch(/Up to 8/);
  });
});
