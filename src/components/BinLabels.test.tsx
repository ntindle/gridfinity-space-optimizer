/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BinLabels from "./BinLabels";
import type { LayoutItem } from "@/types/gridfinity";

const layout: LayoutItem[] = [
  {
    x: 0,
    y: 0,
    width: 6,
    height: 6,
    type: "baseplate",
    pixelX: 0,
    pixelY: 0,
    pixelWidth: 252,
    pixelHeight: 252,
  },
  {
    x: 6,
    y: 0,
    width: 6,
    height: 6,
    type: "baseplate",
    pixelX: 252,
    pixelY: 0,
    pixelWidth: 252,
    pixelHeight: 252,
  },
  {
    x: 0,
    y: 6,
    width: 3,
    height: 2,
    type: "half-size",
    pixelX: 0,
    pixelY: 252,
    pixelWidth: 126,
    pixelHeight: 84,
  },
  {
    x: 3,
    y: 6,
    width: 6,
    height: 0.5,
    type: "spacer",
    pixelX: 126,
    pixelY: 252,
    pixelWidth: 252,
    pixelHeight: 21,
  },
];

afterEach(() => {
  document.body.classList.remove("print-bin-labels");
  vi.restoreAllMocks();
});

describe("BinLabels", () => {
  it("renders one label per bin across all drawers and skips spacers", () => {
    render(<BinLabels layout={layout} useMm={true} numDrawers={2} />);
    expect(screen.getByText("Bin labels")).toBeInTheDocument();
    expect(screen.getAllByText("6 × 6")).toHaveLength(4);
    expect(screen.getAllByText("3 × 2")).toHaveLength(2);
    expect(screen.queryByText("Spacer")).not.toBeInTheDocument();
  });

  it("shows physical size unit-first", () => {
    const { rerender } = render(
      <BinLabels layout={layout} useMm={true} numDrawers={1} />
    );
    expect(screen.getAllByText("252 mm × 252 mm").length).toBeGreaterThan(0);
    rerender(<BinLabels layout={layout} useMm={false} numDrawers={1} />);
    expect(screen.getAllByText("9.92″ × 9.92″").length).toBeGreaterThan(0);
  });

  it("renders nothing when the layout has no bins", () => {
    const spacerOnly = layout.filter((item) => item.type === "spacer");
    render(<BinLabels layout={spacerOnly} useMm={true} numDrawers={1} />);
    expect(screen.queryByText("Bin labels")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /print labels/i })
    ).not.toBeInTheDocument();
  });

  it("print button marks the body for label-only printing and cleans up after print", () => {
    const printSpy = vi.fn();
    Object.defineProperty(window, "print", {
      value: printSpy,
      writable: true,
      configurable: true,
    });
    render(<BinLabels layout={layout} useMm={true} numDrawers={1} />);
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains("print-bin-labels")).toBe(true);
    fireEvent(window, new Event("afterprint"));
    expect(document.body.classList.contains("print-bin-labels")).toBe(false);
  });
});
