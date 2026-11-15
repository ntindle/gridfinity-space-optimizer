import { describe, expect, it } from "vitest";
import { EXAMPLE_PROJECTS } from "./exampleProjects";
import { calculateGrids } from "@/utils/gridfinityUtils";
import { printerSizes } from "@/lib/utils";
import {
  binIssues,
  gridCells,
  indexCells,
  maxBinHeight,
  sanitizeBins,
} from "@/utils/bins";
import { usableBed } from "@/utils/printPlan";

describe("exampleProjects", () => {
  it("ships four named examples with sourced drawer sizes", () => {
    expect(EXAMPLE_PROJECTS).toHaveLength(4);
    const ids = new Set(EXAMPLE_PROJECTS.map((example) => example.id));
    expect(ids.size).toBe(4);
    for (const example of EXAMPLE_PROJECTS) {
      expect(example.name.length).toBeGreaterThan(0);
      expect(example.drawerSource.length).toBeGreaterThan(0);
      expect(example.drawerSourceUrl).toMatch(/^https:\/\//);
      expect(example.snapshot.drawerSize.width).toBeGreaterThan(0);
      expect(example.snapshot.drawerSize.height).toBeGreaterThan(0);
      expect(example.snapshot.bins.length).toBeGreaterThan(0);
      for (const bin of example.snapshot.bins) {
        expect(bin.label.length).toBeGreaterThan(0);
      }
    }
  });

  it.each(EXAMPLE_PROJECTS)(
    "$name loads cleanly: bins survive sanitize and tile the grid with no issues",
    (example) => {
      const sanitized = sanitizeBins(example.snapshot.bins);
      expect(sanitized).toHaveLength(example.snapshot.bins.length);
      expect(sanitized.map((bin) => bin.id)).toEqual(
        example.snapshot.bins.map((bin) => bin.id)
      );
      const printerSize = printerSizes[example.snapshot.selectedPrinter];
      expect(printerSize).toBeDefined();
      const { layout } = calculateGrids(
        example.snapshot.drawerSize,
        printerSize,
        example.snapshot.useHalfSize,
        example.snapshot.preferHalfSize,
        example.snapshot.preferUniformBaseplates
      );
      expect(layout.length).toBeGreaterThan(0);
      const issues = binIssues(example.snapshot.bins, indexCells(gridCells(layout)), {
        ...usableBed(printerSize),
        height: maxBinHeight(printerSize.z),
      });
      expect([...issues.entries()]).toEqual([]);
    }
  );
});
