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
  document.body.classList.remove(
    "print-bin-labels",
    "print-bin-labels-paper",
    "print-bin-labels-cullenect",
    "print-bin-labels-pred-slot"
  );
  vi.restoreAllMocks();
});

describe("BinLabels", () => {
  it("renders one label per bin across all drawers and skips spacers", () => {
    render(<BinLabels layout={layout} useMm={true} numDrawers={2} binContents={{}} />);
    expect(screen.getByText("Bin labels")).toBeInTheDocument();
    expect(screen.getAllByText("6 × 6")).toHaveLength(4);
    expect(screen.getAllByText("3 × 2")).toHaveLength(2);
    expect(screen.queryByText("Spacer")).not.toBeInTheDocument();
  });

  it("shows physical size unit-first", () => {
    const { rerender } = render(
      <BinLabels layout={layout} useMm={true} numDrawers={1} binContents={{}} />
    );
    expect(screen.getAllByText("252 mm × 252 mm").length).toBeGreaterThan(0);
    rerender(<BinLabels layout={layout} useMm={false} numDrawers={1} binContents={{}} />);
    expect(screen.getAllByText("9.92″ × 9.92″").length).toBeGreaterThan(0);
  });

  it("renders nothing when the layout has no bins", () => {
    const spacerOnly = layout.filter((item) => item.type === "spacer");
    render(<BinLabels layout={spacerOnly} useMm={true} numDrawers={1} binContents={{}} />);
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
    render(<BinLabels layout={layout} useMm={true} numDrawers={1} binContents={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains("print-bin-labels")).toBe(true);
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(
      true
    );
    fireEvent(window, new Event("afterprint"));
    expect(document.body.classList.contains("print-bin-labels")).toBe(false);
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(
      false
    );
  });

  it("offers three label styles with the paper card selected by default", () => {
    render(<BinLabels layout={layout} useMm={true} numDrawers={1} binContents={{}} />);
    const group = screen.getByRole("group", { name: /label style/i });
    expect(group).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Paper card" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /Cullenect 36.4/ })
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Bin-width slot/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("switching styles changes the print body class", () => {
    const printSpy = vi.fn();
    Object.defineProperty(window, "print", {
      value: printSpy,
      writable: true,
      configurable: true,
    });
    render(<BinLabels layout={layout} useMm={true} numDrawers={1} binContents={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /Cullenect 36.4/ }));
    expect(screen.getByRole("button", { name: /Cullenect 36.4/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(document.body.classList.contains("print-bin-labels-cullenect")).toBe(
      true
    );
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(
      false
    );
    fireEvent(window, new Event("afterprint"));
    expect(
      document.body.classList.contains("print-bin-labels-cullenect")
    ).toBe(false);
  });

  it("pred-slot cards carry the bin width as a print CSS variable", () => {
    render(
      <BinLabels
        layout={layout}
        useMm={true}
        numDrawers={1}
        binContents={{}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Bin-width slot/ }));
    const cards = document.querySelectorAll(".bin-label-card");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(
        (card as HTMLElement).style.getPropertyValue("--label-w")
      ).toMatch(/^\d+(\.\d+)?mm$/);
    });
    expect(
      (cards[0] as HTMLElement).style.getPropertyValue("--label-w")
    ).toBe("252mm");
  });

  it("prints the contents on paper cards", () => {
    render(
      <BinLabels
        layout={layout}
        useMm={true}
        numDrawers={1}
        binContents={{ "half-size:3x2": "M3 screws" }}
      />
    );
    expect(screen.getByText("M3 screws")).toBeInTheDocument();
    expect(screen.queryByText("M4 nuts")).not.toBeInTheDocument();
  });

  it("puts the contents first on cullenect cards", () => {
    render(
      <BinLabels
        layout={layout}
        useMm={true}
        numDrawers={1}
        binContents={{ "half-size:3x2": "M3 screws" }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Cullenect 36.4/ }));
    expect(screen.getByText("M3 screws")).toBeInTheDocument();
    expect(screen.getByText("3 × 2 · Half-size bin")).toBeInTheDocument();
  });

  it("clears a stale style class before marking the body for printing", () => {
    const printSpy = vi.fn();
    Object.defineProperty(window, "print", {
      value: printSpy,
      writable: true,
      configurable: true,
    });
    render(
      <BinLabels
        layout={layout}
        useMm={true}
        numDrawers={1}
        binContents={{}}
      />
    );
    document.body.classList.add("print-bin-labels-cullenect");
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(
      true
    );
    expect(
      document.body.classList.contains("print-bin-labels-cullenect")
    ).toBe(false);
  });

  it("removes the print body classes on unmount", () => {
    const printSpy = vi.fn();
    Object.defineProperty(window, "print", {
      value: printSpy,
      writable: true,
      configurable: true,
    });
    const { unmount } = render(
      <BinLabels
        layout={layout}
        useMm={true}
        numDrawers={1}
        binContents={{}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(document.body.classList.contains("print-bin-labels")).toBe(true);
    unmount();
    expect(document.body.classList.contains("print-bin-labels")).toBe(false);
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(
      false
    );
  });
});
