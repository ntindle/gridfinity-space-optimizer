import { describe, expect, it } from "vitest";
import { layoutSvgPlan } from "./layoutSvg";
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

describe("layoutSvgPlan", () => {
  it("draws the drawer at real scale with a millimetre viewBox", () => {
    const svg = layoutSvgPlan({ drawerWidth: 381, drawerHeight: 304.8, layout: [], bins: [] });
    expect(svg).toContain('viewBox="0 0 381 304.8"');
    expect(svg).toContain('width="381mm"');
    expect(svg).toContain('height="304.8mm"');
    expect(svg).toContain('<rect x="0" y="0" width="381" height="304.8"');
    expect(svg.match(/<rect/g)?.length).toBe(1);
  });

  it("draws baseplates, spacers, and half-size pieces at their pixel rects", () => {
    const svg = layoutSvgPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [
        item({}),
        item({ type: "spacer", pixelX: 126, pixelWidth: 21, width: 1, height: 2 }),
        item({ type: "half-size", pixelX: 147, pixelY: 84, pixelWidth: 63, pixelHeight: 42, width: 3, height: 2 }),
      ],
      bins: [],
    });
    expect(svg).toContain('<rect x="0" y="0" width="126" height="84" fill="#e5e7eb"');
    expect(svg).toContain('<rect x="126" y="0" width="21" height="84" fill="#ffffff" stroke="#111827" stroke-width="1" stroke-dasharray="3 3"');
    expect(svg).toContain('<rect x="147" y="84" width="63" height="42" fill="#f3f4f6"');
    expect(svg).toContain(">3 × 2</text>");
  });

  it("draws placed bins with their labels and escapes label text", () => {
    const svg = layoutSvgPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [],
      bins: [bin({ x: 42, y: 84, label: "Nuts & <bolts>" })],
    });
    expect(svg).toContain('<rect x="42" y="84" width="84" height="42" fill="#dbeafe"');
    expect(svg).toContain(">Nuts &amp; &lt;bolts&gt;</text>");
  });

  it("labels a real half-size piece in half-cell counts like the preview", () => {
    const svg = layoutSvgPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [item({ type: "half-size", pixelX: 0, pixelY: 0, pixelWidth: 63, pixelHeight: 42, width: 1.5, height: 1 })],
      bins: [],
    });
    expect(svg).toContain(">3 × 2</text>");
    expect(svg).not.toContain(">1.5 × 1</text>");
  });

  it("falls back to the grid size for a whitespace-only bin label", () => {
    const svg = layoutSvgPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [],
      bins: [bin({ label: "   " })],
    });
    expect(svg).toContain(">2 × 1</text>");
  });

  it("falls back to the grid size for an unlabeled bin", () => {
    const svg = layoutSvgPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [],
      bins: [bin({ label: "" })],
    });
    expect(svg).toContain(">2 × 1</text>");
  });

  it("omits text that would not fit a narrow piece", () => {
    const svg = layoutSvgPlan({
      drawerWidth: 381,
      drawerHeight: 304.8,
      layout: [item({ type: "spacer", pixelX: 126, pixelWidth: 12, width: 1, height: 2 })],
      bins: [],
    });
    expect(svg).not.toContain("<text");
  });
});
