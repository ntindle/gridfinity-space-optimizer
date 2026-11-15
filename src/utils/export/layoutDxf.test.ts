import { describe, expect, it } from "vitest";
import { layoutDxfPlan } from "./layoutDxf";
import type { Bin, LayoutItem } from "@/types";

const item = (overrides: Partial<LayoutItem>): LayoutItem => ({
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

const bin = (overrides: Partial<Bin>): Bin => ({
  id: "bin-1",
  x: 0,
  y: 0,
  width: 84,
  depth: 42,
  height: 3,
  label: "Screws",
  ...overrides,
});

const baseplatePolyline =
  "  0\nLWPOLYLINE\n  8\nBASEPLATE\n 90\n4\n 70\n1\n 10\n0\n 20\n220.8\n 10\n126\n 20\n220.8\n 10\n126\n 20\n304.8\n 10\n0\n 20\n304.8";

describe("layoutDxfPlan", () => {
  it("writes a millimetre ASCII DXF header with the five plan layers and an EOF", () => {
    const dxf = layoutDxfPlan({ drawerWidth: 381, drawerHeight: 304.8, layout: [], bins: [] });
    expect(dxf).toContain("  9\n$ACADVER\n  1\nAC1014");
    expect(dxf).toContain("  9\n$MEASUREMENT\n 70\n1");
    expect(dxf).toContain("  9\n$INSUNITS\n 70\n4");
    expect(dxf).toContain("  2\nDRAWER");
    expect(dxf).toContain("  2\nBASEPLATE");
    expect(dxf).toContain("  2\nSPACER");
    expect(dxf).toContain("  2\nHALF");
    expect(dxf).toContain("  2\nBIN");
    expect(dxf).toContain("  8\nDRAWER\n 90\n4\n 70\n1\n 10\n0\n 20\n0\n 10\n381\n 20\n0\n 10\n381\n 20\n304.8\n 10\n0\n 20\n304.8");
    expect(dxf.trimEnd().endsWith("  0\nEOF")).toBe(true);
  });

  it("draws the drawer outline and flips piece Y coordinates to CAD Y-up", () => {
    const dxf = layoutDxfPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [
        item({}),
        item({ type: "spacer", pixelX: 126, pixelWidth: 21, width: 1, height: 2 }),
        item({ type: "half-size", pixelX: 147, pixelY: 84, pixelWidth: 63, pixelHeight: 42, width: 3, height: 2 }),
      ],
      bins: [],
    });
    expect(dxf).toContain(baseplatePolyline);
    expect(dxf).toContain("  8\nSPACER\n 90\n4\n 70\n1\n 10\n126\n 20\n220.8\n 10\n147\n 20\n220.8\n 10\n147\n 20\n304.8\n 10\n126\n 20\n304.8");
    expect(dxf).toContain("  8\nHALF\n 90\n4\n 70\n1\n 10\n147\n 20\n178.8\n 10\n210\n 20\n178.8\n 10\n210\n 20\n220.8\n 10\n147\n 20\n220.8");
    expect(dxf).toContain("  1\n3 x 2");
  });

  it("draws placed bins with centered labels and no XML escaping", () => {
    const dxf = layoutDxfPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [],
      bins: [bin({ x: 42, y: 84, label: "Nuts & <bolts>" })],
    });
    expect(dxf).toContain("  8\nBIN\n 90\n4\n 70\n1\n 10\n42\n 20\n178.8\n 10\n126\n 20\n178.8\n 10\n126\n 20\n220.8\n 10\n42\n 20\n220.8");
    expect(dxf).toContain("  0\nTEXT\n  8\nBIN\n 10\n84\n 20\n199.8\n 40\n6\n  1\nNuts & <bolts>");
  });

  it("escapes percent signs in labels and folds newlines to spaces", () => {
    const dxf = layoutDxfPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [],
      bins: [bin({ label: "100%\nfull" })],
    });
    expect(dxf).toContain("  1\n100%% full");
  });

  it("falls back to the grid size for a whitespace-only bin label", () => {
    const dxf = layoutDxfPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [],
      bins: [bin({ label: "   " })],
    });
    expect(dxf).toContain("  1\n2 x 1");
  });

  it("omits text that would not fit a narrow piece", () => {
    const dxf = layoutDxfPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [item({ type: "spacer", pixelX: 126, pixelWidth: 12, width: 1, height: 2 })],
      bins: [],
    });
    expect(dxf).toContain("  8\nSPACER\n 90\n4\n 70\n1\n 10\n126\n 20\n220.8\n 10\n138\n 20\n220.8\n 10\n138\n 20\n304.8\n 10\n126\n 20\n304.8");
    expect(dxf).not.toContain("TEXT");
  });
});
